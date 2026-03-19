#!/bin/bash
cd /workspace/mvp/server
pkill -9 -f uvicorn || true
pkill -9 -f python3 || true
rm -f server_daemon.log
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True,max_split_size_mb:128
# Run main.py directly (it has its own uvicorn.run block)
nohup python3 main.py > server_daemon.log 2>&1 &
echo "Server started with python3 main.py."
