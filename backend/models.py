import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DECIMAL,
    DateTime, Enum, JSON, ForeignKey
)
from database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    user = "user"


class QuotationType(str, enum.Enum):
    drug = "drug"
    packaging = "packaging"


class QuotationStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    cancelled = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(200))
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DrugItem(Base):
    __tablename__ = "drug_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(200))
    name = Column(String(500))
    standard = Column(String(500))
    method = Column(String(500))
    unit_price = Column(DECIMAL(10, 2), default=0)
    cma = Column(Boolean, default=False)
    cnas = Column(Boolean, default=False)
    cycle_days = Column(Integer, default=5)
    description = Column(Text)
    is_active = Column(Boolean, default=True)


class PackagingItem(Base):
    __tablename__ = "packaging_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(200))
    name = Column(String(500))
    standard = Column(String(500))
    method = Column(String(500))
    unit_price = Column(DECIMAL(10, 2), default=0)
    cma = Column(Boolean, default=False)
    cnas = Column(Boolean, default=False)
    cycle_days = Column(Integer, default=5)
    description = Column(Text)
    is_active = Column(Boolean, default=True)


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    quote_no = Column(String(50))
    title = Column(String(500), nullable=False)
    customer_name = Column(String(500))
    contact_person = Column(String(200))
    sample_name = Column(String(200))
    quotation_type = Column(Enum(QuotationType))
    total_amount = Column(DECIMAL(12, 2), default=0)
    status = Column(Enum(QuotationStatus), default=QuotationStatus.draft)
    items_json = Column(JSON)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
