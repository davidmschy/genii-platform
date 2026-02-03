-- Migration: 005_create_projects
-- Description: Create projects table

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

-- Indexes
CREATE INDEX idx_projects_business ON projects(business_id);
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_projects_slug ON projects(business_id, slug);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_projects_parent ON projects(parent_project_id);
CREATE INDEX idx_projects_assignees ON projects USING GIN(assignee_ids);

-- Trigger
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
