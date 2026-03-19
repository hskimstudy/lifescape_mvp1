
import requests
import json

supabase_url = "https://exyswnijklijufwwvklf.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eXN3bmlqa2xpanVmd3d2a2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTgxMjYsImV4cCI6MjA4ODI3NDEyNn0.eB_QG3KcAib5Qb-e8H1RGl_-K7Crk-DZvdqbs-4O1o0"

def test_post_with_select():
    print("Testing POST with ?select=*...")
    url = f"{supabase_url}/rest/v1/inquiries?select=*"
    
    payload = {
        "name": "Test User Select",
        "email": "test_select@example.com",
        "message": "Testing POST with select param",
        "status": "pending"
    }
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_post_with_select()
