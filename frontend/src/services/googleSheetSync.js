/**
 * Google Sheet Real-time Sync Service
 * Spreadsheet: https://docs.google.com/spreadsheets/d/19KDKagXBecFyaZSYqaGjz-LOSitukaCXsCfK2cF14DU/edit?usp=sharing
 * 
 * Automatically sends every student feedback submission to the linked Google Sheet in real time.
 */

const STORAGE_KEY_WEBHOOK = 'illuminate_google_sheet_webhook_url';
const STORAGE_KEY_QUEUE = 'illuminate_google_sheet_unsynced_queue';

export const GOOGLE_SHEET_CONFIG = {
  spreadsheetId: '1FX6FUEm_9urEtGZ_-neZF1pZiprzU7ErBjd5ZYQ5o68',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1FX6FUEm_9urEtGZ_-neZF1pZiprzU7ErBjd5ZYQ5o68/edit?usp=sharing',
  defaultSheetName: 'Student Feedback',
};

class GoogleSheetSync {
  constructor() {
    this.webhookUrl = this.loadWebhookUrl();
  }

  loadWebhookUrl() {
    if (typeof window === 'undefined') return '';
    return (
      localStorage.getItem(STORAGE_KEY_WEBHOOK) ||
      (import.meta.env && import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK) ||
      ''
    );
  }

  setWebhookUrl(url) {
    this.webhookUrl = (url || '').trim();
    if (typeof window !== 'undefined') {
      if (this.webhookUrl) {
        localStorage.setItem(STORAGE_KEY_WEBHOOK, this.webhookUrl);
      } else {
        localStorage.removeItem(STORAGE_KEY_WEBHOOK);
      }
    }
    return this.webhookUrl;
  }

  getWebhookUrl() {
    return this.webhookUrl || this.loadWebhookUrl();
  }

  getUnsyncedQueue() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveUnsyncedQueue(queue) {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue.slice(-500)));
    } catch (e) {
      console.warn('Could not save Google Sheet sync queue:', e);
    }
  }

  /**
   * Format a feedback record into standard Google Sheet column payload
   */
  formatPayload(feedback) {
    const now = new Date();
    const formattedTimestamp = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium',
    });

    return {
      timestamp: formattedTimestamp,
      submissionId: feedback.id || `FB-${Date.now()}`,
      participantName: feedback.participantName || feedback.name || '',
      phone: feedback.phone || feedback.mobile || '',
      email: feedback.email || '',
      batch: feedback.batch || feedback.course || '',
      trainerRating: Number(feedback.trainerRating) || 5,
      trainerReview: feedback.trainerReview || '',
      orgTeamRating: Number(feedback.orgTeamRating) || 5,
      orgTeamReview: feedback.orgTeamReview || '',
      programRating: Number(feedback.programRating) || 5,
      programReview: feedback.programReview || '',
      spreadsheetId: GOOGLE_SHEET_CONFIG.spreadsheetId,
    };
  }

  /**
   * Automatically dispatch feedback record to Google Sheet
   */
  async sendFeedbackToGoogleSheet(feedback) {
    const payload = this.formatPayload(feedback);
    const webhook = this.getWebhookUrl();

    // If no webhook configured yet, queue for later sync
    if (!webhook) {
      console.info('Google Sheet Webhook URL not set yet. Queuing submission for sync.');
      const queue = this.getUnsyncedQueue();
      queue.push(payload);
      this.saveUnsyncedQueue(queue);
      return { success: true, queued: true, message: 'Saved locally; queued for Google Sheet sync' };
    }

    try {
      // Use mode: 'no-cors' so browser security headers never block the Google Apps Script redirect
      await fetch(webhook, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('✅ Real-time feedback synced to Google Sheet:', payload.participantName);
      return { success: true, queued: false, message: 'Synced to Google Sheet' };
    } catch (err) {
      console.warn('⚠️ Google Sheet sync temporary network issue, queuing:', err);
      const queue = this.getUnsyncedQueue();
      queue.push(payload);
      this.saveUnsyncedQueue(queue);
      return { success: false, queued: true, error: err.message };
    }
  }

  /**
   * Bulk sync all queued or existing feedback entries
   */
  async syncAllFeedbacks(feedbacks = []) {
    const webhook = this.getWebhookUrl();
    if (!webhook) {
      throw new Error('Please configure the Google Apps Script Webhook URL first in Settings.');
    }

    let successCount = 0;
    const items = Array.isArray(feedbacks) && feedbacks.length > 0 ? feedbacks : this.getUnsyncedQueue();

    for (const item of items) {
      const payload = item.submissionId ? item : this.formatPayload(item);
      try {
        await fetch(webhook, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        successCount++;
      } catch (e) {
        console.warn('Failed item sync:', e);
      }
    }

    // Clear queue if successfully sent
    if (successCount > 0) {
      this.saveUnsyncedQueue([]);
    }

    return { total: items.length, synced: successCount };
  }
}

export const googleSheetSync = new GoogleSheetSync();
