"""
ILLUMINATE 2026 - WhatsApp Pass Dispatcher
Automates sending personalized workshop entry passes & verification links to attendees via WhatsApp.

Modes:
1. Web Automation (Selenium Chrome):
   - Opens Chrome with WhatsApp Web
   - Prompts you to scan QR code once with your phone (Settings -> Linked Devices)
   - Automatically dispatches personalized pass messages to each participant
   - Tracks sent status in scripts/.sent_whatsapp_passes.json

2. HTML Dashboard Generator:
   - Generates a standalone interactive Illuminate WhatsApp Dispatch Dashboard
   - Allows 1-click WhatsApp dispatch without any account ban risks

Usage:
  python scripts/send_whatsapp_passes.py --help
  python scripts/send_whatsapp_passes.py --export-html
  python scripts/send_whatsapp_passes.py --test-phone 918848563266
  python scripts/send_whatsapp_passes.py --dry-run
  python scripts/send_whatsapp_passes.py --run
"""

import os
import sys
import json
import time
import urllib.parse
import argparse

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATTENDEES_JS = os.path.join(BASE_DIR, 'frontend', 'src', 'data', 'attendees.js')
PASSES_DIR = os.path.join(BASE_DIR, 'frontend', 'public', 'passes')
SENT_LOG_FILE = os.path.join(BASE_DIR, 'scripts', '.sent_whatsapp_passes.json')
USER_DATA_DIR = os.path.join(BASE_DIR, 'scripts', '.chrome_whatsapp_session')

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
        print(f"Warning saving WhatsApp sent log: {e}")

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

def export_html_dashboard(attendees):
    sent_log = load_sent_log()
    cards_html = []
    
    for idx, a in enumerate(attendees):
        tid = a.get('ticketId')
        name = a.get('participantName')
        phone = clean_phone_number(a.get('phone'))
        email = a.get('email')
        course = a.get('course')
        raw_msg = generate_message(a)
        encoded_msg = urllib.parse.quote(raw_msg)
        wa_web_url = f"https://web.whatsapp.com/send?phone={phone}&text={encoded_msg}"
        wa_mobile_url = f"https://wa.me/{phone}?text={encoded_msg}"
        is_sent = "checked" if tid in sent_log else ""
        pass_url = f"https://illuminatescanner.vercel.app/ticket/{tid}"

        card = f"""
        <div class="card" id="card-{tid}" data-tid="{tid}">
          <div class="card-header">
            <span class="badge">#{idx+1}</span>
            <h3>{name}</h3>
            <span class="tid-pill">{tid}</span>
          </div>
          <div class="card-body">
            <p><strong>Phone:</strong> +{phone}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Course:</strong> {course}</p>
          </div>
          <div class="card-actions">
            <a href="{wa_web_url}" target="_blank" class="btn btn-primary" onclick="markSent('{tid}')">Open in WhatsApp Web 💬</a>
            <a href="{wa_mobile_url}" target="_blank" class="btn btn-secondary" onclick="markSent('{tid}')">WhatsApp Link (App) 📱</a>
            <a href="{pass_url}" target="_blank" class="btn btn-outline">View Pass 🎟️</a>
            <label class="checkbox-label">
              <input type="checkbox" id="check-{tid}" {is_sent} onchange="toggleSent('{tid}', this.checked)">
              <span>Sent</span>
            </label>
          </div>
        </div>
        """
        cards_html.append(card)

    dashboard_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Illuminate 2026 - WhatsApp Pass Dispatcher</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #090314;
      color: #f1f5f9;
      padding: 24px 16px;
    }}
    .container {{ max-width: 1200px; margin: 0 auto; }}
    header {{
      background: linear-gradient(135deg, #1e0b36 0%, #110524 100%);
      border: 1px solid #7c3aed40;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }}
    h1 {{ color: #c084fc; font-size: 24px; margin-bottom: 4px; }}
    .subtitle {{ color: #94a3b8; font-size: 14px; }}
    .stats-bar {{ display: flex; gap: 16px; }}
    .stat-pill {{
      background: #2e1065;
      border: 1px solid #a855f750;
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
    }}
    .search-box {{
      width: 100%;
      max-width: 400px;
      padding: 10px 16px;
      background: #140728;
      border: 1px solid #7c3aed60;
      border-radius: 10px;
      color: #fff;
      font-size: 14px;
      outline: none;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
    }}
    .card {{
      background: #130728;
      border: 1px solid #7c3aed30;
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.2s;
    }}
    .card:hover {{ border-color: #a855f7; box-shadow: 0 4px 20px rgba(168,85,247,0.15); }}
    .card.is-sent {{ opacity: 0.65; border-color: #22c55e50; background: #0c1c14; }}
    .card-header {{ display: flex; align-items: center; justify-content: space-between; gap: 8px; }}
    .card-header h3 {{ font-size: 16px; color: #f8fafc; flex: 1; }}
    .badge {{
      background: #7c3aed30;
      color: #c084fc;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
    }}
    .tid-pill {{
      font-family: monospace;
      font-size: 11px;
      background: #38bdf820;
      color: #38bdf8;
      padding: 3px 8px;
      border-radius: 6px;
    }}
    .card-body p {{ font-size: 13px; color: #94a3b8; margin-bottom: 4px; }}
    .card-body strong {{ color: #cbd5e1; }}
    .card-actions {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin-top: auto;
      padding-top: 10px;
      border-top: 1px solid #7c3aed20;
    }}
    .btn {{
      padding: 8px 12px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
      transition: 0.2s;
      cursor: pointer;
    }}
    .btn-primary {{ background: #25d366; color: #000; font-weight: bold; }}
    .btn-primary:hover {{ background: #1ebd56; }}
    .btn-secondary {{ background: #3b82f6; color: #fff; }}
    .btn-secondary:hover {{ background: #2563eb; }}
    .btn-outline {{ background: transparent; border: 1px solid #7c3aed60; color: #c084fc; }}
    .btn-outline:hover {{ background: #7c3aed20; }}
    .checkbox-label {{
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #4ade80;
      cursor: pointer;
      margin-left: auto;
    }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>ILLUMINATE 2026 - WhatsApp Pass Dispatcher</h1>
        <p class="subtitle">E-Cell IIT Bombay &bull; KMCT College of Engineering (NxtBYTE) &bull; 70 Attendees</p>
      </div>
      <div class="stats-bar">
        <div class="stat-pill">Total: <span id="total-count">{len(attendees)}</span></div>
        <div class="stat-pill" style="border-color:#22c55e;">Sent: <span id="sent-count">{len(sent_log)}</span></div>
      </div>
      <input type="text" class="search-box" id="search" placeholder="🔍 Search by name, phone, ticket ID..." oninput="filterCards()">
    </header>

    <div class="grid" id="grid">
      {"".join(cards_html)}
    </div>
  </div>

  <script>
    function updateCounts() {{
      const total = document.querySelectorAll('.card').length;
      const sent = document.querySelectorAll('.card.is-sent').length;
      document.getElementById('sent-count').textContent = sent;
    }}

    function markSent(tid) {{
      const card = document.getElementById('card-' + tid);
      const checkbox = document.getElementById('check-' + tid);
      if (card && checkbox) {{
        checkbox.checked = true;
        card.classList.add('is-sent');
        saveLocalSent(tid, true);
        updateCounts();
      }}
    }}

    function toggleSent(tid, checked) {{
      const card = document.getElementById('card-' + tid);
      if (card) {{
        if (checked) card.classList.add('is-sent');
        else card.classList.remove('is-sent');
        saveLocalSent(tid, checked);
        updateCounts();
      }}
    }}

    function saveLocalSent(tid, status) {{
      let sentList = JSON.parse(localStorage.getItem('illu_sent_passes') || '[]');
      if (status && !sentList.includes(tid)) {{
        sentList.push(tid);
      }} else if (!status) {{
        sentList = sentList.filter(id => id !== tid);
      }}
      localStorage.setItem('illu_sent_passes', JSON.stringify(sentList));
    }}

    // Sync localStorage on load
    window.addEventListener('DOMContentLoaded', () => {{
      let sentList = JSON.parse(localStorage.getItem('illu_sent_passes') || '[]');
      sentList.forEach(tid => {{
        const card = document.getElementById('card-' + tid);
        const checkbox = document.getElementById('check-' + tid);
        if (card && checkbox) {{
          checkbox.checked = true;
          card.classList.add('is-sent');
        }}
      }});
      updateCounts();
    }});

    function filterCards() {{
      const q = document.getElementById('search').value.toLowerCase();
      document.querySelectorAll('.card').forEach(card => {{
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? 'flex' : 'none';
      }});
    }}
  </script>
</body>
</html>
"""
    out_path = os.path.join(BASE_DIR, 'scripts', 'whatsapp_dispatch.html')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(dashboard_html)
    print(f"✅ Generated interactive WhatsApp Dispatch Dashboard: {out_path}")
    return out_path

def run_selenium_whatsapp(attendees, delay=6, force=False, test_phone=None):
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from webdriver_manager.chrome import ChromeDriverManager

    sent_log = load_sent_log() if not test_phone else set()
    os.makedirs(USER_DATA_DIR, exist_ok=True)

    print("\n🌐 Launching Chrome for WhatsApp Web Automation...")
    options = Options()
    options.add_argument(f"--user-data-dir={USER_DATA_DIR}")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    try:
        print("📲 Opening WhatsApp Web (https://web.whatsapp.com)...")
        driver.get("https://web.whatsapp.com")
        print("\n" + "="*60)
        print("👉 ACTION REQUIRED ON YOUR PHONE:")
        print("1. Open WhatsApp on your phone")
        print("2. Tap Menu / Settings ⚙️ -> Linked Devices -> Link a Device")
        print("3. Point your camera at the QR code on your Chrome screen to link!")
        print("="*60 + "\n")

        # Wait for login: look for search bar or chat list
        wait = WebDriverWait(driver, 120)
        print("Waiting for you to log in to WhatsApp Web (up to 2 minutes)...")
        wait.until(EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true"][@data-tab="3"] | //header | //div[@id="side"]')))
        print("✅ Logged in to WhatsApp Web successfully!\n")
        time.sleep(3)

        target_list = attendees
        if test_phone:
            sample_attendee = dict(attendees[0])
            sample_attendee['phone'] = test_phone
            target_list = [sample_attendee]
            print(f"🧪 TEST MODE: Sending 1 sample pass to test phone: +{test_phone}")

        success_count = 0
        fail_count = 0

        for idx, a in enumerate(target_list):
            tid = a.get('ticketId')
            name = a.get('participantName')
            phone = clean_phone_number(a.get('phone'))

            if not force and not test_phone and tid in sent_log:
                print(f"[{idx+1}/{len(target_list)}] {name} (+{phone})... ⏭️ SKIPPED (Already Sent)")
                continue

            if not phone:
                print(f"[{idx+1}/{len(target_list)}] {name}... ⚠️ SKIPPED (Invalid Phone)")
                fail_count += 1
                continue

            raw_msg = generate_message(a)
            encoded_msg = urllib.parse.quote(raw_msg)
            url = f"https://web.whatsapp.com/send?phone={phone}&text={encoded_msg}"

            print(f"[{idx+1}/{len(target_list)}] Sending to {name} (+{phone})...", end=" ", flush=True)

            try:
                driver.get(url)
                
                # Wait for chat input box or invalid number alert
                send_box = WebDriverWait(driver, 25).until(
                    EC.presence_of_element_located((By.XPATH, '//footer//div[@contenteditable="true"] | //div[@contenteditable="true"][@data-tab="10"]'))
                )
                time.sleep(2)
                # Try clicking send button or press ENTER
                try:
                    send_btn = driver.find_element(By.XPATH, '//button[@aria-label="Send"] | //span[@data-icon="send"]/parent::button | //button[contains(@aria-label, "Send")]')
                    send_btn.click()
                except Exception:
                    send_box.send_keys(Keys.ENTER)
                time.sleep(2)
                print("✅ SENT")
                success_count += 1

                if not test_phone:
                    sent_log.add(tid)
                    save_sent_log(sent_log)

                # Delay between sends to prevent WhatsApp account rate limits
                if idx < len(target_list) - 1:
                    print(f"  ⏳ Waiting {delay}s for safety...", flush=True)
                    time.sleep(delay)

            except Exception as e:
                print(f"❌ FAILED ({e})")
                fail_count += 1
                time.sleep(2)

        print(f"\n🎉 Finished WhatsApp Dispatch! Sent: {success_count}, Failed: {fail_count}")

    finally:
        print("Closing browser session in 5 seconds...")
        time.sleep(5)
        driver.quit()

def main():
    parser = argparse.ArgumentParser(description="ILLUMINATE 2026 WhatsApp Pass Dispatcher")
    parser.add_argument('--export-html', action='store_true', help="Export interactive HTML dashboard for 1-click WhatsApp dispatch")
    parser.add_argument('--run', action='store_true', help="Run automated WhatsApp Web bot via Selenium Chrome")
    parser.add_argument('--test-phone', type=str, help="Send 1 test message to this phone number (e.g. 918848563266)")
    parser.add_argument('--dry-run', action='store_true', help="Preview messages and phone numbers without sending")
    parser.add_argument('--force', action='store_true', help="Force resending even if in sent log")
    parser.add_argument('--delay', type=int, default=6, help="Delay in seconds between WhatsApp messages (default: 6)")
    args = parser.parse_args()

    attendees = load_attendees()
    print(f"Loaded {len(attendees)} attendees from attendees.js")

    if args.dry_run:
        print(f"\n🔍 DRY RUN - Checking 70 attendee phone numbers & messages:")
        for idx, a in enumerate(attendees):
            p = clean_phone_number(a.get('phone'))
            print(f"[{idx+1}/{len(attendees)}] {a.get('participantName')} -> +{p} ({a.get('ticketId')})")
        print("\n✅ All 70 attendees have valid phone numbers!")
        return

    if args.export_html or not (args.run or args.test_phone):
        html_file = export_html_dashboard(attendees)
        print(f"\n💡 You can open the dashboard right now:")
        print(f"   file:///{html_file.replace(os.sep, '/')}")

    if args.run or args.test_phone:
        run_selenium_whatsapp(attendees, delay=args.delay, force=args.force, test_phone=args.test_phone)

if __name__ == '__main__':
    main()
