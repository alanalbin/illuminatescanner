"""
ILLUMINATE 2026 - Automated Pass Dispatcher
Sends official event passes with attached pass graphics to all 38 registered attendees.

Usage:
1. Dry Run (Test without sending):
   python scripts/send_all_passes.py --dry-run

2. Send via Gmail SMTP:
   python scripts/send_all_passes.py --sender your_email@gmail.com --password your_16_digit_app_password

3. Send via Resend API:
   python scripts/send_all_passes.py --resend-key re_your_api_key
"""

import os
import sys
import json
import smtplib
import argparse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATTENDEES_JS = os.path.join(BASE_DIR, 'frontend', 'src', 'data', 'attendees.js')
PASSES_DIR = os.path.join(BASE_DIR, 'frontend', 'public', 'passes')

def load_attendees():
    with open(ATTENDEES_JS, 'r', encoding='utf-8') as f:
        content = f.read()
    start_idx = content.find('[')
    end_idx = content.rfind(']') + 1
    return json.loads(content[start_idx:end_idx])

def create_email_html(attendee):
    ticket_id = attendee.get('ticketId')
    name = attendee.get('participantName')
    course = attendee.get('course', 'Engineering')
    college = attendee.get('college', 'KMCT College of Engineering, Kasaragod')
    pass_url = f"https://illuminatescanner.vercel.app/ticket/{ticket_id}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#070312;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#070312;padding:24px 12px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:580px;background:#100726;border-radius:20px;border:1px solid #7c3aed40;padding:32px;color:#f8fafc;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding-bottom:20px;border-bottom:1px solid #7c3aed30;">
                  <h1 style="margin:0;color:#c084fc;font-size:28px;letter-spacing:3px;font-weight:900;">ILLUMINATE 2026</h1>
                  <p style="margin:4px 0 0 0;color:#a855f7;font-size:13px;font-weight:600;">E-Cell IIT Bombay &bull; KMCT College of Engineering</p>
                </td>
              </tr>

              <!-- Greeting -->
              <tr>
                <td style="padding-top:24px;">
                  <p style="font-size:16px;margin:0 0 12px 0;">Dear <strong style="color:#ffffff;">{name}</strong>,</p>
                  <p style="font-size:14px;color:#cbd5e1;line-height:1.6;margin:0 0 20px 0;">
                    Your seat is officially confirmed for the <strong>6-Hour Offline Entrepreneurship Workshop</strong>! Here is your official entry pass and verification ticket.
                  </p>
                </td>
              </tr>

              <!-- Pass Card Box -->
              <tr>
                <td>
                  <table width="100%" style="background:#190c3a;border:1px solid #a855f750;border-radius:14px;padding:20px;margin-bottom:24px;">
                    <tr>
                      <td>
                        <p style="margin:0 0 8px 0;font-size:12px;color:#a855f7;text-transform:uppercase;font-weight:bold;letter-spacing:1px;">CONFIRMED WORKSHOP PASS</p>
                        <p style="margin:0 0 10px 0;font-family:monospace;font-size:18px;color:#38bdf8;font-weight:bold;letter-spacing:1px;">{ticket_id}</p>
                        <p style="margin:4px 0;color:#cbd5e1;font-size:13px;"><strong>Participant:</strong> {name}</p>
                        <p style="margin:4px 0;color:#cbd5e1;font-size:13px;"><strong>Institution:</strong> {college}</p>
                        <p style="margin:4px 0;color:#cbd5e1;font-size:13px;"><strong>Department:</strong> {course}</p>
                        <p style="margin:4px 0;color:#cbd5e1;font-size:13px;"><strong>Venue:</strong> KMCT Auditorium, Kasaragod</p>
                        <p style="margin:4px 0;color:#cbd5e1;font-size:13px;"><strong>Status:</strong> <span style="color:#4ade80;font-weight:bold;">CONFIRMED &bull; ENTRY GRANTED</span></p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <a href="{pass_url}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#6366f1);color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:12px;box-shadow:0 4px 15px rgba(147,51,234,0.4);">
                    👉 View & Download Digital Pass
                  </a>
                  <p style="margin:8px 0 0 0;font-size:11px;color:#94a3b8;">Click above to view your scannable QR code pass anytime</p>
                </td>
              </tr>

              <!-- Event Day Instructions -->
              <tr>
                <td style="background:#0a0417;border-radius:12px;padding:16px;border:1px solid #7c3aed20;">
                  <p style="margin:0 0 8px 0;color:#c084fc;font-size:12px;font-weight:bold;text-transform:uppercase;">Event Day Instructions:</p>
                  <ul style="margin:0;padding-left:18px;color:#cbd5e1;font-size:12px;line-height:1.6;">
                    <li>Keep this digital pass ready on your phone when arriving at the venue.</li>
                    <li>Collect your official <strong>Illuminate Startup Kit</strong> at the registration desk.</li>
                    <li>Certificate provided upon completion by <strong>E-Cell IIT Bombay</strong>.</li>
                  </ul>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="padding-top:24px;border-top:1px solid #7c3aed20;margin-top:20px;color:#64748b;font-size:11px;">
                  <p style="margin:2px 0;">Registration Desk & Event Coordinator: Alan Albin (8848563266)</p>
                  <p style="margin:2px 0;">KMCT College of Engineering, Kasaragod &bull; E-Cell IIT Bombay</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    return html

def send_via_smtp(sender, password, attendees, dry_run=False):
    print(f"\n🚀 Preparing to dispatch passes to {len(attendees)} attendees via Gmail SMTP...")
    if dry_run:
        print("🔍 DRY RUN MODE ACTIVE - No real emails will be dispatched.")
    
    server = None
    if not dry_run:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        print("✅ Connected to Gmail SMTP server successfully.")

    success_count = 0

    for idx, a in enumerate(attendees):
        name = a.get('participantName')
        email = a.get('email')
        ticket_id = a.get('ticketId')
        pass_file = os.path.join(PASSES_DIR, f"{ticket_id}.png")

        print(f"[{idx+1}/{len(attendees)}] Processing {name} <{email}> ({ticket_id})...", end=" ")

        if dry_run:
            print("[DRY-RUN OK]")
            success_count += 1
            continue

        if not email or '@' not in email:
            print("[SKIPPED - No valid email]")
            continue

        msg = MIMEMultipart('related')
        msg['Subject'] = f"Official Entry Pass: ILLUMINATE 2026 [{ticket_id}]"
        msg['From'] = f"ILLUMINATE 2026 <{sender}>"
        msg['To'] = email

        html_body = create_email_html(a)
        msg.attach(MIMEText(html_body, 'html'))

        # Attach pass image if exists
        if os.path.exists(pass_file):
            with open(pass_file, 'rb') as f:
                img_data = f.read()
            img = MIMEImage(img_data)
            img.add_header('Content-Disposition', 'attachment', filename=f"ILLUMINATE_Pass_{ticket_id}.png")
            msg.attach(img)

        try:
            server.sendmail(sender, email, msg.as_string())
            print("✅ SENT")
            success_count += 1
        except Exception as e:
            print(f"❌ FAILED ({e})")

    if server:
        server.quit()

    print(f"\n🎉 Finished! Dispatched {success_count}/{len(attendees)} passes.")

def main():
    parser = argparse.ArgumentParser(description="ILLUMINATE 2026 Pass Mailer")
    parser.add_argument('--dry-run', action='store_true', help="Simulate without sending real emails")
    parser.add_argument('--sender', type=str, help="Your Gmail address (e.g. alanalbin@gmail.com)")
    parser.add_argument('--password', type=str, help="Gmail 16-character App Password")
    args = parser.parse_args()

    attendees = load_attendees()
    print(f"Loaded {len(attendees)} attendees from attendees.js")

    if args.dry_run:
        send_via_smtp(None, None, attendees, dry_run=True)
    elif args.sender and args.password:
        send_via_smtp(args.sender, args.password, attendees, dry_run=False)
    else:
        print("\n💡 Usage instructions:")
        print("1. Test dry run:  python scripts/send_all_passes.py --dry-run")
        print("2. Send emails:   python scripts/send_all_passes.py --sender YOUR_GMAIL@gmail.com --password YOUR_APP_PASSWORD")

if __name__ == '__main__':
    main()
