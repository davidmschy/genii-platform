-- Migration: 010_seed_data
-- Description: Insert seed data for development and testing

-- Seed organizations
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
