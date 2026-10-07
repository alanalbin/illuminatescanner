import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { localAttendanceStore } from '../services/localAttendanceStore';
import StatsCards from '../components/StatsCards';
import ManualTicketModal from '../components/ManualTicketModal';
import ImportModal from '../components/ImportModal';
import { 
  ScanLine, 
  Ticket, 
  UploadCloud, 
  Download, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Clock,
  UserCheck,
  Users,
  Search,
  ExternalLink,
  Copy,
  Check,
  Phone,
  Mail,
  RotateCcw,
  Sparkles,
  School,
  GraduationCap
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(() => localAttendanceStore.getStats());
  const [tickets, setTickets] = useState(() => localAttendanceStore.getTickets());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('present'); // 'present' | 'awaiting' | 'all' | 'logs'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const debounceTimerRef = useRef(null);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [statsData, ticketsData] = await Promise.all([
        api.getStats().catch(err => { console.warn('Stats err:', err); return null; }),
        api.getTickets().catch(err => { console.warn('Tickets err:', err); return []; })
      ]);
      if (statsData) setStats(statsData);
      if (Array.isArray(ticketsData) && ticketsData.length > 0) {
        setTickets(ticketsData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 3.5 seconds for live gate monitoring
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 3500);

    // Instant real-time listener for scans from scanner tab or local store with debounce
    const handleAttendanceUpdate = () => {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchDashboardData(true);
      }, 200);
    };

    window.addEventListener('illuminate_attendance_updated', handleAttendanceUpdate);
    window.addEventListener('storage', handleAttendanceUpdate);

    return () => {
      clearInterval(interval);
      clearTimeout(debounceTimerRef.current);
      window.removeEventListener('illuminate_attendance_updated', handleAttendanceUpdate);
      window.removeEventListener('storage', handleAttendanceUpdate);
    };
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 45) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return new Date(isoString).toLocaleDateString();
    } catch {
      return '';
    }
  };

  const handleCopyTicket = (id) => {
    if (!id) return;
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickCheckin = async (ticket) => {
    setActionLoadingId(ticket.ticketId);
    try {
      await api.checkinTicket(ticket.ticketId, 'Attendance Desk');
      // Optimistic instant state update
      setTickets(prev => prev.map(t => t.ticketId === ticket.ticketId ? {
        ...t,
        checkedIn: true,
        checkedInAt: new Date().toISOString(),
        checkedInBy: 'Attendance Desk',
        status: 'USED'
      } : t));
      fetchDashboardData(true);
    } catch (err) {
      alert(err.message || 'Check-in failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUndoCheckin = async (ticket) => {
    if (!window.confirm(`Undo attendance check-in for ${ticket.participantName}?`)) return;
    setActionLoadingId(ticket.ticketId);
    try {
      await api.undoCheckin(ticket.ticketId);
      // Optimistic instant state update
      setTickets(prev => prev.map(t => t.ticketId === ticket.ticketId ? {
        ...t,
        checkedIn: false,
        checkedInAt: null,
        checkedInBy: null,
        status: 'ACTIVE'
      } : t));
      fetchDashboardData(true);
    } catch (err) {
      alert(err.message || 'Undo check-in failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Compute attendee lists
  const allAttendees = tickets.length > 0 
    ? tickets 
    : (stats?.allAttendees || (stats?.checkedInAttendees ? [...(stats.checkedInAttendees || []), ...(stats.awaitingAttendees || [])] : []));

  const checkedInAttendees = allAttendees.filter(t => t.checkedIn).sort((a, b) => {
    const timeA = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
    const timeB = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
    return timeB - timeA;
  });

  const awaitingAttendees = allAttendees.filter(t => !t.checkedIn && t.status !== 'CANCELLED');
  const logs = stats?.recentCheckins || stats?.recentActivity || [];

  // Live computed stats for accurate counts
  const liveStats = useMemo(() => {
    const total = allAttendees.length || stats?.totalRegistrations || 38;
    const checkedInCount = checkedInAttendees.length;
    const remainingCount = Math.max(0, total - checkedInCount);
    return {
      ...stats,
      totalRegistrations: total,
      checkedIn: checkedInCount,
      remaining: remainingCount,
      qrGenerated: total,
      checkinPercentage: total > 0 ? Math.round((checkedInCount / total) * 1000) / 10 : 0,
      invalidAttempts: stats?.invalidAttempts || 0,
    };
  }, [stats, allAttendees, checkedInAttendees]);

  const filterBySearch = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(t => 
      (t.ticketId && t.ticketId.toLowerCase().includes(q)) ||
      (t.participantName && t.participantName.toLowerCase().includes(q)) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.phone && t.phone.includes(q)) ||
      (t.college && t.college.toLowerCase().includes(q)) ||
      (t.course && t.course.toLowerCase().includes(q))
    );
  };

  const filteredCheckedIn = useMemo(() => filterBySearch(checkedInAttendees), [checkedInAttendees, searchQuery]);
  const filteredAwaiting = useMemo(() => filterBySearch(awaitingAttendees), [awaitingAttendees, searchQuery]);
  const filteredAll = useMemo(() => filterBySearch(allAttendees), [allAttendees, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-900/40 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Live Attendance & Pass Verification
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Attendance Desk
            </span>
          </div>
          <p className="text-xs sm:text-sm text-purple-300/70 mt-1">
            Illuminate 2026 &bull; IIT Bombay E-Cell / KMCT Venue Entry & Attendance Desk
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => fetchDashboardData()}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900 text-purple-300 border border-purple-700/40 transition-colors"
            title="Refresh stats"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/40 transition-colors"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            <span>Add Ticket</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/40 transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-purple-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => api.downloadAttendanceCsv()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/40 transition-colors"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Export CSV</span>
          </button>

          <Link
            to="/scanner"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-glow-purple transition-all"
          >
            <ScanLine className="w-4 h-4 animate-pulse" />
            <span>Entry Scanner</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatsCards stats={liveStats} />

      {/* Check-in Progress & Overview Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Live Check-in Progress
            </h2>
            <p className="text-xs text-purple-300/70 mt-0.5">
              {liveStats.checkedIn} of {liveStats.totalRegistrations} participants verified present ({liveStats.remaining} remaining)
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-400">
              {liveStats.totalRegistrations ? Math.round((liveStats.checkedIn / liveStats.totalRegistrations) * 100) : 0}%
            </span>
            <span className="text-xs text-purple-400/80 block">Attendance Rate</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-dark-950 h-3.5 rounded-full overflow-hidden border border-purple-900/50 p-0.5">
          <div
            className="bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-glow-green"
            style={{
              width: `${liveStats.totalRegistrations ? (liveStats.checkedIn / liveStats.totalRegistrations) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Main Attendance Section Hub */}
      <div className="glass-panel rounded-3xl border border-purple-500/20 overflow-hidden shadow-xl">
        {/* Navigation Tabs and Search Bar */}
        <div className="p-4 sm:p-6 border-b border-purple-900/40 bg-purple-950/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('present')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'present'
                  ? 'bg-emerald-600 text-white shadow-glow-green'
                  : 'bg-dark-900/70 text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-900/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Present / Checked In</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'present' ? 'bg-emerald-800 text-white' : 'bg-purple-900 text-purple-200'
              }`}>
                {checkedInAttendees.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('awaiting')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'awaiting'
                  ? 'bg-amber-600 text-white shadow-glow-amber'
                  : 'bg-dark-900/70 text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-900/50'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Awaiting Arrival</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'awaiting' ? 'bg-amber-800 text-white' : 'bg-purple-900 text-purple-200'
              }`}>
                {awaitingAttendees.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-glow-purple'
                  : 'bg-dark-900/70 text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-900/50'
              }`}
            >
              <Users className="w-4 h-4 text-purple-300" />
              <span>All Registrations</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'all' ? 'bg-purple-800 text-white' : 'bg-purple-900 text-purple-200'
              }`}>
                {allAttendees.length || 38}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : 'bg-dark-900/70 text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-900/50'
              }`}
            >
              <ScanLine className="w-4 h-4 text-indigo-300" />
              <span>Gate Scan Logs</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'logs' ? 'bg-indigo-800 text-white' : 'bg-purple-900 text-purple-200'
              }`}>
                {logs.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== 'logs' && (
            <div className="relative min-w-[260px] sm:min-w-[320px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                placeholder="Search attendee, ticket ID, college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-dark-900/80 border border-purple-700/50 text-white text-xs sm:text-sm placeholder-purple-400/50 focus:outline-none focus:border-purple-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab 1: Present / Checked In Attendees */}
        {activeTab === 'present' && (
          <div className="overflow-x-auto">
            {filteredCheckedIn.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-purple-950/50 text-[11px] uppercase font-bold text-purple-300/80 tracking-wider border-b border-purple-900/30">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Check-in Time</th>
                    <th className="py-3.5 px-4 sm:px-6">Participant</th>
                    <th className="py-3.5 px-4 sm:px-6">Ticket ID</th>
                    <th className="py-3.5 px-4 sm:px-6">College / Course</th>
                    <th className="py-3.5 px-4 sm:px-6">Verified By</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20 text-purple-100">
                  {filteredCheckedIn.map((ticket) => (
                    <tr key={ticket.ticketId} className="hover:bg-emerald-950/20 transition-colors">
                      {/* Check-in Time */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            {formatTime(ticket.checkedInAt)}
                          </span>
                          <span className="text-[10px] text-purple-300/70 mt-0.5">
                            {getRelativeTime(ticket.checkedInAt)}
                          </span>
                        </div>
                      </td>

                      {/* Participant */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center font-bold text-white text-xs border border-emerald-400/30 shadow-sm shrink-0">
                            {ticket.participantName ? ticket.participantName.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">
                              {ticket.participantName}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-purple-300/70 mt-0.5">
                              {ticket.phone && <span>{ticket.phone}</span>}
                              {ticket.email && <span className="truncate max-w-[150px]">{ticket.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ticket ID */}
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-purple-200 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                            {ticket.ticketId}
                          </span>
                          <button
                            onClick={() => handleCopyTicket(ticket.ticketId)}
                            className="p-1 hover:bg-purple-900/60 rounded text-purple-400 hover:text-white transition-colors"
                            title="Copy ticket ID"
                          >
                            {copiedId === ticket.ticketId ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* College / Course */}
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-purple-200">
                        <div className="font-medium text-white truncate max-w-[200px]" title={ticket.college}>
                          {ticket.college || 'KMCT College'}
                        </div>
                        <div className="text-[11px] text-purple-300/70 truncate max-w-[200px]">
                          {ticket.course} {ticket.yearOfStudy ? `(${ticket.yearOfStudy})` : ''}
                        </div>
                      </td>

                      {/* Verified By */}
                      <td className="py-3.5 px-4 sm:px-6 text-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          {ticket.checkedInBy || 'Attendance Desk'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/ticket/${ticket.ticketId}`}
                            className="p-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800 text-purple-300 hover:text-white transition-colors"
                            title="View digital pass"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleUndoCheckin(ticket)}
                            disabled={actionLoadingId === ticket.ticketId}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/40 transition-colors"
                            title="Undo check-in"
                          >
                            <RotateCcw className={`w-4 h-4 ${actionLoadingId === ticket.ticketId ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 sm:p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-glow-green">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">No Attendees Checked In Yet</h3>
                  <p className="text-xs text-purple-300/70 max-w-md mx-auto mt-1">
                    Passes scanned on the Entry Scanner will appear here immediately. You can also click "Check In" on any participant below:
                  </p>
                </div>

                {/* Quick Check-in Preview from Awaiting List */}
                <div className="max-w-2xl mx-auto text-left pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-900/40 text-xs font-bold text-purple-300">
                    <span>Awaiting Attendees ({awaitingAttendees.length})</span>
                    <button
                      onClick={() => setActiveTab('awaiting')}
                      className="text-purple-400 hover:text-white underline text-xs"
                    >
                      View All Awaiting &rarr;
                    </button>
                  </div>
                  <div className="divide-y divide-purple-900/30 max-h-60 overflow-y-auto">
                    {awaitingAttendees.slice(0, 6).map((a) => (
                      <div key={a.ticketId} className="flex items-center justify-between py-2 px-1">
                        <div>
                          <div className="font-bold text-white text-xs">{a.participantName}</div>
                          <div className="text-[10px] text-purple-300/60 font-mono">{a.ticketId} &bull; {a.course}</div>
                        </div>
                        <button
                          onClick={() => handleQuickCheckin(a)}
                          disabled={actionLoadingId === a.ticketId}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-green transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{actionLoadingId === a.ticketId ? 'Checking...' : 'Check In'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/scanner"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-glow-purple"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>Launch Pass Scanner</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Awaiting Attendees (Absent) */}
        {activeTab === 'awaiting' && (
          <div className="overflow-x-auto">
            {filteredAwaiting.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-purple-950/50 text-[11px] uppercase font-bold text-purple-300/80 tracking-wider border-b border-purple-900/30">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Status</th>
                    <th className="py-3.5 px-4 sm:px-6">Participant</th>
                    <th className="py-3.5 px-4 sm:px-6">Ticket ID</th>
                    <th className="py-3.5 px-4 sm:px-6">College / Course</th>
                    <th className="py-3.5 px-4 sm:px-6">Contact</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Desk Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20 text-purple-100">
                  {filteredAwaiting.map((ticket) => (
                    <tr key={ticket.ticketId} className="hover:bg-amber-950/20 transition-colors">
                      {/* Status */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          Awaiting
                        </span>
                      </td>

                      {/* Participant */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center font-bold text-white text-xs border border-purple-500/30 shadow-sm shrink-0">
                            {ticket.participantName ? ticket.participantName.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">
                              {ticket.participantName}
                            </div>
                            <div className="text-[11px] text-purple-300/70 mt-0.5 truncate max-w-[180px]">
                              {ticket.email || '--'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ticket ID */}
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-purple-200 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                            {ticket.ticketId}
                          </span>
                          <button
                            onClick={() => handleCopyTicket(ticket.ticketId)}
                            className="p-1 hover:bg-purple-900/60 rounded text-purple-400 hover:text-white transition-colors"
                            title="Copy ticket ID"
                          >
                            {copiedId === ticket.ticketId ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* College / Course */}
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-purple-200">
                        <div className="font-medium text-white truncate max-w-[200px]" title={ticket.college}>
                          {ticket.college || 'KMCT College'}
                        </div>
                        <div className="text-[11px] text-purple-300/70 truncate max-w-[200px]">
                          {ticket.course} {ticket.yearOfStudy ? `(${ticket.yearOfStudy})` : ''}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 sm:px-6 text-xs">
                        {ticket.phone ? (
                          <a
                            href={`tel:${ticket.phone}`}
                            className="inline-flex items-center gap-1.5 text-purple-300 hover:text-white font-mono hover:underline"
                          >
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{ticket.phone}</span>
                          </a>
                        ) : (
                          <span className="text-purple-400/50">--</span>
                        )}
                      </td>

                      {/* Desk Action: Quick Check-in */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/ticket/${ticket.ticketId}`}
                            className="p-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800 text-purple-300 hover:text-white transition-colors"
                            title="View digital pass"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleQuickCheckin(ticket)}
                            disabled={actionLoadingId === ticket.ticketId}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-green transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{actionLoadingId === ticket.ticketId ? 'Checking...' : 'Check In'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">All Participants Checked In!</h3>
                <p className="text-xs text-purple-300/70">
                  Every registered participant has arrived and checked in at the event.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: All Registrations (38) */}
        {activeTab === 'all' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-purple-950/50 text-[11px] uppercase font-bold text-purple-300/80 tracking-wider border-b border-purple-900/30">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Attendance Status</th>
                  <th className="py-3.5 px-4 sm:px-6">Participant</th>
                  <th className="py-3.5 px-4 sm:px-6">Ticket ID</th>
                  <th className="py-3.5 px-4 sm:px-6">College / Course</th>
                  <th className="py-3.5 px-4 sm:px-6">Scan Time</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/20 text-purple-100">
                {filteredAll.map((ticket) => (
                  <tr key={ticket.ticketId} className="hover:bg-purple-900/10 transition-colors">
                    {/* Attendance Status */}
                    <td className="py-3.5 px-4 sm:px-6">
                      {ticket.checkedIn ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>PRESENT</span>
                        </span>
                      ) : ticket.status === 'CANCELLED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-500/50">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>CANCELLED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>AWAITING</span>
                        </span>
                      )}
                    </td>

                    {/* Participant */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-bold text-white text-sm">
                        {ticket.participantName}
                      </div>
                      <div className="text-[11px] text-purple-300/70 mt-0.5">
                        {ticket.phone} &bull; {ticket.email}
                      </div>
                    </td>

                    {/* Ticket ID */}
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-xs">
                      <span className="font-semibold text-purple-200 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                        {ticket.ticketId}
                      </span>
                    </td>

                    {/* College / Course */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs text-purple-200">
                      <div className="font-medium text-white truncate max-w-[200px]">
                        {ticket.college || 'KMCT College'}
                      </div>
                      <div className="text-[11px] text-purple-300/70 truncate max-w-[200px]">
                        {ticket.course}
                      </div>
                    </td>

                    {/* Scan Time */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs font-mono text-purple-300">
                      {ticket.checkedIn ? formatTime(ticket.checkedInAt) : '--:--'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/ticket/${ticket.ticketId}`}
                          className="p-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800 text-purple-300 hover:text-white transition-colors"
                          title="View pass"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {ticket.checkedIn ? (
                          <button
                            onClick={() => handleUndoCheckin(ticket)}
                            disabled={actionLoadingId === ticket.ticketId}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors"
                            title="Undo check-in"
                          >
                            <RotateCcw className={`w-4 h-4 ${actionLoadingId === ticket.ticketId ? 'animate-spin' : ''}`} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleQuickCheckin(ticket)}
                            disabled={actionLoadingId === ticket.ticketId}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-green transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Check In</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Gate Scan Activity Logs */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-purple-950/50 text-[11px] uppercase font-bold text-purple-300/80 tracking-wider border-b border-purple-900/30">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Scan Time</th>
                  <th className="py-3.5 px-4 sm:px-6">Ticket ID</th>
                  <th className="py-3.5 px-4 sm:px-6">Participant Name</th>
                  <th className="py-3.5 px-4 sm:px-6">Scan Result</th>
                  <th className="py-3.5 px-4 sm:px-6">Scanner / Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/20 text-purple-100">
                {logs && logs.length > 0 ? (
                  logs.slice(0, 30).map((log) => {
                    const isSuccess = log.result === 'SUCCESS' || log.status === 'SUCCESS' || log.result === 'VALID';
                    const isAlreadyUsed = log.result === 'ALREADY_USED' || log.status === 'ALREADY_USED';
                    const isInvalid = log.result === 'INVALID' || log.status === 'INVALID';
                    const isCancelled = log.result === 'CANCELLED' || log.status === 'CANCELLED';
                    const isUndo = log.result === 'UNDO' || log.status === 'UNDO_CHECKIN';

                    let badge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Valid Entry
                      </span>
                    );

                    if (isAlreadyUsed) {
                      badge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" /> Already Used
                        </span>
                      );
                    } else if (isInvalid) {
                      badge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" /> Invalid Pass
                        </span>
                      );
                    } else if (isCancelled) {
                      badge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-500/30">
                          <XCircle className="w-3 h-3" /> Cancelled
                        </span>
                      );
                    } else if (isUndo) {
                      badge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/60 text-indigo-400 border border-indigo-500/30">
                          <RotateCcw className="w-3 h-3" /> Check-in Undone
                        </span>
                      );
                    }

                    return (
                      <tr key={log.id} className="hover:bg-purple-900/10 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 text-xs text-purple-300 font-mono">
                          {formatTime(log.scannedAt)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-mono text-xs text-purple-200 font-bold">
                          {log.ticketId}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                          {log.participantName || <span className="text-purple-400/50 italic">Unregistered QR</span>}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          {badge}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-xs text-purple-300">
                          {log.scannedBy || 'Scanner'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-purple-400/60 text-sm">
                      No scan activity recorded yet. Scans from the /scanner page will appear here instantly.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ManualTicketModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />
    </div>
  );
}
