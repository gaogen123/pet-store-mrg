from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database
from datetime import datetime

router = APIRouter(
    prefix="/admin/shipping",
    tags=["admin-shipping"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=dict)
def read_shippings(
    skip: int = 0, 
    limit: int = 10, 
    db: Session = Depends(database.get_admin_db),
    db_main: Session = Depends(database.get_db)
):
    query = db.query(models.Shipping)
    total = query.count()
    shippings = query.offset(skip).limit(limit).all()
    
    # Fetch associated orders
    order_ids = [s.order_id for s in shippings]
    orders = db_main.query(models.Order).filter(models.Order.id.in_(order_ids)).all()
    orders_map = {o.id: o for o in orders}
    
    items = []
    for s in shippings:
        s.order = orders_map.get(s.order_id)
        # Explicitly convert to Pydantic model to ensure serialization
        # Using model_validate for Pydantic v2
        items.append(schemas.ShippingWithOrder.model_validate(s))
        
    return {
        "total": total,
        "items": items,
        "page": skip // limit + 1,
        "size": limit
    }

@router.post("/", response_model=schemas.Shipping)
def create_shipping(shipping: schemas.ShippingCreate, db: Session = Depends(database.get_admin_db)):
    # Check if shipping already exists for this order
    db_shipping = db.query(models.Shipping).filter(models.Shipping.order_id == shipping.order_id).first()
    if db_shipping:
        raise HTTPException(status_code=400, detail="Shipping already exists for this order")
    
    db_shipping = models.Shipping(**shipping.dict())
    db.add(db_shipping)
    db.commit()
    db.refresh(db_shipping)
    return db_shipping

@router.get("/order/{order_id}", response_model=schemas.Shipping)
def read_shipping_by_order(order_id: str, db: Session = Depends(database.get_admin_db)):
    shipping = db.query(models.Shipping).filter(models.Shipping.order_id == order_id).first()
    if not shipping:
        raise HTTPException(status_code=404, detail="Shipping not found")
    return shipping

@router.get("/{shipping_id}", response_model=schemas.Shipping)
def read_shipping(shipping_id: int, db: Session = Depends(database.get_admin_db)):
    shipping = db.query(models.Shipping).filter(models.Shipping.id == shipping_id).first()
    if not shipping:
        raise HTTPException(status_code=404, detail="Shipping not found")
    return shipping

@router.put("/{shipping_id}", response_model=schemas.Shipping)
def update_shipping(shipping_id: int, shipping: schemas.ShippingUpdate, db: Session = Depends(database.get_admin_db)):
    db_shipping = db.query(models.Shipping).filter(models.Shipping.id == shipping_id).first()
    if not db_shipping:
        raise HTTPException(status_code=404, detail="Shipping not found")
    
    update_data = shipping.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_shipping, key, value)
        
    db.commit()
    db.refresh(db_shipping)
    return db_shipping

@router.delete("/{shipping_id}")
def delete_shipping(shipping_id: int, db: Session = Depends(database.get_admin_db)):
    db_shipping = db.query(models.Shipping).filter(models.Shipping.id == shipping_id).first()
    if not db_shipping:
        raise HTTPException(status_code=404, detail="Shipping not found")
    
    db.delete(db_shipping)
    db.commit()
    return {"message": "Shipping deleted successfully"}
