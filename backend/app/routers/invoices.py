import re
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.database import get_db
from app.models import Invoice, User
from app.schemas import InvoiceCreate, InvoiceResponse, SuccessResponse

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

@router.post("", response_model=InvoiceResponse)
async def create_invoice(inv_data: InvoiceCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    try:
        data = inv_data.model_dump()
        if not data.get("invoice_number"):
            # Get the last invoice to determine the next number
            last_inv = db.query(Invoice).filter(Invoice.invoice_number.like("HF%")).order_by(Invoice.id.desc()).first()
            next_num = 1
            
            if last_inv:
                match = re.search(r'HF(\d+)', last_inv.invoice_number)
                if match:
                    try:
                        next_num = int(match.group(1)) + 1
                    except ValueError:
                        pass
            
            data["invoice_number"] = f"HF{next_num:03d}" # Switched to 3 digits for better scaling
        
        new_inv = Invoice(**data, user_id=admin.id)
        db.add(new_inv)
        db.commit()
        db.refresh(new_inv)
        return new_inv
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء إنشاء الفاتورة: {str(e)}")

@router.get("", response_model=List[InvoiceResponse])
async def list_invoices(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return db.query(Invoice).order_by(Invoice.id.desc()).all()

@router.delete("/{invoice_id}", response_model=SuccessResponse)
async def delete_invoice(invoice_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="الفاتورة غير موجودة")
    db.delete(inv)
    db.commit()
    return SuccessResponse(message="تم حذف الفاتورة بنجاح")
