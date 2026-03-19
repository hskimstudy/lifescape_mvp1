import requests
import json
import os

# You may need to provide the actual service role key if RLS is the issue
supabase_url = "https://exyswnijklijufwwvklf.supabase.co"
# Using the service_role key to simulate the admin request
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eXN3bmlqa2xpanVmd3d2a2xmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY5ODEyNiwiZXhwIjoyMDg4Mjc0MTI2fQ.AgcrwZTRfBOF9uM3Bg_e3daGlmLUyPg4yXTktDnWzo0"

def test_credit_update():
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    # First, let's just get a profile to see if we can read them
    print("Fetching a profile to test read access...")
    res = requests.get(f"{supabase_url}/rest/v1/profiles?select=*", headers=headers)
    if not res.ok:
        print(f"Failed to read profiles: {res.text}")
        return
    
    profiles = res.json()
    if not profiles:
        print("No profiles found or access denied.")
        return
    
    # Let's try to update the first profile's credits
    target_profile = profiles[0]
    target_id = target_profile.get('id')
    current_credits = target_profile.get('credits', 0)
    new_credits = current_credits + 1
    
    print(f"\nAttempting to update credits for profile {target_id} from {current_credits} to {new_credits}...")
    
    update_data = {"credits": new_credits}
    update_res = requests.patch(f"{supabase_url}/rest/v1/profiles?id=eq.{target_id}", headers=headers, json=update_data)
    
    print(f"Response Status: {update_res.status_code}")
    print(f"Response Body: {update_res.text}")

if __name__ == "__main__":
    test_credit_update()
