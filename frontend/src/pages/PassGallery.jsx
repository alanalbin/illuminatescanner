import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  QrCode, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Download, 
  Copy, 
  Check, 
  Search, 
  Sparkles,
  ScanLine,
  Printer,
  RefreshCw
} from 'lucide-react';

export default function PassGallery() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchTickets = async () => {
    try {
      const data = await api.getTickets();
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCopy = (ticketId) => {
    navigator.clipboard.writeText(ticketId);
    setCopiedId(ticketId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickCheckin = async (ticket) => {
    setActionLoading(ticket.ticketId);
    try {
      const res = await api.checkinTicket(ticket.ticketId, 'QR Gallery Quick Test');
      alert(`Success! ${ticket.participantName} has been checked in!`);
      await fetchTickets();
    } catch (err) {
      alert(err.message || 'Checkin failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchesSearch = !search || 
      t.participantName?.toLowerCase().includes(q) ||
      t.ticketId?.toLowerCase().includes(q) ||
      t.course?.toLowerCase().includes(q) ||
      t.phone?.includes(q);

    if (!matchesSearch) return false;
    if (filter === 'CHECKED_IN') return t.checkedIn;
    if (filter === 'PENDING') return !t.checkedIn;
    return true;
  });

  const checkedInCount = tickets.filter(t => t.checkedIn).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-900/40 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Scannable QR Passes ({tickets.length || 38} Attendees)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/40">
              {checkedInCount} / {tickets.length || 38} Checked In
            </span>
          </div>
          <p className="text-xs sm:text-sm text-purple-300/70 mt-1">
            Display these on screen and scan them with your phone's camera, or tap "Quick Test Check-in".
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            to="/scanner"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-glow-purple transition-all"
          >
            <ScanLine className="w-4 h-4 animate-pulse" />
            <span>Open Scanner</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/40 transition-colors"
          >
            <Printer className="w-4 h-4 text-purple-400" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, ticket ID, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-900/80 border border-purple-900/60 rounded-xl text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'PENDING', 'CHECKED_IN'].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === mode
                  ? 'bg-purple-600 text-white shadow-glow-purple'
                  : 'bg-dark-900/70 text-purple-300/70 hover:text-white border border-purple-900/40'
              }`}
            >
              {mode === 'ALL' && `All (${tickets.length})`}
              {mode === 'PENDING' && `Not Checked In (${tickets.length - checkedInCount})`}
              {mode === 'CHECKED_IN' && `Checked In (${checkedInCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of 27 QR Passes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTickets.map((t, idx) => (
          <div
            key={t.ticketId}
            className={`relative rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
              t.checkedIn 
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-emerald-950/20 shadow-lg' 
                : 'glass-panel border-purple-900/40 hover:border-purple-500/40 hover:shadow-glow-purple'
            }`}
          >
            {/* Status Top Badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-mono text-purple-400/80 font-bold">
                #{idx + 1}
              </span>
              {t.checkedIn ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-3 h-3" />
                  Checked In
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-500/40">
                  <Clock className="w-3 h-3" />
                  Awaiting
                </span>
              )}
            </div>

            {/* QR Code Container (High-Contrast White Background for fast camera scanning) */}
            <div className="flex flex-col items-center my-2">
              <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-purple-300/20 transition-transform hover:scale-105 duration-200">
                <img
                  src={`/qrcodes/${t.ticketId}.png`}
                  alt={`QR for ${t.participantName}`}
                  className="w-36 h-36 object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] text-purple-300/60 mt-2 font-mono">
                Scan with phone camera
              </span>
            </div>

            {/* Participant Details */}
            <div className="mt-2 text-center space-y-1">
              <h3 className="font-extrabold text-white text-base leading-tight">
                {t.participantName}
              </h3>
              <p className="text-xs text-purple-300/80 font-medium">
                {t.course || 'Engineering'}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="font-mono text-[10px] bg-dark-950/90 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40 truncate max-w-[200px]">
                  {t.ticketId}
                </span>
                <button
                  onClick={() => handleCopy(t.ticketId)}
                  className="p-1 text-purple-400 hover:text-white transition-colors"
                  title="Copy Ticket ID"
                >
                  {copiedId === t.ticketId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between gap-2">
              <a
                href={`/qrcodes/${t.ticketId}.png`}
                download={`${t.participantName}_QR_${t.ticketId}.png`}
                className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-purple-900/30"
                title="Download QR image"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Save</span>
              </a>

              <Link
                to={`/ticket/${t.ticketId}`}
                target="_blank"
                className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-purple-900/30"
              >
                <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                <span>Pass</span>
              </Link>

              {!t.checkedIn && (
                <button
                  onClick={() => handleQuickCheckin(t)}
                  disabled={actionLoading === t.ticketId}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verify</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
