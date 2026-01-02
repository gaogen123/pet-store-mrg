from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta
from .. import models, database
import calendar

router = APIRouter(
    prefix="/admin/dashboard",
    tags=["admin_dashboard"],
    responses={404: {"detail": "Not found"}},
)

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(database.get_db)):
    # 1. Total Sales
    total_sales = db.query(func.sum(models.Order.total_amount)).scalar() or 0.0
    
    # 2. Order Count
    order_count = db.query(models.Order).count()
    
    # 3. User Count
    user_count = db.query(models.User).count()
    
    # 4. Product Count
    product_count = db.query(models.Product).count()
    
    # Calculate changes (Mock logic for now, or simple comparison)
    # For real implementation, we would query previous month's data
    
    return {
        "total_sales": total_sales,
        "order_count": order_count,
        "user_count": user_count,
        "product_count": product_count
    }

@router.get("/sales-chart")
def get_sales_chart(db: Session = Depends(database.get_db)):
    # Get last 6 months
    today = datetime.utcnow()
    data = []
    
    for i in range(5, -1, -1):
        # Calculate start and end of the month
        # This is a bit simplified, ideally use a proper date library or SQL grouping
        month_date = today - timedelta(days=i*30) 
        year = month_date.year
        month = month_date.month
        
        _, last_day = calendar.monthrange(year, month)
        start_date = datetime(year, month, 1)
        end_date = datetime(year, month, last_day, 23, 59, 59)
        
        monthly_sales = db.query(func.sum(models.Order.total_amount)).filter(
            models.Order.create_time >= start_date,
            models.Order.create_time <= end_date
        ).scalar() or 0.0
        
        data.append({
            "name": f"{month}月",
            "销售额": monthly_sales
        })
        
    return data

@router.get("/category-chart")
def get_category_chart(db: Session = Depends(database.get_db)):
    # Group products by category
    results = db.query(models.Product.category, func.count(models.Product.id)).group_by(models.Product.category).all()
    
    data = []
    for category, count in results:
        if category: # Filter out None categories if any
            data.append({
                "name": category,
                "value": count
            })
            
    return data

@router.get("/recent-orders")
def get_recent_orders(db: Session = Depends(database.get_db)):
    orders = db.query(models.Order).order_by(models.Order.create_time.desc()).limit(5).all()
    
    result = []
    for order in orders:
        # Get customer name
        customer_name = order.user.username if order.user else "未知用户"
        
        # Get product summary (first product name + others count)
        product_summary = ""
        if order.items:
            first_item = order.items[0]
            product_name = first_item.product.name if first_item.product else "未知商品"
            if len(order.items) > 1:
                product_summary = f"{product_name} 等{len(order.items)}件"
            else:
                product_summary = product_name
        else:
            product_summary = "无商品"
            
        result.append({
            "id": order.order_number,
            "customer": customer_name,
            "product": product_summary,
            "amount": f"¥{order.total_amount}",
            "status": order.status
        })
        
    return result
