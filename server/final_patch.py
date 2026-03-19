import os
import sys

path = "/usr/local/lib/python3.11/dist-packages/diffusers/models/attention_dispatch.py"
print(f"Checking {path}")

if not os.path.exists(path):
    print(f"Error: {path} not found")
    # Try finding it?
    # os.system("find /usr -name attention_dispatch.py")
    sys.exit(1)

try:
    with open(path, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    patched_count = 0
    for line in lines:
        if 'out = torch.nn.functional.scaled_dot_product_attention(' in line:
            # Check indentation
            indent = line[:line.find('out')]
            # Check if previous line in *original* (or current new_lines) is the pop
            if new_lines and "kwargs.pop('enable_gqa'" in new_lines[-1]:
                print("Skipping - already patched")
                new_lines.append(line)
                continue
            
            print(f"Patching at line with indent length {len(indent)}")
            new_lines.append(indent + "kwargs.pop('enable_gqa', None)\n")
            new_lines.append(line)
            patched_count += 1
        else:
            new_lines.append(line)
    
    with open(path, 'w') as f:
        f.writelines(new_lines)
    
    print(f"Finished. Patched {patched_count} occurrences.")

except Exception as e:
    print(f"Exception: {e}")
    sys.exit(1)
