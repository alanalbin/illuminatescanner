/**
 * ILLUMINATE 2026 - Real-Time Cloud Sync Service
 * Connects directly to Google Firebase Realtime Database for live cross-device sync.
 * Whenever any volunteer or coordinator scans on mobile, all other phones & laptops
 * update instantly in real-time (<100ms) without needing page reloads.
 */

import { localAttendanceStore } from './localAttendanceStore';

const FIREBASE_DB_URL = 'https://illuminate-2026-default-rtdb.firebaseio.com';

let eventSource = null;
let isInitialized = false;
let pollingInterval = null;

export const cloudSync = {
  dbUrl: FIREBASE_DB_URL,

  /**
   * Initializes real-time listener (SSE) and initial data pull
   */
  init: async () => {
    if (isInitialized || typeof window === 'undefined') return;
    isInitialized = true;

    console.log('⚡ [CloudSync] Initializing real-time Firebase attendance sync...');

    // 1. Initial Pull from Firebase
    await cloudSync.pull();

    // 2. Connect Server-Sent Events (SSE) for zero-latency live push
    cloudSync.connectLiveStream();

    // 3. Fallback polling every 5s in case mobile screen sleep interrupts SSE
    if (!pollingInterval) {
      pollingInterval = setInterval(() => {
        cloudSync.pull(true);
      }, 5000);
    }
  },

  /**
   * Connects to Firebase Realtime Database SSE stream for real-time live events
   */
  connectLiveStream: () => {
    if (typeof window === 'undefined' || !window.EventSource) return;

    try {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource(`${FIREBASE_DB_URL}/checkins.json`);

      eventSource.addEventListener('put', (e) => {
        try {
          const payload = JSON.parse(e.data);
          const path = payload.path || '';
          const data = payload.data;

          if (path === '/' || path === '') {
            // Root snapshot of all checkins
            if (data && typeof data === 'object') {
              localAttendanceStore.applyAllRemoteCheckins(data);
            }
          } else {
            // Single ticket updated or deleted
            const ticketId = decodeURIComponent(path.replace(/^\//, ''));
            if (data && data.checkedIn) {
              localAttendanceStore.applyRemoteCheckin(ticketId, data);
            } else if (data === null) {
              // Null means ticket was deleted/undone in Firebase
              localAttendanceStore.applyRemoteUndo(ticketId);
            }
          }
        } catch (err) {
          console.warn('[CloudSync] Stream parse error:', err);
        }
      });

      eventSource.onerror = (err) => {
        // EventSource will auto-reconnect; log silently
        // Fallback polling keeps data perfectly fresh in meantime
      };

    } catch (err) {
      console.warn('[CloudSync] EventSource setup error:', err);
    }
  },

  /**
   * Pulls latest check-in data from Firebase RTDB and reconciles with local store
   */
  pull: async (isSilent = false) => {
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/checkins.json`);
      if (!res.ok) return;

      const remoteCheckins = await res.json();
      if (remoteCheckins && typeof remoteCheckins === 'object') {
        localAttendanceStore.applyAllRemoteCheckins(remoteCheckins);
      }

      // Also push any local checkins that might have been scanned offline to Firebase
      const localTickets = localAttendanceStore.getTickets();
      const localCheckedIn = localTickets.filter(t => t.checkedIn);

      for (const t of localCheckedIn) {
        if (!remoteCheckins || !remoteCheckins[t.ticketId]) {
          cloudSync.pushCheckin(t.ticketId, {
            ticketId: t.ticketId,
            participantName: t.participantName,
            course: t.course,
            college: t.college,
            checkedIn: true,
            checkedInAt: t.checkedInAt || new Date().toISOString(),
            checkedInBy: t.checkedInBy || 'Attendance Desk',
          }).catch(() => {});
        }
      }
    } catch (e) {
      if (!isSilent) console.warn('[CloudSync] Pull error:', e);
    }
  },

  /**
   * Pushes a new check-in to Firebase Realtime Database
   */
  pushCheckin: async (ticketId, checkinData) => {
    if (!ticketId) return;
    const cleanId = String(ticketId).trim();
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/checkins/${encodeURIComponent(cleanId)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: cleanId,
          participantName: checkinData.participantName || '',
          course: checkinData.course || '',
          college: checkinData.college || '',
          checkedIn: true,
          checkedInAt: checkinData.checkedInAt || new Date().toISOString(),
          checkedInBy: checkinData.checkedInBy || 'Mobile Scanner',
          syncedAt: new Date().toISOString(),
        }),
      });

      // Also append to public live log
      fetch(`${FIREBASE_DB_URL}/logs.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Date.now(),
          ticketId: cleanId,
          participantName: checkinData.participantName || '',
          status: 'SUCCESS',
          scannedAt: checkinData.checkedInAt || new Date().toISOString(),
          scannedBy: checkinData.checkedInBy || 'Mobile Scanner',
        }),
      }).catch(() => {});

      return await res.json();
    } catch (err) {
      console.warn('[CloudSync] Push error for ticket ' + cleanId, err);
    }
  },

  /**
   * Pushes an undo action to Firebase Realtime Database
   */
  pushUndo: async (ticketId) => {
    if (!ticketId) return;
    const cleanId = String(ticketId).trim();
    try {
      await fetch(`${FIREBASE_DB_URL}/checkins/${encodeURIComponent(cleanId)}.json`, {
        method: 'DELETE',
      });

      // Log undo action
      fetch(`${FIREBASE_DB_URL}/logs.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Date.now(),
          ticketId: cleanId,
          status: 'UNDONE',
          scannedAt: new Date().toISOString(),
          scannedBy: 'Undo Action',
        }),
      }).catch(() => {});
    } catch (err) {
      console.warn('[CloudSync] Push undo error:', err);
    }
  },
};
