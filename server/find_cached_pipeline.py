import os

search_root = "/root/.cache/huggingface/modules"
print(f"Searching in {search_root}...")

if not os.path.exists(search_root):
    print("Cache directory not found.")
    # Try finding where cache is
    import huggingface_hub
    print(f"HF Cache is at: {huggingface_hub.constants.HF_HOME}")
    exit(1)

found_files = []
for root, dirs, files in os.walk(search_root):
    for file in files:
        if file.endswith(".py"):
            full_path = os.path.join(root, file)
            # Check if it contains "Flux2KleinPipeline"
            try:
                with open(full_path, 'r', errors='ignore') as f:
                    content = f.read()
                    if "Flux2KleinPipeline" in content:
                        print(f"FOUND CLASS DEFINITION IN: {full_path}")
                        found_files.append(full_path)
            except:
                pass

if not found_files:
    print("No file containing Flux2KleinPipeline found.")
else:
    print(f"Found {len(found_files)} files.")
