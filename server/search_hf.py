from huggingface_hub import HfApi
try:
    api = HfApi()
    print("Searching for models from 'black-forest-labs'...")
    models = api.list_models(author="black-forest-labs", limit=100)
    found = False
    for m in models:
        print(f" - {m.modelId}")
        if "klein" in m.modelId.lower() or "flux.2" in m.modelId.lower():
            found = True
            
    print("\nSearching globally for 'klein' and 'flux'...")
    models_global = api.list_models(search="flux klein", limit=10)
    for m in models_global:
        print(f" - {m.modelId}")

except Exception as e:
    print(f"Error: {e}")
