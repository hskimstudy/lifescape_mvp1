import diffusers.models.attention_dispatch as m
import os

path = m.__file__
print(f'Patching {path}')

with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
patched = False
for i, line in enumerate(lines):
    if 'out = torch.nn.functional.scaled_dot_product_attention(' in line:
        # Check identifying context to be safe
        # Ensure we don't insert multiple times
        if i > 0 and "kwargs.pop('enable_gqa'" in lines[i-1]:
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
    print('Patched successfully.')
else:
    print('Pattern not found or already patched.')
