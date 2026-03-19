
import torch
import sys
import os

sys.path.append(os.getcwd())

try:
    print("Loading AutoPipelineForImage2Image to get components...")
    from diffusers import AutoPipelineForImage2Image, FluxControlNetPipeline, FluxControlNetModel
    
    BASE_MODEL = "black-forest-labs/FLUX.2-klein-base-4B"
    
    # Load original pipeline to get components
    base_pipe = AutoPipelineForImage2Image.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.bfloat16,
        trust_remote_code=True
    )
    print("Base pipeline loaded.")
    
    # Load ControlNet
    print("Loading ControlNet (Canny)...")
    controlnet = FluxControlNetModel.from_pretrained(
        "instantX/FLUX.1-dev-ControlNet-Canny",
        torch_dtype=torch.bfloat16
    )
    print("ControlNet loaded.")

    print("Attempting to assemble FluxControlNetPipeline with Klein components...")
    # Assemble new pipeline
    # Note: FluxControlNetPipeline requires specific components.
    # We map base_pipe components to it.
    
    # Check what components base_pipe has
    print(f"Base Pipe Components: {base_pipe.config.keys()}")
    
    try:
        cn_pipe = FluxControlNetPipeline(
            transformer=base_pipe.transformer,
            scheduler=base_pipe.scheduler,
            vae=base_pipe.vae,
            text_encoder=base_pipe.text_encoder,
            text_encoder_2=None, # Klein might not have this
            tokenizer=base_pipe.tokenizer,
            tokenizer_2=None, # Klein might not have this
            controlnet=controlnet,
        )
        print("FluxControlNetPipeline assembled successfully!")
        
        # Test a dummy generation call to check signature compatibility
        print("Testing dummy generation call (dry run)...")
        # We won't actually run it fully to save time, just check if it accepts args
        import inspect
        sig = inspect.signature(cn_pipe.__call__)
        if 'control_image' in sig.parameters:
             print("SUCCESS: Assembled pipeline accepts control_image.")
        else:
             print("FAILURE: Assembled pipeline does NOT accept control_image.")

    except Exception as e:
        print(f"Assembly Failed: {e}")
        import traceback
        traceback.print_exc()

except Exception as e:
    print(f"FATAL ERROR: {e}")
    import traceback
    traceback.print_exc()
