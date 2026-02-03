-- Migration Runner for Windows (PowerShell alternative)
-- Run this script with: psql -U your_user -d your_db -f migrate.sql

\echo 'Genii ERP Database Migration Runner'
\echo '===================================='
\echo ''

-- Create migrations tracking table if not exists
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64)
);

-- Helper function to check if migration was executed
CREATE OR REPLACE FUNCTION migration_executed(filename TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM schema_migrations WHERE schema_migrations.filename = $1);
END;
$$ LANGUAGE plpgsql;

\echo 'Migration system initialized.'
\echo 'To run migrations, execute individual files in order from the migrations/ folder.'
\echo ''
\echo 'Order:'
\echo '  1. 001_initial_schema.sql'
\echo '  2. 002_create_organizations.sql'
\echo '  3. 003_create_agents.sql'
\echo '  4. 004_create_businesses.sql'
\echo '  5. 005_create_projects.sql'
\echo '  6. 006_create_sub_agents.sql'
\echo '  7. 007_create_agent_messages.sql'
\echo '  8. 008_create_erp_connections.sql'
\echo '  9. 009_create_views.sql'
\echo '  10. 010_seed_data.sql (optional - for development)'
