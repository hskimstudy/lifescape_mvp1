import diffusers.models.attention_dispatch as m
import os

path = m.__file__
print(f'Fixing {path}')

with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
fixed_count = 0
for line in lines:
    # Look for the line I added with 8 spaces
    if "        kwargs.pop('enable_gqa', None)" in line:
        new_lines.append("    kwargs.pop('enable_gqa', None)\n")
        fixed_count += 1
    # Also good to check if I added it with 4 spaces but maybe context was 0 spaces?
    # No, _native_attention is def inside a class or module level?
    # It is usually a function. indentation is 4. body is 8?
    # Wait.
    # def _native_attention(...):
    #     out = ...
    # Standard python: class method = 4 indent. function inside = 8 indent?
    # No. def _native_attention is toplevel? No, it's method?
    # Let's check the traceback line 731.
    # Function `_native_attention` starts at line ~?
    # If it's a method of a class, it has `self`. Yes.
    # Class = 0 indent. Method = 4 indent. Code inside = 8 indent.
    # So 8 SPACES IS CORRECT for code inside a method!
    # WHY did it fail with "unexpected indent"?
    # Maybe the file uses TABS?
    # OR maybe `_native_attention` is a standalone function (not in class)?
    # "def _native_attention(self,...)" implies class.
    # BUT, looking at diffusers source code `attention_dispatch.py`:
    # It's often a standalone function used by processors.
    # If standalone, def is at 0 indent. Code is at 4 indent.
    # So 8 spaces WOULD be unexpected.
    # I will checking the indentation of the line `out = ...`
    # My previous script matched `out = ...`.
    # If `out` has 4 spaces, then 8 is wrong.
    # If `out` has 8 spaces, then 8 is correct.
    # I will be smarter: I will read the indentation of the `out =` line and MATCH IT.
    
    elif 'out = torch.nn.functional.scaled_dot_product_attention(' in line:
        # This is the line I wanted to precede.
        # But wait, I typically insert BEFORE it.
        # If I already inserted, the previous line has `kwargs.pop`.
        new_lines.append(line)
    else:
        new_lines.append(line)

# Since I already patched it, the file now contains the bad line.
# I just need to find the bad line and replace it with correct indent.
# How do I know correct indent? 
# I can assume 4 spaces is what triggers "unexpected indent" if 8 failed.

# Redoing loop for robustness
new_lines = []
for line in lines:
    if "kwargs.pop('enable_gqa', None)" in line:
        # Detect the indentation of THIS line
        leading_spaces = len(line) - len(line.lstrip())
        print(f"Found patch with {leading_spaces} spaces.")
        if leading_spaces == 8:
            new_lines.append("    kwargs.pop('enable_gqa', None)\n")
            print("Converted to 4 spaces.")
            fixed_count += 1
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)

print(f"Fixed {fixed_count} lines.")
