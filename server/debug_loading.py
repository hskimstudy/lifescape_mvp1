from diffusers import DiffusionPipeline
import torch
import traceback

model_id = "black-forest-labs/FLUX.2-klein-4B"

print(f"Loading {model_id}...")
try:
    pipe = DiffusionPipeline.from_pretrained(
        model_id, 
        torch_dtype=torch.bfloat16, 
        trust_remote_code=True
    )
    print("Successfully loaded pipeline.")
except Exception:
    traceback.print_exc()
