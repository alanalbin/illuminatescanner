import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import QrModal from '../components/QrModal';
import ManualTicketModal from '../components/ManualTicketModal';
import ImportModal from '../components/ImportModal';
import { 
  Search, 
  Filter, 
  QrCode, 
  ExternalLink, 
  CheckCircle, 
  RotateCcw, 
  Ban, 
  Plus, 
  UploadCloud, 
  Download, 
  RefreshCw,
  Mail,
  Phone
} from 'lucide-react';

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedQrTicket, setSelectedQrTicket] = useState(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await api.getTickets(search, statusFilter);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setTickets(localAttendanceStore.getTickets(search, statusFilter));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  useEffect(() => {
    const handleUpdate = () => fetchTickets();
    window.addEventListener('illuminate_attendance_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('illuminate_attendance_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleManualCheckin = async (ticket) => {
    if (!window.confirm(`Mark ${ticket.participantName} (${ticket.ticketId}) as CHECKED-IN?`)) return;
    setActionLoading(ticket.ticketId);
    try {
      await api.checkinTicket(ticket.ticketId, 'Admin Manual Check-in');
      await fetchTickets();
    } catch (err) {
      alert(err.message || 'Check-in failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUndoCheckin = async (ticket) => {
    if (!window.confirm(`Undo check-in for ${ticket.participantName}?`)) return;
    setActionLoading(ticket.ticketId);
    try {
      await api.undoCheckin(ticket.ticketId);
      await fetchTickets();
    } catch (err) {
      alert(err.message || 'Undo check-in failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelTicket = async (ticket) => {
    if (!window.confirm(`Cancel ticket for ${ticket.participantName}? This will deny venue entry.`)) return;
    setActionLoading(ticket.ticketId);
    try {
      await api.cancelTicket(ticket.ticketId);
      await fetchTickets();
    } catch (err) {
      alert(err.message || 'Cancellation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadges = {
    ACTIVE: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30',
    USED: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
    CANCELLED: 'bg-rose-950/60 text-rose-400 border-rose-500/30',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-900/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Attendee & Pass Register
          </h1>
          <p className="text-xs sm:text-sm text-purple-300/70 mt-1">
            Event participants & attendance status ({tickets.length} attendees)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-glow-purple transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ticket</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/40 transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-purple-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => api.downloadAttendanceCsv()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/40 transition-colors"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Ticket ID, Name, Email or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-purple-800/50 text-white placeholder-purple-400/40 text-sm focus:border-purple-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-dark-900 border border-purple-800/40">
          {['ALL', 'ACTIVE', 'USED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-glow-purple'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="glass-panel rounded-3xl border border-purple-500/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-purple-950/40 text-[11px] uppercase font-bold text-purple-300/80 tracking-wider border-b border-purple-900/30">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Ticket ID</th>
                <th className="py-3.5 px-4 sm:px-6">Participant</th>
                <th className="py-3.5 px-4 sm:px-6">Contact</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6">Check-in State</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/20 text-purple-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-purple-400 text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                    Loading tickets...
                  </td>
                </tr>
              ) : (Array.isArray(tickets) && tickets.length > 0) ? (
                tickets.map((t) => (
                  <tr key={t.ticketId || t.id} className="hover:bg-purple-900/10 transition-colors">
                    {/* Ticket ID */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="font-mono text-xs font-bold text-purple-200 bg-purple-950/80 px-2.5 py-1 rounded-md border border-purple-800/40">
                        {t.ticketId}
                      </span>
                    </td>

                    {/* Participant */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-semibold text-white">{t.participantName}</div>
                      <div className="text-[11px] text-purple-300/60">Illuminate 2026 Pass</div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs text-purple-300">
                      {t.email && (
                        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                          <Mail className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          <span className="truncate">{t.email}</span>
                        </div>
                      )}
                      {t.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          <span>{t.phone}</span>
                        </div>
                      )}
                      {!t.email && !t.phone && <span className="text-purple-400/40">--</span>}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          statusBadges[t.status] || 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    {/* Check-in State */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs">
                      {t.checkedIn ? (
                        <div>
                          <span className="font-semibold text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Checked In
                          </span>
                          <span className="text-[11px] text-purple-300/60 block mt-0.5">
                            {t.checkedInAt ? new Date(t.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            {t.checkedInBy ? ` by ${t.checkedInBy}` : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-400/90 font-medium">Pending Entry</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View QR Modal */}
                        <button
                          onClick={() => setSelectedQrTicket(t)}
                          title="View QR Code"
                          className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-800/40 transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* View Digital Pass */}
                        <a
                          href={`/ticket/${t.ticketId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Digital Pass"
                          className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-800/40 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Manual Check-in / Undo */}
                        {t.checkedIn ? (
                          <button
                            onClick={() => handleUndoCheckin(t)}
                            disabled={actionLoading === t.ticketId}
                            title="Undo Check-in"
                            className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-amber-950/40 border border-amber-800/40 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          t.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleManualCheckin(t)}
                              disabled={actionLoading === t.ticketId}
                              title="Mark Check-in"
                              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-950/40 border border-emerald-800/40 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )
                        )}

                        {/* Cancel Ticket */}
                        {t.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancelTicket(t)}
                            disabled={actionLoading === t.ticketId}
                            title="Cancel Ticket"
                            className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/40 border border-rose-800/40 transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-purple-400/60 text-sm">
                    No tickets found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Modal */}
      <QrModal
        ticket={selectedQrTicket}
        onClose={() => setSelectedQrTicket(null)}
      />

      {/* Manual Add Modal */}
      <ManualTicketModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={fetchTickets}
      />

      {/* CSV Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchTickets}
      />
    </div>
  );
}
