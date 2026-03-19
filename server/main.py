import os
os.environ['OMP_NUM_THREADS'] = '1'
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import torch
import torch.nn.functional as F
import asyncio
import sys
import types
import base64
import requests
import time
import json
from dotenv import load_dotenv

load_dotenv()

# Fix for hardware backends that might be missing or broken in older torch versions
class CatchAllMock(types.ModuleType):
    def __init__(self, name):
        super().__init__(name)
        self.__file__ = None
        self.__path__ = []

    def is_available(self): return False
    def device_count(self): return 0
    def empty_cache(self): pass
    def manual_seed(self, *args, **kwargs): return self
    
    def __getattr__(self, name):
        # Avoid infinite recursion or returning self for special dunder methods
        if name.startswith("__") and name.endswith("__"):
            raise AttributeError(name)
        return self
    
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

from diffusers import FluxPipeline, FluxImg2ImgPipeline, DiffusionPipeline
from PIL import Image, ImageOps
import io
import os
import uuid
import rembg
import numpy as np
from fastapi.staticfiles import StaticFiles
from typing import Optional

app = FastAPI()

# Mount the 'generated' folder
os.makedirs("generated", exist_ok=True)
app.mount("/generated", StaticFiles(directory="generated"), name="generated")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

# Global pipeline and status variables
pipe = None
rembg_session = None
model_status = "loading" # loading | ready | error
# Use FLUX.2 Klein 9B via BFL API
BFL_API_KEY = os.environ.get("BFL_API_KEY", "bfl_GNXqDAG9WBfkcB9X8RJhBAE8EhHbCBJ1")
BASE_URL = "https://api.bfl.ai/v1"
BFL_MODEL = "flux-2-klein-9b"

def load_model_background():
    global pipe, rembg_session, model_status
    print("Initializing backend services...")
    try:
        # Pre-load rembg session with high-accuracy model
        from rembg import new_session
        rembg_session = new_session("isnet-general-use")
        print("Rembg (isnet-general-use) session loaded.")
    except Exception as e:
        print(f"WARN: Failed to load rembg session: {e}")
    # try:
    #     # Check device availability
    #     device = "cuda" if torch.cuda.is_available() else "cpu"
    #     dtype = torch.bfloat16 if device == "cuda" else torch.float32 
    #     
    #     print(f"Loading Flux Pipeline from {BASE_MODEL}...")
    #
    #     # Use DiffusionPipeline to let it resolve Flux2KleinPipeline from model_index.json
    #     pipe = DiffusionPipeline.from_pretrained(
    #         BASE_MODEL, 
    #         torch_dtype=dtype, 
    #         trust_remote_code=True
    #     )
    #     
    #     print("Moving model to GPU (or enabling offload)...")
    #     if device == "cuda":
    #         try:
    #             # Try CPU offload first for VRAM efficiency
    #             pipe.enable_model_cpu_offload()
    #             print("Model enabled with CPU offload successfully.")
    #         except Exception as offload_err:
    #             print(f"Offload failed, trying direct .to('cuda'): {offload_err}")
    #             pipe.to("cuda")
    #             print("Model loaded on CUDA directly.")
    #     else:
    #         pipe.to("cpu")
    #         print("Model loaded on CPU successfully.")
    #     
    #     # Load LoRA fine-tuning weights
    #     lora_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "pytorch_lora_weights.safetensors"))
    #     if os.path.exists(lora_path):
    #         print(f"Loading LoRA weights from {lora_path}...")
    #         try:
    #             pipe.load_lora_weights(lora_path)
    #             print("LoRA weights loaded successfully.")
    #         except Exception as e:
    #             print(f"Failed to load LoRA weights: {e}")
    #     else:
    #         print(f"LoRA weights not found at {lora_path}, skipping.")
    #     
    #     if pipe:
    #         model_status = "ready"
    #     else:
    #         model_status = "error"
    #
    # except Exception as e:
    #     print(f"Error loading model: {e}")
    #     pipe = None
    #     model_status = "error"
    model_status = "ready" # BFL API is always ready if key is valid

@app.on_event("startup")
async def startup_event():
    import threading
    thread = threading.Thread(target=load_model_background)
    thread.start()

@app.post("/generate")
async def generate_image(
    file: UploadFile = File(...),
    style_file: Optional[UploadFile] = File(None),
    prompt: Optional[str] = Form(None),
    style: Optional[str] = Form(None),
    strength: Optional[float] = Form(None), 
    guidance_scale: Optional[float] = Form(None),
    lora_scale: Optional[float] = Form(None),
    object_scale: float = Form(1.0),
    remove_bg: Optional[str] = Form("false"),
    resolution: Optional[str] = Form(None),  # 'hd' for 1920x1080 (Pro Plan)
):
    global pipe
    
    # Defaults and Parsing
    guidance_scale = guidance_scale if guidance_scale is not None else 8.3 
    strength = strength if strength is not None else 0.7
    lora_scale = lora_scale if lora_scale is not None else 0.1
    remove_bg_flag = str(remove_bg).lower() in ('true', '1', 'yes')
    
    # Use the provided prompt directly. If none provided, use a high-quality default.
    if not prompt:
        if style_file:
            # High-quality multi-reference default prompt from user snippet
            prompt = (
                "subject: image1에 있는 가구의 색/크기/각도/재질 등 \"모든 것을 유지한 상태로\" "
                "image2의 \"배경\"만 참고해서 새로운 인테리어 공간과 배경을 생성해주세요.\n"
                "details: image2에 있는 가구를 삭제해버리고, image1의 가구로 대체해주세요."
            )
        else:
            prompt = "Naturally place the current furniture image in a high-end interior room, sharp focus, hyper-realistic."
    
    full_prompt = prompt

    try:
        contents = await file.read()
        if not contents:
             raise HTTPException(status_code=400, detail="Empty base image uploaded")
        try:
            init_image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base image: {str(e)}")
            
        # Determine target resolution
        is_hd = str(resolution).lower() == 'hd' if resolution else False
        max_dim = 1920 if is_hd else 1024
        
        # Maintain Aspect Ratio to prevent "stretching" objects
        w, h = init_image.size
        aspect = w / h
        
        if is_hd:
            # Force 1920x1080 for HD mode
            new_w = 1920
            new_h = 1080
            print(f"DEBUG: HD mode enabled - generating at {new_w}x{new_h}")
        else:
            if w > h:
                new_w = 1024
                new_h = int(1024 / aspect)
            else:
                new_h = 1024
                new_w = int(1024 * aspect)
        
        # Ensure dimensions are multiples of 8 for stable inference
        new_w = (new_w // 8) * 8
        new_h = (new_h // 8) * 8
        init_image = init_image.resize((new_w, new_h), Image.LANCZOS)

        # Nukki-first approach: extract furniture, place on white background
        if remove_bg_flag:
            print("DEBUG: Nukki-first mode (Klein) - extracting furniture...")
            try:
                furniture_rgba = rembg.remove(
                    init_image, 
                    session=rembg_session,
                    alpha_matting=True,
                    alpha_matting_foreground_threshold=240,
                    alpha_matting_background_threshold=10,
                    alpha_matting_erode_size=10
                )
                
                # Compute a clean white background using original size
                white_bg = Image.new("RGB", init_image.size, (255, 255, 255))
                
                # Resize furniture if object_scale != 1.0
                final_paste_img = furniture_rgba
                paste_mask = furniture_rgba.split()[3] if furniture_rgba.mode == 'RGBA' else None
                paste_x, paste_y = 0, 0
                
                if object_scale != 1.0:
                    orig_w, orig_h = furniture_rgba.size
                    new_obj_w = int(orig_w * object_scale)
                    new_obj_h = int(orig_h * object_scale)
                    if new_obj_w > 0 and new_obj_h > 0:
                        final_paste_img = furniture_rgba.resize((new_obj_w, new_obj_h), Image.Resampling.LANCZOS)
                        paste_mask = final_paste_img.split()[3] if final_paste_img.mode == 'RGBA' else None
                        paste_x = (white_bg.width - new_obj_w) // 2
                        paste_y = (white_bg.height - new_obj_h) // 2
                        print(f"DEBUG: Resizing object: scale={object_scale}, size={new_obj_w}x{new_obj_h}")

                if paste_mask:
                    white_bg.paste(final_paste_img, (paste_x, paste_y), mask=paste_mask)
                else:
                    white_bg.paste(final_paste_img, (paste_x, paste_y))
                
                init_image = white_bg
                strength = 0.85
                print("DEBUG: Background removed, using high strength Img2Img.")
            except Exception as e:
                print(f"Rembg failed: {e}")

        if model_status != "ready":
            raise HTTPException(status_code=503, detail="BFL API service is not ready")
        
        print(f"Generating image via BFL API with prompt: {full_prompt}")
        
        num_images = 3

        # Helper: Image to Base64
        def img_to_b64(img):
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            return base64.b64encode(buffered.getvalue()).decode("utf-8")

        input_image_b64 = img_to_b64(init_image)
        ref_image_b64 = None
        if style_file:
            ref_contents = await style_file.read()
            ref_img = Image.open(io.BytesIO(ref_contents)).convert("RGB")
            # Resize ref image if needed
            ref_img.thumbnail((1024, 1024), Image.LANCZOS)
            ref_image_b64 = img_to_b64(ref_img)

        def run_bfl_single_sync(idx):
            print(f"DEBUG: Starting BFL task {idx} for prompt: {full_prompt[:50]}...")
            payload = {
                "prompt": full_prompt,
                "input_image": input_image_b64,
                "output_format": "png",
                "seed": torch.randint(0, 1000000, (1,)).item(),
                "width": new_w,
                "height": new_h,
                "safety_tolerance": 2,
            }
            if ref_image_b64:
                payload["input_image_2"] = ref_image_b64

            # Step 1: Request
            r = requests.post(
                f"{BASE_URL}/{BFL_MODEL}",
                headers={
                    "accept": "application/json",
                    "x-key": BFL_API_KEY,
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=60
            )
            r.raise_for_status()
            req_data = r.json()
            polling_url = req_data["polling_url"]

            # Step 2: Polling
            result_url = None
            while True:
                time.sleep(1.0) # 1 sec interval
                pr = requests.get(
                    polling_url,
                    headers={"accept": "application/json", "x-key": BFL_API_KEY},
                    timeout=60
                )
                pr.raise_for_status()
                res = pr.json()
                status = res.get("status")
                print(f"DEBUG: BFL Task {idx} Status: {status}")

                if status == "Ready":
                    result_url = res["result"]["sample"]
                    break
                if status in ("Error", "Failed"):
                    raise RuntimeError(f"BFL Task {idx} Failed: {res}")

            # Step 3: Download & Save
            img_response = requests.get(result_url, timeout=120)
            img_response.raise_for_status()
            result_image = Image.open(io.BytesIO(img_response.content))

            filename = f"{uuid.uuid4()}.png"
            output_path = os.path.join("generated", filename)
            result_image.save(output_path)
            return f"/generated/{filename}"

        # Run 3 tasks in parallel threads
        print(f"Generating {num_images} images via BFL API...")
        tasks = [asyncio.to_thread(run_bfl_single_sync, i) for i in range(num_images)]
        image_urls = await asyncio.gather(*tasks)

        return {"images": image_urls}

    except Exception as e:
        print(f"Generation error: {e}")
        import traceback
        traceback.print_exc()
        filename = f"error_{uuid.uuid4()}.png"
        # Changed error image size to match potential output size
        Image.new('RGB', (1024, 1024), color=(73, 109, 137)).save(os.path.join("generated", filename))
        return {"images": [f"/generated/{filename}"]}

@app.get("/")
def read_root():
    return {
        "message": "Flux Professional Interior Backend is running", 
        "status": model_status,
        "gpu_available": torch.cuda.is_available()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
