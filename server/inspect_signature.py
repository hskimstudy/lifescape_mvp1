from diffusers import DiffusionPipeline
import inspect
import torch

try:
    print("Loading FLUX.2-klein-4B to inspect signature...")
    pipe = DiffusionPipeline.from_pretrained(
        "black-forest-labs/FLUX.2-klein-4B",
        torch_dtype=torch.bfloat16,
        trust_remote_code=True
    )
    print(f"Pipeline Type: {type(pipe)}")
    sig = inspect.signature(pipe.__call__)
    print(f"Signature: {sig}")
    
    # Check if 'image' or 'init_image' is in signature
    params = sig.parameters.keys()
    print(f"Parameters: {list(params)}")

except Exception as e:
    print(f"Error: {e}")
