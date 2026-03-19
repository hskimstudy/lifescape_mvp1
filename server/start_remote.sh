#!/bin/bash
# Redirect cache to persistent volume (Fixes "No space left on device")
export HF_HOME=/workspace/hf_cache
export HF_HUB_CACHE=/workspace/hf_cache
mkdir -p /workspace/hf_cache

screen -S backend -X quit || true
cd /workspace/server
screen -dmS backend bash -c "python3 main.py > server.log 2>&1"
echo "Server started with redirected cache in /workspace/hf_cache."
ps aux | grep uvicorn
