from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.database import get_db
from app.models import Company, User, Product
from app.schemas import CompanyCreate, CompanyResponse, CompanyUpdate, SuccessResponse

router = APIRouter(prefix="/api/companies", tags=["Companies"])

@router.post("", response_model=CompanyResponse)
async def create_company(company_data: CompanyCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    try:
        new_company = Company(**company_data.model_dump())
        db.add(new_company)
        db.commit()
        db.refresh(new_company)
        new_company.image_url = f"/api/companies/{new_company.id}/image" if new_company.image_data else None
        return new_company
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء إضافة الشركة: {str(e)}")

@router.get("", response_model=List[CompanyResponse])
async def get_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).all()
    # Check which companies have images without loading the massive blobs
    companies_with_image = {c_id for (c_id,) in db.query(Company.id).filter(Company.image_data.isnot(None)).all()}
    
    for comp in companies:
        comp.image_url = f"/api/companies/{comp.id}/image" if comp.id in companies_with_image else None
    return companies

@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: int, 
    company_data: CompanyUpdate, 
    db: Session = Depends(get_db), 
    admin: User = Depends(get_current_admin)
):
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="الشركة غير موجودة")
        
        update_data = company_data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(company, k, v)
        
        db.commit()
        db.refresh(company)
        company.image_url = f"/api/companies/{company.id}/image" if company.image_data else None
        return company
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء تحديث الشركة: {str(e)}")

@router.delete("/{company_id}", response_model=SuccessResponse)
async def delete_company(
    company_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(get_current_admin)
):
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="الشركة غير موجودة")
        
        products_count = db.query(Product).filter(Product.company_id == company_id).count()
        if products_count > 0:
            raise HTTPException(
                status_code=400, 
                detail="لا يمكنك حذف الشركة لانه يوجد منتجات تابعه لها احذف المنتجات لتتمكن من حذف الشركة"
            )
        
        db.delete(company)
        db.commit()
        return SuccessResponse(message="تم حذف الشركة بنجاح")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء حذف الشركة: {str(e)}")

@router.post("/{company_id}/image")
async def upload_company_image(
    company_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="الشركة غير موجودة")
        
        data = await file.read()
        company.image_data = data
        db.commit()
        return {"message": "تم رفع شعار الشركة"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء رفع الشعار: {str(e)}")

@router.get("/{company_id}/image")
async def get_company_image(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company or not company.image_data:
        raise HTTPException(status_code=404)
    return Response(content=company.image_data, media_type="image/png")