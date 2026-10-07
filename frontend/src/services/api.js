import { localAttendanceStore } from './localAttendanceStore';

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('illuminate_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeader(),
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.status}`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch {
      // not JSON
    }
    throw new Error(errorMsg);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await res.json();
  }
  // When running on static/SPA hosting (like Vercel), unknown /api calls return index.html (200 text/html)
  // Throw an error so callers cleanly fall back to localAttendanceStore!
  throw new Error(`Non-JSON response received: ${contentType || 'text/html'}`);
}

export const api = {
  // Auth (backward compatible stub)
  login: async (username, password) => {
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (data && data.token) return data;
      return { token: 'guest_token', username: 'volunteer', name: 'Attendance Desk', role: 'VOLUNTEER' };
    } catch {
      return { token: 'guest_token', username: 'volunteer', name: 'Attendance Desk', role: 'VOLUNTEER' };
    }
  },

  // Dashboard Stats
  getStats: async () => {
    const localStats = localAttendanceStore.getStats();
    try {
      const data = await request('/dashboard/stats');
      if (data && typeof data === 'object' && typeof data.totalRegistrations === 'number') {
        const mergedCheckedIn = Math.max(localStats.checkedIn || 0, data.checkedIn || 0);
        const total = Math.max(localStats.totalRegistrations || 38, data.totalRegistrations || 38);
        return {
          ...data,
          totalRegistrations: total,
          checkedIn: mergedCheckedIn,
          remaining: Math.max(0, total - mergedCheckedIn),
          qrGenerated: total,
          checkinPercentage: total > 0 ? Math.round((mergedCheckedIn / total) * 1000) / 10 : 0,
          recentCheckins: Array.isArray(data.recentCheckins) && data.recentCheckins.length > 0 
            ? data.recentCheckins 
            : localStats.recentCheckins,
          checkedInAttendees: localStats.checkedInAttendees,
          awaitingAttendees: localStats.awaitingAttendees,
          allAttendees: localStats.allAttendees,
        };
      }
      return localStats;
    } catch {
      return localStats;
    }
  },

  // Tickets
  getTickets: async (query = '', status = '') => {
    const localTickets = localAttendanceStore.getTickets(query, status);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (status && status !== 'ALL') params.append('status', status);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await request(`/tickets${qs}`);
      if (Array.isArray(data) && data.length > 0) {
        const localCheckinMap = new Map(localTickets.map(t => [(t.ticketId || '').toUpperCase(), t]));
        return data.map(remoteTicket => {
          const local = localCheckinMap.get((remoteTicket.ticketId || '').toUpperCase());
          if (local && local.checkedIn) {
            return {
              ...remoteTicket,
              checkedIn: true,
              checkedInAt: local.checkedInAt || remoteTicket.checkedInAt,
              checkedInBy: local.checkedInBy || remoteTicket.checkedInBy,
              status: 'USED',
            };
          }
          return remoteTicket;
        });
      }
      return localTickets;
    } catch {
      return localTickets;
    }
  },

  getTicket: async (ticketId) => {
    try {
      return await request(`/tickets/${encodeURIComponent(ticketId)}`);
    } catch {
      const ticket = localAttendanceStore.getTicket(ticketId);
      if (!ticket) throw new Error(`Ticket not found: ${ticketId}`);
      return ticket;
    }
  },

  getDigitalPass: async (ticketId) => {
    try {
      return await request(`/tickets/${encodeURIComponent(ticketId)}/pass`);
    } catch {
      const ticket = localAttendanceStore.getTicket(ticketId);
      if (!ticket) throw new Error(`Pass not found for ticket: ${ticketId}`);
      return {
        ticketId: ticket.ticketId,
        participantName: ticket.participantName,
        email: ticket.email,
        phone: ticket.phone,
        status: ticket.status,
        checkedIn: ticket.checkedIn,
        college: ticket.college || 'KMCT College of Engineering, Kasaragod',
        course: ticket.course || 'Engineering',
        passImageUrl: `/passes/${ticket.ticketId}.png`,
        eventName: 'ILLUMINATE 2026',
        venue: 'KMCT Auditorium',
        qrContent: typeof window !== 'undefined' 
          ? `${window.location.origin}/ticket/${ticket.ticketId}`
          : `https://illuminatescanner.vercel.app/ticket/${ticket.ticketId}`,
      };
    }
  },

  createTicket: async (data) => {
    try {
      return await request('/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const tickets = localAttendanceStore.getTickets();
      const newTicket = {
        ticketId: data.ticketId || `ILM-KMCT-MANUAL-${Date.now().toString(36).toUpperCase()}`,
        participantName: data.participantName,
        email: data.email || '',
        phone: data.phone || '',
        status: 'ACTIVE',
        checkedIn: false,
        checkedInAt: null,
      };
      tickets.unshift(newTicket);
      localStorage.setItem('illuminate_local_attendees_v2', JSON.stringify(tickets));
      return newTicket;
    }
  },

  importCsv: async (file) => {
    return await request('/tickets/import', {
      method: 'POST',
      body: file instanceof FormData ? file : (() => {
        const fd = new FormData();
        fd.append('file', file);
        return fd;
      })(),
    });
  },

  exportCsvUrl: () => `${API_BASE}/tickets/export`,

  downloadAttendanceCsv: () => {
    const csvContent = localAttendanceStore.exportCsvString();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `illuminate_attendance_38_attendees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  validateTicket: async (qrContent) => {
    // Instant local evaluation
    const localRes = localAttendanceStore.validateTicket(qrContent);
    // Non-blocking background sync if backend is active
    request('/tickets/validate', {
      method: 'POST',
      body: JSON.stringify({ qrContent }),
    }).catch(() => {});
    return localRes;
  },

  checkinTicket: async (qrContent, scannedBy = 'Attendance Desk', deviceInfo = navigator.userAgent) => {
    // Instant local check-in with 100% offline reliability
    const localRes = localAttendanceStore.checkinTicket(qrContent, scannedBy);
    // Non-blocking background sync if backend is active
    request('/tickets/checkin', {
      method: 'POST',
      body: JSON.stringify({ qrContent, scannedBy, deviceInfo }),
    }).catch(() => {});
    return localRes;
  },

  undoCheckin: async (ticketId) => {
    try {
      return await request(`/tickets/${encodeURIComponent(ticketId)}/undo-checkin`, {
        method: 'POST',
      });
    } catch {
      return localAttendanceStore.undoCheckin(ticketId);
    }
  },

  cancelTicket: async (ticketId) => {
    try {
      return await request(`/tickets/${encodeURIComponent(ticketId)}/cancel`, {
        method: 'POST',
      });
    } catch {
      return localAttendanceStore.cancelTicket(ticketId);
    }
  },

  // Scan history
  getCheckins: async () => {
    try {
      const data = await request('/checkins');
      if (Array.isArray(data)) return data;
      return localAttendanceStore.getCheckins();
    } catch {
      return localAttendanceStore.getCheckins();
    }
  },

  // Event Settings
  getSettings: async () => {
    try {
      return await request('/settings');
    } catch {
      return {
        eventName: 'ILLUMINATE',
        organizer: 'IIT Bombay E-Cell & KMCT',
        eventYear: '2026',
        eventDate: 'October 2026',
        venue: 'KMCT Auditorium',
        theme: 'PURPLE_BLACK',
      };
    }
  },

  updateSettings: async (settings) => {
    try {
      return await request('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch {
      return settings;
    }
  },
};
