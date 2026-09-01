from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# -- Enums ------------------------------------------------------------------

class ProductStatusEnum(str, Enum):
    AVAILABLE = "متوفر"
    OUT_OF_STOCK = "نفذ"
    ON_ORDER = "تحت الطلب"


class SenderTypeEnum(str, Enum):
    USER = "user"
    BOT = "bot"


class UserRoleEnum(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    CUSTOMER = "customer"


# -- Auth -------------------------------------------------------------------

class UserCreate(BaseModel):
    user_name: str
    password: str = Field(..., min_length=4)
    role: UserRoleEnum = UserRoleEnum.CUSTOMER


class UserLogin(BaseModel):
    user_name: str
    password: str

    @model_validator(mode="before")
    @classmethod
    def normalize_login_payload(cls, value):
        if isinstance(value, dict) and "user_name" not in value and "username" in value:
            value = dict(value)
            value["user_name"] = value["username"]
        return value


class UserUpdate(BaseModel):
    new_user_name: Optional[str] = None
    new_name: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=4)
    current_password: str


class UserResponse(BaseModel):
    id: int
    user_name: str
    role: UserRoleEnum
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    role: Optional[UserRoleEnum] = None


class DashboardStats(BaseModel):
    total_products: int
    total_users: int
    total_conversations: int
    out_of_stock_count: int
    total_companies: int


# -- Company ----------------------------------------------------------------

class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class CompanyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# -- Product ----------------------------------------------------------------

class ProductImageResponse(BaseModel):
    id: int
    product_id: int
    mime_type: str
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    price: float = Field(..., ge=0)
    stock_status: ProductStatusEnum = ProductStatusEnum.AVAILABLE
    description: Optional[str] = None
    company_id: Optional[int] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    price: Optional[float] = Field(None, ge=0)
    stock_status: Optional[ProductStatusEnum] = None
    description: Optional[str] = None
    company_id: Optional[int] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    price: float
    stock_status: ProductStatusEnum
    description: Optional[str] = None
    added_by_user_id: Optional[int] = None
    company_id: Optional[int] = None
    created_at: datetime
    company: Optional[CompanyResponse] = None
    images: List[ProductImageResponse] = []
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    per_page: int


# -- Chat -------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    products_found: Optional[List[ProductResponse]] = None


class MessageResponse(BaseModel):
    id: int
    sender: SenderTypeEnum
    message_content: str
    sent_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    session_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    started_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


# -- Invoice ----------------------------------------------------------------

class InvoiceCreate(BaseModel):
    person_name: str = Field(..., max_length=255)
    invoice_number: Optional[str] = Field(None, max_length=50)
    product_name: str = Field(..., max_length=255)
    amount_received: float = Field(..., ge=0)
    invoice_date: Optional[datetime] = None


class InvoiceResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    person_name: str
    invoice_number: str
    product_name: str
    amount_received: float
    invoice_date: datetime

    class Config:
        from_attributes = True


# -- Generic ----------------------------------------------------------------

class SuccessResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    detail: str
    success: bool = False
