from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database
import shutil
import os
from sqlalchemy import or_

router = APIRouter(
    prefix="/admin/products",
    tags=["admin-products"],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
def read_products(
    skip: int = 0, 
    limit: int = 100, 
    q: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    low_stock: Optional[bool] = False,
    sort_by: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Product)
    
    if category and category != "全部" and category != "全部分类":
        query = query.filter(models.Product.category == category)
        
    if status:
        query = query.filter(models.Product.status == status)
        
    if low_stock:
        query = query.filter(models.Product.stock < 50)
        
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                models.Product.name.like(search),
                models.Product.description.like(search)
            )
        )
        
    if sort_by == 'sales_desc':
        query = query.order_by(models.Product.sales.desc())
        
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": products,
        "page": skip // limit + 1,
        "size": limit
    }

@router.post("/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(database.get_db)):
    product_data = product.dict()
    images = product_data.pop('images', [])
    specs = product_data.pop('specs', [])
    
    db_product = models.Product(**product_data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    if images:
        for img_url in images:
            db_image = models.ProductImage(product_id=db_product.id, url=img_url)
            db.add(db_image)
            
    if specs:
        for spec_text in specs:
            db_spec = models.ProductSpec(product_id=db_product.id, spec=spec_text)
            db.add(db_spec)
            
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=schemas.Product)
def update_product(product_id: str, product: schemas.ProductUpdate, db: Session = Depends(database.get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product.dict(exclude_unset=True)
    
    # Handle images and specs separately
    if 'images' in update_data:
        images = update_data.pop('images')
        # Clear existing images
        db.query(models.ProductImage).filter(models.ProductImage.product_id == product_id).delete()
        # Add new images
        if images:
            for img_url in images:
                db_image = models.ProductImage(product_id=product_id, url=img_url)
                db.add(db_image)
                
    if 'specs' in update_data:
        specs = update_data.pop('specs')
        # Clear existing specs
        db.query(models.ProductSpec).filter(models.ProductSpec.product_id == product_id).delete()
        # Add new specs
        if specs:
            for spec_text in specs:
                db_spec = models.ProductSpec(product_id=product_id, spec=spec_text)
                db.add(db_spec)
    
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(database.get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}

@router.post("/batch-delete")
def batch_delete_products(product_ids: List[str], db: Session = Depends(database.get_db)):
    # Delete associated data first to avoid foreign key constraints
    db.query(models.ProductImage).filter(models.ProductImage.product_id.in_(product_ids)).delete(synchronize_session=False)
    db.query(models.ProductSpec).filter(models.ProductSpec.product_id.in_(product_ids)).delete(synchronize_session=False)
    db.query(models.CartItem).filter(models.CartItem.product_id.in_(product_ids)).delete(synchronize_session=False)
    db.query(models.Favorite).filter(models.Favorite.product_id.in_(product_ids)).delete(synchronize_session=False)
    
    # Also delete OrderItems to allow deletion (WARNING: This modifies historical orders)
    db.query(models.OrderItem).filter(models.OrderItem.product_id.in_(product_ids)).delete(synchronize_session=False)
    
    db.query(models.Product).filter(models.Product.id.in_(product_ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"Successfully deleted {len(product_ids)} products"}

@router.post("/upload")
async def upload_product_image(file: UploadFile = File(...)):
    upload_dir = "uploads/products"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    file_extension = os.path.splitext(file.filename)[1]
    # Generate unique filename
    import uuid
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return URL (assuming localhost:8001 for admin backend, but images might be served from there too)
    # Note: If marketplace frontend needs to see these images, they should be accessible.
    # Currently admin backend serves static files from "uploads".
    return {"url": f"http://localhost:8001/uploads/products/{file_name}"}

@router.post("/batch-upload")
async def batch_upload_products(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    content = await file.read()
    decoded_content = content.decode('utf-8-sig') # Handle BOM
    lines = decoded_content.splitlines()
    
    # Skip header
    if len(lines) > 0:
        lines = lines[1:]
        
    created_count = 0
    errors = []
    
    for i, line in enumerate(lines):
        if not line.strip():
            continue
            
        try:
            # Expected format: name,category,price,stock,description,image_url,additional_images,specs
            parts = line.split(',')
            if len(parts) < 4:
                errors.append(f"Line {i+2}: Insufficient fields")
                continue
                
            name = parts[0].strip()
            category = parts[1].strip()
            price = float(parts[2].strip())
            stock = int(parts[3].strip())
            description = parts[4].strip() if len(parts) > 4 else ""
            image = parts[5].strip() if len(parts) > 5 else ""
            additional_images_str = parts[6].strip() if len(parts) > 6 else ""
            specs_str = parts[7].strip() if len(parts) > 7 else ""
            
            product = models.Product(
                name=name,
                category=category,
                price=price,
                stock=stock,
                description=description,
                image=image,
                sales=0,
                rating=0
            )
            db.add(product)
            db.flush() # Generate ID
            
            if additional_images_str:
                for img_url in additional_images_str.split('|'):
                    if img_url.strip():
                        db.add(models.ProductImage(product_id=product.id, url=img_url.strip()))
                        
            if specs_str:
                for spec in specs_str.split('|'):
                    if spec.strip():
                        db.add(models.ProductSpec(product_id=product.id, spec=spec.strip()))
            
            created_count += 1
            
        except Exception as e:
            errors.append(f"Line {i+2}: {str(e)}")
            
    db.commit()
    
    return {
        "message": f"Successfully uploaded {created_count} products",
        "errors": errors
    }
