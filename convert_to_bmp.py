from PIL import Image
img = Image.open('logo.png')
img = img.resize((48, 48), Image.Resampling.LANCZOS)
img.save('logo_small.bmp')
