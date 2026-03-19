import torch
try:
    import accelerate
    print(f"Accelerate version: {accelerate.__version__}")
except ImportError:
    print("Accelerate not found")

print(f"Torch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")

from main import app
print("App imported successfully")
