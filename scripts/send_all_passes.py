"""
ILLUMINATE 2026 - Automated Gmail Pass Dispatcher
Sends official event passes with embedded HD pass graphics and verification QR codes to attendees.

Usage:
1. Dry Run (Test without sending any emails):
   python scripts/send_all_passes.py --dry-run

2. Send a Single Test Email to yourself:
   python scripts/send_all_passes.py --sender your_email@gmail.com --password your_16_digit_app_password --test-to your_email@gmail.com

3. Bulk Dispatch to All 38 Registered Attendees:
   python scripts/send_all_passes.py --sender your_email@gmail.com --password your_16_digit_app_password

Note: You can also save GMAIL_SENDER and GMAIL_APP_PASSWORD in .env so you don't need to specify them via flags!
"""

import os
import sys
import json
import time
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
ENV_FILE = os.path.join(BASE_DIR, '.env')

def load_env_credentials():
    sender = os.environ.get('GMAIL_SENDER')
    password = os.environ.get('GMAIL_APP_PASSWORD')
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('#') or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k == 'GMAIL_SENDER' and not sender:
                    sender = v
                elif k == 'GMAIL_APP_PASSWORD' and not password:
                    password = v
    return sender, password

def load_attendees():
    with open(ATTENDEES_JS, 'r', encoding='utf-8') as f:
        content = f.read()
    start_idx = content.find('[')
    end_idx = content.rfind(']') + 1
    return json.loads(content[start_idx:end_idx])

def create_email_html(attendee, has_inline_image=False):
    ticket_id = attendee.get('ticketId')
    name = attendee.get('participantName')
    course = attendee.get('course', 'Engineering')
    college = attendee.get('college', 'KMCT College of Engineering for Emerging Technologies and Management, Kasaragod')
    pass_url = f"https://illuminatescanner.vercel.app/ticket/{ticket_id}"

    pass_banner_html = ""
    if has_inline_image:
        pass_banner_html = f"""
        <tr>
          <td align="center" style="padding:10px 0 24px 0;">
            <img src="cid:pass_banner" alt="ILLUMINATE 2026 Entry Pass" style="width:100%;max-width:540px;border-radius:14px;display:block;border:1px solid #a855f760;box-shadow:0 8px 24px rgba(168,85,247,0.25);" />
          </td>
        </tr>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#070312;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#070312;padding:24px 12px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:600px;background:#100726;border-radius:20px;border:1px solid #7c3aed40;padding:32px 24px;color:#f8fafc;box-shadow:0 12px 35px rgba(0,0,0,0.6);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding-bottom:20px;border-bottom:1px solid #7c3aed30;">
                  <h1 style="margin:0;color:#c084fc;font-size:26px;letter-spacing:2px;font-weight:900;">ILLUMINATE 2026</h1>
                  <p style="margin:6px 0 0 0;color:#a855f7;font-size:13px;font-weight:600;">E-Cell IIT Bombay &bull; KMCT College of Engineering (NxtBYTE)</p>
                </td>
              </tr>

              <!-- Greeting -->
              <tr>
                <td style="padding-top:24px;">
                  <p style="font-size:16px;margin:0 0 12px 0;">Dear <strong style="color:#ffffff;">{name}</strong>,</p>
                  <p style="font-size:14px;color:#cbd5e1;line-height:1.6;margin:0 0 20px 0;">
                    Your seat is <strong>officially confirmed</strong> for the 6-Hour Offline Entrepreneurship Workshop! Below is your official entry pass with scannable QR verification for seamless check-in.
                  </p>
                </td>
              </tr>

              <!-- Embedded Pass Image -->
              {pass_banner_html}

              <!-- Event Details Box -->
              <tr>
                <td>
                  <table width="100%" style="background:#190c3a;border:1px solid #a855f750;border-radius:14px;padding:20px;margin-bottom:24px;">
                    <tr>
                      <td>
                        <p style="margin:0 0 8px 0;font-size:11px;color:#a855f7;text-transform:uppercase;font-weight:bold;letter-spacing:1.5px;">CONFIRMED REGISTRATION DETAILS</p>
                        <p style="margin:0 0 12px 0;font-family:monospace;font-size:17px;color:#38bdf8;font-weight:bold;letter-spacing:1px;">{ticket_id}</p>
                        <table width="100%" cellpadding="3" cellspacing="0" style="color:#cbd5e1;font-size:13px;line-height:1.5;">
                          <tr><td width="30%"><strong>Participant:</strong></td><td>{name}</td></tr>
                          <tr><td><strong>Date:</strong></td><td><span style="color:#facc15;font-weight:bold;">20th October 2026</span></td></tr>
                          <tr><td><strong>Timing:</strong></td><td>10:00 a.m. to 4:00 p.m.</td></tr>
                          <tr><td><strong>Venue:</strong></td><td>KMCT College of Engineering, Kasaragod (Auditorium)</td></tr>
                          <tr><td><strong>Department:</strong></td><td>{course}</td></tr>
                          <tr><td><strong>Status:</strong></td><td><span style="color:#4ade80;font-weight:bold;">CONFIRMED &bull; ENTRY GRANTED</span></td></tr>
                        </table>
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
                  <p style="margin:8px 0 0 0;font-size:11px;color:#94a3b8;">Click above to view your real-time scannable QR ticket on any device</p>
                </td>
              </tr>

              <!-- Event Instructions -->
              <tr>
                <td style="background:#0a0417;border-radius:12px;padding:16px;border:1px solid #7c3aed20;">
                  <p style="margin:0 0 8px 0;color:#c084fc;font-size:12px;font-weight:bold;text-transform:uppercase;">Important Instructions for Event Day:</p>
                  <ul style="margin:0;padding-left:18px;color:#cbd5e1;font-size:12px;line-height:1.7;">
                    <li>Keep this pass or QR code saved on your mobile phone to scan at entry.</li>
                    <li>Collect your official <strong>Illuminate Welcome Kit</strong> at the registration desk.</li>
                    <li>Official Certificates will be awarded by <strong>E-Cell IIT Bombay</strong> upon workshop completion.</li>
                  </ul>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="padding-top:24px;border-top:1px solid #7c3aed20;margin-top:20px;color:#64748b;font-size:11px;">
                  <p style="margin:2px 0;">Event Lead & Coordinator: <strong>Alan Albin (8848563266)</strong></p>
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

def build_message(sender, to_email, attendee, pass_file):
    msg = MIMEMultipart('related')
    ticket_id = attendee.get('ticketId')
    name = attendee.get('participantName')

    msg['Subject'] = f"Official Entry Pass: ILLUMINATE 2026 [{ticket_id}]"
    msg['From'] = f"ILLUMINATE 2026 <{sender}>"
    msg['To'] = to_email

    has_pass = os.path.exists(pass_file)
    html_content = create_email_html(attendee, has_inline_image=has_pass)
    msg.attach(MIMEText(html_content, 'html'))

    # Embed inline pass image if available
    if has_pass:
        with open(pass_file, 'rb') as f:
            img_data = f.read()

        # Inline visual banner (CID)
        inline_img = MIMEImage(img_data)
        inline_img.add_header('Content-ID', '<pass_banner>')
        inline_img.add_header('Content-Disposition', 'inline', filename=f"ILLUMINATE_Pass_{ticket_id}.png")
        msg.attach(inline_img)

        # Attachment for downloading/printing
        attach_img = MIMEImage(img_data)
        attach_img.add_header('Content-Disposition', 'attachment', filename=f"ILLUMINATE_Pass_{ticket_id}.png")
        msg.attach(attach_img)

    return msg

def send_via_smtp(sender, password, attendees, test_to=None, dry_run=False):
    target_list = attendees
    if test_to:
        target_list = [attendees[0]]
        print(f"\n🧪 TEST MODE: Dispatching 1 test pass to '{test_to}' (Sample: {target_list[0]['participantName']})...")
    else:
        print(f"\n🚀 Preparing to dispatch passes to {len(target_list)} attendees via Gmail SMTP...")

    if dry_run:
        print("🔍 DRY RUN MODE ACTIVE - No real emails will be sent.")
        for idx, a in enumerate(target_list):
            tid = a.get('ticketId')
            nm = a.get('participantName')
            em = test_to if test_to else a.get('email')
            pass_file = os.path.join(PASSES_DIR, f"{tid}.png")
            exists = "Found HD Pass" if os.path.exists(pass_file) else "Pass PNG Missing"
            print(f"[{idx+1}/{len(target_list)}] DRY-RUN: {nm} -> {em} ({tid}) [{exists}]")
        print("\n✅ Dry run completed successfully! All attendee records and pass files verified.")
        return

    # Real SMTP connection
    print(f"Connecting to smtp.gmail.com as {sender}...")
    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, password)
        print("✅ Authenticated with Gmail SMTP successfully!\n")
    except Exception as e:
        print(f"\n❌ Gmail Authentication Error: {e}")
        print("\n💡 Troubleshooting Tips:")
        print("1. Did you use a 16-character Google App Password (not your normal Gmail login password)?")
        print("2. Generate an App Password at: https://myaccount.google.com/apppasswords")
        return

    success_count = 0
    fail_count = 0

    try:
        for idx, a in enumerate(target_list):
            name = a.get('participantName')
            ticket_id = a.get('ticketId')
            recipient = test_to if test_to else a.get('email')
            pass_file = os.path.join(PASSES_DIR, f"{ticket_id}.png")

            print(f"[{idx+1}/{len(target_list)}] Sending to {name} <{recipient}> ({ticket_id})...", end=" ", flush=True)

            if not recipient or '@' not in recipient:
                print("⚠️ SKIPPED (Invalid email)")
                fail_count += 1
                continue

            try:
                msg = build_message(sender, recipient, a, pass_file)
                server.sendmail(sender, recipient, msg.as_string())
                print("✅ SENT")
                success_count += 1
            except Exception as ex:
                print(f"❌ FAILED ({ex})")
                fail_count += 1

            # Brief pacing delay to respect Gmail rate limits
            if not test_to and idx < len(target_list) - 1:
                time.sleep(1.2)

    finally:
        server.quit()

    print(f"\n🎉 Finished! Dispatched {success_count} passes successfully ({fail_count} failed).")

def main():
    parser = argparse.ArgumentParser(description="ILLUMINATE 2026 Gmail Automated Pass Dispatcher")
    parser.add_argument('--dry-run', action='store_true', help="Simulate email dispatch without sending")
    parser.add_argument('--test-to', type=str, help="Send 1 sample pass to this test email address")
    parser.add_argument('--sender', type=str, help="Your Gmail address (e.g. yourname@gmail.com)")
    parser.add_argument('--password', type=str, help="Gmail 16-character App Password")
    args = parser.parse_args()

    env_sender, env_pass = load_env_credentials()
    sender = args.sender or env_sender
    password = args.password or env_pass

    attendees = load_attendees()
    print(f"Loaded {len(attendees)} registered attendees from attendees.js")

    if args.dry_run:
        send_via_smtp(sender or "sample@gmail.com", None, attendees, test_to=args.test_to, dry_run=True)
    elif sender and password:
        send_via_smtp(sender, password, attendees, test_to=args.test_to, dry_run=False)
    else:
        print("\n🔑 Gmail Credentials Needed!")
        print("You can run this directly with:")
        print("  python scripts/send_all_passes.py --sender YOUR_GMAIL@gmail.com --password YOUR_APP_PASSWORD")
        print("\nOr test first with dry run:")
        print("  python scripts/send_all_passes.py --dry-run")
        print("\nOr test by sending 1 pass to your own inbox:")
        print("  python scripts/send_all_passes.py --sender YOUR_GMAIL@gmail.com --password YOUR_APP_PASSWORD --test-to YOUR_EMAIL@gmail.com")

if __name__ == '__main__':
    main()
