# Agent Implementation Specs: Agent Isolation Runtime
## Genii Platform — 5 Specialized Build Agents
**Version:** 1.0  
**Status:** Ready for Sprint  
**Date:** February 2026  
**Linked PRD:** PRD-agent-isolation.md  
**Linked RFC:** RFC-001-agent-isolation-runtime.md  

---

## Overview

Five specialized agents are required to build the Agent Isolation Runtime. Each agent owns exactly one pillar. No agent touches another agent's pillar. All five agents share the same schema reference (`docs/genii-platform-schema.md`) and coordinate through the GitHub PR workflow.

| Agent | Pillar | Owns |
|-------|--------|------|
| [Agent 1] File System Agent | Per-Agent File System | Migration, Supabase Storage config, 5 API routes |
| [Agent 2] Memory Agent | Durable Memory | Migration, pgvector setup, 5 API routes |
| [Agent 3] Transaction Agent | Transactional Execution | `withTransaction()` lib, idempotency middleware, fix provision.ts |
| [Agent 4] Queue Agent | Horizontal Scalability | BullMQ setup, worker factory, queue-guard middleware |
| [Agent 5] Quota Agent | Quota Management | Migration, enforcer middleware, 5 API routes, pg_cron jobs |

All code lands in `github.com/davidmschy/genii-platform`. Each agent opens a separate PR against `main`. PRs merge in dependency order: Agent 3 first (no deps), then Agent 5, then Agents 1, 2, 4 in parallel.

---

## Agent 1: File System Agent

### Identity
Specialized backend engineer. Owns the per-agent file system pillar end-to-end: database schema, Supabase Storage bucket policy, and all five API routes. Writes TypeScript (Fastify), SQL, and Supabase Storage configuration.

### Inputs
- `docs/RFC-001-agent-isolation-runtime.md` Section 3 (Pillar 1)
- `docs/genii-platform-schema.md` (Actor, Entity, AgentTask types)
- `code/backend/server.ts` (route registration pattern)
- `code/migrations/002_thread_tables.sql` (migration style reference)

### Deliverables

#### 1. Migration: `code/migrations/003_agent_files.sql`

```sql
-- Exactly as specified in RFC-001 Section 3.2
-- Tables: agent_files
-- Indexes: agent_id, entity_id, task_id, created_at DESC
-- RLS: entity_id isolation policy
-- Constraint: UNIQUE(agent_id, bucket_path)
```

Full implementation requirements:
- Use `uuid_generate_v4()` for all IDs (consistent with migration 002)
- `purpose` column: enforce CHECK constraint `IN ('output','draft','attachment','log')`
- `expires_at` nullable — NULL means permanent retention
- Add trigger to update `agent_quotas.storage_used_bytes` on INSERT and soft-DELETE
- Foreign keys: `agent_id → agents(id) ON DELETE CASCADE`, `entity_id → entities(id)`

#### 2. Supabase Storage Configuration: `code/backend/lib/storage.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!   // service role — never exposed to clients
)

// Bucket naming: one bucket per entity slug
// Path convention: {entity_slug}/{agent_id}/{yyyy-mm-dd}/{filename}
export function agentStoragePath(
  entitySlug: string,
  agentId: string,
  filename: string
): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${entitySlug}/${agentId}/${date}/${filename}`
}

// Upload with path enforcement
export async function uploadAgentFile(
  entitySlug: string,
  agentId: string,
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ path: string; size: number }> { ... }

// Signed URL — 15 minute expiry, never raw path
export async function getSignedUrl(bucketPath: string): Promise<string> { ... }
```

#### 3. API Routes: `code/backend/routes/agent-files.ts`

Implement all 5 routes as a Fastify plugin:

```typescript
// GET /api/agents/:id/files
// Query params: ?purpose=output&from=2026-02-01&to=2026-02-28&limit=20&offset=0
// Response: { files: AgentFile[], total: number, has_more: boolean }

// POST /api/agents/:id/files
// Multipart form upload (use @fastify/multipart)
// Validates: JWT sub === :id, size <= 50MB, mime in allowlist
// Inserts to agent_files table, uploads to Supabase Storage
// Response: { file: AgentFile }

// GET /api/agents/:id/files/:file_id
// Response: { file: AgentFile } (metadata only, no content)

// DELETE /api/agents/:id/files/:file_id
// Soft delete: sets expires_at = NOW()
// Updates agent_quotas.storage_used_bytes -= file.size_bytes
// Response: { success: true }

// GET /api/agents/:id/files/:file_id/url
// Generates signed URL via Supabase Storage, expires in 900s
// Response: { url: string, expires_at: string }
```

**Auth enforcement on every route:**
```typescript
// Middleware — add to all agent-files routes
async function enforceAgentOwnership(request, reply) {
  const { id } = request.params
  const { sub } = request.user  // from JWT
  if (sub !== id) {
    return reply.status(403).send({
      error: 'forbidden',
      message: 'Agent can only access its own files'
    })
  }
}
```

#### 4. Route Registration

Add to `code/backend/server.ts`:
```typescript
import { agentFileRoutes } from './routes/agent-files'
await app.register(agentFileRoutes, { prefix: '/api/agents' })
```

### Acceptance Tests (write these as Jest tests in `code/backend/tests/agent-files.test.ts`)

```typescript
describe('Agent File System', () => {
  test('upload succeeds for owning agent')
  test('upload returns 403 for non-owning agent JWT')
  test('file > 50MB returns 413')
  test('signed URL expires after 900 seconds')
  test('deleted file returns 404 on subsequent GET')
  test('file persists after agent process restart simulation')
  test('cross-agent file access returns 403')
  test('storage_used_bytes updates on upload and delete')
})
```

### PR Requirements
- Branch: `feat/agent-file-system`
- Migration must be idempotent (`IF NOT EXISTS` on all DDL)
- Zero `console.log` — use Fastify logger throughout
- All routes return consistent error shape: `{ error: string, message: string, code?: string }`
- TypeScript strict mode, no `any` types

---

## Agent 2: Memory Agent

### Identity
Specialized backend engineer with ML/vector database experience. Owns the durable memory pillar: key-value store, vector embeddings, semantic search, and TTL management.

### Inputs
- `docs/RFC-001-agent-isolation-runtime.md` Section 4 (Pillar 2)
- `docs/genii-platform-schema.md`
- `code/backend/server.ts`
- `code/migrations/002_thread_tables.sql` (style reference)

### Deliverables

#### 1. Migration: `code/migrations/004_agent_memory.sql`

```sql
-- Enable pgvector (must be first)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tables: agent_memory, agent_memory_semantic
-- Exactly as specified in RFC-001 Section 4.2
-- Additional requirements:
--   agent_memory: trigger to update updated_at on every UPDATE
--   agent_memory_semantic: IVFFlat index with lists=100 for cosine similarity
--   pg_cron: 'expire-agent-memory' job runs hourly
-- RLS policies on both tables
```

Full implementation requirements:
- `agent_memory.value` stores any JSON — validate in application layer, not DB
- `agent_memory.access_count` increments on every GET via UPDATE trigger
- `agent_memory_semantic.embedding` dimension: 1536 (text-embedding-3-small)
- IVFFlat index only created after seeding — add comment in migration noting this

#### 2. Embedding Service: `code/backend/lib/embeddings.ts`

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8191),  // token limit safety
  })
  return response.data[0].embedding
}

// Cost tracking: text-embedding-3-small = $0.00002 / 1K tokens
export function estimateEmbeddingCost(text: string): number {
  const estimatedTokens = Math.ceil(text.length / 4)
  return (estimatedTokens / 1000) * 0.00002
}
```

#### 3. API Routes: `code/backend/routes/agent-memory.ts`

```typescript
// GET /api/agents/:id/memory
// Query: ?limit=50&offset=0&include_expired=false
// Response: { keys: MemoryKey[], total: number }

// GET /api/agents/:id/memory/:key
// Returns value + metadata; increments access_count
// 404 if key not found or TTL expired
// Response: { key: string, value: any, ttl_seconds?: number, access_count: number, updated_at: string }

// PUT /api/agents/:id/memory/:key
// Upsert — creates or replaces
// Body: { value: any, ttl_seconds?: number }
// Response: { key: string, value: any, created: boolean }

// DELETE /api/agents/:id/memory/:key
// Hard delete (not soft — memory deletion is intentional)
// Response: { success: true }

// POST /api/agents/:id/memory/embed
// Embeds content and stores in agent_memory_semantic
// Body: { content: string, source_type: string, source_id?: string, metadata?: object }
// Calls embeddings.ts, stores vector
// Response: { id: string, content: string, created_at: string }

// POST /api/agents/:id/memory/search
// Body: { query: string, top_k?: number, threshold?: number, source_type?: string }
// Generates embedding for query, runs cosine similarity search
// Response: { results: SemanticMemoryResult[] }
```

**Semantic search SQL (use in route handler):**
```sql
SELECT
  id, content, source_type, source_id, metadata, created_at,
  1 - (embedding <=> $1::vector) AS similarity
FROM agent_memory_semantic
WHERE agent_id = $2
  AND ($3::text IS NULL OR source_type = $3)
  AND 1 - (embedding <=> $1::vector) >= $4
ORDER BY embedding <=> $1::vector
LIMIT $5;
```

#### 4. Redis Cache Layer for KV Memory

Hot-path keys (accessed > 5x in last hour) should be cached in Redis:
```typescript
// backend/lib/memory-cache.ts
// Cache key pattern: 'memory:{agent_id}:{key}'
// TTL in Redis = min(ttl_seconds, 3600) — never cache longer than 1 hour
// Invalidate on PUT and DELETE
```

### Acceptance Tests (`code/backend/tests/agent-memory.test.ts`)

```typescript
describe('Durable Memory', () => {
  test('PUT memory key → GET returns same value after simulated restart')
  test('TTL memory key → returns 404 after ttl_seconds elapsed')
  test('cross-agent memory read returns 404 (not 403 — do not leak existence)')
  test('embed + search returns result with similarity >= 0.75')
  test('search with threshold=0.99 returns empty array for unrelated query')
  test('access_count increments on each GET')
  test('expired keys not returned in list endpoint')
  test('embed latency < 2000ms p95')
})
```

### PR Requirements
- Branch: `feat/agent-durable-memory`
- Depends on: `feat/transaction-engine` (merged first)
- All embedding calls must go through `withTransaction()` when writing to DB
- Redis cache invalidation must be atomic with DB write — use pipeline
- Never log embedding vectors — only log `{ agent_id, source_type, dimension: 1536 }`

---

## Agent 3: Transaction Agent

### Identity
Senior backend engineer specializing in database reliability and atomic operations. Owns the transactional execution pillar: the `withTransaction()` utility, idempotency middleware, and the fix to `provision.ts`. This is the foundational PR that all other agents depend on.

### Inputs
- `docs/RFC-001-agent-isolation-runtime.md` Section 5 (Pillar 3)
- `code/backend/server.ts`
- `code/backend/routes/provision.ts` (the broken file)
- `code/migrations/002_thread_tables.sql`

### Deliverables

#### 1. Transaction Utility: `code/backend/lib/db-transaction.ts`

```typescript
import { Pool, PoolClient } from 'pg'
import { FastifyBaseLogger } from 'fastify'

export interface TransactionOptions {
  isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE'
  logger?: FastifyBaseLogger
}

export async function withTransaction<T>(
  db: Pool,
  fn: (client: PoolClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const client = await db.connect()
  const { isolationLevel = 'READ COMMITTED', logger } = options

  try {
    await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`)
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    logger?.error({ err, fn: fn.name }, 'Transaction rolled back')
    throw err
  } finally {
    client.release()
  }
}

// Retry helper for deadlock scenarios
export async function withTransactionRetry<T>(
  db: Pool,
  fn: (client: PoolClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(db, fn)
    } catch (err: any) {
      // Postgres deadlock error code: 40P01
      if (err.code === '40P01' && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 100))
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}
```

#### 2. Idempotency Middleware: `code/backend/middleware/idempotency.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify'
import { Pool } from 'pg'

// Register as a Fastify preHandler on all POST routes
export function idempotencyMiddleware(db: Pool) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const key = request.headers['idempotency-key'] as string
    if (!key) return  // idempotency is optional for non-mutation callers

    // Check cache
    const { rows } = await db.query(
      `SELECT response_body, status_code FROM idempotency_keys
       WHERE key = $1 AND expires_at > NOW()`,
      [key]
    )

    if (rows.length > 0) {
      // Return cached response — do not re-execute
      return reply.status(rows[0].status_code).send(rows[0].response_body)
    }

    // Store key before execution to prevent concurrent duplicate requests
    await db.query(
      `INSERT INTO idempotency_keys (key, status_code)
       VALUES ($1, 202)
       ON CONFLICT (key) DO NOTHING`,
      [key]
    )

    // Attach key to request context for route handler to update after execution
    ;(request as any).idempotencyKey = key
  }
}

// Call this after successful route execution
export async function resolveIdempotencyKey(
  db: Pool,
  key: string,
  responseBody: unknown,
  statusCode: number
) {
  await db.query(
    `UPDATE idempotency_keys
     SET response_body = $1, status_code = $2
     WHERE key = $3`,
    [JSON.stringify(responseBody), statusCode, key]
  )
}
```

#### 3. Migration: `code/migrations/003_idempotency.sql`

```sql
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key             TEXT PRIMARY KEY,
  response_body   JSONB,
  status_code     INTEGER NOT NULL DEFAULT 202,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
CREATE INDEX idx_idempotency_key ON idempotency_keys(key);

SELECT cron.schedule(
  'expire-idempotency-keys',
  '0 */4 * * *',
  $$DELETE FROM idempotency_keys WHERE expires_at < NOW()$$
);
```

#### 4. Fixed Provision Route: `code/backend/routes/provision.ts`

Rewrite the existing file. Full requirements:
- Wrap all 4 DB writes in `withTransaction()`
- Create agent → quota → ledger_entry → system_event in that order
- Use `withTransactionRetry()` for deadlock resilience
- Add `Idempotency-Key` support on the provision endpoint
- Return the provisioned agent record + quota defaults on success
- Fire n8n webhook **after** commit completes (not inside transaction)

```typescript
// Skeleton — agent must fill in full implementation
export async function provisionAgent(input: ProvisionInput, db: Pool) {
  return withTransactionRetry(db, async (client) => {
    const agent = await insertAgent(client, input)
    await insertDefaultQuota(client, agent.id, input.entity_id)
    await insertLedgerEntry(client, agent.id, input.entity_id, input.requestor_actor_id)
    await insertSystemEvent(client, agent.id, input.entity_id, input.requestor_actor_id)
    return agent
  })
  // n8n webhook fired here, outside transaction
}
```

#### 5. ESLint Rule Documentation: `code/backend/TRANSACTION-RULES.md`

Document the enforcement policy for code review:
- Any function touching `ledger_entries` must call `withTransaction()`
- Any function touching 2+ tables must call `withTransaction()`
- Raw `db.query()` is allowed only for single-table reads
- Violations block PR merge

### Acceptance Tests (`code/backend/tests/transactions.test.ts`)

```typescript
describe('Transactional Execution', () => {
  test('provision: all 4 tables written atomically on success')
  test('provision: inject error after step 2 → 0 rows in all 4 tables')
  test('provision: inject error after step 3 → 0 rows in all 4 tables')
  test('idempotency: same key twice → second call returns cached response, no new DB rows')
  test('deadlock: withTransactionRetry retries up to 3 times on 40P01')
  test('rollback logged with error and fn name')
  test('withTransaction COMMIT verified by reading back written rows')
})
```

### PR Requirements
- Branch: `feat/transaction-engine`
- **This is the first PR — no dependencies**
- Merge to `main` before any other agent opens their PR
- Exports from `db-transaction.ts` must be re-exported from `code/backend/lib/index.ts`
- 100% test coverage on `withTransaction` and `withTransactionRetry`

---

## Agent 4: Queue Agent

### Identity
Platform infrastructure engineer. Owns the horizontal scalability pillar: BullMQ queue setup, per-agent worker factory, queue-guard middleware, and Cloud Run worker configuration.

### Inputs
- `docs/RFC-001-agent-isolation-runtime.md` Section 6 (Pillar 4)
- `code/backend/server.ts`
- `code/docker-compose.yml` (Redis service already present)
- `code/migrations/002_thread_tables.sql`

### Deliverables

#### 1. Migration: `code/migrations/005_agent_tasks.sql`

```sql
-- Table: agent_tasks (full schema per RFC-001 Section 6.2)
-- Indexes: (agent_id, status), (queue_name, status), (entity_id, status), (queued_at DESC)
-- Constraint: UNIQUE(idempotency_key) WHERE idempotency_key IS NOT NULL
-- Trigger: on status → 'dead_lettered', insert into system_events
```

Full implementation requirements:
- `bullmq_job_id` TEXT — populated when job is enqueued
- `retry_count` auto-incremented by worker on each retry attempt
- `failed_at` set by worker on final failure
- Status transition trigger: `queued → running → completed|failed|needs_human`
- Add CHECK constraint: `started_at IS NULL OR started_at >= queued_at`

#### 2. BullMQ Setup: `code/backend/workers/queue.ts`

```typescript
import { Queue, QueueEvents, Worker, Job } from 'bullmq'
import Redis from 'ioredis'

// Singleton Redis connection for BullMQ
let _redis: Redis | null = null
export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,  // required by BullMQ
      enableReadyCheck: false,
    })
  }
  return _redis
}

// Get or create per-agent queue
const queues = new Map<string, Queue>()
export function getAgentQueue(agentId: string): Queue {
  if (!queues.has(agentId)) {
    queues.set(agentId, new Queue(`agent:${agentId}`, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    }))
  }
  return queues.get(agentId)!
}
```

#### 3. Queue Guard Middleware: `code/backend/middleware/queue-guard.ts`

```typescript
import { getAgentQueue } from '../workers/queue'

export const MAX_QUEUE_DEPTH = 100

export async function enforceQueueDepth(agentId: string): Promise<void> {
  const queue = getAgentQueue(agentId)
  const [waiting, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getDelayedCount(),
  ])
  const depth = waiting + delayed

  if (depth >= MAX_QUEUE_DEPTH) {
    throw Object.assign(new Error(`Queue full for agent ${agentId}`), {
      code: 'queue_full',
      statusCode: 429,
      depth,
      limit: MAX_QUEUE_DEPTH,
    })
  }
}
```

#### 4. Worker Factory: `code/backend/workers/agent-worker.ts`

```typescript
import { Worker, Job } from 'bullmq'
import { Pool } from 'pg'
import { withTransaction } from '../lib/db-transaction'
import { enforceQuota } from '../middleware/quota-enforcer'
import { getRedis } from './queue'

export function createAgentWorker(agentId: string, db: Pool): Worker {
  return new Worker(
    `agent:${agentId}`,
    async (job: Job) => {
      const task = job.data as AgentTaskPayload

      // 1. Mark task as running (inside transaction)
      await withTransaction(db, async (client) => {
        await client.query(
          `UPDATE agent_tasks SET status = 'running', started_at = NOW()
           WHERE id = $1`,
          [task.task_id]
        )
      })

      // 2. Quota check BEFORE any LLM call
      const quotaResult = await enforceQuota(
        agentId, task.estimated_tokens, task.estimated_cost_usd, db
      )
      if (!quotaResult.allowed) {
        await failTask(db, task.task_id, `quota_exceeded: ${quotaResult.reason}`)
        return
      }

      // 3. Execute task (agent-specific logic)
      const output = await executeTask(task)

      // 4. Record result + usage atomically
      await withTransaction(db, async (client) => {
        await client.query(
          `UPDATE agent_tasks
           SET status = 'completed', output = $1, completed_at = NOW()
           WHERE id = $2`,
          [JSON.stringify(output), task.task_id]
        )
        await recordQuotaUsage(
          client, agentId, task.entity_id, task.task_id,
          output.tokens_used, output.cost_usd, output.model
        )
      })
    },
    {
      connection: getRedis(),
      concurrency: 1,
      limiter: { max: 60, duration: 60_000 },
    }
  )
}
```

#### 5. Worker Entrypoint: `code/backend/workers/worker-runner.ts`

Standalone process deployed as a separate Cloud Run service:
```typescript
// Reads AGENT_ID env var → creates worker for that agent
// Handles SIGTERM gracefully — waits for current job to complete
// Health check: GET /health returns { status: 'ok', queue: agentId, active: N }
```

#### 6. Dead-Letter Handler

When a job exhausts all retries, BullMQ fires `failed` event:
```typescript
worker.on('failed', async (job, err) => {
  if (job.attemptsMade >= job.opts.attempts!) {
    // Update DB status to dead_lettered
    // Post Slack alert to #fleet-ops
    // Create human escalation thread via POST /api/threads
  }
})
```

#### 7. Updated POST /api/tasks Route

Modify existing task creation route to enqueue via BullMQ instead of direct execution:
```typescript
// Before: await executeTaskDirectly(input)
// After:
await enforceQueueDepth(input.agent_id)
const queue = getAgentQueue(input.agent_id)
const job = await queue.add('execute', taskPayload, {
  priority: priorityToNumber(input.priority),
  jobId: input.idempotency_key,  // BullMQ deduplication
})
await db.query(
  `UPDATE agent_tasks SET bullmq_job_id = $1 WHERE id = $2`,
  [job.id, task.id]
)
```

### Acceptance Tests (`code/backend/tests/queue.test.ts`)

```typescript
describe('Horizontal Scalability', () => {
  test('queue depth at 100 → POST /tasks returns 429 with queue_full code')
  test('queue depth at 99 → POST /tasks returns 201, job enqueued')
  test('task fails 3 times → status = dead_lettered, Slack alert fired')
  test('retry delays: ~1s, ~4s, ~16s between attempts')
  test('200 concurrent submissions → all reach completed, no data loss')
  test('bullmq_job_id populated in agent_tasks on enqueue')
  test('worker SIGTERM: completes current job before shutdown')
  test('duplicate idempotency_key → BullMQ deduplicates, one job only')
})
```

### PR Requirements
- Branch: `feat/queue-scalability`
- Depends on: `feat/transaction-engine` (merged), `feat/quota-enforcement` (merged)
- `package.json`: add `bullmq` as dependency, add `worker` script entry
- Cloud Run worker Dockerfile: separate from backend API — `worker-runner.ts` as entrypoint
- Never import `agent-worker.ts` into the API server — workers run in separate processes

---

## Agent 5: Quota Agent

### Identity
Backend engineer with billing and metering systems experience. Owns the quota management pillar: schema, enforcer middleware, API routes, and all pg_cron jobs. Operates as a shared service consumed by all other agents.

### Inputs
- `docs/RFC-001-agent-isolation-runtime.md` Section 7 (Pillar 5)
- `code/backend/server.ts`
- `code/backend/routes/provision.ts` (must integrate quota creation at provision time)
- `code/migrations/002_thread_tables.sql`

### Deliverables

#### 1. Migration: `code/migrations/006_agent_quotas.sql`

```sql
-- Tables: agent_quotas, agent_quota_usage
-- Exactly as specified in RFC-001 Section 7.2
-- Additional requirements:
--   agent_quotas: trigger to update updated_at on every UPDATE
--   agent_quota_usage: partition by month (range on recorded_at) if > 10M rows expected
--   pg_cron: 'reset-agent-quotas' runs at midnight on 1st of each month
--   pg_cron: 'quota-warning-check' runs every 15 minutes, publishes alert if any agent > 80%

-- Backfill: create default quotas for all existing agents
INSERT INTO agent_quotas (agent_id, entity_id)
SELECT id, entity_id FROM agents
WHERE id NOT IN (SELECT agent_id FROM agent_quotas)
ON CONFLICT (agent_id) DO NOTHING;
```

Full implementation requirements:
- `rate_limit_rpm` enforced via Redis sliding window (not DB) — DB stores the limit, Redis enforces it
- Quota warning check pg_cron job publishes to Redis pub/sub channel `quota:warnings`
- `agent_quota_usage.cost_usd` precision: 4 decimal places (DECIMAL(8,4))
- Index on `agent_quota_usage(agent_id, recorded_at DESC)` — most common query pattern

#### 2. Quota Enforcer: `code/backend/middleware/quota-enforcer.ts`

Full implementation of the interface defined in RFC-001 Section 7.3:

```typescript
export interface QuotaCheckResult {
  allowed: boolean
  reason?: string
  policy: 'block' | 'alert_only' | 'allow'
  current: {
    tokens_used: number
    tokens_limit: number
    tokens_pct: number
    cost_used_usd: number
    cost_limit_usd: number
    cost_pct: number
    storage_used_bytes: number
    storage_limit_bytes: number
    storage_pct: number
  }
}

// Redis cache key: 'quota:{agent_id}'
// Cache TTL: 60 seconds
// Invalidate on: PUT /api/agents/:id/quota, quota usage recording

export async function enforceQuota(
  agentId: string,
  estimatedTokens: number,
  estimatedCostUsd: number,
  db: Pool,
  redis: Redis
): Promise<QuotaCheckResult> { ... }

// Rate limit check using Redis sliding window
// Key: 'rate:{agent_id}:rpm'
// Uses ZADD + ZRANGEBYSCORE + ZREMRANGEBYSCORE pattern
export async function enforceRateLimit(
  agentId: string,
  redis: Redis,
  limitRpm: number
): Promise<{ allowed: boolean; current: number; limit: number }> { ... }

// Called inside withTransaction() after every task completion
export async function recordQuotaUsage(
  client: PoolClient,
  agentId: string,
  entityId: string,
  taskId: string,
  tokensUsed: number,
  costUsd: number,
  model: string
): Promise<void> { ... }

async function notifyQuotaOverage(agentId: string, quota: AgentQuota): Promise<void> {
  // Post to Slack #fleet-ops (non-blocking, fire-and-forget)
  // Publish to Redis pub/sub 'quota:warnings' channel
}
```

#### 3. API Routes: `code/backend/routes/agent-quota.ts`

```typescript
// GET /api/agents/:id/quota
// Returns current quota state with usage percentages
// Reads from DB (not cache — always fresh for this endpoint)
// Response: { quota: AgentQuota, usage: QuotaUsageSummary }

// PUT /api/agents/:id/quota
// Admin-only (check JWT role claim: 'admin')
// Body: Partial<{ monthly_token_limit, monthly_cost_limit_usd, rate_limit_rpm,
//               storage_limit_bytes, max_concurrent_tasks, overage_policy }>
// Invalidates Redis cache after update
// Response: { quota: AgentQuota }

// GET /api/agents/:id/quota/usage
// Paginated usage history from agent_quota_usage
// Query: ?from=2026-02-01&to=2026-02-28&limit=100&offset=0&group_by=day
// Response: { usage: DailyUsage[], total_tokens: number, total_cost_usd: number }

// POST /api/agents/:id/quota/reset
// Admin-only — manual reset outside normal pg_cron cycle
// Sets monthly_tokens_used=0, monthly_cost_used_usd=0
// Logs reset event to system_events table
// Response: { reset: true, previous: { tokens_used, cost_used_usd } }

// GET /api/entities/:entity_id/quota/summary
// Cross-agent rollup for an entity — shows all agents' quota state
// Sorted by cost_pct DESC (most expensive agents first)
// Response: { agents: QuotaSummary[], entity_totals: EntityQuotaTotals }
```

#### 4. Redis Rate Limiter Implementation

```typescript
// backend/lib/rate-limiter.ts
// Sliding window algorithm using Redis sorted sets
// Precision: per-second buckets within the 60-second window

export async function slidingWindowRateLimit(
  redis: Redis,
  key: string,          // 'rate:{agent_id}:rpm'
  limit: number,        // from agent_quotas.rate_limit_rpm
  windowMs = 60_000
): Promise<{ allowed: boolean; current: number; resetAt: number }> {
  const now = Date.now()
  const windowStart = now - windowMs

  const pipeline = redis.pipeline()
  pipeline.zremrangebyscore(key, '-inf', windowStart)  // remove old entries
  pipeline.zadd(key, now, `${now}-${Math.random()}`)   // add current request
  pipeline.zcard(key)                                   // count in window
  pipeline.expire(key, Math.ceil(windowMs / 1000) + 1)

  const results = await pipeline.exec()
  const current = results![2][1] as number

  return {
    allowed: current <= limit,
    current,
    resetAt: now + windowMs,
  }
}
```

#### 5. Quota Warning pg_cron Job

```sql
-- Runs every 15 minutes
-- Publishes warnings for agents approaching limits
SELECT cron.schedule(
  'quota-warning-check',
  '*/15 * * * *',
  $$
  SELECT pg_notify(
    'quota_warnings',
    json_build_object(
      'agent_id', agent_id,
      'tokens_pct', ROUND(monthly_tokens_used::numeric / NULLIF(monthly_token_limit, 0) * 100, 1),
      'cost_pct', ROUND(monthly_cost_used_usd / NULLIF(monthly_cost_limit_usd, 0) * 100, 1)
    )::text
  )
  FROM agent_quotas
  WHERE
    monthly_tokens_used::numeric / NULLIF(monthly_token_limit, 0) >= 0.8
    OR monthly_cost_used_usd / NULLIF(monthly_cost_limit_usd, 0) >= 0.8
  $$
);
```

### Acceptance Tests (`code/backend/tests/quota.test.ts`)

```typescript
describe('Quota Management', () => {
  test('agent at 100% token quota → enforceQuota returns allowed=false')
  test('quota check fires BEFORE any OpenAI SDK call')
  test('overage_policy=alert_only → task executes AND Slack called')
  test('overage_policy=allow → task executes, no alert')
  test('recordQuotaUsage: tokens_used updates within same transaction as task completion')
  test('pg_cron reset: monthly_tokens_used = 0 after cron fires')
  test('PUT /api/agents/:id/quota with non-admin JWT → 403')
  test('rate limit: 61st request in 60s window → 429')
  test('entity quota summary sorted by cost_pct DESC')
  test('manual reset logs to system_events table')
  test('Redis cache invalidated after PUT /api/agents/:id/quota')
})
```

### PR Requirements
- Branch: `feat/quota-enforcement`
- Depends on: `feat/transaction-engine` (merged)
- Must merge before `feat/queue-scalability` (Queue Agent imports `enforceQuota`)
- Quota enforcer exported from `code/backend/lib/index.ts` for use by all other agents
- All Slack notifications go to `#fleet-ops` channel via existing Slack webhook env var
- Never throw inside `notifyQuotaOverage` — it's fire-and-forget and must not break task execution

---

## PR Merge Order

```
1. feat/transaction-engine     (Agent 3) — no deps, merge first
2. feat/quota-enforcement      (Agent 5) — depends on #1
3. feat/agent-file-system      (Agent 1) — depends on #1, can run parallel with #4
3. feat/agent-durable-memory   (Agent 2) — depends on #1, can run parallel with #3
4. feat/queue-scalability      (Agent 4) — depends on #1 + #2
```

---

## Shared Conventions (all agents must follow)

### Error Response Shape
```typescript
interface ErrorResponse {
  error: string           // machine-readable code: 'quota_exceeded', 'queue_full', 'forbidden'
  message: string         // human-readable explanation
  code?: string           // optional: Postgres error code or HTTP sub-code
  details?: unknown       // optional: structured context (pct values, limits, etc.)
}
```

### Logging
```typescript
// All routes use Fastify's built-in logger — no console.log
request.log.info({ agent_id, task_id, action: 'file_upload' }, 'Agent file uploaded')
request.log.error({ err, agent_id, action: 'quota_check' }, 'Quota check failed')
```

### Environment Variables (add to `.env.example`)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
REDIS_URL=
SLACK_FLEET_OPS_WEBHOOK=
JWT_SECRET=
DATABASE_URL=
```

### Migration Naming Convention
```
code/migrations/
  001_genii_schema.sql          (existing)
  002_thread_tables.sql         (existing)
  003_idempotency.sql           (Agent 3)
  004_agent_files.sql           (Agent 1)
  005_agent_memory.sql          (Agent 2)
  006_agent_tasks.sql           (Agent 4)
  007_agent_quotas.sql          (Agent 5)
```

All migrations: idempotent (`IF NOT EXISTS`), wrapped in a transaction, tested in CI.

---

*AGENT-SPECS v1.0 — david@geniinow.com — Each agent PR requires review from one other agent's engineer before merge*
