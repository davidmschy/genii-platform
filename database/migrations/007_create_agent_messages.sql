-- Migration: 007_create_agent_messages
-- Description: Create agent_messages table

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

-- Indexes
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

-- Trigger
CREATE TRIGGER update_agent_messages_updated_at BEFORE UPDATE ON agent_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
