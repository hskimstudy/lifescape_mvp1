from diffusers import FluxPipeline
import torch
import traceback

model_id = "black-forest-labs/FLUX.2-klein-4B"

print(f"Loading {model_id} with FluxPipeline (ignoring secondary encoder)...")
try:
    pipe = FluxPipeline.from_pretrained(
        model_id, 
        torch_dtype=torch.bfloat16,
        text_encoder_2=None,
        tokenizer_2=None
    )
    print("Successfully loaded FluxPipeline with None components.")
except Exception:
    traceback.print_exc()
