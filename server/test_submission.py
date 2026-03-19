
import requests
import json

supabase_url = "https://exyswnijklijufwwvklf.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eXN3bmlqa2xpanVmd3d2a2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTgxMjYsImV4cCI6MjA4ODI3NDEyNn0.eB_QG3KcAib5Qb-e8H1RGl_-K7Crk-DZvdqbs-4O1o0"

def test_submission():
    print("Testing inquiry submission...")
    url = f"{supabase_url}/rest/v1/inquiries"
    
    # Try with user_id = null first to eliminate FK issues
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "message": "[문의유형: 상세 페이지 제작]\n[업체명: 테스트업체]\n\n내용:\n테스트 문의입니다.",
        "user_id": None,
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
        
        if response.status_code != 201:
            print("\nRetrying without user_id field at all...")
            del payload["user_id"]
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_submission()
