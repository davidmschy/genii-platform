-- ============================================================================
-- Genii ERP Database Schema
-- PostgreSQL 15+
-- UUID primary keys, JSONB for flexible data, comprehensive indexing
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- organizations: Top-level tenant/company entities
-- ----------------------------------------------------------------------------
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE organizations IS 'Top-level tenant entities representing companies or organizations';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN organizations.settings IS 'Organization-level configuration';
COMMENT ON COLUMN organizations.metadata IS 'Flexible metadata storage';

-- ----------------------------------------------------------------------------
-- agents: AI agents/workers within an organization
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- businesses: Business entities managed by the ERP
-- ----------------------------------------------------------------------------
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    slug VARCHAR(100) NOT NULL,
    business_type VARCHAR(100) CHECK (business_type IN ('llc', 'corporation', 'partnership', 'sole_proprietorship', 'nonprofit', 'other')),
    industry VARCHAR(100),
    tax_id VARCHAR(100),
    registration_number VARCHAR(100),
    description TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,
    billing_address JSONB,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    fiscal_year_start MONTH,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(organization_id, slug)
);

COMMENT ON TABLE businesses IS 'Business entities managed within the ERP system';

-- ----------------------------------------------------------------------------
-- projects: Projects within businesses
-- ----------------------------------------------------------------------------
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    project_code VARCHAR(100),
    project_type VARCHAR(50) DEFAULT 'standard' CHECK (project_type IN ('standard', 'recurring', 'template', 'internal')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15, 2),
    cost DECIMAL(15, 2) DEFAULT 0,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    assignee_ids UUID[] DEFAULT '{}',
    stakeholder_ids UUID[] DEFAULT '{}',
    parent_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    custom_fields JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(business_id, slug),
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

COMMENT ON TABLE projects IS 'Projects managed within businesses';

-- ----------------------------------------------------------------------------
-- sub_agents: Child/specialized agents spawned by parent agents
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- agent_messages: Communication between agents and users/system
-- ----------------------------------------------------------------------------
CREATE TABLE agent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID,
    parent_message_id UUID REFERENCES agent_messages(id) ON DELETE SET NULL,
    
    -- Message content
    role VARCHAR(20) NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool', 'function')),
    content TEXT,
    content_type VARCHAR(50) DEFAULT 'text' CHECK (content_type IN ('text', 'json', 'markdown', 'code', 'image', 'file', 'mixed')),
    
    -- Structured content for complex messages
    content_blocks JSONB,
    
    -- Tool/function calling
    tool_calls JSONB,
    tool_results JSONB,
    
    -- Context and metadata
    context JSONB DEFAULT '{}',
    tokens_used INTEGER,
    tokens_input INTEGER,
    tokens_output INTEGER,
    model_used VARCHAR(100),
    latency_ms INTEGER,
    cost_estimate DECIMAL(10, 6),
    
    -- Source tracking
    source VARCHAR(50) DEFAULT 'api' CHECK (source IN ('api', 'webhook', 'websocket', 'internal', 'scheduled', 'trigger')),
    channel VARCHAR(50),
    external_id VARCHAR(255),
    
    -- User association (for user messages)
    user_id UUID,
    user_name VARCHAR(255),
    
    -- Feedback and ratings
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    
    -- Status and processing
    status VARCHAR(50) DEFAULT 'delivered' CHECK (status IN ('pending', 'processing', 'delivered', 'failed', 'cancelled')),
    processing_metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE agent_messages IS 'Messages exchanged between agents, users, and the system';
COMMENT ON COLUMN agent_messages.content_blocks IS 'Structured content blocks for rich messages';
COMMENT ON COLUMN agent_messages.tool_calls IS 'Tool/function calls made by the agent';

-- ----------------------------------------------------------------------------
-- erp_connections: External ERP system integrations
-- ----------------------------------------------------------------------------
CREATE TABLE erp_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    
    -- Connection details
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL CHECK (provider IN ('quickbooks', 'xero', 'sage', 'netsuite', 'sap', 'dynamics', 'freshbooks', 'wave', 'zoho', 'custom')),
    connection_type VARCHAR(50) DEFAULT 'oauth' CHECK (connection_type IN ('oauth', 'api_key', 'basic_auth', 'saml', 'custom')),
    
    -- Authentication (encrypted/sensitive data should use proper vault in production)
    auth_config JSONB DEFAULT '{}',
    credentials_encrypted TEXT,
    
    -- Connection state
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'connecting', 'connected', 'disconnected', 'error', 'refreshing')),
    last_connected_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Sync configuration
    sync_config JSONB DEFAULT '{}',
    sync_schedule JSONB DEFAULT '{}',
    entity_mappings JSONB DEFAULT '{}',
    field_mappings JSONB DEFAULT '{}',
    
    -- Rate limiting and quotas
    rate_limit_config JSONB DEFAULT '{}',
    api_calls_count INTEGER DEFAULT 0,
    api_calls_reset_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    last_error TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    
    -- Webhook configuration
    webhook_url TEXT,
    webhook_secret TEXT,
    webhook_events JSONB DEFAULT '[]',
    
    -- Metadata
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE erp_connections IS 'External ERP system integrations and connections';
COMMENT ON COLUMN erp_connections.auth_config IS 'OAuth tokens, API keys, or other auth details';
COMMENT ON COLUMN erp_connections.entity_mappings IS 'Mapping of external entities to internal entities';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Organizations indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_subscription ON organizations(subscription_tier, subscription_expires_at);
CREATE INDEX idx_organizations_created_at ON organizations(created_at DESC);

-- Agents indexes
CREATE INDEX idx_agents_organization ON agents(organization_id);
CREATE INDEX idx_agents_slug ON agents(organization_id, slug);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_type ON agents(agent_type);
CREATE INDEX idx_agents_is_public ON agents(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_agents_last_active ON agents(last_active_at DESC);
CREATE INDEX idx_agents_capabilities ON agents USING GIN(capabilities);

-- Businesses indexes
CREATE INDEX idx_businesses_organization ON businesses(organization_id);
CREATE INDEX idx_businesses_slug ON businesses(organization_id, slug);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_type ON businesses(business_type);
CREATE INDEX idx_businesses_industry ON businesses(industry);

-- Projects indexes
CREATE INDEX idx_projects_business ON projects(business_id);
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_projects_slug ON projects(business_id, slug);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_projects_parent ON projects(parent_project_id);
CREATE INDEX idx_projects_assignees ON projects USING GIN(assignee_ids);

-- Sub-agents indexes
CREATE INDEX idx_sub_agents_parent ON sub_agents(parent_agent_id);
CREATE INDEX idx_sub_agents_organization ON sub_agents(organization_id);
CREATE INDEX idx_sub_agents_status ON sub_agents(status);
CREATE INDEX idx_sub_agents_lifecycle ON sub_agents(lifecycle);
CREATE INDEX idx_sub_agents_expires ON sub_agents(expires_at);

-- Agent messages indexes
CREATE INDEX idx_agent_messages_agent ON agent_messages(agent_id);
CREATE INDEX idx_agent_messages_conversation ON agent_messages(conversation_id);
CREATE INDEX idx_agent_messages_parent ON agent_messages(parent_message_id);
CREATE INDEX idx_agent_messages_role ON agent_messages(role);
CREATE INDEX idx_agent_messages_sent_at ON agent_messages(sent_at DESC);
CREATE INDEX idx_agent_messages_source ON agent_messages(source);
CREATE INDEX idx_agent_messages_status ON agent_messages(status);
CREATE INDEX idx_agent_messages_user ON agent_messages(user_id);
CREATE INDEX idx_agent_messages_external ON agent_messages(external_id);
CREATE INDEX idx_agent_messages_context ON agent_messages USING GIN(context);
CREATE INDEX idx_agent_messages_content_search ON agent_messages USING GIN(to_tsvector('english', content));

-- ERP connections indexes
CREATE INDEX idx_erp_connections_organization ON erp_connections(organization_id);
CREATE INDEX idx_erp_connections_business ON erp_connections(business_id);
CREATE INDEX idx_erp_connections_provider ON erp_connections(provider);
CREATE INDEX idx_erp_connections_status ON erp_connections(status);
CREATE INDEX idx_erp_connections_last_sync ON erp_connections(last_sync_at DESC);

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_agents_updated_at BEFORE UPDATE ON sub_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_messages_updated_at BEFORE UPDATE ON agent_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_erp_connections_updated_at BEFORE UPDATE ON erp_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Seed organization
INSERT INTO organizations (id, name, slug, description, subscription_tier, settings, metadata) VALUES
('00000000-0000-0000-0000-000000000001', 'Genii Demo Organization', 'genii-demo', 'Demo organization for testing and development', 'enterprise', 
 '{"features": {"agents": true, "erp": true, "analytics": true}, "limits": {"max_agents": 100, "max_projects": 500}}',
 '{"industry": "technology", "size": "medium", "region": "us-west"}'),

('00000000-0000-0000-0000-000000000002', 'Acme Corporation', 'acme-corp', 'Sample enterprise organization', 'pro',
 '{"features": {"agents": true, "erp": true}, "limits": {"max_agents": 50, "max_projects": 200}}',
 '{"industry": "manufacturing", "size": "large"}');

-- Seed agents
INSERT INTO agents (id, organization_id, name, slug, description, agent_type, model_config, capabilities, system_prompt, status, is_public) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Genius Assistant', 'genius-assistant', 'General purpose AI assistant for the organization', 'assistant',
 '{"model": "claude-3-5-sonnet", "temperature": 0.7, "max_tokens": 4096}',
 '["conversation", "analysis", "summarization", "coding", "writing"]',
 'You are a helpful AI assistant for Genii ERP. You help users manage their business, projects, and data.', 'active', TRUE),

('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Data Analyst', 'data-analyst', 'Specialized agent for data analysis and reporting', 'analyst',
 '{"model": "claude-3-opus", "temperature": 0.2, "max_tokens": 8192}',
 '["data_analysis", "reporting", "visualization", "forecasting", "sql"]',
 'You are a data analyst AI. You help users analyze business data, create reports, and extract insights.', 'idle', FALSE),

('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'ERP Sync Worker', 'erp-sync', 'Background worker for ERP synchronization tasks', 'worker',
 '{"model": "claude-3-haiku", "temperature": 0.1, "max_tokens": 2048}',
 '["erp_sync", "data_transformation", "api_integration", "error_handling"]',
 'You are a background worker focused on ERP synchronization and data integration tasks.', 'active', FALSE),

('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Acme Sales Assistant', 'sales-assistant', 'Sales-focused assistant for Acme Corp', 'assistant',
 '{"model": "claude-3-5-sonnet", "temperature": 0.8, "max_tokens": 4096}',
 '["sales", "crm", "lead_qualification", "proposal_writing"]',
 'You are a sales assistant for Acme Corporation. Help the sales team with leads, proposals, and customer communication.', 'active', TRUE);

-- Seed businesses
INSERT INTO businesses (id, organization_id, name, legal_name, slug, business_type, industry, description, currency, timezone, status) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Genii Technologies', 'Genii Technologies Inc.', 'genii-tech', 'corporation', 'Software',
 'Primary business entity for Genii platform development and operations', 'USD', 'America/Los_Angeles', 'active'),

('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Genii Consulting', 'Genii Consulting LLC', 'genii-consulting', 'llc', 'Consulting',
 'Professional services and consulting division', 'USD', 'America/New_York', 'active'),

('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Acme Manufacturing', 'Acme Manufacturing Corp', 'acme-manufacturing', 'corporation', 'Manufacturing',
 'Main manufacturing division of Acme Corporation', 'USD', 'America/Chicago', 'active');

-- Seed projects
INSERT INTO projects (id, business_id, organization_id, name, slug, description, project_type, priority, status, start_date, end_date, budget, progress_percent, assignee_ids) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ERP Platform v2.0', 'erp-platform-v2', 'Major platform upgrade with new AI capabilities', 'standard', 'high', 'active', '2025-01-15', '2025-06-30', 500000.00, 35, 
 ARRAY['10000000-0000-0000-0000-000000000001'::UUID, '10000000-0000-0000-0000-000000000002'::UUID]),

('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'AI Agent Framework', 'ai-agent-framework', 'Core framework for agent orchestration and management', 'standard', 'critical', 'active', '2025-02-01', '2025-05-15', 750000.00, 50,
 ARRAY['10000000-0000-0000-0000-000000000002'::UUID]),

('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Client Onboarding System', 'client-onboarding', 'Automated client onboarding and project setup', 'standard', 'medium', 'planning', '2025-03-01', '2025-04-30', 75000.00, 0,
 ARRAY['10000000-0000-0000-0000-000000000001'::UUID]),

('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Manufacturing Automation', 'mfg-automation', 'ERP integration with manufacturing floor systems', 'standard', 'high', 'active', '2025-01-01', '2025-08-31', 1200000.00, 20,
 ARRAY['10000000-0000-0000-0000-000000000004'::UUID]);

-- Seed sub-agents
INSERT INTO sub_agents (id, parent_agent_id, organization_id, name, description, purpose, task_context, lifecycle, status) VALUES
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Sales Report Analyzer', 'Temporary agent for Q1 sales report analysis', 'Analyze Q1 2025 sales data and generate insights report',
 '{"report_type": "quarterly_sales", "quarter": "Q1", "year": 2025, "focus_areas": ["revenue", "trends", "forecasts"]}',
 'ephemeral', 'completed'),

('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Data Pipeline Monitor', 'Persistent monitoring agent for data pipelines', 'Monitor data pipeline health and alert on anomalies',
 '{"pipelines": ["etl_main", "etl_crm", "etl_erp"], "alert_thresholds": {"error_rate": 0.05, "latency_ms": 5000}}',
 'persistent', 'active'),

('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Meeting Summarizer', 'Ephemeral agent for meeting transcription and summary', 'Summarize weekly team meeting and extract action items',
 '{"meeting_id": "meet_12345", "participants": ["Alice", "Bob", "Charlie"], "duration_minutes": 60}',
 'ephemeral', 'active');

-- Seed agent messages
INSERT INTO agent_messages (id, agent_id, organization_id, conversation_id, role, content, content_type, context, tokens_used, model_used, status) VALUES
('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'c1a2b3c4-d5e6-7890-abcd-ef1234567890', 'user', 'Can you help me analyze our Q1 sales performance?', 'text',
 '{"source": "web_chat", "session_id": "sess_abc123"}', NULL, NULL, 'delivered'),

('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'c1a2b3c4-d5e6-7890-abcd-ef1234567890', 'assistant', 'I''d be happy to help analyze your Q1 sales performance. Let me pull up the relevant data and create a comprehensive analysis for you.', 'text',
 '{"confidence": 0.95, "intent": "data_analysis_request"}', 245, 'claude-3-5-sonnet', 'delivered'),

('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'd2e3f4g5-h6i7-8901-jklm-no2345678901', 'system', 'Data analysis task initiated for project ERP Platform v2.0', 'text',
 '{"task_type": "analysis", "project_id": "30000000-0000-0000-0000-000000000001"}', 50, 'claude-3-opus', 'delivered'),

('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', NULL, 'assistant', 'ERP sync completed successfully. 1,247 records synchronized.', 'json',
 '{"sync_results": {"inserted": 45, "updated": 1202, "deleted": 0, "errors": 0}, "duration_seconds": 45}', 120, 'claude-3-haiku', 'delivered');

-- Seed ERP connections
INSERT INTO erp_connections (id, organization_id, business_id, name, provider, connection_type, status, auth_config, sync_config, entity_mappings) VALUES
('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'QuickBooks Online', 'quickbooks', 'oauth', 'connected',
 '{"access_token": "[encrypted]", "refresh_token": "[encrypted]", "realm_id": "1234567890"}',
 '{"auto_sync": true, "sync_interval_minutes": 60, "entities": ["customers", "invoices", "payments", "items"]}',
 '{"customers": {"table": "businesses", "field_map": {"DisplayName": "name", "PrimaryEmailAddr": "email"}}, "invoices": {"table": "projects", "field_map": {"DocNumber": "project_code"}}}'),

('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Xero Accounting', 'xero', 'oauth', 'connected',
 '{"access_token": "[encrypted]", "tenant_id": "abc-123-def"}',
 '{"auto_sync": true, "sync_interval_minutes": 120, "entities": ["contacts", "invoices", "accounts"]}',
 '{"contacts": {"table": "businesses", "field_map": {"Name": "name", "EmailAddress": "email"}}}'),

('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 'SAP Business One', 'sap', 'api_key', 'error',
 '{"api_key": "[encrypted]", "base_url": "https://sap.acme.com/api"}',
 '{"auto_sync": false, "sync_interval_minutes": 30, "entities": ["orders", "inventory"]}',
 '{"orders": {"table": "projects", "field_map": {"DocEntry": "id", "CardCode": "business_id"}}}',
 '{"last_error": "Connection timeout after 30s", "retry_count": 3}');

-- ============================================================================
-- VIEWS
-- ============================================================================

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
    MAX(sent_at) as last_message_at,
    MAX(CASE WHEN role = 'user' THEN content END) FILTER (WHERE sent_at = MAX(sent_at)) as last_user_message
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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - Optional, enable as needed
-- ============================================================================

-- Enable RLS on tables (commented out by default - enable when auth is configured)
-- ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sub_agents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE erp_connections ENABLE ROW LEVEL SECURITY;

-- Example policy (customize based on your auth model):
-- CREATE POLICY organization_isolation ON organizations
--     USING (id = current_setting('app.current_organization_id')::UUID);

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
