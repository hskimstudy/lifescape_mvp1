import os

path = "/usr/local/lib/python3.11/dist-packages/diffusers/models/attention_dispatch.py"
print(f"Patching {path}")

if not os.path.exists(path):
    print("Error: File not found")
    exit(1)

with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
patched = False
for line in lines:
    if "out = torch.nn.functional.scaled_dot_product_attention(" in line:
        if new_lines and "kwargs.pop('enable_gqa'" in new_lines[-1]:
            print("Already patched.")
            new_lines.append(line)
            continue
            
        new_lines.append("        kwargs.pop('enable_gqa', None)\n")
        new_lines.append(line)
        patched = True
    else:
        new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)

if patched:
    print("Successfully patched.")
else:
    print("No patch needed or already patched.")
