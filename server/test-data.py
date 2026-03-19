import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('c:/Users/lifes/Projects/lifescapemvp1/client/.env')

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

print("\n--- Payments ---")
try:
    response = supabase.table("payments").select("*").execute()
    print(f"Payments Count: {len(response.data)}")
    if len(response.data) > 0:
        print("Sample payment:", response.data[0])
except Exception as e:
    print("Payments query failed:", e)

print("\n--- Generations ---")
try:
    response = supabase.table("generations").select("*").execute()
    print(f"Generations Count: {len(response.data)}")
    if len(response.data) > 0:
        print("Sample generation (URL):", response.data[0].get('url'))
except Exception as e:
    print("Generations query failed:", e)
