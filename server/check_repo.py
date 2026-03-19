from huggingface_hub import list_repo_files
import os

token = os.getenv("HF_TOKEN")
if not token:
    # Try generic load from cache
    try:
        from huggingface_hub import HfFolder
        token = HfFolder.get_token()
    except:
        pass

try:
    print(f"Checking repo with token: {token[:4]}..." if token else "Checking repo without token...")
    files = list_repo_files("black-forest-labs/FLUX.2-klein-4B", token=token)
    print("Repo contents:")
    for f in files:
        print(f)
except Exception as e:
    print(f"Error: {e}")
