
import torch
from diffusers import AutoPipelineForImage2Image, FluxControlNetModel

BASE_MODEL = "black-forest-labs/FLUX.2-klein-base-4B"

print(f"Loading {BASE_MODEL}...")
pipe = AutoPipelineForImage2Image.from_pretrained(
    BASE_MODEL,
    torch_dtype=torch.bfloat16,
    trust_remote_code=True
)

def count_params(model):
    return sum(p.numel() for p in model.parameters())

print(f"Transformer Params: {count_params(pipe.transformer) / 1e9:.2f} B")
if hasattr(pipe, "text_encoder"):
    print(f"Text Encoder Params: {count_params(pipe.text_encoder) / 1e9:.2f} B")
if hasattr(pipe, "text_encoder_2"):
    print(f"Text Encoder 2 Params: {count_params(pipe.text_encoder_2) / 1e9:.2f} B")

print("Loading ControlNet...")
cn = FluxControlNetModel.from_pretrained(
    "instantX/FLUX.1-dev-ControlNet-Canny",
    torch_dtype=torch.bfloat16
)
print(f"ControlNet Params: {count_params(cn) / 1e9:.2f} B")

import sys
sys.exit(0)
