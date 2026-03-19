import os

# Hardcoded path from previous logs
path = "/usr/local/lib/python3.11/dist-packages/diffusers/models/attention_dispatch.py"
print(f'Fixing {path}')

if not os.path.exists(path):
    print("Error: File not found at expected path.")
    exit(1)

with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
fixed_count = 0
for line in lines:
    if "kwargs.pop('enable_gqa', None)" in line:
        # Check current indentation
        leading_spaces = len(line) - len(line.lstrip())
        print(f"Found line with {leading_spaces} spaces.")
        
        # We want 4 spaces (standard python method body indent)
        # Verify: The surrounding lines might tell us.
        # But for now, forcing 4 spaces is the goal.
        new_lines.append("    kwargs.pop('enable_gqa', None)\n")
        fixed_count += 1
    else:
        new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)

print(f"Fixed {fixed_count} lines.")
