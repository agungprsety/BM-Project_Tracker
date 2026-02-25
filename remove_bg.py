import sys
import subprocess
try:
    from PIL import Image
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def remove_white_bg(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Simple thresholding. A pure white or close to white pixel becomes transparent.
            # To avoid hard edges, we can do a simple alpha blending, but threshold is fine for now
            if r > 230 and g > 230 and b > 230:
                pixels[x, y] = (255, 255, 255, 0)
    
    img.save(output_path, "PNG")
    print(f"Saved to {output_path}")

try:
    remove_white_bg("public/sigi_s.png", "public/sigi_s_transparent.png")
    remove_white_bg("public/sigi_margafull.png.jpg", "public/sigi_margafull_transparent.png")
except Exception as e:
    print(f"Error: {e}")
