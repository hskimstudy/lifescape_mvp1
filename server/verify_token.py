from huggingface_hub import login, hf_hub_download
import os

token = os.getenv("HF_TOKEN")
try:
    login(token=token)
    print("Login call executed.")
    
    from huggingface_hub import HfApi
    api = HfApi(token=token)
    user_info = api.whoami()
    print(f"Token belongs to user: {user_info['name']}")
    
    path = hf_hub_download(repo_id="black-forest-labs/FLUX.1-Fill-dev", filename="config.json")
    print("SUCCESS: Model usage authorized.")
except Exception as e:
    print(f"FAILURE: {e}")
