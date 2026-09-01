from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_admin
from app.database import get_db
from app.models import Product, ProductImage, User
from app.schemas import ProductCreate, ProductListResponse, ProductResponse, ProductUpdate, SuccessResponse

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Product.category).distinct().all()
    valid_categories = [c[0] for c in categories if c[0]]
    return {"categories": valid_categories}

@router.post("", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate, 
    db: Session = Depends(get_db), 
    admin: User = Depends(get_current_admin)
):
    try:
        new_prod = Product(
            name=product_data.name,
            category=product_data.category,
            price=product_data.price,
            stock_status=product_data.stock_status.value,
            description=product_data.description,
            added_by_user_id=admin.id,
            company_id=product_data.company_id
        )
        db.add(new_prod)
        db.commit()
        db.refresh(new_prod)
        return new_prod
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء إضافة المنتج: {str(e)}")

@router.get("", response_model=ProductListResponse)
async def list_products(
    db: Session = Depends(get_db),
    page: int = 1, per_page: int = 20,
    category: Optional[str] = None, 
    search: Optional[str] = None,
    company_id: Optional[int] = None
):
    from sqlalchemy.orm import Query
    query: Query = db.query(Product).options(joinedload(Product.company), joinedload(Product.images))
    if category:
        query = query.filter(Product.category == category)
    if company_id:
        query = query.filter(Product.company_id == company_id)
    if search:
        search = search.strip()
        if len(search) < 2:
            return ProductListResponse(products=[], total=0, page=page, per_page=per_page)
            
        terms = search.split()
        for term in terms:
            if len(term) >= 2:
                search_pattern = f"%{term}%"
                query = query.filter(or_(Product.name.ilike(search_pattern), Product.description.ilike(search_pattern)))
    
    total = query.count()
    offset = (page - 1) * per_page
    products = query.order_by(Product.created_at.desc()).offset(offset).limit(per_page).all()
    
    for p in products:
        primary_img = next((img for img in p.images if img.is_primary), None)
        if not primary_img and p.images:
            primary_img = p.images[0]
        
        if primary_img:
            p.image_url = f"/api/products/images/{primary_img.id}"
            
    return ProductListResponse(products=products, total=total, page=page, per_page=per_page)

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).options(joinedload(Product.company), joinedload(Product.images)).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="غير موجود")
    
    primary_img = next((img for img in prod.images if img.is_primary), None)
    if not primary_img and prod.images:
        primary_img = prod.images[0]
    
    if primary_img:
        prod.image_url = f"/api/products/images/{primary_img.id}"
        
    return prod

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, prod_data: ProductUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    try:
        prod = db.query(Product).filter(Product.id == product_id).first()
        if not prod: raise HTTPException(status_code=404, detail="المنتج غير موجود")
        update_data = prod_data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            if k == "stock_status" and v is not None:
                setattr(prod, k, v.value)
            else:
                setattr(prod, k, v)
        db.commit()
        db.refresh(prod)
        return prod
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء تحديث المنتج: {str(e)}")

@router.delete("/{product_id}", response_model=SuccessResponse)
async def delete_prod(product_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    try:
        prod = db.query(Product).filter(Product.id == product_id).first()
        if not prod: raise HTTPException(status_code=404, detail="المنتج غير موجود")
        db.delete(prod)
        db.commit()
        return SuccessResponse(message="تم الحذف")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء حذف المنتج: {str(e)}")

@router.post("/{product_id}/images")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    is_primary: bool = False,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    try:
        count = db.query(ProductImage).filter(ProductImage.product_id == product_id).count()
        if count >= 5:
            raise HTTPException(status_code=400, detail="لا يمكن رفع أكثر من 5 صور لكل منتج")

        data = await file.read()
        img = ProductImage(
            product_id=product_id,
            image_data=data,
            mime_type=file.content_type,
            is_primary=is_primary
        )
        db.add(img)
        db.commit()
        db.refresh(img)
        return {"message": "تم رفع الصورة بنجاح", "image_id": img.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء رفع الصورة: {str(e)}")

@router.get("/{product_id}/images")
async def get_product_images(product_id: int, db: Session = Depends(get_db)):
    images = db.query(ProductImage).filter(ProductImage.product_id == product_id).all()
    return [{"id": img.id} for img in images]

@router.get("/images/{image_id}")
async def get_product_image(image_id: int, db: Session = Depends(get_db)):
    img = db.query(ProductImage).filter(ProductImage.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404)
    return Response(content=img.image_data, media_type=img.mime_type or "image/png")

@router.delete("/image-delete/{image_id}", response_model=SuccessResponse)
async def delete_product_image(image_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    try:
        img = db.query(ProductImage).filter(ProductImage.id == image_id).first()
        if not img: raise HTTPException(status_code=404, detail="الصورة غير موجودة")
        db.delete(img)
        db.commit()
        return SuccessResponse(message="تم حذف الصورة")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء حذف الصورة: {str(e)}")
