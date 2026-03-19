from PIL import Image
try:
    img = Image.new('RGB', (512, 512), color='blue')
    img.save('/workspace/mvp/server/test_image.jpg')
    print("Created test_image.jpg")
except Exception as e:
    print(f"Error creating image: {e}")
