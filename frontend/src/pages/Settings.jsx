import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Settings as SettingsIcon, Save, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function Settings() {
  const [formData, setFormData] = useState({
    eventName: 'ILLUMINATE',
    organizer: 'IIT Bombay E-Cell / KMCT',
    eventYear: '2026',
    eventDate: 'October 2026',
    venue: 'KMCT Campus Auditorium',
    logoUrl: '/logos/ecell-iitb.png',
    theme: 'PURPLE_BLACK',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.getSettings();
        if (res) {
          setFormData({
            eventName: res.eventName || 'ILLUMINATE',
            organizer: res.organizer || 'IIT Bombay E-Cell / KMCT',
            eventYear: res.eventYear || '2026',
            eventDate: res.eventDate || 'October 2026',
            venue: res.venue || 'KMCT Campus Auditorium',
            logoUrl: res.logoUrl || '/logos/ecell-iitb.png',
            theme: res.theme || 'PURPLE_BLACK',
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.updateSettings(formData);
      setMessage({ type: 'success', text: 'Event settings updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-purple-900/40 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-purple-400" />
          Event Settings
        </h1>
        <p className="text-xs sm:text-sm text-purple-300/70 mt-1">
          Configure branding, venue, and metadata for the Illuminate event passes.
        </p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/60 border-red-500/40 text-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/20 space-y-5 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-200/80 mb-1.5">
              Event Name
            </label>
            <input
              type="text"
              required
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-purple-800 text-white text-sm focus:border-purple-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-200/80 mb-1.5">
              Organizer
            </label>
            <input
              type="text"
              required
              value={formData.organizer}
              onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-purple-800 text-white text-sm focus:border-purple-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-200/80 mb-1.5">
              Event Year
            </label>
            <input
              type="text"
              value={formData.eventYear}
              onChange={(e) => setFormData({ ...formData, eventYear: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-purple-800 text-white text-sm focus:border-purple-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-200/80 mb-1.5">
              Event Date
            </label>
            <input
              type="text"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-purple-800 text-white text-sm focus:border-purple-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-purple-200/80 mb-1.5">
            Venue
          </label>
          <input
            type="text"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-purple-800 text-white text-sm focus:border-purple-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-purple-200/80 mb-1.5">
            Branding Theme
          </label>
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-between text-xs text-purple-200">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-purple-600 shadow-glow-purple" />
              <span className="font-semibold">PURPLE + BLACK (Default Official Theme)</span>
            </div>
            <span className="text-[10px] text-purple-400 uppercase font-bold">Active</span>
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-glow-purple disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
