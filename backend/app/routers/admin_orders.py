from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database
from sqlalchemy import desc

router = APIRouter(
    prefix="/admin/orders",
    tags=["admin-orders"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=dict)
def read_orders(
    skip: int = 0, 
    limit: int = 10, 
    status: Optional[str] = None,
    order_number: Optional[str] = None,
    sort_by: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Order)
    
    if status and status != "all":
        query = query.filter(models.Order.status == status)
        
    if order_number:
        query = query.filter(models.Order.order_number.like(f"%{order_number}%"))
        
    if sort_by == 'amount_desc':
        query = query.order_by(desc(models.Order.total_amount))
    elif sort_by == 'amount_asc':
        query = query.order_by(models.Order.total_amount)
    else:
        # Default sort by create_time desc
        query = query.order_by(desc(models.Order.create_time))
        
    try:
        total = query.count()
        orders = query.offset(skip).limit(limit).all()
        
        # Explicitly convert to Pydantic models to ensure serialization works
        # and to catch any validation errors here
        items = [schemas.Order.from_orm(o) for o in orders]
        
        return {
            "total": total,
            "items": items,
            "page": skip // limit + 1,
            "size": limit
        }
    except Exception as e:
        print(f"Error fetching orders: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/{order_id}", response_model=schemas.Order)
def read_order(order_id: str, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}/status")
def update_order_status(
    order_id: str, 
    status_update: dict, 
    db: Session = Depends(database.get_db),
    db_admin: Session = Depends(database.get_admin_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    new_status = status_update.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
        
    order.status = new_status
    db.commit()
    db.refresh(order)
    
    # If status is 'shipped', create a shipping record if it doesn't exist
    if new_status == 'shipped':
        shipping = db_admin.query(models.Shipping).filter(models.Shipping.order_id == order_id).first()
        if not shipping:
            # Create default shipping record
            new_shipping = models.Shipping(
                order_id=order_id,
                tracking_number="",
                carrier="",
                status="待揽件"
            )
            db_admin.add(new_shipping)
            db_admin.commit()
            
    return {"message": "Order status updated", "status": order.status}

@router.delete("/{order_id}")
def delete_order(order_id: str, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Delete order items first
    db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).delete()
    
    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully"}
