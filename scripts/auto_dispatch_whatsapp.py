"""
ILLUMINATE 2026 - Automatic WhatsApp Pass Dispatcher
Dispatches passes sequentially to all 70 participants through your active browser session.

Features:
- Opens each participant's WhatsApp Web chat pre-filled with their personalized pass
- Automatically presses Enter to send the message
- Respects pacing delays to safeguard your account
- Tracks sent attendees in scripts/.sent_whatsapp_passes.json to prevent duplicates
"""

import os
import sys
import json
import time
import urllib.parse
import argparse
import webbrowser
import pyautogui

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATTENDEES_JS = os.path.join(BASE_DIR, 'frontend', 'src', 'data', 'attendees.js')
SENT_LOG_FILE = os.path.join(BASE_DIR, 'scripts', '.sent_whatsapp_passes.json')

def load_attendees():
    with open(ATTENDEES_JS, 'r', encoding='utf-8') as f:
        content = f.read()
    start_idx = content.find('[')
    end_idx = content.rfind(']') + 1
    return json.loads(content[start_idx:end_idx])

def load_sent_log():
    if os.path.exists(SENT_LOG_FILE):
        try:
            with open(SENT_LOG_FILE, 'r', encoding='utf-8') as f:
                return set(json.load(f))
        except Exception:
            return set()
    return set()

def save_sent_log(sent_set):
    try:
        with open(SENT_LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(list(sent_set), f, indent=2)
    except Exception as e:
        print(f"Warning saving sent log: {e}")

def clean_phone_number(raw_phone):
    if not raw_phone:
        return None
    digits = ''.join(c for c in str(raw_phone) if c.isdigit())
    if len(digits) == 10:
        return '91' + digits
    if len(digits) == 12 and digits.startswith('91'):
        return digits
    if len(digits) > 10 and digits.startswith('0'):
        return '91' + digits[1:]
    return digits if digits else None

def generate_message(attendee):
    name = attendee.get('participantName')
    ticket_id = attendee.get('ticketId')
    course = attendee.get('course', 'Engineering')
    pass_url = f"https://illuminatescanner.vercel.app/ticket/{ticket_id}"

    msg = (
        f"🎟️ *ILLUMINATE 2026 - OFFICIAL ENTRY PASS*\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"E-Cell IIT Bombay & KMCT College of Engineering (NxtBYTE)\n\n"
        f"Dear *{name}*,\n\n"
        f"Your seat is *officially confirmed* for the 6-Hour Offline Entrepreneurship Workshop!\n\n"
        f"📋 *Registration Details:*\n"
        f"• *Ticket ID:* `{ticket_id}`\n"
        f"• *Date:* Thursday, 22nd October 2026\n"
        f"• *Time:* 10:00 AM – 4:00 PM\n"
        f"• *Venue:* KMCT College of Engineering, Kasaragod (Auditorium)\n"
        f"• *Department:* {course}\n\n"
        f"🔗 *Your Verified Digital Pass & QR Code:*\n"
        f"{pass_url}\n\n"
        f"📌 *Important Instructions:*\n"
        f"1. Keep this link/QR ready on your phone for rapid scanning at the gate.\n"
        f"2. Collect your official Illuminate Welcome Kit at the registration desk.\n"
        f"3. Official Certificates will be awarded by *E-Cell IIT Bombay* upon workshop completion.\n\n"
        f"Event Coordinator: Alan Albin (+91 8848563266)\n"
        f"See you tomorrow at the workshop! 🚀"
    )
    return msg

def main():
    parser = argparse.ArgumentParser(description="ILLUMINATE 2026 Auto WhatsApp Pass Dispatcher")
    parser.add_argument('--limit', type=int, default=None, help="Limit number of messages to send")
    parser.add_argument('--force', action='store_true', help="Resend even if already in sent log")
    parser.add_argument('--load-wait', type=int, default=8, help="Seconds to wait for WhatsApp Web chat to load (default: 8)")
    parser.add_argument('--delay', type=int, default=4, help="Seconds between messages (default: 4)")
    args = parser.parse_args()

    all_attendees = load_attendees()
    sent_log = load_sent_log() if not args.force else set()

    to_send = [a for a in all_attendees if args.force or a.get('ticketId') not in sent_log]
    if args.limit:
        to_send = to_send[:args.limit]

    print(f"\n🚀 Ready to auto-dispatch {len(to_send)} attendee passes on WhatsApp!")
    print(f"Already sent: {len(sent_log)} / Total: {len(all_attendees)}")
    print("=" * 60)
    print("⚠️  IMPORTANT: Please make sure WhatsApp Web is open and active in your browser!")
    print("Starting in 5 seconds... (Switch to your browser window now)")
    print("=" * 60)
    time.sleep(5)

    success = 0
    failed = 0

    for idx, a in enumerate(to_send):
        tid = a.get('ticketId')
        name = a.get('participantName')
        phone = clean_phone_number(a.get('phone'))

        if not phone:
            print(f"[{idx+1}/{len(to_send)}] ⚠️ Skipped {name} (Invalid phone)")
            failed += 1
            continue

        raw_msg = generate_message(a)
        encoded_msg = urllib.parse.quote(raw_msg)
        wa_url = f"https://web.whatsapp.com/send?phone={phone}&text={encoded_msg}"

        print(f"[{idx+1}/{len(to_send)}] Opening chat for {name} (+{phone})...", flush=True)
        webbrowser.open(wa_url)

        # Wait for WhatsApp Web to load the conversation and fill the input box
        time.sleep(args.load_wait)

        # Press Enter to send
        pyautogui.press('enter')
        print(f"  ✅ Sent to {name} ({tid})", flush=True)

        sent_log.add(tid)
        save_sent_log(sent_log)
        success += 1

        # Inter-message safety pacing
        if idx < len(to_send) - 1:
            time.sleep(args.delay)

    print(f"\n🎉 Finished! Dispatched {success} passes on WhatsApp ({failed} skipped).")

if __name__ == '__main__':
    main()
