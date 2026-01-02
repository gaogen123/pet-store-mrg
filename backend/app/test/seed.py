from app.database import SessionLocal, engine
from app import models
import json

# Recreate tables to apply schema changes
models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

products_data = [
  {
    "id": '1',
    "name": '优质狗粮',
    "price": 128,
    "category": '食品',
    "image": 'https://images.unsplash.com/photo-1598134493179-51332e56807f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBmb29kJTIwYm93bHxlbnwxfHx8fDE3NjcxNjYxOTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    "images": [
      'https://images.unsplash.com/photo-1598134493179-51332e56807f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBmb29kJTIwYm93bHxlbnwxfHx8fDE3NjcxNjYxOTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1767023023369-96a7c923be0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBmb29kJTIwYm93bCUyMG51dHJpdGlvbnxlbnwxfHx8fDE3NjcyNjY3Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1604544203292-0daa7f847478?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjB0cmVhdHMlMjBzbmFja3N8ZW58MXx8fHwxNzY3MTk0NDIzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    "description": '天然配方，营养均衡，适合所有犬种',
    "rating": 4.8,
    "sales": 1234,
    "stock": 156,
    "specs": ['净含量：5kg', '适用：全犬种', '产地：新西兰', '保质期：18个月']
  },
  {
    "id": '2',
    "name": '宠物玩具套装',
    "price": 68,
    "category": '玩具',
    "image": 'https://images.unsplash.com/photo-1589924749359-9697080c3577?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjB0b3lzfGVufDF8fHx8MTc2NzE3Mjk3MXww&ixlib=rb-4.1.0&q=80&w=1080',
    "images": [
      'https://images.unsplash.com/photo-1589924749359-9697080c3577?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjB0b3lzfGVufDF8fHx8MTc2NzE3Mjk3MXww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1744608257939-1ecbd90f1320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjB0b3lzJTIwY29sb3JmdWx8ZW58MXx8fHwxNzY3MjA2MTUyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      'https://images.unsplash.com/photo-1587559070757-f72a388edbba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBwbGF5aW5nJTIwdG95fGVufDF8fHx8MTc2NzI2Njc0MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    "description": '多种玩具组合，耐咬耐用，增进互动',
    "rating": 4.6,
    "sales": 856,
    "stock": 89,
    "specs": ['套装含：5件', '材质：天然橡胶', '适用：中小型犬', '耐咬等级：⭐⭐⭐⭐']
  },
  {
    "id": '3',
    "name": '舒适宠物床',
    "price": 198,
    "category": '用品',
    "image": 'https://images.unsplash.com/photo-1581888227599-779811939961?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBiZWR8ZW58MXx8fHwxNzY3MjY0NDQ0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    "images": [
      'https://images.unsplash.com/photo-1581888227599-779811939961?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBiZWR8ZW58MXx8fHwxNzY3MjY0NDQ0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1749703174207-257698ceb352?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBiZWQlMjBjb21mb3J0YWJsZXxlbnwxfHx8fDE3NjcyNjY3Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    "description": '柔软透气，可拆洗，让宠物睡得更香',
    "rating": 4.9,
    "sales": 623,
    "stock": 45,
    "specs": ['尺寸：80x60cm', '材质：记忆棉', '可拆洗', '颜色：灰色/棕色']
  },
  {
    "id": '4',
    "name": '高级猫粮',
    "price": 158,
    "category": '食品',
    "image": 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBwZXR8ZW58MXx8fHwxNjcxOTQwMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    "images": [
      'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBwZXR8ZW58MXx8fHwxNjcxOTQwMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1596854331442-3cf47265cefb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBmb29kJTIwcHJlbWl1bXxlbnwxfHx8fDE3NjcyNjY3NDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    "description": '低盐配方，呵护猫咪肾脏健康',
    "rating": 4.7,
    "sales": 982,
    "stock": 203,
    "specs": ['净含量：3kg', '适用：成年猫', '无谷配方', '保质期：12个月']
  },
  {
    "id": '5',
    "name": '智能自动喂食器',
    "price": 328,
    "category": '用品',
    "image": 'https://images.unsplash.com/photo-1582456891925-a53965520520?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nfGVufDF8fHx8MTc2NzI2NDQ0M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    "images": [
      'https://images.unsplash.com/photo-1582456891925-a53965520520?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nfGVufDF8fHx8MTc2NzI2NDQ0M3ww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1765110278433-7b0d294a1104?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbWF0aWMlMjBwZXQlMjBmZWVkZXJ8ZW58MXx8fHwxNjcyNjY3NDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    ],
    "description": 'APP远程控制，定时定量，出差无忧',
    "rating": 4.5,
    "sales": 445,
    "stock": 32,
    "specs": ['容量：6L', 'WiFi连接', '定时投喂', '支持语音录制']
  },
  {
    "id": '6',
    "name": '鸟笼套装',
    "price": 268,
    "category": '用品',
    "image": 'https://images.unsplash.com/photo-1634413102755-7f0857eba45b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJkJTIwY2FnZXxlbnwxfHx8fDE3NjcyNjQ0NDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    "description": '宽敞舒适，配件齐全，适合小型鸟类',
    "rating": 4.4,
    "sales": 312,
    "stock": 28,
    "specs": ['尺寸：50x40x60cm', '材质：不锈钢', '含配件：3件', '适用：鹦鹉/文鸟']
  },
  {
    "id": '7',
    "name": '宠物零食大礼包',
    "price": 88,
    "category": '食品',
    "image": 'https://images.unsplash.com/photo-1589924749359-9697080c3577?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjB0b3lzfGVufDF8fHx8MTc2NzE3Mjk3MXww&ixlib=rb-4.1.0&q=80&w=1080',
    "description": '多种口味，健康美味，训练奖励必备',
    "rating": 4.7,
    "sales": 1567,
    "stock": 345,
    "specs": ['净含量：500g', '口味：8种', '无添加剂', '独立包装']
  },
  {
    "id": '8',
    "name": '宠物外出背包',
    "price": 168,
    "category": '用品',
    "image": 'https://images.unsplash.com/photo-1581888227599-779811939961?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBiZWR8ZW58MXx8fHwxNzY3MjY0NDQ0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    "description": '透气舒适，便携设计，外出旅行好帮手',
    "rating": 4.6,
    "sales": 734,
    "stock": 67,
    "specs": ['承重：8kg', '透气网眼', '可扩展空间', '颜色：多色可选']
  },
  {
    "id": '9',
    "name": '猫咪项圈',
    "price": 39,
    "category": '用品',
    "image": 'https://images.unsplash.com/photo-1595232170847-da4cab9e63ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBjb2xsYXJ8ZW58MXx8fHwxNzY3MjY0NTM3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    "description": '安全铃铛设计，时尚又实用',
    "rating": 4.5,
    "sales": 892,
    "stock": 156,
    "specs": ['材质：尼龙', '可调节', '含铃铛', '反光条设计']
  },
  {
    "id": '10',
    "name": '观赏鱼饲料',
    "price": 45,
    "category": '食品',
    "image": 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcXVhcml1bSUyMGZpc2h8ZW58MXx8fHwxNzY3MjY0NTM3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    "description": '增色配方，适合各类热带鱼',
    "rating": 4.6,
    "sales": 543,
    "stock": 234,
    "specs": ['净含量：200g', '适用：热带鱼', '增色配方', '易消化']
  },
  {
    "id": '11',
    "name": '兔笼豪华套装',
    "price": 358,
    "category": '用品',
    "image": 'https://images.unsplash.com/photo-1611601361616-43a49bc718bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYWJiaXQlMjBodXRjaHxlbnwxfHx8fDE3NjcyNjQ1Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    "description": '双层设计，活动空间大，易清洁',
    "rating": 4.7,
    "sales": 234,
    "stock": 18,
    "specs": ['尺寸：90x60x80cm', '双层结构', '抽屉式底盘', '含食盆水壶']
  },
  {
    "id": '12',
    "name": '宠物美容工具套装',
    "price": 158,
    "category": '用品',
    "image": 'https://images.unsplash.com/photo-1625279138836-e7311d5c863a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBncm9vbWluZ3xlbnwxfHx8fDE3NjcyMzUzNjN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    "description": '专业级美容工具，在家也能DIY',
    "rating": 4.8,
    "sales": 678,
    "stock": 92,
    "specs": ['套装含：8件', '不锈钢材质', '含收纳包', '适合各种宠物']
  },
  {
    "id": '13',
    "name": '狗狗牵引绳',
    "price": 58,
    "category": '用品',
    "image": 'https://images.unsplash.com/photo-1621101164063-ba88826cb918?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBsZWFzaHxlbnwxfHx8fDE3NjcyNjQ1Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    "description": '自动伸缩，夜光反光，遛狗更安全',
    "rating": 4.6,
    "sales": 1123,
    "stock": 187,
    "specs": ['长度：5米', '自动伸缩', '反光材质', '承重：50kg']
  },
  {
    "id": '14',
    "name": '猫砂盆',
    "price": 128,
    "category": '用品',
    "image": 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBwZXR8ZW58MXx8fHwxNzY3MTk0MDE2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    "description": '全封闭设计，除臭防溅',
    "rating": 4.7,
    "sales": 567,
    "stock": 73,
    "specs": ['尺寸：50x40x40cm', '全封闭', '活性炭除臭', '易清洁']
  },
  {
    "id": '15',
    "name": '磨牙棒组合',
    "price": 35,
    "category": '玩具',
    "image": 'https://images.unsplash.com/photo-1589924749359-9697080c3577?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjB0b3lzfGVufDF8fHx8MTc2NzE3Mjk3MXww&ixlib=rb-4.1.0&q=80&w=1080',
    "description": '天然材质，保护牙齿健康',
    "rating": 4.5,
    "sales": 934,
    "stock": 267,
    "specs": ['材质：天然木材', '套装含：6根', '无添加', '适合幼犬']
  },
  {
    "id": '16',
    "name": '猫抓板',
    "price": 48,
    "category": '玩具',
    "image": 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBwZXR8ZW58MXx8fHwxNzY3MTk0MDE2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    "description": '瓦楞纸材质，保护家具从此开始',
    "rating": 4.6,
    "sales": 1456,
    "stock": 312,
    "specs": ['材质：瓦楞纸', '尺寸：45x20cm', '含猫薄荷', '环保材质']
  },
]

for p in products_data:
    db_product = models.Product(
        id=p["id"],
        name=p["name"],
        price=p["price"],
        category=p["category"],
        image=p["image"],
        description=p["description"],
        rating=p["rating"],
        sales=p["sales"],
        stock=p["stock"]
    )
    db.add(db_product)
    
    if "images" in p:
        for img_url in p["images"]:
            db_image = models.ProductImage(product_id=p["id"], url=img_url)
            db.add(db_image)
            
    if "specs" in p:
        for spec in p["specs"]:
            db_spec = models.ProductSpec(product_id=p["id"], spec=spec)
            db.add(db_spec)

db.commit()
db.close()
print("Data seeded successfully")
