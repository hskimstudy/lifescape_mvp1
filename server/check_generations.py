import requests
import json
from datetime import datetime, timedelta

supabase_url = "https://exyswnijklijufwwvklf.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eXN3bmlqa2xpanVmd3d2a2xmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY5ODEyNiwiZXhwIjoyMDg4Mjc0MTI2fQ.AgcrwZTRfBOF9uM3Bg_e3daGlmLUyPg4yXTktDnWzo0"

def check_or_query():
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }

    seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    one_year_ago = (datetime.utcnow() - timedelta(days=365)).isoformat()

    user_id = "adf89ec6-9c06-4602-a330-ff30a05877de" # From the previous fetch
    
    # The query used in dbFetch
    or_query = f"or=(and(is_favorite.eq.false,created_at.gte.{seven_days_ago}),and(is_favorite.eq.true,created_at.gte.{one_year_ago}))"
    
    url = f"{supabase_url}/rest/v1/generations?select=*&user_id=eq.{user_id}&{or_query}"

    print(f"Testing URL: {url}")
    res = requests.get(url, headers=headers)
    
    if res.ok:
        data = res.json()
        print(f"Total generations found with OR query: {len(data)}")
        if len(data) > 0:
            print("First item:")
            print(json.dumps(data[0], indent=2))
    else:
        print(f"Failed: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    check_or_query()
