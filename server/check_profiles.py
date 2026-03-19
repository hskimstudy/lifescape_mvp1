import requests
import json
import os

supabase_url = "https://exyswnijklijufwwvklf.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eXN3bmlqa2xpanVmd3d2a2xmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY5ODEyNiwiZXhwIjoyMDg4Mjc0MTI2fQ.AgcrwZTRfBOF9uM3Bg_e3daGlmLUyPg4yXTktDnWzo0"

def check_profiles():
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }

    print("Fetching profiles to verify credits...")
    res = requests.get(f"{supabase_url}/rest/v1/profiles?select=email,credits", headers=headers)
    
    if res.ok:
        profiles = res.json()
        print(json.dumps(profiles, indent=2))
    else:
        print(f"Failed: {res.text}")

if __name__ == "__main__":
    check_profiles()
