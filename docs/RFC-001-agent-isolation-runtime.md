# RFC-001: Agent Isolation Runtime
## Genii Platform — Technical Specification
**Version:** 1.0  
**Status:** Approved for Implementation  
**Date:** February 2026  
**Owner:** david@geniinow.com  
**Repo:** github.com/davidmschy/genii-platform  

---

## 1. Problem Statement

The Genii platform runs a fleet of autonomous AI agents across multiple business entities (FBX Homes, HomeGenii, Genii Agency, Genii Platform). As the fleet scales, five critical runtime properties must be guaranteed per agent:

1. **Per-agent file system** — agents must persist and retrieve their own artifacts without cross-contamination
2. **Durable memory** — agents must retain context and history across sessions without scanning the entire ledger
3. **Transactional execution** — multi-table writes must be atomic; partial failures must leave no dirty state
4. **Horizontal scalability** — agent workloads must distribute across workers with backpressure and concurrency controls
5. **Quota management** — every agent must have enforced ceilings on tokens, cost, and call rate

Currently:
- File system: **absent** — all agent output is ephemeral
- Memory: **partial** — `ledger_entries` is durable but requires full table scan to reconstruct agent context
- Transactional execution: **broken** — `provision.ts` makes 3 sequential `await db.query()` calls with no `BEGIN/COMMIT`
- Horizontal scalability: **partial** — Redis pub/sub exists, pg_cron exists, n8n handles async; no queue depth enforcement or backpressure
- Quota management: **absent** — `monthly_cost_usd` column exists on `agents` table but is never read or enforced

This RFC defines the schema changes, new API routes, and agent architecture required to close all five gaps.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Genii Agent Runtime                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Agent File  │  │ Agent Memory │  │  Quota Enforcer      │  │
│  │  System      │  │ Store        │  │  (Middleware)        │  │
│  │  (Supabase   │  │ (agent_      │  │                      │  │
│  │   Storage)   │  │  memory)     │  │  Checks before every │  │
│  └──────┬───────┘  └──────┬───────┘  │  task execution      │  │
│         │                 │          └──────────┬───────────┘  │
│         └────────┬────────┘                     │              │
│                  │                              │              │
│         ┌────────▼──────────────────────────────▼───────┐     │
│         │            Agent Task Executor                │     │
│         │   BEGIN → validate quota → execute → COMMIT   │     │
│         │   (transactional, atomic, audited)            │     │
│         └────────────────────┬──────────────────────────┘     │
│                              │                                 │
│         ┌────────────────────▼──────────────────────────┐     │
│         │            BullMQ Task Queue                   │     │
│         │   Per-agent queues, concurrency=1 default      │     │
│         │   Dead letter queue, retry with backoff        │     │
│         └────────────────────┬──────────────────────────┘     │
│                              │                                 │
│         ┌────────────────────▼──────────────────────────┐     │
│         │         Horizontal Worker Pool                 │     │
│         │   N workers on Cloud Run (auto-scale)          │     │
│         │   Each worker pulls from BullMQ               │     │
│         └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Pillar 1: Per-Agent File System

### 3.1 Design

Every agent gets an isolated storage namespace in Supabase Storage. No agent can read or write another agent's files. Storage paths follow a strict convention:

```
{entity_id}/{agent_id}/{yyyy-mm-dd}/{filename}
```

Example:
```
fbx-homes/agent_abc123/2026-02-22/lead-report-0830.pdf
homegenii/agent_xyz789/2026-02-22/email-draft-v2.txt
```

### 3.2 Schema Changes

```sql
-- Migration: 003_agent_file_system.sql

CREATE TABLE IF NOT EXISTS agent_files (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  entity_id       UUID NOT NULL REFERENCES entities(id),
  bucket_path     TEXT NOT NULL,         -- full storage path
  filename        TEXT NOT NULL,
  mime_type       TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes      BIGINT NOT NULL DEFAULT 0,
  purpose         TEXT NOT NULL,         -- 'output' | 'draft' | 'attachment' | 'log'
  task_id         UUID REFERENCES agent_tasks(id),
  thread_id       UUID REFERENCES threads(id),
  expires_at      TIMESTAMPTZ,           -- NULL = permanent
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT agent_files_path_unique UNIQUE (agent_id, bucket_path)
);

CREATE INDEX idx_agent_files_agent_id   ON agent_files(agent_id);
CREATE INDEX idx_agent_files_entity_id  ON agent_files(entity_id);
CREATE INDEX idx_agent_files_task_id    ON agent_files(task_id);
CREATE INDEX idx_agent_files_created_at ON agent_files(created_at DESC);

-- RLS: agents can only access their own entity's files
ALTER TABLE agent_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_files_entity_isolation ON agent_files
  USING (entity_id = current_setting('app.entity_id')::UUID);
```

### 3.3 Supabase Storage Bucket Policy

```sql
-- Each entity gets its own bucket. Bucket name = entity slug.
-- Bucket policy: service role only for agent writes; JWT-scoped for reads.

-- Storage path enforced in application layer before upload:
-- NEVER allow agent_id in path to differ from authenticated agent_id
```

### 3.4 API Routes

```
GET    /api/agents/:id/files              -- list files for agent
POST   /api/agents/:id/files              -- upload file (returns signed URL)
GET    /api/agents/:id/files/:file_id     -- get file metadata
DELETE /api/agents/:id/files/:file_id     -- soft-delete (sets expires_at = now)
GET    /api/agents/:id/files/:file_id/url -- get signed download URL (15min expiry)
```

### 3.5 Enforcement Rules

- Agent A **cannot** call `/api/agents/:id/files` where `:id` does not match the agent's JWT `sub`
- All uploads validated server-side: `agent_id` in path must equal `agent_id` in JWT
- File size limit: **50MB per file**, **5GB total per agent** (enforced at quota layer)
- Mime type allowlist: `text/*`, `application/json`, `application/pdf`, `image/*`, `application/octet-stream`

---

## 4. Pillar 2: Durable Memory

### 4.1 Design

Agents need two types of memory:
- **Short-term (working)**: key-value pairs that persist across task invocations — preferences, last-seen IDs, draft state
- **Long-term (semantic)**: vector-embedded summaries of past actions for RAG-style context retrieval

Both are scoped per `agent_id`. No agent can read another agent's memory.

### 4.2 Schema Changes

```sql
-- Migration: 003_agent_memory.sql

-- Short-term key-value memory
CREATE TABLE IF NOT EXISTS agent_memory (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  entity_id       UUID NOT NULL REFERENCES entities(id),
  key             TEXT NOT NULL,
  value           JSONB NOT NULL,
  ttl_seconds     INTEGER,               -- NULL = permanent
  last_accessed   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_count    INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT agent_memory_agent_key_unique UNIQUE (agent_id, key)
);

CREATE INDEX idx_agent_memory_agent_id   ON agent_memory(agent_id);
CREATE INDEX idx_agent_memory_key        ON agent_memory(agent_id, key);
CREATE INDEX idx_agent_memory_ttl        ON agent_memory(ttl_seconds) WHERE ttl_seconds IS NOT NULL;

-- Long-term semantic memory (requires pgvector extension)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS agent_memory_semantic (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  entity_id       UUID NOT NULL REFERENCES entities(id),
  content         TEXT NOT NULL,         -- original text
  embedding       vector(1536),          -- OpenAI text-embedding-3-small
  source_type     TEXT NOT NULL,         -- 'task_output' | 'thread_message' | 'ledger_entry' | 'manual'
  source_id       UUID,                  -- ID of the source record
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT agent_memory_semantic_source UNIQUE (agent_id, source_type, source_id)
);

CREATE INDEX idx_agent_memory_semantic_agent_id  ON agent_memory_semantic(agent_id);
CREATE INDEX idx_agent_memory_semantic_embedding ON agent_memory_semantic
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Auto-expire TTL'd memory (pg_cron job)
-- Runs every hour, deletes expired entries
SELECT cron.schedule(
  'expire-agent-memory',
  '0 * * * *',
  $$DELETE FROM agent_memory
    WHERE ttl_seconds IS NOT NULL
    AND updated_at + (ttl_seconds * interval '1 second') < NOW()$$
);

-- RLS
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory_semantic ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_memory_isolation ON agent_memory
  USING (entity_id = current_setting('app.entity_id')::UUID);

CREATE POLICY agent_memory_semantic_isolation ON agent_memory_semantic
  USING (entity_id = current_setting('app.entity_id')::UUID);
```

### 4.3 API Routes

```
-- Key-value memory
GET    /api/agents/:id/memory             -- list all keys (paginated)
GET    /api/agents/:id/memory/:key        -- get value for key
PUT    /api/agents/:id/memory/:key        -- upsert key-value pair
DELETE /api/agents/:id/memory/:key        -- delete a key

-- Semantic memory
POST   /api/agents/:id/memory/embed       -- embed + store content
POST   /api/agents/:id/memory/search      -- cosine similarity search (top-K)
```

### 4.4 Memory Search Contract

```typescript
// POST /api/agents/:id/memory/search
// Request
{
  query: string;       // natural language query
  top_k: number;       // default 5, max 20
  threshold: number;   // cosine similarity floor, default 0.75
  source_type?: string; // optional filter
}

// Response
{
  results: Array<{
    id: string;
    content: string;
    similarity: number;   // 0-1
    source_type: string;
    source_id: string;
    created_at: string;
  }>;
}
```

---

## 5. Pillar 3: Transactional Execution

### 5.1 Problem (Current Code)

`backend/routes/provision.ts` (current):
```typescript
// BROKEN: 3 separate queries, no transaction
await db.query('INSERT INTO agents ...', [...])
await db.query('INSERT INTO system_events ...', [...]) // if this fails, agent record is orphaned
await db.query('INSERT INTO ledger_entries ...', [...]) // never reached
```

This leaves the database in a dirty state on partial failure.

### 5.2 Fix: Transaction Wrapper Pattern

Every multi-table write in the Genii backend **must** use this pattern:

```typescript
// shared utility: backend/lib/db-transaction.ts
import { Pool, PoolClient } from 'pg'

export async function withTransaction<T>(
  db: Pool,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
```

### 5.3 Fixed Provision Route

```typescript
// backend/routes/provision.ts (corrected)
import { withTransaction } from '../lib/db-transaction'

async function provisionAgent(input: ProvisionInput) {
  return withTransaction(db, async (client) => {
    // 1. Insert agent
    const { rows: [agent] } = await client.query(
      `INSERT INTO agents (name, role, entity_id, skills, status)
       VALUES ($1, $2, $3, $4, 'provisioning') RETURNING *`,
      [input.name, input.role, input.entity_id, input.skills]
    )

    // 2. Insert quota (default limits)
    await client.query(
      `INSERT INTO agent_quotas (agent_id, entity_id, monthly_token_limit, monthly_cost_limit_usd)
       VALUES ($1, $2, 500000, 50.00)`,
      [agent.id, input.entity_id]
    )

    // 3. Insert ledger entry
    await client.query(
      `INSERT INTO ledger_entries (entity_id, agent_id, type, title, status)
       VALUES ($1, $2, 'hire', $3, 'pending_decision')`,
      [input.entity_id, agent.id, `Agent provisioned: ${input.name}`]
    )

    // 4. Insert system event
    await client.query(
      `INSERT INTO system_events (entity_id, actor_id, event_type, payload)
       VALUES ($1, $2, 'agent.provisioned', $3)`,
      [input.entity_id, input.requestor_actor_id, JSON.stringify({ agent_id: agent.id })]
    )

    // All 4 writes committed atomically or all rolled back
    return agent
  })
}
```

### 5.4 Transactional Rules (enforced in code review)

1. Any route that writes to **2 or more tables** must use `withTransaction()`
2. Any route that writes to **ledger_entries** must be in a transaction — no exceptions
3. n8n webhooks that trigger multi-step DB writes must use a single idempotent transaction with an `idempotency_key` column to prevent duplicate processing

### 5.5 Idempotency Table

```sql
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key             TEXT PRIMARY KEY,
  response_body   JSONB,
  status_code     INTEGER NOT NULL DEFAULT 200,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- Auto-expire via pg_cron
SELECT cron.schedule(
  'expire-idempotency-keys',
  '0 */4 * * *',
  $$DELETE FROM idempotency_keys WHERE expires_at < NOW()$$
);
```

---

## 6. Pillar 4: Horizontal Scalability

### 6.1 Design

Replace direct n8n webhook triggers with a durable task queue (BullMQ over Redis). Each agent gets its own named queue. Workers are Cloud Run instances that auto-scale based on queue depth.

```
POST /api/tasks  →  BullMQ queue (per-agent)  →  Worker pool (Cloud Run)
                         │
                         ├── Concurrency limit per agent (default: 1)
                         ├── Max queue depth per agent (default: 100)
                         ├── Retry with exponential backoff (3x, 1s/4s/16s)
                         └── Dead letter queue → alert + human escalation
```

### 6.2 Queue Schema

```sql
-- Migration: 003_task_queue.sql

CREATE TABLE IF NOT EXISTS agent_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id       UUID NOT NULL REFERENCES entities(id),
  agent_id        UUID NOT NULL REFERENCES agents(id),
  queue_name      TEXT NOT NULL,              -- 'agent:{agent_id}' by convention
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'queued',
    -- queued | running | completed | failed | needs_human | dead_lettered
  priority        INTEGER NOT NULL DEFAULT 5, -- 1=critical, 10=low
  input           JSONB NOT NULL DEFAULT '{}',
  output          JSONB,
  error           TEXT,
  retry_count     INTEGER NOT NULL DEFAULT 0,
  max_retries     INTEGER NOT NULL DEFAULT 3,
  idempotency_key TEXT UNIQUE,
  bullmq_job_id   TEXT,

  thread_id       UUID REFERENCES threads(id),
  ledger_entry_id UUID REFERENCES ledger_entries(id),

  queued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,

  CONSTRAINT valid_status CHECK (status IN (
    'queued','running','completed','failed','needs_human','dead_lettered'
  )),
  CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 10)
);

CREATE INDEX idx_agent_tasks_agent_status  ON agent_tasks(agent_id, status);
CREATE INDEX idx_agent_tasks_queue_name    ON agent_tasks(queue_name, status);
CREATE INDEX idx_agent_tasks_entity        ON agent_tasks(entity_id, status);
CREATE INDEX idx_agent_tasks_queued_at     ON agent_tasks(queued_at DESC);
```

### 6.3 BullMQ Worker Configuration

```typescript
// backend/workers/agent-worker.ts
import { Worker, Queue, QueueEvents } from 'bullmq'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

// One queue per agent, created on-demand
export function getAgentQueue(agentId: string): Queue {
  return new Queue(`agent:${agentId}`, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  })
}

// Worker factory — one worker process per Cloud Run instance
export function createAgentWorker(agentId: string) {
  return new Worker(
    `agent:${agentId}`,
    async (job) => {
      // Execute with quota check inside transaction
      return executeAgentTask(job.data)
    },
    {
      connection: redis,
      concurrency: 1,        // single-threaded per agent by default
      limiter: {
        max: 10,             // max 10 jobs per agent per minute
        duration: 60_000,
      },
    }
  )
}
```

### 6.4 Queue Depth Enforcement

```typescript
// backend/middleware/queue-guard.ts
// Called before any POST /api/tasks

export async function enforceQueueDepth(agentId: string, redis: Redis) {
  const queue = getAgentQueue(agentId)
  const waiting = await queue.getWaitingCount()
  const MAX_DEPTH = 100

  if (waiting >= MAX_DEPTH) {
    throw new Error(
      `Agent ${agentId} queue is full (${waiting}/${MAX_DEPTH}). ` +
      `Task rejected. Escalating to human review.`
    )
  }
}
```

### 6.5 Scalability Targets

| Metric | Target | Enforcement |
|--------|--------|-------------|
| Max concurrent tasks per agent | 1 (default), up to 5 (configurable) | BullMQ `concurrency` |
| Max queue depth per agent | 100 jobs | `queue-guard.ts` middleware |
| Worker horizontal scale | 1-20 Cloud Run instances | Cloud Run `--max-instances=20` |
| Task throughput | 1,000 tasks/min at peak | Redis + 20 worker instances |
| Retry policy | 3x exponential backoff (1s, 4s, 16s) | BullMQ `attempts` + `backoff` |
| Dead letter threshold | After 3 failed attempts | Moves to `dead_lettered` status + Slack alert |

---

## 7. Pillar 5: Quota Management

### 7.1 Design

Every agent has a quota record defining hard limits on compute consumption. The quota enforcer middleware runs as the **first** step in every task execution — before any LLM calls or DB writes. Quota violations are rejected immediately and logged.

### 7.2 Schema

```sql
-- Migration: 003_agent_quotas.sql

CREATE TABLE IF NOT EXISTS agent_quotas (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id                    UUID NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
  entity_id                   UUID NOT NULL REFERENCES entities(id),

  -- Token limits (per month)
  monthly_token_limit         BIGINT NOT NULL DEFAULT 500000,
  monthly_tokens_used         BIGINT NOT NULL DEFAULT 0,

  -- Cost limits (per month, USD)
  monthly_cost_limit_usd      DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  monthly_cost_used_usd       DECIMAL(10,2) NOT NULL DEFAULT 0.00,

  -- Rate limits (per minute)
  rate_limit_rpm              INTEGER NOT NULL DEFAULT 60,   -- requests per minute
  rate_limit_tpm              INTEGER NOT NULL DEFAULT 40000, -- tokens per minute

  -- Storage limits
  storage_limit_bytes         BIGINT NOT NULL DEFAULT 5368709120, -- 5GB
  storage_used_bytes          BIGINT NOT NULL DEFAULT 0,

  -- Task limits
  max_concurrent_tasks        INTEGER NOT NULL DEFAULT 1,
  max_queue_depth             INTEGER NOT NULL DEFAULT 100,

  -- Billing period
  period_start                DATE NOT NULL DEFAULT DATE_TRUNC('month', NOW()),
  period_end                  DATE NOT NULL DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month - 1 day'),

  -- Overage policy
  overage_policy              TEXT NOT NULL DEFAULT 'block',
    -- 'block' | 'alert_only' | 'allow' (for trusted agents)

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_overage_policy CHECK (overage_policy IN ('block', 'alert_only', 'allow'))
);

-- Usage log for cost attribution
CREATE TABLE IF NOT EXISTS agent_quota_usage (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id        UUID NOT NULL REFERENCES agents(id),
  entity_id       UUID NOT NULL REFERENCES entities(id),
  task_id         UUID REFERENCES agent_tasks(id),
  tokens_used     INTEGER NOT NULL DEFAULT 0,
  cost_usd        DECIMAL(8,4) NOT NULL DEFAULT 0.0000,
  model           TEXT NOT NULL,           -- 'gpt-4o' | 'claude-3-5-sonnet' | etc.
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quota_usage_agent_period ON agent_quota_usage(agent_id, recorded_at DESC);
CREATE INDEX idx_quota_usage_entity       ON agent_quota_usage(entity_id, recorded_at DESC);

-- Auto-reset monthly quotas at period start
SELECT cron.schedule(
  'reset-agent-quotas',
  '0 0 1 * *',   -- midnight, 1st of every month
  $$UPDATE agent_quotas SET
      monthly_tokens_used = 0,
      monthly_cost_used_usd = 0.00,
      period_start = DATE_TRUNC('month', NOW()),
      period_end = DATE_TRUNC('month', NOW()) + INTERVAL '1 month - 1 day'
    WHERE overage_policy != 'allow'$$
);
```

### 7.3 Quota Enforcer Middleware

```typescript
// backend/middleware/quota-enforcer.ts

interface QuotaCheckResult {
  allowed: boolean
  reason?: string
  current: {
    tokens_pct: number
    cost_pct: number
    storage_pct: number
  }
}

export async function enforceQuota(
  agentId: string,
  estimatedTokens: number,
  estimatedCostUsd: number,
  db: Pool
): Promise<QuotaCheckResult> {
  const { rows: [quota] } = await db.query(
    `SELECT * FROM agent_quotas WHERE agent_id = $1`,
    [agentId]
  )

  if (!quota) {
    throw new Error(`No quota record found for agent ${agentId}. Provisioning incomplete.`)
  }

  // Hard checks
  const tokenOverage = (quota.monthly_tokens_used + estimatedTokens) > quota.monthly_token_limit
  const costOverage  = (Number(quota.monthly_cost_used_usd) + estimatedCostUsd) > Number(quota.monthly_cost_limit_usd)

  if ((tokenOverage || costOverage) && quota.overage_policy === 'block') {
    return {
      allowed: false,
      reason: tokenOverage
        ? `Token quota exceeded: ${quota.monthly_tokens_used}/${quota.monthly_token_limit}`
        : `Cost quota exceeded: $${quota.monthly_cost_used_usd}/$${quota.monthly_cost_limit_usd}`,
      current: {
        tokens_pct: quota.monthly_tokens_used / quota.monthly_token_limit * 100,
        cost_pct: Number(quota.monthly_cost_used_usd) / Number(quota.monthly_cost_limit_usd) * 100,
        storage_pct: Number(quota.storage_used_bytes) / quota.storage_limit_bytes * 100,
      }
    }
  }

  // Alert-only: allow but fire webhook
  if ((tokenOverage || costOverage) && quota.overage_policy === 'alert_only') {
    await notifyQuotaOverage(agentId, quota) // non-blocking
  }

  return {
    allowed: true,
    current: {
      tokens_pct: quota.monthly_tokens_used / quota.monthly_token_limit * 100,
      cost_pct: Number(quota.monthly_cost_used_usd) / Number(quota.monthly_cost_limit_usd) * 100,
      storage_pct: Number(quota.storage_used_bytes) / quota.storage_limit_bytes * 100,
    }
  }
}
```

### 7.4 Usage Recording (after task completion)

```typescript
// Called inside withTransaction() after every LLM call completes
async function recordQuotaUsage(
  client: PoolClient,
  agentId: string,
  entityId: string,
  taskId: string,
  tokensUsed: number,
  costUsd: number,
  model: string
) {
  await client.query(
    `INSERT INTO agent_quota_usage (agent_id, entity_id, task_id, tokens_used, cost_usd, model)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [agentId, entityId, taskId, tokensUsed, costUsd, model]
  )

  await client.query(
    `UPDATE agent_quotas
     SET monthly_tokens_used = monthly_tokens_used + $1,
         monthly_cost_used_usd = monthly_cost_used_usd + $2,
         updated_at = NOW()
     WHERE agent_id = $3`,
    [tokensUsed, costUsd, agentId]
  )
}
```

### 7.5 Quota API Routes

```
GET    /api/agents/:id/quota              -- current quota state + usage percentages
PUT    /api/agents/:id/quota              -- update limits (admin only)
GET    /api/agents/:id/quota/usage        -- usage history (paginated, by day)
POST   /api/agents/:id/quota/reset        -- manual reset (admin only)
GET    /api/entities/:id/quota/summary    -- all agents' quota rollup for entity
```

---

## 8. Migration Plan

All changes land in a single migration file: `004_agent_isolation_runtime.sql`

### Execution Order

```sql
-- 1. Agent file system
-- (tables: agent_files)

-- 2. Agent memory
-- (extensions: vector; tables: agent_memory, agent_memory_semantic; cron: expire-agent-memory)

-- 3. Idempotency
-- (tables: idempotency_keys; cron: expire-idempotency-keys)

-- 4. Task queue
-- (tables: agent_tasks — replaces or extends existing if present)

-- 5. Quota management
-- (tables: agent_quotas, agent_quota_usage; cron: reset-agent-quotas)

-- 6. RLS policies on all new tables
-- 7. Backfill: create default quota records for all existing agents
INSERT INTO agent_quotas (agent_id, entity_id)
SELECT id, entity_id FROM agents
ON CONFLICT (agent_id) DO NOTHING;
```

### Zero-Downtime Strategy

1. Migration runs in a transaction — all or nothing
2. New tables are additive — no existing tables altered
3. `provision.ts` fix is backward compatible — wraps existing logic in `withTransaction()`
4. BullMQ queue is introduced alongside existing n8n flows; n8n remains active until queue is validated in staging

---

## 9. New File Structure

```
backend/
  lib/
    db-transaction.ts       -- withTransaction() helper
    quota-enforcer.ts       -- enforceQuota() middleware
    queue-guard.ts          -- enforceQueueDepth() middleware
  workers/
    agent-worker.ts         -- BullMQ worker factory
    worker-runner.ts        -- entrypoint for Cloud Run worker instances
  routes/
    provision.ts            -- FIXED: wrapped in withTransaction()
    agent-files.ts          -- NEW: per-agent file system routes
    agent-memory.ts         -- NEW: durable memory routes
    agent-quota.ts          -- NEW: quota management routes

migrations/
  003_agent_isolation_runtime.sql  -- all 5 pillars in one migration
```

---

## 10. Definition of Done

| Pillar | Acceptance Test |
|--------|----------------|
| Per-agent file system | Agent A uploads file → Agent B's JWT cannot retrieve it (403). File persists across agent restarts. |
| Durable memory | Agent writes key `last_lead_id=123` → process restarts → agent reads back `123`. Semantic search returns top-3 relevant memories with similarity >= 0.80. |
| Transactional execution | Kill DB mid-provision → no orphaned agent records. All 4 tables either all written or all rolled back. |
| Horizontal scalability | 200 simultaneous task submissions → queue depth stays bounded, all processed in order, no data loss. Worker count scales from 1 to 5 automatically under load. |
| Quota management | Agent hits 100% token quota → next task returns 429 with `quota_exceeded` reason. `monthly_tokens_used` never exceeds `monthly_token_limit` in `block` mode. |

---

## 11. Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | Should `concurrency` per agent be configurable at runtime or fixed at provision time? | David | Mar 1 |
| 2 | pgvector vs. Pinecone for semantic memory at scale? | Eng | Mar 1 |
| 3 | Should `overage_policy=allow` require explicit approval, or is role-based sufficient? | David | Mar 1 |
| 4 | File retention policy: permanent by default, or auto-expire after 90 days? | David | Mar 1 |

---

*RFC-001 v1.0 — locked for sprint. Changes require PR + approval from david@geniinow.com*
