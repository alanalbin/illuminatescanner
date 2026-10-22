import { INITIAL_ATTENDEES } from '../data/attendees.js';

const STORAGE_KEY = 'illuminate_local_attendees_v4';
const LOGS_KEY = 'illuminate_local_checkin_logs_v4';
const FEEDBACKS_KEY = 'illuminate_student_feedbacks_v2';

const DEFAULT_FEEDBACKS = [
  {
    id: 'fb_sample_1',
    ticketId: 'ILM-KMCT-MUTBSJW5-AED124',
    participantName: 'Aryananda M',
    college: 'KMCT College of Engineering, Kasaragod',
    course: 'Electronics and Communication',
    yearOfStudy: '1st Year',
    overallRating: 5,
    contentRating: 5,
    mentorRating: 5,
    organizationRating: 5,
    recommend: 'yes',
    likedMost: 'The hands-on startup ideation and pitch deck guidance from E-Cell IIT Bombay mentors was truly inspiring! Learned a lot about business models.',
    suggestions: 'Would love a follow-up 2-day hackathon or bootcamp on funding & incubation next semester.',
    submittedAt: '2026-10-22T10:45:00.000Z',
  },
  {
    id: 'fb_sample_2',
    ticketId: 'ILM-KMCT-MUTCBR59-C9F1E2',
    participantName: 'Bhavya Shree',
    college: 'KMCT College of Engineering, Kasaragod',
    course: 'BTech ECE',
    yearOfStudy: '1st Year',
    overallRating: 5,
    contentRating: 5,
    mentorRating: 5,
    organizationRating: 4,
    recommend: 'yes',
    likedMost: 'Case studies of real Indian startups and how they overcame initial roadblocks. Mentors explained financial metrics very simply.',
    suggestions: 'Everything was great! More networking time with IIT Bombay student founders.',
    submittedAt: '2026-10-22T11:10:00.000Z',
  },
  {
    id: 'fb_sample_3',
    ticketId: 'ILM-KMCT-MUTD4OFR-2F58F8',
    participantName: 'Arya Vijayan',
    college: 'KMCT College of Engineering, Kasaragod',
    course: 'BTech Artificial intelligence and data science',
    yearOfStudy: '1st Year',
    overallRating: 5,
    contentRating: 5,
    mentorRating: 5,
    organizationRating: 5,
    recommend: 'yes',
    likedMost: 'The session on AI products and building an MVP in 48 hours was super practical. The QR pass check-in system was also super smooth!',
    suggestions: 'Please conduct another workshop on deep tech and patenting.',
    submittedAt: '2026-10-22T11:20:00.000Z',
  }
];

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
    const raw = safeStorage.getItem(STORAGE_KEY) || 
      safeStorage.getItem('illuminate_local_attendees_v3') || 
      safeStorage.getItem('illuminate_local_attendees_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge in all 51 attendees
        const existingMap = new Map(parsed.map(t => [t.ticketId.toUpperCase(), t]));
        let modified = false;
        INITIAL_ATTENDEES.forEach(init => {
          if (!existingMap.has(init.ticketId.toUpperCase())) {
            parsed.push({ ...init });
            modified = true;
          } else {
            // Update metadata if missing
            const ex = existingMap.get(init.ticketId.toUpperCase());
            if (ex && (!ex.college || !ex.course)) {
              ex.college = init.college;
              ex.course = init.course;
              ex.yearOfStudy = init.yearOfStudy;
              modified = true;
            }
          }
        });
        if (modified) {
          safeStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local attendees:', e);
  }
  // Initialize with the 38 registered attendees
  const initial = INITIAL_ATTENDEES.map(t => ({ ...t }));
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function dispatchAttendanceUpdate(detail = {}) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('illuminate_attendance_updated', { detail }));
      // Also update timestamp to notify other tabs/windows
      safeStorage.setItem('illuminate_last_sync_timestamp', String(Date.now()));
    } catch (e) {
      console.warn('Sync dispatch error:', e);
    }
  }
}

function saveTickets(tickets) {
  try {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    dispatchAttendanceUpdate({ type: 'tickets_updated', count: tickets.length });
  } catch (e) {
    console.error('Failed to save local attendees:', e);
  }
}

function loadLogs() {
  try {
    const raw = safeStorage.getItem(LOGS_KEY) || safeStorage.getItem('illuminate_local_checkin_logs_v2');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  try {
    safeStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
    dispatchAttendanceUpdate({ type: 'logs_updated', count: logs.length });
  } catch (e) {
    console.error('Failed to save logs:', e);
  }
}

function loadFeedbacks() {
  try {
    const raw = safeStorage.getItem(FEEDBACKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local feedbacks:', e);
  }
  safeStorage.setItem(FEEDBACKS_KEY, JSON.stringify(DEFAULT_FEEDBACKS));
  return [...DEFAULT_FEEDBACKS];
}

function saveFeedbacks(feedbacks) {
  try {
    safeStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks));
    dispatchAttendanceUpdate({ type: 'feedback_updated', count: feedbacks.length });
  } catch (e) {
    console.error('Failed to save feedbacks:', e);
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
    if (!Array.isArray(tickets)) {
      tickets = INITIAL_ATTENDEES.map(t => ({ ...t }));
    }
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
    const total = Math.max(tickets.length, INITIAL_ATTENDEES.length);
    const checkedInTickets = tickets.filter(t => t.checkedIn);
    const checkedIn = checkedInTickets.length;
    const cancelled = tickets.filter(t => t.status === 'CANCELLED').length;
    const remaining = Math.max(0, total - checkedIn - cancelled);
    const logs = loadLogs();
    const invalidAttempts = logs.filter(l => l.result === 'INVALID' || l.status === 'INVALID').length;

    const sortedCheckedIn = [...checkedInTickets].sort((a, b) => {
      const timeA = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
      const timeB = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
      return timeB - timeA;
    });

    return {
      totalRegistrations: total,
      checkedIn,
      remaining,
      cancelled,
      invalidAttempts,
      invalidScans: invalidAttempts,
      qrGenerated: total,
      checkinPercentage: total > 0 ? Math.round((checkedIn / total) * 1000) / 10 : 0,
      recentActivity: logs.slice(0, 50),
      recentCheckins: logs.slice(0, 50),
      checkedInAttendees: sortedCheckedIn,
      awaitingAttendees: tickets.filter(t => !t.checkedIn && t.status !== 'CANCELLED'),
      allAttendees: tickets,
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
      const logs = loadLogs();
      logs.unshift({
        id: Date.now(),
        ticketId: qrContent ? String(qrContent).slice(0, 32) : 'UNKNOWN',
        participantName: 'Unregistered Pass',
        status: 'INVALID',
        result: 'INVALID',
        scannedAt: new Date().toISOString(),
        scannedBy,
      });
      saveLogs(logs);

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
      const logs = loadLogs();
      logs.unshift({
        id: Date.now(),
        ticketId: ticket.ticketId,
        participantName: ticket.participantName,
        status: 'CANCELLED',
        result: 'CANCELLED',
        scannedAt: new Date().toISOString(),
        scannedBy,
      });
      saveLogs(logs);

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

      const logs = loadLogs();
      logs.unshift({
        id: Date.now(),
        ticketId: ticket.ticketId,
        participantName: ticket.participantName,
        status: 'ALREADY_USED',
        result: 'ALREADY_USED',
        scannedAt: new Date().toISOString(),
        scannedBy,
      });
      saveLogs(logs);

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
      result: 'SUCCESS',
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

    const logs = loadLogs();
    logs.unshift({
      id: Date.now(),
      ticketId: ticket.ticketId,
      participantName: ticket.participantName,
      status: 'UNDO_CHECKIN',
      result: 'UNDO',
      scannedAt: new Date().toISOString(),
      scannedBy: 'Admin Desk',
    });
    saveLogs(logs);

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
  },

  applyRemoteCheckin: (ticketId, data) => {
    if (!ticketId) return;
    const tickets = loadTickets();
    const ticket = findAttendee(tickets, ticketId);
    if (!ticket) return;

    if (!ticket.checkedIn || (data.checkedInAt && (!ticket.checkedInAt || data.checkedInAt > ticket.checkedInAt))) {
      ticket.checkedIn = true;
      ticket.checkedInAt = data.checkedInAt || new Date().toISOString();
      ticket.checkedInBy = data.checkedInBy || 'Mobile Scanner';
      ticket.status = 'USED';

      const idx = tickets.findIndex(t => t.ticketId.toUpperCase() === ticket.ticketId.toUpperCase());
      if (idx !== -1) {
        tickets[idx] = ticket;
        saveTickets(tickets);
      }
    }
  },

  applyRemoteUndo: (ticketId) => {
    if (!ticketId) return;
    const tickets = loadTickets();
    const ticket = findAttendee(tickets, ticketId);
    if (!ticket) return;

    if (ticket.checkedIn) {
      ticket.checkedIn = false;
      ticket.checkedInAt = null;
      ticket.checkedInBy = null;
      ticket.status = 'ACTIVE';

      const idx = tickets.findIndex(t => t.ticketId.toUpperCase() === ticket.ticketId.toUpperCase());
      if (idx !== -1) {
        tickets[idx] = ticket;
        saveTickets(tickets);
      }
    }
  },

  applyAllRemoteCheckins: (remoteMap) => {
    if (!remoteMap || typeof remoteMap !== 'object') return;
    const tickets = loadTickets();
    let changed = false;

    const normalizedRemote = new Map();
    Object.keys(remoteMap).forEach(k => {
      const item = remoteMap[k];
      if (item && (item.checkedIn || item.status === 'USED')) {
        normalizedRemote.set(k.toUpperCase(), item);
      }
    });

    tickets.forEach(ticket => {
      const remote = normalizedRemote.get(ticket.ticketId.toUpperCase());
      if (remote && !ticket.checkedIn) {
        ticket.checkedIn = true;
        ticket.checkedInAt = remote.checkedInAt || new Date().toISOString();
        ticket.checkedInBy = remote.checkedInBy || 'Mobile Scanner';
        ticket.status = 'USED';
        changed = true;
      }
    });

    if (changed) {
      saveTickets(tickets);
    }
  },

  // --- Student Feedback Subsystem ---
  getFeedbacks: () => {
    return loadFeedbacks().sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  },

  getFeedbackByTicketId: (ticketId) => {
    if (!ticketId) return null;
    const cleanId = String(ticketId).trim().toUpperCase();
    const feedbacks = loadFeedbacks();
    return feedbacks.find(f => f.ticketId && f.ticketId.trim().toUpperCase() === cleanId) || null;
  },

  submitFeedback: (data) => {
    if (!data) throw new Error('Feedback data required');
    const feedbacks = loadFeedbacks();
    const cleanTicketId = data.ticketId ? String(data.ticketId).trim().toUpperCase() : '';
    
    // Check if feedback already exists for this ticket or explicit id
    const existingIndex = feedbacks.findIndex(f => 
      (cleanTicketId && f.ticketId && f.ticketId.trim().toUpperCase() === cleanTicketId) ||
      (data.id && f.id === data.id)
    );

    const feedbackItem = {
      id: existingIndex !== -1 ? feedbacks[existingIndex].id : `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ticketId: data.ticketId || '',
      participantName: data.participantName || 'Anonymous Student',
      college: data.college || 'KMCT College of Engineering, Kasaragod',
      course: data.course || '',
      yearOfStudy: data.yearOfStudy || '',
      email: data.email || '',
      phone: data.phone || '',
      overallRating: Number(data.overallRating) || 5,
      contentRating: Number(data.contentRating) || 5,
      mentorRating: Number(data.mentorRating) || 5,
      organizationRating: Number(data.organizationRating) || 5,
      recommend: data.recommend || 'yes',
      likedMost: data.likedMost || '',
      suggestions: data.suggestions || '',
      submittedAt: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      feedbacks[existingIndex] = feedbackItem;
    } else {
      feedbacks.unshift(feedbackItem);
    }

    saveFeedbacks(feedbacks);
    return feedbackItem;
  },

  deleteFeedback: (id) => {
    if (!id) return;
    const feedbacks = loadFeedbacks();
    const filtered = feedbacks.filter(f => f.id !== id);
    saveFeedbacks(filtered);
    return filtered;
  },

  getFeedbackStats: () => {
    const feedbacks = loadFeedbacks();
    const total = feedbacks.length;
    if (total === 0) {
      return {
        total: 0,
        avgRating: 0,
        avgContent: 0,
        avgMentor: 0,
        avgOrg: 0,
        recommendRate: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    let sumOverall = 0;
    let sumContent = 0;
    let sumMentor = 0;
    let sumOrg = 0;
    let recommendYesCount = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    feedbacks.forEach(f => {
      const overall = Math.min(5, Math.max(1, Math.round(Number(f.overallRating) || 5)));
      sumOverall += Number(f.overallRating) || 5;
      sumContent += Number(f.contentRating) || 5;
      sumMentor += Number(f.mentorRating) || 5;
      sumOrg += Number(f.organizationRating) || 5;
      distribution[overall] = (distribution[overall] || 0) + 1;
      if (f.recommend === 'yes') recommendYesCount++;
    });

    return {
      total,
      avgRating: Math.round((sumOverall / total) * 10) / 10,
      avgContent: Math.round((sumContent / total) * 10) / 10,
      avgMentor: Math.round((sumMentor / total) * 10) / 10,
      avgOrg: Math.round((sumOrg / total) * 10) / 10,
      recommendRate: Math.round((recommendYesCount / total) * 100),
      distribution
    };
  },

  exportFeedbackCsvString: () => {
    const feedbacks = loadFeedbacks();
    const headers = [
      'Submission ID',
      'Ticket ID',
      'Participant Name',
      'College',
      'Course',
      'Year of Study',
      'Overall Rating (out of 5)',
      'Workshop Content Rating',
      'IIT Bombay Mentors Rating',
      'Venue & Org Rating',
      'Would Recommend',
      'Liked Most',
      'Suggestions',
      'Submitted At'
    ];

    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    const rows = feedbacks.map(f => [
      escapeCsv(f.id),
      escapeCsv(f.ticketId),
      escapeCsv(f.participantName),
      escapeCsv(f.college),
      escapeCsv(f.course),
      escapeCsv(f.yearOfStudy),
      f.overallRating || 5,
      f.contentRating || 5,
      f.mentorRating || 5,
      f.organizationRating || 5,
      escapeCsv(f.recommend === 'yes' ? 'Yes' : f.recommend === 'maybe' ? 'Maybe' : 'No'),
      escapeCsv(f.likedMost),
      escapeCsv(f.suggestions),
      escapeCsv(f.submittedAt)
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
};

