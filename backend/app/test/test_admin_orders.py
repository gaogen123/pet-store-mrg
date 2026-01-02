import requests
import json

BASE_URL = "http://localhost:8001/admin/orders"

def test_get_orders():
    print("Testing GET /admin/orders/...")
    response = requests.get(f"{BASE_URL}/")
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Total orders: {data['total']}")
        if data['items']:
            print(f"First order ID: {data['items'][0]['id']}")
            return data['items'][0]['id']
    else:
        print(f"Failed: {response.status_code} - {response.text}")
    return None

def test_get_order_detail(order_id):
    if not order_id:
        print("Skipping detail test (no order ID)")
        return

    print(f"Testing GET /admin/orders/{order_id}...")
    response = requests.get(f"{BASE_URL}/{order_id}")
    if response.status_code == 200:
        print("Success! Order details fetched.")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"Failed: {response.status_code} - {response.text}")

def test_update_order_status(order_id):
    if not order_id:
        print("Skipping update test (no order ID)")
        return

    print(f"Testing PUT /admin/orders/{order_id}/status...")
    # Update to 'shipped'
    response = requests.put(
        f"{BASE_URL}/{order_id}/status",
        json={"status": "shipped"}
    )
    if response.status_code == 200:
        print("Success! Status updated to 'shipped'.")
    else:
        print(f"Failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    order_id = test_get_orders()
    test_get_order_detail(order_id)
    # Be careful with update test on real data, maybe skip for now or use a specific test order
    # test_update_order_status(order_id) 
