
import torch
from diffusers import AutoPipelineForImage2Image

BASE_MODEL = "black-forest-labs/FLUX.2-klein-base-4B"

print(f"Loading {BASE_MODEL} normally to check classes...")
pipe = AutoPipelineForImage2Image.from_pretrained(
    BASE_MODEL,
    torch_dtype=torch.bfloat16,
    trust_remote_code=True
)

print(f"Transformer Class: {type(pipe.transformer)}")
print(f"Text Encoder Class: {type(pipe.text_encoder)}")
if hasattr(pipe, "text_encoder_2"):
    print(f"Text Encoder 2 Class: {type(pipe.text_encoder_2)}")
    
print("Transformer Config keys relevant to arch:")
print(pipe.transformer.config)

import sys
sys.exit(0)
