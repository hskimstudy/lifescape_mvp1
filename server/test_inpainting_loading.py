
import torch
import sys
import os

# Add current directory to sys.path to ensure imports work if needed, though we use diffusers directly
sys.path.append(os.getcwd())

try:
    print("Loading AutoPipelineForImage2Image...")
    from diffusers import AutoPipelineForImage2Image, AutoPipelineForInpainting
    
    BASE_MODEL = "black-forest-labs/FLUX.2-klein-base-4B"
    
    print(f"Loading base pipeline from {BASE_MODEL}...")
    pipe = AutoPipelineForImage2Image.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.bfloat16,
        trust_remote_code=True
    )
    print("Base pipeline loaded.")
    
    import inspect
    sig = inspect.signature(pipe.__call__)
    print(f"Pipeline Call Signature: {sig}")
    
    if 'mask_image' in sig.parameters:
        print("SUCCESS: Pipeline supports mask_image natively!")
    else:
        print("FAILURE: Pipeline does NOT support mask_image.")

    # print("Converting to Inpainting pipeline...")
    # pipe = AutoPipelineForInpainting.from_pipe(pipe)

    print(f"FATAL ERROR: {e}")
    import traceback
    traceback.print_exc()
