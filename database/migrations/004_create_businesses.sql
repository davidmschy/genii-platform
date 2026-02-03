-- Migration: 004_create_businesses
-- Description: Create businesses table

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
    fiscal_year_start INTEGER CHECK (fiscal_year_start BETWEEN 1 AND 12),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(organization_id, slug)
);

COMMENT ON TABLE businesses IS 'Business entities managed within the ERP system';

-- Indexes
CREATE INDEX idx_businesses_organization ON businesses(organization_id);
CREATE INDEX idx_businesses_slug ON businesses(organization_id, slug);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_type ON businesses(business_type);
CREATE INDEX idx_businesses_industry ON businesses(industry);

-- Trigger
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
