-- Migration: 009_create_views
-- Description: Create utility views

-- Active agents with organization info
CREATE VIEW v_active_agents AS
SELECT 
    a.*,
    o.name as organization_name,
    o.slug as organization_slug
FROM agents a
JOIN organizations o ON a.organization_id = o.id
WHERE a.status IN ('active', 'idle', 'busy')
  AND a.deleted_at IS NULL
  AND o.status = 'active';

-- Projects with business and organization info
CREATE VIEW v_projects_extended AS
SELECT 
    p.*,
    b.name as business_name,
    b.slug as business_slug,
    o.name as organization_name,
    o.slug as organization_slug
FROM projects p
JOIN businesses b ON p.business_id = b.id
JOIN organizations o ON p.organization_id = o.id
WHERE p.deleted_at IS NULL;

-- Agent conversation threads
CREATE VIEW v_conversations AS
SELECT 
    conversation_id,
    agent_id,
    organization_id,
    COUNT(*) as message_count,
    MIN(sent_at) as started_at,
    MAX(sent_at) as last_message_at
FROM agent_messages
WHERE conversation_id IS NOT NULL
GROUP BY conversation_id, agent_id, organization_id;

-- ERP connection status summary
CREATE VIEW v_erp_connection_summary AS
SELECT 
    ec.*,
    o.name as organization_name,
    b.name as business_name
FROM erp_connections ec
JOIN organizations o ON ec.organization_id = o.id
LEFT JOIN businesses b ON ec.business_id = b.id
WHERE ec.deleted_at IS NULL;
