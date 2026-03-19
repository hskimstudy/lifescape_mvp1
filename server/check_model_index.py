from huggingface_hub import hf_hub_download
import json
import os

try:
    path = hf_hub_download(repo_id="black-forest-labs/FLUX.2-klein-4B", filename="model_index.json")
    with open(path, 'r') as f:
        print(json.load(f))
except Exception as e:
    print(f"Error: {e}")
