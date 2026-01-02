import requests
import json

BASE_URL = "http://localhost:8001/admin"

def test_auto_create_shipping():
    print("Testing Auto Create Shipping Flow...")
    
    # 1. Find an order that is NOT 'shipped' and preferably has no shipping record
    # For simplicity, let's just pick the first order that is 'pending' or 'paid'
    response = requests.get(f"{BASE_URL}/orders/?status=paid")
    if response.status_code != 200:
        print("Failed to fetch orders")
        return

    orders = response.json()['items']
    if not orders:
        print("No 'paid' orders found to test. Trying 'pending'...")
        response = requests.get(f"{BASE_URL}/orders/?status=pending")
        orders = response.json()['items']
        if not orders:
            print("No suitable orders found.")
            return

    target_order = orders[0]
    order_id = target_order['id']
    print(f"Target Order: {target_order['order_number']} ({order_id}), Status: {target_order['status']}")

    # 2. Update status to 'shipped'
    print(f"Updating order {order_id} status to 'shipped'...")
    response = requests.put(
        f"{BASE_URL}/orders/{order_id}/status",
        json={"status": "shipped"}
    )
    
    if response.status_code == 200:
        print("Order status updated successfully.")
    else:
        print(f"Failed to update order status: {response.text}")
        return

    # 3. Verify Shipping Record Created
    print(f"Checking for shipping record for order {order_id}...")
    response = requests.get(f"{BASE_URL}/shipping/order/{order_id}")
    
    if response.status_code == 200:
        shipping = response.json()
        print("Success! Shipping record found:")
        print(json.dumps(shipping, indent=2, ensure_ascii=False))
    elif response.status_code == 404:
        print("Failed: Shipping record NOT found.")
    else:
        print(f"Error checking shipping: {response.text}")

if __name__ == "__main__":
    test_auto_create_shipping()
