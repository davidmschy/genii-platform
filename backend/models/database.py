from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Enum, UUID, Text, Numeric, Date, Boolean
from sqlalchemy.orm import relationship, declarative_base
import uuid
from datetime import datetime

Base = declarative_base()

import enum

class TenantType(enum.Enum):
    FAMILY = "family"
    BUSINESS = "business"
    PERSONAL = "personal"

class UserRole(enum.Enum):
    ADMIN = "admin"
    AMBER = "amber"
    KID = "kid"
    TEAM = "team"
    CONTRACTOR = "contractor"

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(50), unique=True, nullable=False)
    type = Column(Enum(TenantType), nullable=False, default=TenantType.BUSINESS)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # VM / Interconnection Config
    vm_ip = Column(String(50))
    obsidian_vault_path = Column(String(512))
    
    users = relationship("User", back_populates="tenant")
    accounts = relationship("Account", back_populates="tenant")
    ledger_entries = relationship("LedgerEntry", back_populates="tenant")

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    email = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.TEAM)
    
    tenant = relationship("Tenant", back_populates="users")

class LedgerEntry(Base):
    """
    Core of the Triple-Entry Ledger system.
    """
    __tablename__ = "ledger_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor_id = Column(String(100), nullable=False) # e.g., MKT_PA_001
    recipient_id = Column(String(100), nullable=False) # e.g., META_ADS_API
    action = Column(String(255), nullable=False)
    payload = Column(Text) # JSON blob of the action details
    
    # Triple-Entry Signatures
    actor_sig = Column(String(512))
    recipient_sig = Column(String(512))
    auditor_sig = Column(String(512))
    
    tenant = relationship("Tenant", back_populates="ledger_entries")

class Account(Base):
    # ... (existing content remains)
    __tablename__ = "accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    code = Column(String(20), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False) # asset, liability, equity, revenue, expense
    balance = Column(Numeric(15, 2), default=0)
    
    tenant = relationship("Tenant", back_populates="accounts")

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    date = Column(Date, nullable=False, default=datetime.utcnow().date)
    reference = Column(String(255))
    memo = Column(Text)
    state = Column(String(20), default="draft") # draft, posted
    
    lines = relationship("JournalEntryLine", back_populates="entry")

class JournalEntryLine(Base):
    __tablename__ = "journal_entry_lines"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id = Column(UUID(as_uuid=True), ForeignKey("journal_entries.id"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    debit = Column(Numeric(15, 2), default=0)
    credit = Column(Numeric(15, 2), default=0)
    
    entry = relationship("JournalEntry", back_populates="lines")

class Partner(Base):
    __tablename__ = "partners"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    is_customer = Column(Boolean, default=True)
    is_supplier = Column(Boolean, default=False)
    email = Column(String(255))

class Permit(Base):
    __tablename__ = "permits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    municipality = Column(String(255), nullable=False)
    type = Column(String(100)) # Building, Electrical, etc.
    status = Column(String(50), default="pending") # pending, approved, rejected
    jobsite_address = Column(String(512))
    applied_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

class ProductionTask(Base):
    __tablename__ = "production_tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    status = Column(String(50), default="scheduled") # scheduled, in_progress, finished
    labor_assigned = Column(Integer, default=0)
    materials_ready = Column(Boolean, default=False)
    scheduled_start = Column(DateTime)
    scheduled_end = Column(DateTime)
