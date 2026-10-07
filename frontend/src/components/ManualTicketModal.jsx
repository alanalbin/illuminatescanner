import React, { useState } from 'react';
import { X, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function ManualTicketModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    ticketId: '',
    participantName: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.ticketId.trim() || !formData.participantName.trim()) {
      setError('Ticket ID and Participant Name are required');
      return;
    }

    setLoading(true);
    try {
      await api.createTicket({
        ticketId: formData.ticketId.trim(),
        participantName: formData.participantName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });
      setSuccess(`Ticket ${formData.ticketId} added successfully!`);
      setTimeout(() => {
        onSuccess();
        onClose();
        setFormData({ ticketId: '', participantName: '', email: '', phone: '' });
        setSuccess('');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to add ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-dark-900 border border-purple-500/30 p-6 shadow-glow-purple-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              Manual Ticket Entry
            </h3>
            <p className="text-xs text-purple-300/70 mt-0.5">
              Enter an existing registered ticket ID exactly as provided.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-purple-400 hover:text-white rounded-full hover:bg-purple-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 flex items-center gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center gap-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-purple-200/80 mb-1">
              Existing Ticket ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ILM-KMCT-MUTD4OFR-2F58F8"
              value={formData.ticketId}
              onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-purple-700/50 text-white font-mono text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none"
            />
            <p className="text-[10px] text-purple-400/60 mt-1">
              Do not generate a new ID. Keep exact provided ticket ID.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-purple-200/80 mb-1">
              Participant Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alan Albin"
              value={formData.participantName}
              onChange={(e) => setFormData({ ...formData, participantName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-purple-700/50 text-white text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-purple-200/80 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="alan@kmct.edu.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-purple-700/50 text-white text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-purple-200/80 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-950 border border-purple-700/50 text-white text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-purple-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-glow-purple disabled:opacity-50 transition-all"
            >
              {loading ? 'Adding...' : 'Add Ticket & Generate QR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
