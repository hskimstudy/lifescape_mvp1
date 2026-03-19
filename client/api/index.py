import os
import random
import io
import base64
import time
import requests
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

# Use FLUX.2 Klein 9B via BFL API
# Note: In production, set BFL_API_KEY in Vercel environment variables
BFL_API_KEY = os.environ.get("BFL_API_KEY", "bfl_GNXqDAG9WBfkcB9X8RJhBAE8EhHbCBJ1")
BASE_URL = "https://api.bfl.ai/v1"
BFL_MODEL = "flux-2-klein-9b"

@app.post("/api/generate")
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
    resolution: Optional[str] = Form(None),
):
    if not BFL_API_KEY:
        raise HTTPException(status_code=500, detail="BFL_API_KEY not configured in environment")

    remove_bg_flag = str(remove_bg).lower() in ('true', '1', 'yes')
    
    if not prompt:
        prompt = "Naturally place the current furniture image in a high-end interior room, sharp focus, hyper-realistic."
    
    full_prompt = prompt

    try:
        contents = await file.read()
        init_image = Image.open(io.BytesIO(contents)).convert("RGB")
            
        # Determine target resolution
        is_hd = str(resolution).lower() == 'hd'
        w, h = init_image.size
        aspect = w / h
        
        if is_hd:
            new_w, new_h = 1920, 1080
        else:
            if w > h:
                new_w, new_h = 1024, int(1024 / aspect)
            else:
                new_h, new_w = 1024, int(1024 * aspect)
        
        new_w, new_h = (new_w // 8) * 8, (new_h // 8) * 8
        init_image = init_image.resize((new_w, new_h), Image.LANCZOS)

        # Background removal (Nukki) - Disabled for Vercel size limit
        if remove_bg_flag:
             # Vercel functions cannot run heavy local models like rembg easily within 250MB
             # Just logging it for now.
             print("Background removal is currently skipped on Vercel deployment to save resources.")

        def img_to_b64(img):
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            return base64.b64encode(buffered.getvalue()).decode("utf-8")

        input_image_b64 = img_to_b64(init_image)
        ref_image_b64 = None
        if style_file:
            ref_contents = await style_file.read()
            ref_img = Image.open(io.BytesIO(ref_contents)).convert("RGB")
            ref_img.thumbnail((1024, 1024), Image.LANCZOS)
            ref_image_b64 = img_to_b64(ref_img)

        payload = {
            "prompt": full_prompt,
            "input_image": input_image_b64,
            "output_format": "png",
            "seed": random.randint(0, 1000000),
            "width": new_w,
            "height": new_h,
            "safety_tolerance": 2,
        }
        if ref_image_b64:
            payload["input_image_2"] = ref_image_b64

        r = requests.post(f"{BASE_URL}/{BFL_MODEL}",
            headers={"x-key": BFL_API_KEY, "Content-Type": "application/json"},
            json=payload, timeout=60)
        r.raise_for_status()
        polling_url = r.json()["polling_url"]

        while True:
            time.sleep(2)
            pr = requests.get(polling_url, headers={"x-key": BFL_API_KEY}, timeout=60)
            res = pr.json()
            if res.get("status") == "Ready":
                return {"images": [res["result"]["sample"]]}
            if res.get("status") in ("Error", "Failed"):
                raise RuntimeError(f"BFL Task Failed: {res}")

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api")
@app.get("/")
def read_root():
    return {"message": "Lifescape Serverless API is running", "env": "vercel"}
