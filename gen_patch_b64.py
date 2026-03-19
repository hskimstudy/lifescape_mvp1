import base64

script = r"""
import os
path = '/usr/local/lib/python3.11/dist-packages/diffusers/models/attention_dispatch.py'
try:
    with open(path, 'r') as f: txt = f.read()
    if "kwargs.pop('enable_gqa'" not in txt:
        # We replace the call to insert the pop before it
        # Assuming indentation is 8 spaces for 'out ='
        # We replace '        out = ...' with '        kwargs.pop... \n        out = ...'
        # But robustly, we just search for the substring
        
        target = 'out = torch.nn.functional.scaled_dot_product_attention('
        replacement = "kwargs.pop('enable_gqa', None)\n        out = torch.nn.functional.scaled_dot_product_attention("
        
        # Check if target exists with strict indentation?
        # The file content usually has '    out =' (4 spaces) or '        out =' (8 spaces)
        # We should replace regardless of indentation if possible, but python relies on it.
        # Step 2001 showed indentation error with 8 spaces when 4 were expected?
        # But 'find' output showed it is inside a function _native_attention.
        # Let's inspect the file content around the target line first?
        # No, just do a sloppy replace that works for typical indentation.
        
        # Wait, if I use replace(), I assume indentation.
        # I will read line by line and detect indentation.
        
        lines = txt.splitlines()
        new_lines = []
        for line in lines:
            if 'out = torch.nn.functional.scaled_dot_product_attention(' in line:
                # Get indentation
                indent = line[:line.find('out')]
                new_lines.append(indent + "kwargs.pop('enable_gqa', None)")
                new_lines.append(line)
            else:
                new_lines.append(line)
        
        with open(path, 'w') as f: f.write('\n'.join(new_lines) + '\n')
        print("Patched successfully")
    else:
        print("Already patched")
except Exception as e:
    print(f"Error: {e}")
"""

encoded = base64.b64encode(script.encode('utf-8')).decode('utf-8')
print(encoded)
