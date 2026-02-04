-- Seed data for David and Amber

-- Insert David Schy with AI assistant
INSERT INTO users (
  id, 
  email, 
  name, 
  phone,
  assistant_email, 
  assistant_phone,
  communication_prefs,
  created_at
) VALUES (
  'david-schy-001',
  'david@geniinow.com',
  'David Schy',
  '+1-559-555-0100',
  'david-ai@geniinow.com',
  '+1-555-DAVID-01',
  '{"channels": ["email", "sms", "telegram"], "preferred": "email", "quiet_hours": {"start": "22:00", "end": "07:00"}}'::jsonb,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert Amber Schy with AI assistant
INSERT INTO users (
  id, 
  email, 
  name, 
  phone,
  assistant_email, 
  assistant_phone,
  communication_prefs,
  created_at
) VALUES (
  'amber-schy-001',
  'amber@geniinow.com',
  'Amber Schy',
  '+1-559-555-0101',
  'amber-ai@geniinow.com',
  '+1-555-AMBER-01',
  '{"channels": ["email", "sms", "telegram"], "preferred": "sms", "quiet_hours": {"start": "21:00", "end": "06:00"}}'::jsonb,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert Schy Holdings organization
INSERT INTO organizations (
  id,
  name,
  owner_email,
  settings,
  created_at
) VALUES (
  'schy-holdings-001',
  'Schy Holdings',
  'david@geniinow.com',
  '{"timezone": "America/Los_Angeles", "currency": "USD"}'::jsonb,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Link users to organization
INSERT INTO organization_members (
  organization_id,
  user_id,
  role,
  joined_at
) VALUES 
  ('schy-holdings-001', 'david-schy-001', 'owner', NOW()),
  ('schy-holdings-001', 'amber-schy-001', 'admin', NOW())
ON CONFLICT DO NOTHING;

-- Insert businesses
INSERT INTO businesses (
  id,
  organization_id,
  name,
  type,
  settings,
  created_at
) VALUES 
  ('fbx-dev-001', 'schy-holdings-001', 'FBX Developments', 'real_estate', '{"focus": "residential"}'::jsonb, NOW()),
  ('mike-schy-001', 'schy-holdings-001', 'Mike Schy Putting', 'product', '{"product": "golf_ebook"}'::jsonb, NOW()),
  ('genii-ai-001', 'schy-holdings-001', 'Genii AI', 'software', '{"product": "ai_platform"}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample projects
INSERT INTO projects (
  id,
  business_id,
  name,
  status,
  priority,
  assigned_users,
  created_at
) VALUES 
  ('selma-loi-001', 'fbx-dev-001', 'Selma LOI', 'negotiating', 5, ARRAY['david-schy-001', 'amber-schy-001'], NOW()),
  ('kerman-walk-001', 'fbx-dev-001', 'Kerman Walk', 'scheduled', 3, ARRAY['david-schy-001'], NOW()),
  ('golf-ebook-001', 'mike-schy-001', 'Putting Confidence Ebook', 'active', 4, ARRAY['david-schy-001'], NOW())
ON CONFLICT (id) DO NOTHING;

SELECT 'Seed data created for David and Amber' as status;
