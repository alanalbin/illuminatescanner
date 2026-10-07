import { INITIAL_ATTENDEES } from '../data/attendees.js';

const STORAGE_KEY = 'illuminate_local_attendees_v2';
const LOGS_KEY = 'illuminate_local_checkin_logs_v2';

const memoryStore = new Map();
const safeStorage = {
  getItem: (key) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStore.get(key) || null;
  },
  setItem: (key, val) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val);
    } else {
      memoryStore.set(key, val);
    }
  }
};

function loadTickets() {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge in case any of the 27 attendees were missing
        const existingMap = new Map(parsed.map(t => [t.ticketId.toUpperCase(), t]));
        INITIAL_ATTENDEES.forEach(init => {
          if (!existingMap.has(init.ticketId.toUpperCase())) {
            parsed.push({ ...init });
          }
        });
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local attendees:', e);
  }
  // Initialize with the 27 registered attendees
  const initial = INITIAL_ATTENDEES.map(t => ({ ...t }));
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveTickets(tickets) {
  try {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error('Failed to save local attendees:', e);
  }
}

function loadLogs() {
  try {
    const raw = safeStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  try {
    safeStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save logs:', e);
  }
}

export function extractTicketId(raw) {
  if (!raw) return '';
  const clean = String(raw).trim();

  // Try parsing JSON if QR holds JSON data
  if ((clean.startsWith('{') && clean.endsWith('}')) || (clean.startsWith('[') && clean.endsWith(']'))) {
    try {
      const p = JSON.parse(clean);
      if (typeof p === 'object' && p !== null) {
        if (p.ticketId) return String(p.ticketId).trim();
        if (p.ticket_id) return String(p.ticket_id).trim();
        if (p.id) return String(p.id).trim();
        if (p.ticket) return String(p.ticket).trim();
        if (p.code) return String(p.code).trim();
        if (p.registrationNumber) return String(p.registrationNumber).trim();
        if (p.regNo) return String(p.regNo).trim();
        if (p.paymentId) return String(p.paymentId).trim();
      }
    } catch {}
  }

  // If it matches ILM-KMCT-...
  const ilmMatch = clean.match(/ILM-KMCT-[A-Za-z0-9_-]+/i);
  if (ilmMatch) return ilmMatch[0].trim();

  // Any ILM-... pattern
  const anyIlm = clean.match(/ILM-[A-Za-z0-9_-]+/i);
  if (anyIlm) return anyIlm[0].trim();

  // If it's a URL like http://.../ticket/ILM-KMCT-... or /verify/... or /pass/...
  const urlMatch = clean.match(/\/(?:ticket|verify|pass)\/([A-Za-z0-9_-]+)/i);
  if (urlMatch) return urlMatch[1].trim();

  // If URL has query params like ?id=... or ?ticket=... or ?ticketId=...
  const queryMatch = clean.match(/[?&](?:id|ticket|ticketId|regNo)=([A-Za-z0-9_-]+)/i);
  if (queryMatch) return queryMatch[1].trim();

  return clean;
}

export function findAttendee(tickets, rawInput) {
  if (!rawInput) return null;
  const raw = String(rawInput).trim();
  const lower = raw.toLowerCase();

  // 1. Exact match on extracted ticket ID
  const extracted = extractTicketId(raw);
  const extractedLower = extracted.toLowerCase();
  let found = tickets.find(t => t.ticketId && t.ticketId.toLowerCase() === extractedLower);
  if (found) return found;

  // 2. Direct match on ticketId
  found = tickets.find(t => t.ticketId && t.ticketId.toLowerCase() === lower);
  if (found) return found;

  // 3. Check each ticket's individual tokens (e.g. MUTBSJW5, AED124, etc.)
  for (const t of tickets) {
    if (!t.ticketId) continue;
    const parts = t.ticketId.split('-');
    // Middle token (e.g. MUTBSJW5)
    if (parts.length >= 3 && parts[2]) {
      const mid = parts[2].toLowerCase();
      if (mid.length >= 4 && lower.includes(mid)) {
        return t;
      }
    }
    // Suffix token (e.g. AED124)
    if (parts.length >= 4 && parts[3]) {
      const suf = parts[3].toLowerCase();
      if (suf.length >= 4 && lower.includes(suf)) {
        return t;
      }
    }
    // Combined subpart (e.g. MUTBSJW5-AED124)
    if (parts.length >= 4) {
      const combined = `${parts[2]}-${parts[3]}`.toLowerCase();
      if (lower.includes(combined)) {
        return t;
      }
    }
  }

  // 4. Substring match for full ticketId
  found = tickets.find(t => t.ticketId && (lower.includes(t.ticketId.toLowerCase()) || t.ticketId.toLowerCase().includes(lower)));
  if (found) return found;

  // 5. Match Razorpay payment ID (e.g. pay_TjhUXyKWTT9TQk)
  for (const t of tickets) {
    if (t.paymentId && t.paymentId.length > 5) {
      if (lower.includes(t.paymentId.toLowerCase())) {
        return t;
      }
    }
  }

  // 6. Match phone number (last 10 digits)
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    found = tickets.find(t => t.phone && t.phone.replace(/\D/g, '').endsWith(last10));
    if (found) return found;
  }

  // 7. Match email address
  for (const t of tickets) {
    if (t.email && t.email.includes('@')) {
      if (lower.includes(t.email.toLowerCase())) {
        return t;
      }
    }
  }

  // 8. Match participant name (if input contains full name or vice versa)
  if (raw.length >= 4) {
    found = tickets.find(t => {
      if (!t.participantName) return false;
      const pName = t.participantName.toLowerCase();
      return lower.includes(pName) || pName.includes(lower);
    });
    if (found) return found;
  }

  return null;
}

export const localAttendanceStore = {
  getTickets: (query = '', status = '') => {
    let tickets = loadTickets();
    if (query) {
      const q = query.toLowerCase().trim();
      tickets = tickets.filter(t => 
        (t.ticketId && t.ticketId.toLowerCase().includes(q)) ||
        (t.participantName && t.participantName.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.phone && t.phone.includes(q)) ||
        (t.course && t.course.toLowerCase().includes(q))
      );
    }
    if (status && status !== 'ALL') {
      if (status === 'CHECKED_IN') {
        tickets = tickets.filter(t => t.checkedIn);
      } else if (status === 'NOT_CHECKED_IN') {
        tickets = tickets.filter(t => !t.checkedIn && t.status !== 'CANCELLED');
      } else {
        tickets = tickets.filter(t => t.status === status);
      }
    }
    return tickets;
  },

  getTicket: (ticketId) => {
    const tickets = loadTickets();
    return findAttendee(tickets, ticketId);
  },

  getStats: () => {
    const tickets = loadTickets();
    const total = tickets.length;
    const checkedIn = tickets.filter(t => t.checkedIn).length;
    const remaining = Math.max(0, total - checkedIn);
    const logs = loadLogs();

    return {
      totalRegistrations: total,
      checkedIn,
      remaining,
      invalidScans: 0,
      qrGenerated: total,
      checkinPercentage: total > 0 ? Math.round((checkedIn / total) * 1000) / 10 : 0,
      recentActivity: logs.slice(0, 10),
    };
  },

  validateTicket: (qrContent) => {
    const tickets = loadTickets();
    const ticket = findAttendee(tickets, qrContent);

    if (!ticket) {
      return {
        valid: false,
        status: 'INVALID',
        message: `Pass not found in registration database (${qrContent})`,
        ticket: null,
      };
    }

    if (ticket.status === 'CANCELLED') {
      return {
        valid: false,
        status: 'CANCELLED',
        ticketId: ticket.ticketId,
        participantName: ticket.participantName,
        course: ticket.course,
        college: ticket.college,
        message: 'This pass has been CANCELLED and is not eligible for entry.',
        ticket,
      };
    }

    if (ticket.checkedIn) {
      const timeStr = ticket.checkedInAt 
        ? new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : '--:--';
      return {
        valid: false,
        status: 'ALREADY_USED',
        ticketId: ticket.ticketId,
        participantName: ticket.participantName,
        course: ticket.course,
        college: ticket.college,
        message: `Already checked in at ${timeStr} by ${ticket.checkedInBy || 'Attendance Desk'}!`,
        ticket,
        checkedInAt: ticket.checkedInAt,
        checkedInBy: ticket.checkedInBy,
      };
    }

    return {
      valid: true,
      status: 'VALID',
      ticketId: ticket.ticketId,
      participantName: ticket.participantName,
      course: ticket.course,
      college: ticket.college,
      message: 'Valid pass verified! Entry allowed.',
      ticket,
    };
  },

  checkinTicket: (qrContent, scannedBy = 'Attendance Desk') => {
    const tickets = loadTickets();
    const ticket = findAttendee(tickets, qrContent);

    if (!ticket) {
      return {
        valid: false,
        success: false,
        status: 'INVALID',
        message: `No matching registration found for scanned code (${qrContent})`,
        ticket: null,
      };
    }

    const ticketIndex = tickets.findIndex(t => t.ticketId === ticket.ticketId);

    if (ticket.status === 'CANCELLED') {
      return {
        valid: false,
        success: false,
        status: 'CANCELLED',
        ticketId: ticket.ticketId,
        participantName: ticket.participantName,
        course: ticket.course,
        college: ticket.college,
        message: 'Ticket has been cancelled. Entry denied.',
        ticket,
      };
    }

    if (ticket.checkedIn) {
      const timeStr = ticket.checkedInAt 
        ? new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : '--:--';
      return {
        valid: false,
        success: false,
        status: 'ALREADY_USED',
        ticketId: ticket.ticketId,
        participantName: ticket.participantName,
        course: ticket.course,
        college: ticket.college,
        message: `Pass already checked in at ${timeStr}!`,
        ticket,
        checkedInAt: ticket.checkedInAt,
        checkedInBy: ticket.checkedInBy,
      };
    }

    const now = new Date().toISOString();
    ticket.checkedIn = true;
    ticket.checkedInAt = now;
    ticket.checkedInBy = scannedBy;
    ticket.status = 'USED';

    tickets[ticketIndex] = ticket;
    saveTickets(tickets);

    const logs = loadLogs();
    logs.unshift({
      id: Date.now(),
      ticketId: ticket.ticketId,
      participantName: ticket.participantName,
      status: 'SUCCESS',
      scannedAt: now,
      scannedBy,
    });
    saveLogs(logs);

    return {
      valid: true,
      success: true,
      status: 'VALID',
      ticketId: ticket.ticketId,
      participantName: ticket.participantName,
      course: ticket.course,
      college: ticket.college,
      message: `Attendance marked successfully for ${ticket.participantName}!`,
      ticket,
      checkedInAt: now,
      checkedInBy: scannedBy,
    };
  },

  undoCheckin: (ticketId) => {
    const tickets = loadTickets();
    const ticket = findAttendee(tickets, ticketId);

    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const ticketIndex = tickets.findIndex(t => t.ticketId === ticket.ticketId);
    ticket.checkedIn = false;
    ticket.checkedInAt = null;
    ticket.checkedInBy = null;
    ticket.status = 'ACTIVE';

    tickets[ticketIndex] = ticket;
    saveTickets(tickets);

    return ticket;
  },

  cancelTicket: (ticketId) => {
    const tickets = loadTickets();
    const ticket = findAttendee(tickets, ticketId);

    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    const ticketIndex = tickets.findIndex(t => t.ticketId === ticket.ticketId);
    ticket.status = 'CANCELLED';

    tickets[ticketIndex] = ticket;
    saveTickets(tickets);

    return ticket;
  },

  getCheckins: () => {
    return loadLogs();
  },

  exportCsvString: () => {
    const tickets = loadTickets();
    const headers = [
      'Ticket ID',
      'Full Name',
      'Email',
      'Phone',
      'College',
      'Course',
      'Attendance Status',
      'Checked In Time',
      'Checked In By',
      'Payment ID'
    ];

    const rows = tickets.map(t => [
      `"${t.ticketId}"`,
      `"${t.participantName || ''}"`,
      `"${t.email || ''}"`,
      `"${t.phone || ''}"`,
      `"${(t.college || '').replace(/"/g, '""')}"`,
      `"${(t.course || '').replace(/"/g, '""')}"`,
      `"${t.checkedIn ? 'PRESENT' : 'ABSENT'}"`,
      `"${t.checkedInAt ? new Date(t.checkedInAt).toLocaleString('en-IN') : '--'}"`,
      `"${t.checkedInBy || '--'}"`,
      `"${t.paymentId || ''}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
};
