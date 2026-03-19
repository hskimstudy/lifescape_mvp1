import torch
from diffusers import FluxPipeline, FluxImg2ImgPipeline
import sys

def check_gpu():
    if torch.cuda.is_available():
        print(f"CUDA Available: {torch.cuda.get_device_name(0)}")
        print(f"Memory Allocated: {torch.cuda.memory_allocated() / 1024**3:.2f} GB")
        print(f"Memory Reserved: {torch.cuda.memory_reserved() / 1024**3:.2f} GB")
    else:
        print("CUDA NOT AVAILABLE")

try:
    print("Step 1: Importing libraries...")
    check_gpu()

    print("\nStep 2: Loading FluxPipeline (bfloat16)...")
    pipe = FluxPipeline.from_pretrained(
        "black-forest-labs/FLUX.2-klein-4B",
        torch_dtype=torch.bfloat16,
        trust_remote_code=True
    )
    print("FluxPipeline loaded successfully.")
    check_gpu()

    print("\nStep 3: Converting to Img2ImgPipeline...")
    img2img_pipe = FluxImg2ImgPipeline.from_pipe(pipe)
    print("Conversion successful.")
    check_gpu()

    print("\nStep 4: Moving to CUDA...")
    img2img_pipe.to("cuda")
    print("Moved to CUDA successfully.")
    check_gpu()

    print("\nSUCCESS: Model is ready.")

except Exception as e:
    print(f"\nCRITICAL ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
