from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    price: float
    category: str
    image: str
    description: str
    rating: Optional[float] = 0.0
    sales: Optional[int] = 0
    stock: Optional[int] = 0
    status: Optional[str] = "上架"

class ProductCreate(ProductBase):
    images: Optional[List[str]] = []
    specs: Optional[List[str]] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    rating: Optional[float] = None
    sales: Optional[int] = None
    stock: Optional[int] = None
    status: Optional[str] = None
    images: Optional[List[str]] = None
    specs: Optional[List[str]] = None

class Product(ProductBase):
    id: str
    images: List[str] = []
    specs: List[str] = []

    class Config:
        orm_mode = True
        from_attributes = True

    @staticmethod
    def _extract_images(v):
        if not v: return []
        # If it's already a list of strings, return it
        if isinstance(v[0], str): return v
        return [img.url for img in v]

    @staticmethod
    def _extract_specs(v):
        if not v: return []
        if isinstance(v[0], str): return v
        return [s.spec for s in v]



    @field_validator('images', mode='before')
    @classmethod
    def validate_images(cls, v):
        if not v: return []
        # Check if it's a list of objects (SQLAlchemy models)
        if hasattr(v[0], 'url'):
            return [img.url for img in v]
        return v

    @field_validator('specs', mode='before')
    @classmethod
    def validate_specs(cls, v):
        if not v: return []
        if hasattr(v[0], 'spec'):
            return [s.spec for s in v]
        return v



class VIPLevelBase(BaseModel):
    name: str
    level: int
    discount: int
    min_spend: float
    color: str
    icon: str
    benefits: List[str]

class VIPLevelCreate(VIPLevelBase):
    pass

class VIPLevelUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[int] = None
    discount: Optional[int] = None
    min_spend: Optional[float] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    benefits: Optional[List[str]] = None

class VIPLevel(VIPLevelBase):
    id: str
    memberCount: Optional[int] = 0
    monthlyRevenue: Optional[float] = 0.0

    class Config:
        from_attributes = True

    @field_validator('benefits', mode='before')
    @classmethod
    def parse_benefits(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str
    phone: Optional[str] = None
    role: Optional[str] = "user"

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    avatar: Optional[str] = None
    vip_level_id: Optional[str] = None

class UserLogin(BaseModel):
    identifier: str # Can be email or phone
    password: str

class User(UserBase):
    id: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    role: str
    is_active: bool = True
    vip_level_id: Optional[str] = None
    vip_level: Optional[VIPLevel] = None
    register_time: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class AdminUserBase(BaseModel):
    username: str
    email: str

class AdminUserCreate(AdminUserBase):
    password: str

class AdminUserLogin(BaseModel):
    identifier: str
    password: str

class AdminUser(AdminUserBase):
    id: str
    avatar: Optional[str] = None
    create_time: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class CartItemBase(BaseModel):
    product_id: str
    quantity: int

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: int

class CartItem(CartItemBase):
    id: int
    product: Product

    class Config:
        from_attributes = True

class FavoriteBase(BaseModel):
    product_id: str

class FavoriteCreate(FavoriteBase):
    pass

class Favorite(FavoriteBase):
    id: int
    create_time: datetime
    product: Product

    class Config:
        from_attributes = True

class OrderItemBase(BaseModel):
    product_id: str
    quantity: int
    price: float

class OrderItem(OrderItemBase):
    id: int
    product: Product

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    payment_method: str
    address_id: Optional[str] = None # For now we might pass full address or just ID. Let's assume we pass address details in frontend but backend might link to address table later. 
    # Actually frontend passes full address object.
    # Let's simplify: create order request will have address details.

class OrderCreate(BaseModel):
    payment_method: str
    address: dict # Simplified for now, or use Address schema if we had one.



from pydantic import model_validator
import json

class UserResetPassword(BaseModel):
    username: str
    email: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str

class Order(BaseModel):
    id: str
    order_number: Optional[str] = None
    user_id: Optional[str] = None
    payment_method: Optional[str] = None
    total_amount: Optional[float] = 0.0
    create_time: Optional[datetime] = None
    status: Optional[str] = "pending"
    address_snapshot: Optional[str] = None
    address: Optional[dict] = None
    user: Optional[User] = None
    items: List[OrderItem] = []

    class Config:
        from_attributes = True

    @model_validator(mode='after')
    def parse_address_snapshot(self):
        if self.address_snapshot and not self.address:
            try:
                self.address = json.loads(self.address_snapshot)
            except:
                pass
        return self

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = "blue"
    sort_order: Optional[int] = 0
    is_active: Optional[bool] = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class Category(CategoryBase):
    id: int
    productCount: Optional[int] = 0

    class Config:
        from_attributes = True

class ShippingBase(BaseModel):
    order_id: str
    tracking_number: str
    carrier: str
    status: Optional[str] = "shipped"
    estimated_delivery_time: Optional[datetime] = None

class ShippingCreate(ShippingBase):
    pass

class ShippingUpdate(BaseModel):
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    status: Optional[str] = None
    estimated_delivery_time: Optional[datetime] = None

class Shipping(ShippingBase):
    id: int
    shipping_time: datetime

    class Config:
        from_attributes = True

class ShippingWithOrder(Shipping):
    order: Optional[Order] = None

    class Config:
        from_attributes = True

class UserAdminView(User):
    orders_count: int = 0
    total_spent: float = 0.0
    address_str: str = ""

    class Config:
        from_attributes = True

class BannerBase(BaseModel):
    title: str
    image_url: str
    description: Optional[str] = None
    link_url: Optional[str] = None
    sort_order: Optional[int] = 0
    is_active: Optional[bool] = True

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    link_url: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class Banner(BannerBase):
    id: int
    create_time: datetime

    class Config:
        from_attributes = True
