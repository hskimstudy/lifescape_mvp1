import torch
from diffusers import DiffusionPipeline, FluxImg2ImgPipeline
import inspect
import sys

BASE_MODEL = "black-forest-labs/FLUX.2-klein-base-4B"

print("--- Testing DiffusionPipeline ---")
try:
    pipe1 = DiffusionPipeline.from_pretrained(BASE_MODEL, torch_dtype=torch.bfloat16, trust_remote_code=True)
    print(f"Pipeline Type: {type(pipe1)}")
    
    sig = inspect.signature(pipe1.__call__)
    params = list(sig.parameters.keys())
    print(f"Parameters: {params}")
    
    if 'image' in params:
        print("image is present in DiffusionPipeline")
    if 'strength' in params:
        print("strength is present in DiffusionPipeline")
        
except Exception as e:
    print(f"Error loading DiffusionPipeline: {e}")

print("\n--- Testing FluxImg2ImgPipeline ---")
try:
    pipe2 = FluxImg2ImgPipeline.from_pretrained(BASE_MODEL, torch_dtype=torch.bfloat16, trust_remote_code=True)
    print(f"Pipeline Type: {type(pipe2)}")
    
    sig2 = inspect.signature(pipe2.__call__)
    params2 = list(sig2.parameters.keys())
    print(f"Parameters: {params2}")
    
    if 'image' in params2:
        print("image is present in FluxImg2ImgPipeline")
    if 'strength' in params2:
        print("strength is present in FluxImg2ImgPipeline")

except Exception as e:
    print(f"Error loading FluxImg2ImgPipeline: {e}")
