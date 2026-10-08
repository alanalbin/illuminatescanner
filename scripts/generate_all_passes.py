"""
ILLUMINATE 2026 - Pass Generator Script
Generates high-definition personalized passes using the official 20th Oct 2026 KMCT Kasaragod event banner.
Embeds unique QR codes and Ticket IDs for all registered attendees.
"""

import os
import sys
import json
from PIL import Image, ImageDraw, ImageFont
import qrcode

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATTENDEES_JS = os.path.join(BASE_DIR, 'frontend', 'src', 'data', 'attendees.js')
PASSES_DIR = os.path.join(BASE_DIR, 'frontend', 'public', 'passes')
QRCODES_DIR = os.path.join(BASE_DIR, 'frontend', 'public', 'qrcodes')
ASSETS_DIR = os.path.join(BASE_DIR, 'frontend', 'public', 'pass-assets')
TEMPLATE_SRC = os.path.join(ASSETS_DIR, 'official_event_pass.png')

def load_attendees():
    with open(ATTENDEES_JS, 'r', encoding='utf-8') as f:
        content = f.read()
    start_idx = content.find('[')
    end_idx = content.rfind(']') + 1
    return json.loads(content[start_idx:end_idx])

def create_base_template(src_img):
    """Creates a reusable base template with blank QR area and blank ticket ID area"""
    W, H = src_img.size[0] * 2, src_img.size[1] * 2
    hd_base = src_img.resize((W, H), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(hd_base)

    # 1. Blank out QR box with crisp rounded white rectangle
    draw.rounded_rectangle([1674, 294, 1970, 586], radius=28, fill='white')

    # 2. Blank out Ticket ID text inside the pill box with seamless background
    draw.rectangle([1670, 712, 1975, 776], fill=(2, 2, 6, 255))

    return hd_base

def generate_pass_for_attendee(base_template, ticket_id, font):
    img = base_template.copy()
    draw = ImageDraw.Draw(img)

    # 1. Generate unique QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=0,
    )
    qr_url = f"https://illuminatescanner.vercel.app/ticket/{ticket_id}"
    qr.add_data(qr_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color='black', back_color='white').convert('RGBA')
    qr_img = qr_img.resize((260, 260), Image.Resampling.LANCZOS)
    img.paste(qr_img, (1692, 310), qr_img)

    # 2. Draw Ticket ID text centered in pill box
    bbox = draw.textbbox((0, 0), ticket_id, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = 1670 + (305 - tw) // 2
    ty = 714 + (62 - th) // 2
    draw.text((tx, ty), ticket_id, fill=(255, 255, 255, 255), font=font)

    return img, qr_img

def main():
    os.makedirs(PASSES_DIR, exist_ok=True)
    os.makedirs(QRCODES_DIR, exist_ok=True)
    os.makedirs(ASSETS_DIR, exist_ok=True)

    print("🎨 Loading official event pass template...")
    src_img = Image.open(TEMPLATE_SRC).convert('RGBA')

    # Save copy of source template in pass-assets
    src_img.save(os.path.join(ASSETS_DIR, 'official_event_pass.png'))

    # Generate master HD base template
    hd_base = create_base_template(src_img)
    hd_base.save(os.path.join(ASSETS_DIR, 'pass_base.png'))
    print("✅ Created and saved HD pass_base.png (2048x1024)")

    attendees = load_attendees()
    print(f"👥 Generating passes for {len(attendees)} attendees...")

    font_candidates = [
        r'C:\Windows\Fonts\segoeuib.ttf',
        r'C:\Windows\Fonts\arialbd.ttf',
    ]
    font_path = next((f for f in font_candidates if os.path.exists(f)), None)
    if font_path:
        font = ImageFont.truetype(font_path, 20)
    else:
        font = ImageFont.load_default()

    for idx, att in enumerate(attendees):
        tid = att['ticketId']
        name = att['participantName']
        pass_img, qr_img = generate_pass_for_attendee(hd_base, tid, font)

        # Save pass
        pass_file = os.path.join(PASSES_DIR, f"{tid}.png")
        pass_img.save(pass_file, optimize=True)

        # Save standalone QR code
        qr_file = os.path.join(QRCODES_DIR, f"{tid}.png")
        qr_img.save(qr_file, optimize=True)

        print(f"[{idx+1}/{len(attendees)}] Generated: {tid} ({name})")

    print("\n🎉 All 38 attendee passes generated successfully with the new pass design!")

if __name__ == '__main__':
    main()
