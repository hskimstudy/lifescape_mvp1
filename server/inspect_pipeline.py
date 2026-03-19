import torch
from diffusers import FluxPipeline
import inspect

try:
    print("Loading with FluxPipeline (explicit None for T5)...")
    pipe = FluxPipeline.from_pretrained(
        "black-forest-labs/FLUX.2-klein-4B",
        trust_remote_code=True,
        torch_dtype=torch.bfloat16,
        text_encoder_2=None,
        tokenizer_2=None
    )
    print(f"Pipeline Class: {type(pipe).__name__}")
    
    sig = inspect.signature(pipe.__call__)
    print(f"Call Signature: {sig}")
    
    if "image" in sig.parameters:
        print("SUCCESS: Pipeline accepts 'image' argument.")
    elif "init_image" in sig.parameters:
        print("SUCCESS: Pipeline accepts 'init_image' argument.")
    else:
        print("WARNING: Pipeline MIGHT NOT support Img2Img directly.")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
