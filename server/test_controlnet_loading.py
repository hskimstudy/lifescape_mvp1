
import torch
import sys
import os

sys.path.append(os.getcwd())

try:
    print("Imports...")
    from diffusers import AutoPipelineForImage2Image, FluxControlNetModel
    from diffusers.utils import load_image
    
    BASE_MODEL = "black-forest-labs/FLUX.2-klein-base-4B"
    CONTROLNET_MODEL = "instantX/FLUX.1-dev-ControlNet-Canny" # Standard Flux ControlNet
    
    print(f"Loading ControlNet from {CONTROLNET_MODEL}...")
    # Attempt to load ControlNet
    # Note: If Flux2Klein uses a different transformer/embedding dimension, this will fail or mismatch.
    controlnet = FluxControlNetModel.from_pretrained(
        CONTROLNET_MODEL,
        torch_dtype=torch.bfloat16
    )
    print("ControlNet loaded successfully.")

    print(f"Loading Base Pipeline {BASE_MODEL} with ControlNet...")
    # Attempt to load pipeline with ControlNet
    try:
        pipe = AutoPipelineForImage2Image.from_pretrained(
            BASE_MODEL,
            controlnet=controlnet,
            torch_dtype=torch.bfloat16,
            trust_remote_code=True
        )
        print("Pipeline loaded WITH ControlNet argument.")
    except Exception as e:
        print(f"Failed to load pipeline WITH controlnet arg: {e}")
        print("Attempting to load without arg, then checking if we can attach it...")
        pipe = AutoPipelineForImage2Image.from_pretrained(
            BASE_MODEL,
            torch_dtype=torch.bfloat16,
            trust_remote_code=True
        )
        if hasattr(pipe, "register_modules"):
            print("Pipeline has register_modules. Attempting to register controlnet...")
            try:
                pipe.register_modules(controlnet=controlnet)
                print("ControlNet registered manually.")
            except Exception as e:
                print(f"Manual registration failed: {e}")
        else:
            print("Pipeline does NOT support register_modules or controlnet injection.")

    # Check if pipe actually has controlnet attribute now
    if hasattr(pipe, "controlnet"):
        print(f"SUCCESS: Pipeline has 'controlnet' attribute. Type: {type(pipe.controlnet)}")
    else:
        print("FAILURE: Pipeline has NO 'controlnet' attribute.")

except Exception as e:
    print(f"FATAL ERROR: {e}")
    import traceback
    traceback.print_exc()
