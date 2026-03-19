import torch
from diffusers import FluxImg2ImgPipeline
from diffusers.utils import load_image
import traceback
import os

model_id = 'black-forest-labs/FLUX.2-klein-4B'
image_path = '/workspace/mvp/server/test_image.jpg'

print(f'Loading {model_id} with device_map="cuda"...')
try:
    # Use the 'cuda' strategy explicitly
    pipe = FluxImg2ImgPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.bfloat16,
        device_map="cuda",
        text_encoder_2=None,
        tokenizer_2=None
    )
    print('Successfully loaded with device_map="cuda".')

    if os.path.exists(image_path):
        init_image = load_image(image_path).resize((512, 512))

        print('Running inference...')
        image = pipe(
            prompt='a photo of a luxury architectural room',
            image=init_image,
            num_inference_steps=8,
            guidance_scale=1.8,
            strength=0.8
        ).images[0]

        image.save('test_output_v9.png')
        print('Inference successful. Saved test_output_v9.png')
    else:
        print(f"Image path {image_path} not found. Skipping inference.")

except Exception:
    traceback.print_exc()
