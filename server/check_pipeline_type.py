
try:
    from diffusers import FluxControlNetImg2ImgPipeline
    print("SUCCESS: FluxControlNetImg2ImgPipeline exists!")
except ImportError:
    print("FAILURE: FluxControlNetImg2ImgPipeline does NOT exist.")
    
from diffusers import FluxControlNetPipeline
import inspect
sig = inspect.signature(FluxControlNetPipeline.__call__)
print(f"FluxControlNetPipeline strength support: {'strength' in sig.parameters}")
print(f"FluxControlNetPipeline image support: {'image' in sig.parameters}")
