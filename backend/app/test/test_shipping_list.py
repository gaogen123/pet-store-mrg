import requests
import json

BASE_URL = "http://localhost:8001/admin/shipping"

def test_shipping_list_with_orders():
    print("Testing Shipping List with Orders...")
    response = requests.get(f"{BASE_URL}/")
    if response.status_code == 200:
        data = response.json()
        print(f"Total: {data.get('total')}")
        items = data.get('items', [])
        print(f"Items count: {len(items)}")
        if items:
            print("First item sample:")
            print(json.dumps(items[0], indent=2, ensure_ascii=False))
            if 'order' in items[0] and items[0]['order']:
                print("Order details found!")
            else:
                print("WARNING: Order details missing!")
    else:
        print(f"Failed: {response.text}")

if __name__ == "__main__":
    test_shipping_list_with_orders()
