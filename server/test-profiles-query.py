import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('c:/Users/lifes/Projects/lifescapemvp1/client/.env')

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

print("\nTrying to query profiles with ordering by created_at...")
try:
    response = supabase.table("profiles").select("*").order("created_at", desc=True).execute()
    print("Query succeeded!")
except Exception as e:
    print("Query failed! Error details:", e)
