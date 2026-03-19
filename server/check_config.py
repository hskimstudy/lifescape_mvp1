from huggingface_hub import hf_hub_download
import json
import os

token = os.getenv("HF_TOKEN")
try:
    print("Downloading model_index.json...")
    path = hf_hub_download(repo_id="black-forest-labs/FLUX.2-klein-4B", filename="model_index.json", token=token)
    with open(path, 'r') as f:
        data = json.load(f)
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
