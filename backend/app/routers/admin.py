"""Admin API routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.auth import get_current_admin
from app.database import get_db
from app.models import Company, Conversation, Product, ProductStatus, User
from app.schemas import DashboardStats

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=DashboardStats)
async def stats(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    """Get dashboard statistics for admin users."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    return DashboardStats(
        total_products=db.query(Product).count(),
        total_users=db.query(User).count(),
        total_conversations=db.query(Conversation).filter(Conversation.started_at >= today_start).count(),
        out_of_stock_count=db.query(Product).filter(Product.stock_status == ProductStatus.OUT_OF_STOCK.value).count(),
        total_companies=db.query(Company).count(),
    )
