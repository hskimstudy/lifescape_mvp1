from huggingface_hub import list_repo_files
try:
    files = list_repo_files("black-forest-labs/FLUX.2-klein-4B")
    for f in files:
        print(f)
except Exception as e:
    print(f"Error: {e}")
