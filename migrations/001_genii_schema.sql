-- Genii AI Platform - Supabase Migration 001
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  erp_company TEXT NOT NULL,
  chart_of_accounts TEXT,
  tax_id TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO entities (id, name, erp_company, chart_of_accounts, currency) VALUES
  ('fbx', 'FBX Homes', 'FBX Homes LLC', 'Standard with US Taxes', 'USD'),
  ('homegenii', 'HomeGenii', 'HomeGenii Inc', 'Standard with US Taxes', 'USD'),
  ('genii', 'Genii Corp', 'Genii AI Corporation', 'Standard with US Taxes', 'USD')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  entity_id TEXT NOT NULL REFERENCES entities(id),
  openclaw_instance_id TEXT UNIQUE,
  skills TEXT[] DEFAULT '{}',
  mcps TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'provisioning' CHECK (status IN ('provisioning','active','idle','suspended','archived')),
  monthly_cost_usd DECIMAL(8,2) DEFAULT 0,
  last_heartbeat TIMESTAMPTZ,
  provisioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_entity ON agents(entity_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_heartbeat ON agents(last_heartbeat);

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id TEXT NOT NULL REFERENCES entities(id),
  agent_id UUID REFERENCES agents(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('expense','revenue','decision','task','provision','update')),
  ai_recommendation JSONB,
  human_decision JSONB,
  real_outcome JSONB,
  amount DECIMAL(12,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  erp_doc_id TEXT,
  erp_posted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','awaiting_approval','approved','rejected','posted','anomaly')),
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approval_threshold DECIMAL(12,2) DEFAULT 500,
  immutable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posted_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  source_ref TEXT
);

CREATE INDEX idx_ledger_entity ON ledger_entries(entity_id);
CREATE INDEX idx_ledger_agent ON ledger_entries(agent_id);
CREATE INDEX idx_ledger_status ON ledger_entries(status);
CREATE INDEX idx_ledger_created ON ledger_entries(created_at DESC);
CREATE INDEX idx_ledger_action_type ON ledger_entries(action_type);

CREATE OR REPLACE FUNCTION enforce_ledger_immutability() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'ledger_entries is immutable: rows cannot be deleted (id: %)', OLD.id; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER ledger_immutability BEFORE UPDATE OR DELETE ON ledger_entries FOR EACH ROW EXECUTE FUNCTION enforce_ledger_immutability();

CREATE OR REPLACE FUNCTION flag_approval_required() RETURNS TRIGGER AS $$
BEGIN IF NEW.amount IS NOT NULL AND NEW.amount >= 500 THEN NEW.requires_approval := true; NEW.status := 'awaiting_approval'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER ledger_approval_flag BEFORE INSERT ON ledger_entries FOR EACH ROW EXECUTE FUNCTION flag_approval_required();

CREATE TABLE IF NOT EXISTS entity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id TEXT NOT NULL REFERENCES entities(id),
  snapshot_date DATE NOT NULL,
  total_revenue DECIMAL(14,2) DEFAULT 0,
  total_expense DECIMAL(14,2) DEFAULT 0,
  net_income DECIMAL(14,2) GENERATED ALWAYS AS (total_revenue - total_expense) STORED,
  agent_count INT DEFAULT 0,
  active_agents INT DEFAULT 0,
  erp_synced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_id TEXT REFERENCES entities(id),
  agent_id UUID REFERENCES agents(id),
  payload JSONB,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info','warn','error','critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_full_access" ON entities FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_full_access" ON agents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_full_access" ON ledger_entries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_full_access" ON entity_snapshots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_full_access" ON system_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "anon_read" ON entities FOR SELECT USING (true);
CREATE POLICY "anon_read" ON agents FOR SELECT USING (true);
CREATE POLICY "anon_read" ON ledger_entries FOR SELECT USING (true);
CREATE POLICY "anon_read" ON entity_snapshots FOR SELECT USING (true);
CREATE POLICY "auth_insert_ledger" ON ledger_entries FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

ALTER PUBLICATION supabase_realtime ADD TABLE ledger_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE system_events;