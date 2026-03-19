from diffusers import FluxPipeline
import torch
import traceback

model_id = "black-forest-labs/FLUX.2-klein-4B"

print(f"Loading {model_id} with FluxPipeline...")
try:
    pipe = FluxPipeline.from_pretrained(
        model_id, 
        torch_dtype=torch.bfloat16
        # Removed trust_remote_code=True to force standard pipeline
    )
    print("Successfully loaded FluxPipeline.")
except Exception:
    traceback.print_exc()
