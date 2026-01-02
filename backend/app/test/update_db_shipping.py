from app.database import admin_engine, AdminBase
from app.models import Shipping

print("Creating shipping table in admin database...")
AdminBase.metadata.create_all(bind=admin_engine)
print("Done!")
