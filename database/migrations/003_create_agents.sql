-- Migration: 003_create_agents
-- Description: Create agents table

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    agent_type VARCHAR(50) DEFAULT 'assistant' CHECK (agent_type IN ('assistant', 'worker', 'supervisor', 'analyst', 'custom')),
    model_config JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '[]',
    system_prompt TEXT,
    tools_config JSONB DEFAULT '{}',
    memory_config JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'busy', 'paused', 'error', 'offline')),
    is_public BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(organization_id, slug)
);

COMMENT ON TABLE agents IS 'AI agents/workers that perform tasks within an organization';
COMMENT ON COLUMN agents.model_config IS 'LLM configuration (model, temperature, max_tokens, etc.)';
COMMENT ON COLUMN agents.capabilities IS 'List of agent capabilities/skills';
COMMENT ON COLUMN agents.tools_config IS 'Enabled tools and their configurations';

-- Indexes
CREATE INDEX idx_agents_organization ON agents(organization_id);
CREATE INDEX idx_agents_slug ON agents(organization_id, slug);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_type ON agents(agent_type);
CREATE INDEX idx_agents_is_public ON agents(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_agents_last_active ON agents(last_active_at DESC);
CREATE INDEX idx_agents_capabilities ON agents USING GIN(capabilities);

-- Trigger
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
