import subprocess
import os

files = ['server/main.py', 'server/requirements.txt']

for f_path in files:
    print(f"Restoring {f_path}...")
    try:
        content = subprocess.check_output(['git', 'show', f'HEAD:{f_path}'])
        with open(f_path, 'wb') as f:
            f.write(content)
        print(f"Successfully restored {f_path}")
    except Exception as e:
        print(f"Failed to restore {f_path}: {e}")
