-- Migration: 006_create_sub_agents
-- Description: Create sub_agents table

CREATE TABLE sub_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    purpose TEXT,
    task_context JSONB DEFAULT '{}',
    inherit_capabilities BOOLEAN DEFAULT TRUE,
    custom_capabilities JSONB DEFAULT '[]',
    model_config JSONB DEFAULT '{}',
    memory_snapshot JSONB,
    execution_context JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'initializing', 'active', 'paused', 'completed', 'error', 'terminated')),
    lifecycle VARCHAR(20) DEFAULT 'ephemeral' CHECK (lifecycle IN ('ephemeral', 'persistent', 'recurring')),
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sub_agents IS 'Child agents spawned by parent agents for specific tasks';
COMMENT ON COLUMN sub_agents.task_context IS 'Context and parameters for the spawned task';
COMMENT ON COLUMN sub_agents.memory_snapshot IS 'Captured memory state from parent agent';

-- Indexes
CREATE INDEX idx_sub_agents_parent ON sub_agents(parent_agent_id);
CREATE INDEX idx_sub_agents_organization ON sub_agents(organization_id);
CREATE INDEX idx_sub_agents_status ON sub_agents(status);
CREATE INDEX idx_sub_agents_lifecycle ON sub_agents(lifecycle);
CREATE INDEX idx_sub_agents_expires ON sub_agents(expires_at);

-- Trigger
CREATE TRIGGER update_sub_agents_updated_at BEFORE UPDATE ON sub_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
