from PIL import Image
import os
img = Image.new('RGB', (512, 512), color='blue')
img.save('/workspace/mvp/server/test_image.jpg')
print("Created /workspace/mvp/server/test_image.jpg")
