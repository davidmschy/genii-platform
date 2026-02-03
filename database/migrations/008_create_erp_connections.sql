-- Migration: 008_create_erp_connections
-- Description: Create erp_connections table

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

-- Indexes
CREATE INDEX idx_erp_connections_organization ON erp_connections(organization_id);
CREATE INDEX idx_erp_connections_business ON erp_connections(business_id);
CREATE INDEX idx_erp_connections_provider ON erp_connections(provider);
CREATE INDEX idx_erp_connections_status ON erp_connections(status);
CREATE INDEX idx_erp_connections_last_sync ON erp_connections(last_sync_at DESC);

-- Trigger
CREATE TRIGGER update_erp_connections_updated_at BEFORE UPDATE ON erp_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
