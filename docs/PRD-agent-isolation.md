# PRD: Agent Isolation Runtime
## Genii Platform — Product Requirements Document
**Version:** 1.0  
**Status:** Approved  
**Date:** February 2026  
**Product Owner:** David Schy (david@geniinow.com)  
**Engineering Lead:** TBD  
**Linked RFC:** RFC-001-agent-isolation-runtime.md  

---

## 1. Executive Summary

The Genii platform operates a growing fleet of autonomous AI agents across multiple business entities. Today, agents share compute, storage, and execution context with no isolation boundaries. This creates four compounding risks:

1. **Data leakage** — Agent A can access artifacts produced by Agent B
2. **Runaway costs** — A misbehaving agent can exhaust the entire platform's LLM budget
3. **Dirty state** — A failed provisioning leaves orphaned DB records, breaking audit trails
4. **Invisible bottlenecks** — No queue depth enforcement means a single slow agent can starve the entire fleet

This PRD defines the product requirements for the Agent Isolation Runtime — a set of five enforced runtime properties that make every agent on the platform safe, accountable, and independently scalable.

**Shipping target:** March 14, 2026 (3-week sprint)  
**Team size required:** 2 engineers + 1 QA  

---

## 2. Goals & Non-Goals

### Goals
- Every agent has an isolated, persistent file namespace that no other agent can access
- Every agent has a durable key-value and semantic memory store that survives process restarts
- Every multi-table database write is wrapped in an atomic transaction — no partial failures
- Agent task execution is queue-backed with enforced concurrency limits and backpressure
- Every agent has a quota record with hard enforcement on tokens, cost, and storage

### Non-Goals
- **Agent-to-agent communication protocols** (separate RFC, Q2 2026)
- **Billing and invoicing for multi-tenant customers** (separate PRD)
- **Agent self-modification or skill hot-swap** (not in this sprint)
- **UI dashboard for quota monitoring** (Phase 2; this sprint delivers the API only)

---

## 3. User Stories

### 3.1 Per-Agent File System

**US-01** — As an AI agent, I can write a file (report, draft, log) to my own storage namespace so that my output persists beyond the task execution lifecycle.

**US-02** — As a platform administrator, I can list all files produced by a specific agent, filtered by date or task, so that I can audit what the agent has done.

**US-03** — As an AI agent, I cannot read or write files belonging to any other agent, even within the same entity, so that data isolation is guaranteed at the storage layer.

**US-04** — As a founder reviewing an agent's work, I can retrieve a signed download URL for any file the agent produced, valid for 15 minutes, without exposing the raw storage path.

**Acceptance Criteria:**
- [ ] `POST /api/agents/:id/files` rejects uploads where the JWT `sub` does not match `:id` — returns 403
- [ ] `GET /api/agents/:id/files/:file_id/url` returns a signed URL expiring in exactly 900 seconds
- [ ] Files survive agent process restart (stored in Supabase Storage, not local disk)
- [ ] A file uploaded by Agent A returns 403 when fetched using Agent B's JWT
- [ ] File size > 50MB returns 413 with a clear error message
- [ ] Total storage per agent > 5GB is blocked by quota enforcer with a 429 response

---

### 3.2 Durable Memory

**US-05** — As an AI agent, I can store a key-value pair (e.g., `last_processed_lead_id`) so that I can resume work across task invocations without reprocessing already-handled records.

**US-06** — As an AI agent, I can store a natural-language summary of a completed task as a semantic memory so that future tasks can retrieve relevant context via similarity search.

**US-07** — As an AI agent, I can search my semantic memory with a natural language query and receive the top-5 most relevant past contexts, ranked by cosine similarity.

**US-08** — As a platform administrator, I can set a TTL on any memory key so that ephemeral working state is automatically cleaned up without manual intervention.

**Acceptance Criteria:**
- [ ] `PUT /api/agents/:id/memory/:key` with `value` and `ttl_seconds=3600` — key disappears after 1 hour
- [ ] `POST /api/agents/:id/memory/search` with `query="FBX lead follow-up"` returns results with `similarity >= 0.75`
- [ ] Agent process restart followed by `GET /api/agents/:id/memory/:key` returns the previously stored value
- [ ] Agent A's memory keys are not visible in Agent B's `GET /api/agents/:id/memory` response
- [ ] `POST /api/agents/:id/memory/embed` stores embedding within 2 seconds of the request
- [ ] pg_cron job deletes expired keys on schedule; no expired key is retrievable after expiry

---

### 3.3 Transactional Execution

**US-09** — As a platform engineer, when agent provisioning fails at any step (agent insert, quota insert, ledger insert, event insert), I expect zero orphaned records in any table — the database returns to exactly its pre-request state.

**US-10** — As a compliance officer, I need every ledger entry to be created atomically alongside its triggering agent record, so the audit trail is always internally consistent.

**US-11** — As a platform engineer, I need idempotent task submission — submitting the same task twice with the same `idempotency_key` returns the original result without double-executing.

**Acceptance Criteria:**
- [ ] Terminate the DB connection mid-way through `POST /api/agents/provision` — zero rows inserted into any table
- [ ] All routes touching `ledger_entries` use `withTransaction()` — enforced via ESLint rule or code review checklist
- [ ] `POST /api/tasks` with duplicate `idempotency_key` within 24 hours returns 200 with cached response body, no new task created
- [ ] Transaction wrapper test: inject error after step 2 of 4 in `provision.ts` — assert 0 rows in agents, agent_quotas, ledger_entries, system_events
- [ ] `ROLLBACK` is logged to the application logger with full stack trace on every transaction failure

---

### 3.4 Horizontal Scalability

**US-12** — As a platform operator, I need agent tasks to be queued in a durable, ordered queue so that a spike in task submissions does not overwhelm available workers or cause data loss.

**US-13** — As a platform operator, I need each agent's task queue to have a maximum depth of 100 jobs, so that a runaway agent cannot exhaust Redis memory or starve other agents.

**US-14** — As a platform engineer, I need failed tasks to automatically retry up to 3 times with exponential backoff before being moved to a dead-letter state and triggering a human escalation alert.

**US-15** — As a founder, I need the worker pool to automatically scale from 1 to 20 Cloud Run instances based on queue depth, so I never pay for idle capacity but also never drop tasks at peak load.

**Acceptance Criteria:**
- [ ] `POST /api/tasks` when agent queue depth >= 100 returns 429 with `queue_full` reason
- [ ] A task that fails 3 times transitions to `dead_lettered` status and fires a Slack alert to `#fleet-ops`
- [ ] 200 concurrent task submissions all reach `completed` status with zero data loss (load test required)
- [ ] Worker count observed in Cloud Run console increases from 1 to >= 3 under sustained 50-task/min load
- [ ] Task retry delay follows exponential pattern: attempt 1 at +1s, attempt 2 at +4s, attempt 3 at +16s
- [ ] BullMQ job ID is stored in `agent_tasks.bullmq_job_id` for cross-system traceability

---

### 3.5 Quota Management

**US-16** — As a platform administrator, I can set monthly token, cost, and storage limits per agent so that no single agent can exceed its allocated budget.

**US-17** — As an AI agent, when I attempt to execute a task that would push me over my token or cost quota, the request is rejected before any LLM call is made, so quota is never exceeded in `block` mode.

**US-18** — As a founder, I can view a real-time quota dashboard for any agent showing tokens used, cost accrued, and storage consumed as percentages of their limits.

**US-19** — As a platform administrator, I can set an agent's overage policy to `alert_only` so that trusted agents can continue operating while a Slack alert is sent for visibility.

**US-20** — As a platform operator, monthly quotas reset automatically on the 1st of each month via a scheduled pg_cron job, with no manual intervention required.

**Acceptance Criteria:**
- [ ] Agent with `monthly_token_limit=1000, monthly_tokens_used=950` — submitting a task with `estimated_tokens=100` returns 429 with `quota_exceeded` reason before any OpenAI call is made
- [ ] `GET /api/agents/:id/quota` returns `tokens_pct`, `cost_pct`, `storage_pct` as floats 0-100
- [ ] pg_cron job fires at midnight on the 1st — `monthly_tokens_used` and `monthly_cost_used_usd` reset to 0
- [ ] Agent with `overage_policy=alert_only` exceeding quota: task executes AND Slack message fires to `#fleet-ops`
- [ ] `agent_quota_usage` table logs every task completion with model, tokens, and cost within the same transaction
- [ ] `PUT /api/agents/:id/quota` with non-admin JWT returns 403

---

## 4. Functional Requirements Summary

| ID | Requirement | Pillar | Priority |
|----|-------------|--------|----------|
| FR-01 | Agent file upload with namespace isolation | File System | P0 |
| FR-02 | Signed URL generation for file retrieval | File System | P0 |
| FR-03 | RLS enforcement: agents cannot cross entity boundaries | File System | P0 |
| FR-04 | Key-value memory with optional TTL | Memory | P0 |
| FR-05 | Vector embedding storage and cosine search | Memory | P1 |
| FR-06 | Auto-expire TTL'd memory via pg_cron | Memory | P1 |
| FR-07 | `withTransaction()` wrapper on all multi-table writes | Transactions | P0 |
| FR-08 | Idempotency key deduplication (24h window) | Transactions | P0 |
| FR-09 | Transaction failure logging with full rollback | Transactions | P0 |
| FR-10 | BullMQ per-agent named queues | Scalability | P0 |
| FR-11 | Queue depth enforcement (max 100, returns 429) | Scalability | P0 |
| FR-12 | Dead-letter queue + Slack alert after 3 failures | Scalability | P0 |
| FR-13 | Cloud Run auto-scale workers (1-20 instances) | Scalability | P1 |
| FR-14 | Per-agent quota record created at provision time | Quota | P0 |
| FR-15 | Pre-execution quota check (before any LLM call) | Quota | P0 |
| FR-16 | Post-execution usage recording (within transaction) | Quota | P0 |
| FR-17 | Monthly quota reset via pg_cron | Quota | P0 |
| FR-18 | Overage policy: block / alert_only / allow | Quota | P1 |

---

## 5. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Latency | Quota check overhead per task | < 10ms (cached in Redis) |
| Latency | File upload (< 10MB) | < 2s end-to-end |
| Latency | Memory key-value read | < 5ms |
| Latency | Semantic memory search (top-5) | < 200ms |
| Throughput | Peak task submissions | 1,000/min |
| Durability | Memory and files survive process restart | 100% |
| Isolation | Cross-agent data access blocked | 100% (RLS + JWT checks) |
| Availability | Worker pool uptime | 99.9% (Cloud Run SLA) |
| Auditability | Every quota overage logged | 100% |
| Security | No raw storage paths exposed to clients | Signed URLs only |

---

## 6. Technical Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| Supabase Storage | Per-agent file buckets | Available |
| pgvector extension | Semantic memory embeddings | Needs enabling |
| BullMQ + Redis | Durable task queues | Redis deployed, BullMQ new |
| pg_cron | TTL cleanup + quota reset | Available in Supabase |
| OpenAI Embeddings API | text-embedding-3-small for memory | Available |
| Cloud Run autoscaling | Worker horizontal scale | Configured in deploy pipeline |

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| pgvector index performance degrades at 1M+ embeddings | Medium | Medium | Use IVFFlat index with 100 lists; add HNSW if needed |
| Redis OOM from unbounded BullMQ queues | Low | High | Max queue depth = 100 per agent; Redis maxmemory-policy = allkeys-lru |
| Quota check adds latency to every task | Medium | Low | Cache quota record in Redis with 60s TTL; invalidate on update |
| Transaction deadlocks under high concurrent provisioning | Low | Medium | Consistent table lock ordering in all transactions; retry on deadlock |
| pg_cron quota reset fires during active task execution | Low | Medium | Reset only sets counters to 0; running tasks use in-flight snapshot |

---

## 8. Sprint Plan

### Week 1 (Feb 24 – Feb 28): Database + Core Utilities
- [ ] Write and run `003_agent_isolation_runtime.sql` migration
- [ ] Enable pgvector on Supabase project
- [ ] Implement `withTransaction()` helper and fix `provision.ts`
- [ ] Implement `idempotency_keys` table + middleware
- [ ] Backfill: create default `agent_quotas` for all existing agents

### Week 2 (Mar 3 – Mar 7): API Routes + Queue
- [ ] Implement `agent-files.ts` routes (upload, list, signed URL)
- [ ] Implement `agent-memory.ts` routes (KV + semantic search)
- [ ] Implement `agent-quota.ts` routes (read, update, usage history)
- [ ] Install BullMQ; implement `agent-worker.ts` + `queue-guard.ts`
- [ ] Fix `POST /api/tasks` to enqueue via BullMQ instead of direct execution

### Week 3 (Mar 10 – Mar 14): QA + Hardening
- [ ] Load test: 200 concurrent submissions, assert zero data loss
- [ ] Cross-agent isolation tests: 403 on all cross-boundary attempts
- [ ] Transaction failure injection tests
- [ ] Quota enforcement tests (block, alert_only, allow modes)
- [ ] Cloud Run autoscale validation under load
- [ ] Deploy to production; verify all 5 acceptance test suites pass

---

## 9. Metrics & Monitoring

Post-launch, the following metrics must be observable in the Genii Command Center:

| Metric | Source | Alert Threshold |
|--------|--------|----------------|
| `quota.tokens_pct` per agent | agent_quotas table | > 80% → Slack warning |
| `queue.depth` per agent | BullMQ | > 75 jobs → Slack warning |
| `tasks.dead_lettered` count | agent_tasks table | > 0 → immediate Slack alert |
| `transactions.rollback_rate` | App logger | > 1% → PagerDuty |
| `files.storage_pct` per agent | agent_quotas | > 90% → Slack warning |
| `memory.embed_latency_p99` | App metrics | > 500ms → investigate |

---

## 10. Definition of Done

The Agent Isolation Runtime is considered shipped when:

1. All 18 functional requirements are implemented and passing in staging
2. All 20 user story acceptance criteria are green
3. Load test passes: 200 concurrent tasks, zero data loss, queue depth bounded
4. Cross-agent isolation verified: 0 successful cross-boundary reads in pentest
5. All 5 quota scenarios pass: block, alert_only, allow, reset, backfill
6. Migration runs cleanly on production Supabase with zero downtime
7. RFC-001 and this PRD committed to `docs/` in the main branch

---

*PRD v1.0 — david@geniinow.com — Changes require product owner sign-off*
