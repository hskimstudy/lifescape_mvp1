
import requests
import json

supabase_url = "https://exyswnijklijufwwvklf.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eXN3bmlqa2xpanVmd3d2a2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTgxMjYsImV4cCI6MjA4ODI3NDEyNn0.eB_QG3KcAib5Qb-e8H1RGl_-K7Crk-DZvdqbs-4O1o0"

def check_recent_inquiries():
    print("Checking recent inquiries with profiles...")
    url = f"{supabase_url}/rest/v1/inquiries?select=*,profiles(email)&order=created_at.desc&limit=5"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            for inq in data:
                print(f"ID: {inq['id']}, UserID: {inq['user_id']}, Name: {inq['name']}, Profile: {inq.get('profiles')}")
        else:
            print(f"Error: {response.status_code} {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_recent_inquiries()
