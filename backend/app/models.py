import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Text, Numeric,
    DateTime, Enum, ForeignKey, Boolean, LargeBinary,
)
from sqlalchemy.orm import relationship, deferred

from .database import Base


class ProductStatus(str, enum.Enum):
    AVAILABLE = "متوفر"
    OUT_OF_STOCK = "نفذ"
    ON_ORDER = "تحت الطلب"


class SenderType(str, enum.Enum):
    user = "user"
    bot = "bot"


class UserRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    CUSTOMER = "customer"


def _utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_name = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        Enum("owner", "admin", "customer", name="user_role", create_type=False),
        default="customer",
    )
    created_at = Column(DateTime(timezone=True), default=_utcnow)

    added_products = relationship("Product", back_populates="added_by_user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="user", cascade="all, delete-orphan")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    image_data = deferred(Column(LargeBinary, nullable=True))
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow)

    products = relationship("Product", back_populates="company")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), index=True, nullable=True)
    price = Column(Numeric(10, 2), nullable=False, default=0.00)
    stock_status = Column(
        Enum("متوفر", "نفذ", "تحت الطلب", name="product_status", create_type=False),
        default="متوفر",
    )
    description = Column(Text, nullable=True)
    added_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow)

    added_by_user = relationship("User", back_populates="added_products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    company = relationship("Company", back_populates="products")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    image_data = deferred(Column(LargeBinary, nullable=False))
    mime_type = Column(String(50), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow)

    product = relationship("Product", back_populates="images")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_id = Column(String(255), nullable=True, index=True)
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    started_at = Column(DateTime(timezone=True), default=_utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.sent_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender = Column(Enum(SenderType, name="sender_type", create_type=False), nullable=False)
    message_content = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True), default=_utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    person_name = Column(String(255), nullable=False)
    invoice_number = Column(String(50), nullable=False)
    product_name = Column(String(255), nullable=False)
    amount_received = Column(Numeric(10, 2), nullable=False)
    invoice_date = Column(DateTime(timezone=True), default=_utcnow)

    user = relationship("User", back_populates="invoices")
