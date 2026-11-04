"""Convierte una imagen (el QR) en un video .y4m quieto para la cámara falsa de Chromium."""
import sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
W, H = 640, 480
fondo = Image.new('RGB', (W, H), (40, 44, 48))
qr = Image.open(src).convert('RGB'); lado = 360
qr = qr.resize((lado, lado), Image.NEAREST)
fondo.paste(qr, ((W - lado) // 2, (H - lado) // 2))
ycc = fondo.convert('YCbCr'); y, cb, cr = ycc.split()
cb = cb.resize((W // 2, H // 2)); cr = cr.resize((W // 2, H // 2))
frame = b'FRAME\n' + y.tobytes() + cb.tobytes() + cr.tobytes()
with open(out, 'wb') as f:
    f.write(('YUV4MPEG2 W%d H%d F15:1 Ip A1:1 C420jpeg\n' % (W, H)).encode())
    for _ in range(30): f.write(frame)
