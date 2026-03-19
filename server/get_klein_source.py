import torch
from diffusers import DiffusionPipeline
import inspect

BASE_MODEL = "black-forest-labs/FLUX.2-klein-base-4B"

pipe = DiffusionPipeline.from_pretrained(BASE_MODEL, torch_dtype=torch.bfloat16, trust_remote_code=True)

try:
    source = inspect.getsource(pipe.__class__)
    with open("klein_pipeline_source.py", "w", encoding="utf-8") as f:
        f.write(source)
    print("Successfully saved pipeline source to klein_pipeline_source.py")
except Exception as e:
    print(f"Error getting source: {e}")
