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
    pipe.to("cuda")
    print("Successfully loaded pipeline. Running inference...")
    
    # Run inference with simple prompt
    image = pipe("a photo of a cat", num_inference_steps=4, guidance_scale=3.5).images[0]
    image.save("test_output_v3.png")
    print("Inference successful. Saved test_output_v3.png")

except Exception:
    traceback.print_exc()
