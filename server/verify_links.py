
import requests
import json

supabase_url = "https://exyswnijklijufwwvklf.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eXN3bmlqa2xpanVmd3d2a2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTgxMjYsImV4cCI6MjA4ODI3NDEyNn0.eB_QG3KcAib5Qb-e8H1RGl_-K7Crk-DZvdqbs-4O1o0"

def verify_inquiry_links():
    print("Verifying inquiry to user_id links...")
    # Fetch all inquiries to see if any have user_id
    url = f"{supabase_url}/rest/v1/inquiries?select=id,user_id,email,name&limit=20"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            linked_count = sum(1 for inc in data if inc.get('user_id') is not None)
            total = len(data)
            print(f"Total checked: {total}, Linked to user_id: {linked_count}")
            for inq in data:
                if inq.get('user_id'):
                    print(f"LINKED: Inq ID {inq['id']} -> UserID {inq['user_id']} ({inq['email']})")
                else:
                    print(f"UNLINKED: Inq ID {inq['id']} ({inq['email']})")
        else:
            print(f"Error: {response.status_code} {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_inquiry_links()
