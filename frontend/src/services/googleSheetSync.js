/**
 * Google Sheet & Google Form Real-time Sync Service
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1FX6FUEm_9urEtGZ_-neZF1pZiprzU7ErBjd5ZYQ5o68/edit?usp=sharing
 * Google Form: https://docs.google.com/forms/d/e/1FAIpQLSfqtBNHYgy0JIcQlu6iIGGQVGer3IAgwfhfRXkYFrlqQSF6XQ/viewform
 * 
 * Automatically sends every student feedback submission to:
 * 1. The official Google Form endpoint (native Google-to-Sheets pipeline)
 * 2. The Google Apps Script Webhook (if deployed)
 */

const STORAGE_KEY_WEBHOOK = 'illuminate_google_sheet_webhook_url';
const STORAGE_KEY_QUEUE = 'illuminate_google_sheet_unsynced_queue';

export const GOOGLE_SHEET_CONFIG = {
  spreadsheetId: '1FX6FUEm_9urEtGZ_-neZF1pZiprzU7ErBjd5ZYQ5o68',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1FX6FUEm_9urEtGZ_-neZF1pZiprzU7ErBjd5ZYQ5o68/edit?usp=sharing',
  defaultSheetName: 'Student Feedback',
};

// Official Google Form Response URL (submits directly to Google Forms backend)
export const GOOGLE_FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfqtBNHYgy0JIcQlu6iIGGQVGer3IAgwfhfRXkYFrlqQSF6XQ/formResponse';

export const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbw1VDRnuYTyCiexLeNH8uS9XOq21Ncsc2Vh4yvCQRgma_6IDyo9QS-Swx5amBjXJwoO/exec';

class GoogleSheetSync {
  constructor() {
    this.webhookUrl = this.loadWebhookUrl();
  }

  loadWebhookUrl() {
    if (typeof window === 'undefined') return DEFAULT_WEBHOOK_URL;
    return (
      localStorage.getItem(STORAGE_KEY_WEBHOOK) ||
      (import.meta.env && import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK) ||
      DEFAULT_WEBHOOK_URL
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
      studentName: feedback.studentName || feedback.participantName || '',
      departmentAndCourse: feedback.departmentAndCourse || feedback.batch || feedback.course || '',
      yearOfStudy: feedback.yearOfStudy || '1st year',
      mobileNumber: feedback.mobileNumber || feedback.phone || '',
      overallWorkshopRating: Number(feedback.overallWorkshopRating || feedback.programRating) || 5,
      relevanceRating: Number(feedback.relevanceRating) || 5,
      trainerKnowledgeRating: Number(feedback.trainerKnowledgeRating || feedback.trainerRating) || 5,
      clarityRating: Number(feedback.clarityRating) || 5,
      engagementRating: Number(feedback.engagementRating) || 5,
      overallFeedback: feedback.overallFeedback || feedback.trainerReview || feedback.orgTeamReview || '',
      spreadsheetId: GOOGLE_SHEET_CONFIG.spreadsheetId,
    };
  }

  /**
   * Submits directly to the Google Form response endpoint
   * Google Forms automatically inserts this into the linked Google Sheet!
   */
  async submitDirectlyToGoogleForm(payload) {
    try {
      const formData = new FormData();
      formData.append('entry.2072471034', payload.studentName || '');
      formData.append('entry.3566228', payload.departmentAndCourse || '');
      formData.append('entry.1908939836', payload.yearOfStudy || '1st year');
      formData.append('entry.1351658189', payload.mobileNumber || '');
      formData.append('entry.84902081', String(payload.overallWorkshopRating || 5));
      formData.append('entry.717571131', String(payload.relevanceRating || 5));
      formData.append('entry.757459011', String(payload.trainerKnowledgeRating || 5));
      formData.append('entry.971168313', String(payload.clarityRating || 5));
      formData.append('entry.193016744', String(payload.engagementRating || 5));
      formData.append('entry.2035088795', payload.overallFeedback || '');

      await fetch(GOOGLE_FORM_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      });

      console.log('✅ Real-time response dispatched to Google Forms:', payload.studentName);
      return true;
    } catch (err) {
      console.warn('⚠️ Google Form direct submission note:', err);
      return false;
    }
  }

  /**
   * Automatically dispatch feedback record to Google Sheet & Form
   */
  async sendFeedbackToGoogleSheet(feedback) {
    const payload = this.formatPayload(feedback);

    // 1. Send directly to Google Form backend (auto-populates linked Google Sheet)
    this.submitDirectlyToGoogleForm(payload).catch(() => {});

    // 2. Also send to Google Apps Script Webhook if configured
    const webhook = this.getWebhookUrl();
    if (webhook) {
      try {
        await fetch(webhook, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(payload),
        });
        console.log('✅ Real-time feedback synced via Webhook to Google Sheet:', payload.studentName);
      } catch (err) {
        console.warn('⚠️ Webhook sync temporary issue, queuing:', err);
        const queue = this.getUnsyncedQueue();
        queue.push(payload);
        this.saveUnsyncedQueue(queue);
      }
    } else {
      const queue = this.getUnsyncedQueue();
      queue.push(payload);
      this.saveUnsyncedQueue(queue);
    }

    return { success: true, message: 'Dispatched to Google Sheet' };
  }

  /**
   * Bulk sync all queued or existing feedback entries
   */
  async syncAllFeedbacks(feedbacks = []) {
    let successCount = 0;
    const items = Array.isArray(feedbacks) && feedbacks.length > 0 ? feedbacks : this.getUnsyncedQueue();

    for (const item of items) {
      const payload = item.submissionId ? item : this.formatPayload(item);
      try {
        await this.submitDirectlyToGoogleForm(payload);
        
        const webhook = this.getWebhookUrl();
        if (webhook) {
          await fetch(webhook, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
        successCount++;
      } catch (e) {
        console.warn('Failed item sync:', e);
      }
    }

    if (successCount > 0) {
      this.saveUnsyncedQueue([]);
    }

    return { total: items.length, synced: successCount };
  }
}

export const googleSheetSync = new GoogleSheetSync();
