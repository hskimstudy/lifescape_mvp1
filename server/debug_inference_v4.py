from diffusers import FluxImg2ImgPipeline
from diffusers.utils import load_image
import torch
import traceback

model_id = "black-forest-labs/FLUX.2-klein-4B"
image_path = "/workspace/mvp/server/test_image.jpg"

print(f"Loading {model_id} with FluxImg2ImgPipeline...")
try:
    pipe = FluxImg2ImgPipeline.from_pretrained(
        model_id, 
        torch_dtype=torch.bfloat16,
        text_encoder_2=None,
        tokenizer_2=None
    )
    pipe.to("cuda")
    print("Successfully loaded FluxImg2ImgPipeline.")
    
    init_image = load_image(image_path).resize((512, 512))
    
    print("Running inference...")
    image = pipe(
        prompt="a photo of a cat", 
        image=init_image,
        num_inference_steps=4, 
        guidance_scale=3.5,
        strength=0.8
    ).images[0]
    
    image.save("test_output_v4.png")
    print("Inference successful. Saved test_output_v4.png")

except Exception:
    traceback.print_exc()
