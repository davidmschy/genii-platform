# Genii ERP Database Schema

PostgreSQL database schema for the Genii ERP platform.

## Features

- **UUID Primary Keys** - All tables use UUID v4 for primary keys
- **JSONB Flexible Data** - Extensive use of JSONB for schemaless attributes
- **Comprehensive Indexing** - Optimized indexes for common query patterns
- **Soft Deletes** - `deleted_at` timestamps for data recovery
- **Audit Trail** - `created_at` and `updated_at` timestamps on all tables
- **Automatic Updates** - Triggers keep `updated_at` current
- **Foreign Key Constraints** - Full referential integrity

## Tables

| Table | Description |
|-------|-------------|
| `organizations` | Top-level tenant entities |
| `agents` | AI agents/workers within organizations |
| `businesses` | Business entities managed by the ERP |
| `projects` | Projects within businesses |
| `sub_agents` | Child agents spawned by parent agents |
| `agent_messages` | Communication between agents and users |
| `erp_connections` | External ERP system integrations |

## Quick Start

### Full Setup
```bash
psql -U your_user -d genii_erp -f schema.sql
```

### Incremental Migrations
```bash
# Run all migrations in order
for f in migrations/*.sql; do
    echo "Running $f..."
    psql -U your_user -d genii_erp -f "$f"
done
```

## Entity Relationships

```
organizations
    ├── agents
    ├── businesses
    │     └── projects
    ├── sub_agents (via agents.parent_agent_id)
    ├── agent_messages (via agents)
    └── erp_connections
```

## Indexes

All tables include strategic indexes:
- **Foreign Key Indexes** - For join performance
- **Status Indexes** - For filtering active records
- **GIN Indexes** - For JSONB array searches
- **Full-Text Search** - On agent_messages.content
- **Timestamp Indexes** - For time-range queries

## Views

| View | Purpose |
|------|---------|
| `v_active_agents` | Active agents with org info |
| `v_projects_extended` | Projects with business/org joins |
| `v_conversations` | Message thread aggregations |
| `v_erp_connection_summary` | ERP connections with org info |

## Seed Data

The schema includes sample data for development:
- 2 organizations (Genii Demo, Acme Corp)
- 4 agents (various types)
- 3 businesses
- 4 projects
- 3 sub-agents
- 4 agent messages
- 3 ERP connections

## Row Level Security

RLS policies are commented out in the schema. To enable:

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_isolation ON organizations
    USING (id = current_setting('app.current_organization_id')::UUID);
```

## Extensions Required

- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptographic functions

## Notes

- Use `schema.sql` for fresh installs
- Use `migrations/` for incremental updates
- All JSONB columns default to `'{}'` or `'[]'`
- Soft deletes use `deleted_at` timestamp
- All monetary values use `DECIMAL(15, 2)`
