import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('c:/Users/lifes/Projects/lifescapemvp1/client/.env')

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

print("\nTrying to insert a test profile...")
try:
    dummy_id = '22222222-3333-4444-5555-666666666666'
    insert_response = supabase.table("profiles").upsert({
        "id": dummy_id,
        "email": "test_insert2@example.com"
    }).execute()
    
    print("Insert succeeded!", insert_response.data)
    
    # Clean up
    supabase.table("profiles").delete().eq("id", dummy_id).execute()
    print("Cleaned up dummy profile.")
except Exception as e:
    print("Insert failed! Error details:", e)
