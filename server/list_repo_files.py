from huggingface_hub import HfApi
try:
    api = HfApi()
    print("Listing files in 'black-forest-labs/FLUX.2-klein-4B'...")
    files = api.list_repo_files("black-forest-labs/FLUX.2-klein-4B")
    for f in files:
        print(f" - {f}")
except Exception as e:
    print(f"Error: {e}")
