from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
import torch
import torch.nn.functional as F

import sys
import types

# Fix for hardware backends that might be missing or broken in older torch versions
class CatchAllMock(types.ModuleType):
    def __init__(self, name):
        super().__init__(name)
    def is_available(self): return False
    def device_count(self): return 0
    def empty_cache(self): pass
    def manual_seed(self, *args, **kwargs): return self
    def __getattr__(self, name): return self
    def __call__(self, *args, **kwargs): return self

def mock_module(name):
    m = CatchAllMock(name)
    sys.modules[name] = m
    return m

# Fix for missing modules/attributes in older torch versions
try:
    import torch.distributed as dist_m
except ImportError:
    dist_m = mock_module("torch.distributed")
    torch.distributed = dist_m

for backend in ["xpu", "mps", "compiler"]:
    if not hasattr(torch, backend):
        setattr(torch, backend, CatchAllMock(backend))

if not hasattr(torch.backends, "mps"):
    torch.backends.mps = CatchAllMock("mps")

# Fix for missing float8 types
for dtype in ["float8_e4m3fn", "float8_e5m2"]:
    if not hasattr(torch, dtype):
        setattr(torch, dtype, torch.float32)

# Nested mocks for distributed
for sub in ["device_mesh", "distributed_c10d", "all_collectives", "collectives", "rendezvous", "_functional_collectives"]:
    if not hasattr(dist_m, sub):
        sm = mock_module(f"torch.distributed.{sub}")
        setattr(dist_m, sub, sm)

# DeviceMesh needs to be a class
class MockDeviceMesh:
    def __init__(self, *args, **kwargs): pass
    def __enter__(self): return self
    def __exit__(self, *args): pass

dist_m.device_mesh.DeviceMesh = MockDeviceMesh

from typing import List, Optional

# Monkeypatch scaled_dot_product_attention to handle 'enable_gqa' on older torch versions
_orig_sdpa = F.scaled_dot_product_attention
def _patched_sdpa(*args, **kwargs):
    kwargs.pop("enable_gqa", None)
    return _orig_sdpa(*args, **kwargs)
F.scaled_dot_product_attention = _patched_sdpa

import sys
import types

# (Patches removed for Cloud Deployment)

from diffusers import FluxPipeline, FluxImg2ImgPipeline, DiffusionPipeline
from PIL import Image
import io
import os
import uuid

from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Mount the 'generated' folder so files can be accessed via HTTP
os.makedirs("generated", exist_ok=True)
app.mount("/generated", StaticFiles(directory="generated"), name="generated")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    origin = request.headers.get("origin")
    print(f"DEBUG: Incoming {request.method} request to {request.url.path} from origin: {origin}")
    response = await call_next(request)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_detail = exc.errors()
    print(f"DEBUG: Validation Error detected -> {error_detail}")
    return JSONResponse(
        status_code=422,
        content={"detail": error_detail, "message": "Field validation failed. Check your request body."},
    )

# Global pipeline variable
pipe = None
# Use Flux 2 Klein 4B (Official 4B Efficiency Model by Black Forest Labs)
BASE_MODEL = "black-forest-labs/FLUX.2-klein-4B"
LORA_PATH = "./models" 

@app.on_event("startup")
async def startup_event():
    global pipe
    print(f"Loading {BASE_MODEL}... this might take a while.")
    try:
        # Check device availability
        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.bfloat16 if device == "cuda" else torch.float32 
        
        print(f"Loading Flux Pipeline on {device}...")

        if device == "cuda":
            # Real GPU loading - Use .to() for maximum speed if VRAM permits (A6000/3090 is plenty)
            pipe = DiffusionPipeline.from_pretrained(BASE_MODEL, torch_dtype=dtype, trust_remote_code=True)
            pipe.to("cuda") 
        else:
            # CPU Loading
            try:
                pipe = DiffusionPipeline.from_pretrained(BASE_MODEL, torch_dtype=dtype, trust_remote_code=True)
                pipe.to("cpu")
                print("Model loaded on CPU successfully.")
            except Exception as e:
                 print(f"Failed to load Flux on CPU: {str(e)}")
                 pipe = None

    except Exception as e:
        print(f"Error loading model: {e}")
        pipe = None

@app.post("/generate")
async def generate_image(
    file: UploadFile = File(...),
    style_file: Optional[UploadFile] = File(None), # Optional style reference image
    prompt: Optional[str] = Form(None),
    style: Optional[str] = Form(None),
    strength: Optional[float] = Form(None), 
    guidance_scale: Optional[float] = Form(None),
):
    global pipe
    
    # Robust Defaults
    prompt = prompt or "professional interior"
    style = style or "Modern"
    # Lower guidance_scale helps keep structural integrity (1.0 - 2.0 range is sweet spot for Klein)
    guidance_scale = guidance_scale if guidance_scale is not None else 1.8 
    
    # Hyper-Premium Style Prompt Mapping
    style_prompts = {
        "Scandi": "High-end Scandinavian architecture, Nordic minimalism, light-washed oak textures, airy atmosphere, functional elegance.",
        "Modern": "Contemporary luxury residence, floor-to-ceiling glass, Italian marble surfaces, recessed architectural lighting, sophisticated neutral palette.",
        "Industrial": "Urban luxury loft, refined raw materials, polished concrete, bespoke metal fixtures, warm reclaimed wood accents, moody ambient lighting.",
        "Minimalist": "Ultramodern zen sanctuary, seamless surfaces, pure geometric forms, soft indirect natural light, serene clutter-free aesthetic.",
        "Boho": "Bohemian luxury design, curated artisanal textiles, organic lush greenery, layered warm textures, soft sunset glow lighting."
    }
    
    selected_style = style_prompts.get(style, style_prompts["Modern"])
    
    # Construction of a hyper-preservationist architectural prompt
    style_ref_msg = " adhering to the specific aesthetic palette of the style reference" if style_file else ""
    
    full_prompt = (
        f"A world-class architectural photograph of a room{style_ref_msg}. "
        f"MANDATORY: Preserve the exact 1:1 structural geometry, spatial dimensions, and placement of all original furniture and architectural features. "
        f"TRANSFORM: Apply {selected_style} materials, luxury finishes, and high-end textiles to the existing objects. "
        f"LIGHTING: Emphasize volumetric lighting, soft ray-traced shadows, and realistic global illumination. "
        f"DETAIL: {prompt}. "
        "Hyper-realistic, 8k resolution, cinematic atmosphere, sharp architectural focus, professional Interior Design Magazine quality."
    )

    try:
        # Read Base Image
        contents = await file.read()
        if not contents:
             raise HTTPException(status_code=400, detail="Empty base image uploaded")
        try:
            init_image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base image: {str(e)}")
            
        init_image = init_image.resize((1024, 1024)) 

        # (Note: Current pipeline doesn't use style_image directly but we can use it 
        # for future IP-Adapter integration or prompt enrichment. For now, we use the prompt.)

        image_urls = []
        num_images = 6

        if not pipe:
            print(f"WARN: Pipeline not loaded. Falling back to mock for style: {style}")
            for i in range(num_images):
                result_image = init_image.rotate((i + 1) * 15)
                filename = f"{uuid.uuid4()}.png"
                output_path = os.path.join("generated", filename)
                result_image.save(output_path)
                image_urls.append(f"/generated/{filename}")
        else:
            print(f"Generating {num_images} images with prompt: {full_prompt}")
            for i in range(num_images):
                seed = torch.randint(0, 1000000, (1,)).item()
                result = pipe(
                    prompt=full_prompt,
                    image=init_image,
                    guidance_scale=guidance_scale, 
                    num_inference_steps=8, 
                    num_images_per_prompt=1,
                    generator=torch.Generator(device=pipe.device).manual_seed(seed)
                )
                result_image = result.images[0]
                
                filename = f"{uuid.uuid4()}.png"
                output_path = os.path.join("generated", filename)
                result_image.save(output_path)
                image_urls.append(f"/generated/{filename}")
        
        return {"images": image_urls}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Flux Professional Interior Backend is running"}
