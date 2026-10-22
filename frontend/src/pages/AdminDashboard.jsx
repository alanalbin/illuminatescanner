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
  GraduationCap,
  Star,
  MessageSquareHeart,
  ThumbsUp,
  Trash2,
  Award,
  Heart
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(() => localAttendanceStore.getStats());
  const [tickets, setTickets] = useState(() => localAttendanceStore.getTickets());
  const [feedbacks, setFeedbacks] = useState(() => localAttendanceStore.getFeedbacks());
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('all');
  const [copiedFeedbackUrl, setCopiedFeedbackUrl] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('present'); // 'present' | 'awaiting' | 'all' | 'logs' | 'feedback'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const debounceTimerRef = useRef(null);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [statsData, ticketsData, feedbacksData] = await Promise.all([
        api.getStats().catch(err => { console.warn('Stats err:', err); return null; }),
        api.getTickets().catch(err => { console.warn('Tickets err:', err); return []; }),
        api.getFeedbacks().catch(err => { console.warn('Feedbacks err:', err); return []; })
      ]);
      if (statsData) setStats(statsData);
      if (Array.isArray(ticketsData) && ticketsData.length > 0) {
        setTickets(ticketsData);
      }
      if (Array.isArray(feedbacksData)) {
        setFeedbacks(feedbacksData);
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
    const total = allAttendees.length || stats?.totalRegistrations || 0;
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

  const feedbackStats = useMemo(() => {
    return localAttendanceStore.getFeedbackStats();
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(fb => {
      if (feedbackRatingFilter !== 'all') {
        if (Math.round(fb.overallRating) !== Number(feedbackRatingFilter)) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (fb.participantName && fb.participantName.toLowerCase().includes(q)) ||
        (fb.ticketId && fb.ticketId.toLowerCase().includes(q)) ||
        (fb.college && fb.college.toLowerCase().includes(q)) ||
        (fb.course && fb.course.toLowerCase().includes(q)) ||
        (fb.likedMost && fb.likedMost.toLowerCase().includes(q)) ||
        (fb.suggestions && fb.suggestions.toLowerCase().includes(q))
      );
    });
  }, [feedbacks, feedbackRatingFilter, searchQuery]);

  const handleDeleteFeedback = async (id, participantName) => {
    if (!window.confirm(`Delete feedback submission from ${participantName || 'attendee'}?`)) return;
    try {
      await api.deleteFeedback(id);
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      fetchDashboardData(true);
    } catch (e) {
      alert('Failed to delete feedback: ' + (e.message || 'Error'));
    }
  };

  const handleCopyFeedbackUrl = () => {
    const url = `${window.location.origin}/feedback`;
    navigator.clipboard?.writeText(url);
    setCopiedFeedbackUrl(true);
    setTimeout(() => setCopiedFeedbackUrl(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">
      {/* Official Organizers & Partners Banner */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl glass-card shadow-lg shadow-purple-950/20">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-300/80 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Organized by IIT Bombay E-Cell & KMCT Kasaragod</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto no-scrollbar w-full sm:w-auto py-1 justify-center sm:justify-end">
          <img src="/logos/ecell-iitb.png" alt="E-Cell IIT Bombay" className="h-5 sm:h-7 w-auto object-contain filter drop-shadow brightness-110 hover:scale-105 transition-all shrink-0" title="E-Cell IIT Bombay" />
          <div className="w-px h-4 bg-purple-500/30 shrink-0" />
          <img src="/logos/nec-iitb.png" alt="NEC 2026" className="h-5 sm:h-7 w-auto object-contain filter drop-shadow hover:scale-105 transition-all shrink-0" title="National Entrepreneurship Challenge 2026" />
          <div className="w-px h-4 bg-purple-500/30 shrink-0" />
          <img src="/logos/kmct-college.png" alt="KMCT College" className="h-4 sm:h-6 w-auto object-contain filter drop-shadow hover:scale-105 transition-all shrink-0" title="KMCT College of Engineering" />
          <div className="w-px h-4 bg-purple-500/30 shrink-0" />
          <img src="/logos/nxtbyte-ecell.png" alt="NxT Byte E-Cell" className="h-4.5 sm:h-6 w-auto object-contain filter drop-shadow hover:scale-105 transition-all shrink-0" title="NxT Byte E-Cell" />
        </div>
      </div>

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-900/40 pb-4 sm:pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Live Attendance & Pass Desk
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Real-time Synced
            </span>
          </div>
          <p className="text-xs sm:text-sm text-purple-300/70 mt-1">
            Illuminate 2026 &bull; IIT Bombay E-Cell / KMCT Venue Entry & Attendance Desk
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => fetchDashboardData()}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-700/40 transition-colors shrink-0 active:scale-95"
            title="Refresh stats"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/40 transition-colors shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            <span>Add Ticket</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/40 transition-colors shrink-0 active:scale-95"
          >
            <UploadCloud className="w-4 h-4 text-purple-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => api.downloadAttendanceCsv()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-600/40 transition-colors shrink-0 active:scale-95"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Export CSV</span>
          </button>

          <Link
            to="/scanner"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-glow-purple transition-all shrink-0 active:scale-95"
          >
            <ScanLine className="w-4 h-4 animate-pulse" />
            <span>Scanner</span>
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
                {allAttendees.length}
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

            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'feedback'
                  ? 'bg-gradient-to-r from-amber-600 via-purple-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.45)]'
                  : 'bg-dark-900/70 text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-900/50'
              }`}
            >
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Student Feedback</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'feedback' ? 'bg-amber-800 text-white' : 'bg-purple-900 text-purple-200'
              }`}>
                {feedbacks.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== 'logs' && (
            <div className="relative min-w-[260px] sm:min-w-[320px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                placeholder={activeTab === 'feedback' ? "Search student, review, suggestions..." : "Search attendee, ticket ID, college..."}
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
          <div>
            {filteredCheckedIn.length > 0 ? (
              <>
                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto">
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

                          <td className="py-3.5 px-4 sm:px-6 text-xs text-purple-200">
                            <div className="font-medium text-white truncate max-w-[200px]" title={ticket.college}>
                              {ticket.college || 'KMCT College'}
                            </div>
                            <div className="text-[11px] text-purple-300/70 truncate max-w-[200px]">
                              {ticket.course} {ticket.yearOfStudy ? `(${ticket.yearOfStudy})` : ''}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-xs">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                              {ticket.checkedInBy || 'Attendance Desk'}
                            </span>
                          </td>

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
                </div>

                {/* Mobile Cards View (< md) - Clean, Uncrowded & Touch-friendly */}
                <div className="block md:hidden p-2.5 sm:p-3 space-y-2.5">
                  {filteredCheckedIn.map((ticket) => (
                    <div key={ticket.ticketId} className="p-3.5 rounded-2xl glass-card border border-emerald-500/30 space-y-2.5 shadow-md">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center font-bold text-white text-xs border border-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.3)] shrink-0">
                            {ticket.participantName ? ticket.participantName.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-sm truncate leading-tight">{ticket.participantName}</h4>
                            <p className="text-[11px] text-purple-300/70 truncate">{ticket.course || 'Engineering'} {ticket.yearOfStudy ? `(${ticket.yearOfStudy})` : ''}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Present</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-900/30">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40 font-bold">
                            {ticket.ticketId}
                          </span>
                          <button
                            onClick={() => handleCopyTicket(ticket.ticketId)}
                            className="p-1 hover:bg-purple-900/60 rounded text-purple-400 hover:text-white"
                          >
                            {copiedId === ticket.ticketId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {formatTime(ticket.checkedInAt)}
                        </span>
                      </div>

                      {ticket.college && (
                        <div className="text-[11px] text-purple-300/75 truncate">
                          {ticket.college}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-900/30">
                        <Link
                          to={`/ticket/${ticket.ticketId}`}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 text-purple-200 border border-purple-800/40 text-xs font-semibold transition-all active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Pass</span>
                        </Link>
                        <button
                          onClick={() => handleUndoCheckin(ticket)}
                          disabled={actionLoadingId === ticket.ticketId}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/40 text-xs font-bold transition-all active:scale-95"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${actionLoadingId === ticket.ticketId ? 'animate-spin' : ''}`} />
                          <span>Undo Entry</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
          <div>
            {filteredAwaiting.length > 0 ? (
              <>
                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto">
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
                          <td className="py-3.5 px-4 sm:px-6">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              Awaiting
                            </span>
                          </td>

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

                          <td className="py-3.5 px-4 sm:px-6 text-xs text-purple-200">
                            <div className="font-medium text-white truncate max-w-[200px]" title={ticket.college}>
                              {ticket.college || 'KMCT College'}
                            </div>
                            <div className="text-[11px] text-purple-300/70 truncate max-w-[200px]">
                              {ticket.course} {ticket.yearOfStudy ? `(${ticket.yearOfStudy})` : ''}
                            </div>
                          </td>

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
                </div>

                {/* Mobile Cards View (< md) */}
                <div className="block md:hidden p-2.5 sm:p-3 space-y-2.5">
                  {filteredAwaiting.map((ticket) => (
                    <div key={ticket.ticketId} className="p-3.5 rounded-2xl glass-card border border-amber-500/30 space-y-2.5 shadow-md">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center font-bold text-white text-xs border border-purple-500/30 shrink-0">
                            {ticket.participantName ? ticket.participantName.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-sm truncate leading-tight">{ticket.participantName}</h4>
                            <p className="text-[11px] text-purple-300/70 truncate">{ticket.course || 'Engineering'} {ticket.yearOfStudy ? `(${ticket.yearOfStudy})` : ''}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 shrink-0">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Awaiting</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-900/30">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40 font-bold">
                            {ticket.ticketId}
                          </span>
                          <button
                            onClick={() => handleCopyTicket(ticket.ticketId)}
                            className="p-1 hover:bg-purple-900/60 rounded text-purple-400 hover:text-white"
                          >
                            {copiedId === ticket.ticketId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        {ticket.phone ? (
                          <a href={`tel:${ticket.phone}`} className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{ticket.phone}</span>
                          </a>
                        ) : null}
                      </div>

                      {ticket.college && (
                        <div className="text-[11px] text-purple-300/75 truncate">
                          {ticket.college}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-900/30">
                        <Link
                          to={`/ticket/${ticket.ticketId}`}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 text-purple-200 border border-purple-800/40 text-xs font-semibold transition-all active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Pass</span>
                        </Link>
                        <button
                          onClick={() => handleQuickCheckin(ticket)}
                          disabled={actionLoadingId === ticket.ticketId}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{actionLoadingId === ticket.ticketId ? 'Checking...' : 'Check In'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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

        {/* Tab 3: All Registrations */}
        {activeTab === 'all' && (
          <div>
            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
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

                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-white text-sm">
                          {ticket.participantName}
                        </div>
                        <div className="text-[11px] text-purple-300/70 mt-0.5">
                          {ticket.phone} &bull; {ticket.email}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-purple-200 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                            {ticket.ticketId}
                          </span>
                          <button
                            onClick={() => handleCopyTicket(ticket.ticketId)}
                            className="p-1 hover:bg-purple-900/60 rounded text-purple-400 hover:text-white"
                          >
                            {copiedId === ticket.ticketId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-xs text-purple-200">
                        <div className="font-medium text-white truncate max-w-[200px]">
                          {ticket.college || 'KMCT College'}
                        </div>
                        <div className="text-[11px] text-purple-300/70 truncate max-w-[200px]">
                          {ticket.course}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-xs font-mono text-purple-300">
                        {ticket.checkedIn ? formatTime(ticket.checkedInAt) : '--:--'}
                      </td>

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

            {/* Mobile Cards View (< md) */}
            <div className="block md:hidden p-2.5 sm:p-3 space-y-2.5">
              {filteredAll.map((ticket) => (
                <div key={ticket.ticketId} className="p-3.5 rounded-2xl glass-card space-y-2.5 shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs border shrink-0 ${
                        ticket.checkedIn 
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'bg-gradient-to-br from-purple-700 to-indigo-800 border-purple-500/30'
                      }`}>
                        {ticket.participantName ? ticket.participantName.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate leading-tight">{ticket.participantName}</h4>
                        <p className="text-[11px] text-purple-300/70 truncate">{ticket.course || 'Engineering'} {ticket.yearOfStudy ? `(${ticket.yearOfStudy})` : ''}</p>
                      </div>
                    </div>
                    {ticket.checkedIn ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Present</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 shrink-0">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Awaiting</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-900/30">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40 font-bold">
                        {ticket.ticketId}
                      </span>
                      <button
                        onClick={() => handleCopyTicket(ticket.ticketId)}
                        className="p-1 hover:bg-purple-900/60 rounded text-purple-400 hover:text-white"
                      >
                        {copiedId === ticket.ticketId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    {ticket.checkedIn ? (
                      <span className="text-[11px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {formatTime(ticket.checkedInAt)}
                      </span>
                    ) : ticket.phone ? (
                      <a href={`tel:${ticket.phone}`} className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{ticket.phone}</span>
                      </a>
                    ) : null}
                  </div>

                  {ticket.college && (
                    <div className="text-[11px] text-purple-300/75 truncate">
                      {ticket.college}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-900/30">
                    <Link
                      to={`/ticket/${ticket.ticketId}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 text-purple-200 border border-purple-800/40 text-xs font-semibold transition-all active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Pass</span>
                    </Link>
                    {ticket.checkedIn ? (
                      <button
                        onClick={() => handleUndoCheckin(ticket)}
                        disabled={actionLoadingId === ticket.ticketId}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/40 text-xs font-bold transition-all active:scale-95"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${actionLoadingId === ticket.ticketId ? 'animate-spin' : ''}`} />
                        <span>Undo Entry</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuickCheckin(ticket)}
                        disabled={actionLoadingId === ticket.ticketId}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === ticket.ticketId ? 'Checking...' : 'Check In'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

        {/* Tab 5: Student Feedback & Workshop Experience Hub */}
        {activeTab === 'feedback' && (
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* KPI Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Overall Average Rating */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-dark-900 to-purple-950/30 border border-amber-500/30 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Overall Rating</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {feedbackStats.avgRating > 0 ? feedbackStats.avgRating : '5.0'}
                  </span>
                  <span className="text-sm font-bold text-amber-400">/ 5.0</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= Math.round(feedbackStats.avgRating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] text-purple-300/70 ml-1.5 font-medium">
                    ({feedbackStats.total} {feedbackStats.total === 1 ? 'response' : 'responses'})
                  </span>
                </div>
              </div>

              {/* Card 2: Recommendation Rate */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-dark-900 to-purple-950/30 border border-emerald-500/30 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Recommend Rate</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <ThumbsUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-400 tracking-tight">
                    {feedbackStats.recommendRate}%
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300/70 mt-2 font-medium">
                  Would definitely recommend ILLUMINATE to peers
                </p>
              </div>

              {/* Card 3: Pillar Averages */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/50 via-dark-900 to-indigo-950/40 border border-purple-500/30 shadow-lg space-y-2">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">Pillar Scores</span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300/90 font-medium">Mr. Naveen Paul:</span>
                    <span className="font-bold text-amber-300 font-mono">{feedbackStats.avgTrainer || feedbackStats.avgMentor || 5.0} ★</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300/90 font-medium">Workshop Program:</span>
                    <span className="font-bold text-purple-300 font-mono">{feedbackStats.avgProgram || feedbackStats.avgContent || 5.0} ★</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300/90">Event Organization:</span>
                    <span className="font-bold text-white font-mono">{feedbackStats.avgOrg || 5.0} ★</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Star Breakdown Bar Chart */}
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-purple-500/20 shadow-lg space-y-1.5">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">Star Distribution</span>
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = feedbackStats.distribution[s] || 0;
                  const pct = feedbackStats.total > 0 ? Math.round((count / feedbackStats.total) * 100) : 0;
                  return (
                    <div key={s} className="flex items-center gap-2 text-[10px]">
                      <span className="w-5 text-purple-300 font-bold">{s}★</span>
                      <div className="flex-1 bg-dark-950 h-2 rounded-full overflow-hidden border border-purple-900/40">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-7 text-right text-purple-400 font-mono">{count}</span>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Filter and Action Controls Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-dark-950/60 border border-purple-500/20">
              
              {/* Rating Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `All (${feedbacks.length})` },
                  { id: '5', label: `5 Stars ★ (${feedbackStats.distribution[5] || 0})` },
                  { id: '4', label: `4 Stars ★ (${feedbackStats.distribution[4] || 0})` },
                  { id: '3', label: `3 Stars ★ (${feedbackStats.distribution[3] || 0})` },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setFeedbackRatingFilter(chip.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      feedbackRatingFilter === chip.id
                        ? 'bg-amber-500 text-dark-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                        : 'bg-dark-900 text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-800/40'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Actions: Copy Link & Export CSV */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyFeedbackUrl}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-dark-900 hover:bg-purple-950 text-purple-200 border border-purple-600/40 transition-colors active:scale-95"
                  title="Copy student feedback form link for sharing on WhatsApp or projection"
                >
                  {copiedFeedbackUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
                  <span>{copiedFeedbackUrl ? 'LINK COPIED!' : 'COPY STUDENT LINK'}</span>
                </button>

                <button
                  onClick={() => api.downloadFeedbackCsv()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-glow-purple transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT FEEDBACK CSV</span>
                </button>

                <Link
                  to="/feedback"
                  target="_blank"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>PREVIEW STUDENT FORM</span>
                </Link>
              </div>

            </div>

            {/* Student Feedback Reviews Grid */}
            {filteredFeedbacks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFeedbacks.map((fb) => {
                  const rating = Number(fb.overallRating || fb.programRating) || 5;
                  const tRating = Number(fb.trainerRating || fb.mentorRating) || 5;
                  const pRating = Number(fb.programRating || fb.overallRating) || 5;
                  const initials = fb.participantName 
                    ? fb.participantName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'ST';

                  return (
                    <div
                      key={fb.id}
                      className="p-5 rounded-2xl bg-gradient-to-br from-dark-900/90 to-purple-950/30 border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 shadow-md group"
                    >
                      <div className="space-y-3">
                        {/* Student Header & Rating */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0">
                              {initials}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                <span>{fb.participantName}</span>
                                {fb.recommend === 'yes' && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                    Recommends
                                  </span>
                                )}
                              </h4>
                              <p className="text-[11px] text-purple-300/70">
                                {fb.course ? `${fb.course} &bull; ` : ''}{fb.college}
                              </p>
                              {fb.ticketId && (
                                <Link
                                  to={`/ticket/${fb.ticketId}`}
                                  className="text-[10px] font-mono text-purple-400 hover:text-purple-200 inline-flex items-center gap-1 mt-0.5 underline decoration-purple-500/30"
                                >
                                  <span>{fb.ticketId}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Overall Stars Badge */}
                          <div className="flex flex-col items-end shrink-0">
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-black text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{rating}.0</span>
                            </div>
                            <span className="text-[10px] text-purple-400/60 mt-1">
                              {getRelativeTime(fb.submittedAt)}
                            </span>
                          </div>
                        </div>

                        {/* Trainer Mr. Naveen Paul Section */}
                        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-300 flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              Trainer: Mr. Naveen Paul
                            </span>
                            <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                              {tRating}.0 ★
                            </span>
                          </div>
                          {(fb.trainerReview || fb.likedMost) && (
                            <p className="text-xs text-amber-100/90 italic">
                              "{fb.trainerReview || fb.likedMost}"
                            </p>
                          )}
                        </div>

                        {/* Workshop Program Section */}
                        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-purple-200 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              Workshop Program: ILLUMINATE
                            </span>
                            <span className="font-mono font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/30">
                              {pRating}.0 ★
                            </span>
                          </div>
                          {(fb.programReview || fb.suggestions) && (
                            <p className="text-xs text-purple-200/90 italic">
                              "{fb.programReview || fb.suggestions}"
                            </p>
                          )}
                        </div>

                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-purple-900/30 text-[11px] text-purple-400/60">
                        <span>Submitted: {new Date(fb.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(fb.submittedAt).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleDeleteFeedback(fb.id, fb.participantName)}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity p-1"
                          title="Delete feedback entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-dark-950/40 border border-purple-500/20 space-y-3">
                <MessageSquareHeart className="w-12 h-12 text-purple-400/40 mx-auto" />
                <h3 className="text-base font-bold text-white">No Feedbacks Found</h3>
                <p className="text-xs text-purple-300/70 max-w-sm mx-auto">
                  {searchQuery 
                    ? `No feedbacks match query "${searchQuery}". Try clearing search or rating filter.`
                    : 'No feedback submissions in this category yet. Share the feedback form link with students!'}
                </p>
                <div className="pt-2">
                  <Link
                    to="/feedback"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-glow-purple transition-all"
                  >
                    <span>Submit Sample Feedback</span>
                  </Link>
                </div>
              </div>
            )}

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
