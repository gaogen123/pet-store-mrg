import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8001/admin/shipping"

def test_shipping_crud():
    print("Testing Shipping CRUD...")
    
    # 1. Create
    order_id = f"test_order_{int(datetime.now().timestamp())}"
    payload = {
        "order_id": order_id,
        "tracking_number": "SF1234567890",
        "carrier": "SF Express"
    }
    print(f"Creating shipping for order {order_id}...")
    response = requests.post(f"{BASE_URL}/", json=payload)
    if response.status_code == 200:
        data = response.json()
        print(f"Created: {data}")
        shipping_id = data['id']
    else:
        print(f"Create failed: {response.text}")
        return

    # 2. Read List
    print("Listing shippings...")
    response = requests.get(f"{BASE_URL}/")
    if response.status_code == 200:
        print(f"List count: {len(response.json())}")
    
    # 3. Read Detail
    print(f"Reading shipping {shipping_id}...")
    response = requests.get(f"{BASE_URL}/{shipping_id}")
    if response.status_code == 200:
        print("Read success")

    # 4. Update
    print(f"Updating shipping {shipping_id}...")
    response = requests.put(f"{BASE_URL}/{shipping_id}", json={"status": "delivered"})
    if response.status_code == 200:
        print(f"Updated: {response.json()['status']}")

    # 5. Delete
    print(f"Deleting shipping {shipping_id}...")
    response = requests.delete(f"{BASE_URL}/{shipping_id}")
    if response.status_code == 200:
        print("Deleted success")

if __name__ == "__main__":
    test_shipping_crud()
