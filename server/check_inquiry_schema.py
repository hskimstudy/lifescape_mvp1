
import requests
import json

supabase_url = "https://exyswnijklijufwwvklf.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eXN3bmlqa2xpanVmd3d2a2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTgxMjYsImV4cCI6MjA4ODI3NDEyNn0.eB_QG3KcAib5Qb-e8H1RGl_-K7Crk-DZvdqbs-4O1o0"

def check_schema():
    print(f"Checking 'inquiries' table at {supabase_url}...")
    url = f"{supabase_url}/rest/v1/inquiries?select=*"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Range": "0-0",
        "Prefer": "count=exact"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200 or response.status_code == 206:
            data = response.json()
            if data:
                print("Found columns:", list(data[0].keys()))
            else:
                print("Table is empty, checking OpenAPI spec for columns...")
                openapi_url = f"{supabase_url}/rest/v1/"
                openapi_resp = requests.get(openapi_url, headers=headers)
                if openapi_resp.status_code == 200:
                    spec = openapi_resp.json()
                    inquiry_props = spec.get('definitions', {}).get('inquiries', {}).get('properties', {})
                    if inquiry_props:
                        print("Columns from OpenAPI:", list(inquiry_props.keys()))
                    else:
                        print("Could not find 'inquiries' properties in OpenAPI spec.")
                else:
                    print(f"Failed to get OpenAPI spec: {openapi_resp.status_code}")
        else:
            print(f"Failed to fetch: {response.status_code} {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
