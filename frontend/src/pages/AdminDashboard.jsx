import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
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
  UserCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const data = await api.getStats();
      if (data && typeof data === 'object') {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setStats(localAttendanceStore.getStats());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 5 seconds for live check-in monitoring
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);
    return () => clearInterval(interval);
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
              Live Attendance
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
      <StatsCards stats={stats} />

      {/* Check-in Progress & Overview Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              Check-in Progress
            </h2>
            <p className="text-xs text-purple-300/70 mt-0.5">
              {stats?.checkedIn || 0} of {stats?.totalRegistrations || 38} participants verified
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-400">
              {stats?.totalRegistrations ? Math.round(((stats.checkedIn || 0) / stats.totalRegistrations) * 100) : 0}%
            </span>
            <span className="text-xs text-purple-400/80 block">Completed</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-dark-950 h-3 rounded-full overflow-hidden border border-purple-900/50 p-0.5">
          <div
            className="bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-glow-green"
            style={{
              width: `${stats?.totalRegistrations ? ((stats.checkedIn || 0) / stats.totalRegistrations) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Recent Check-in Logs Table */}
      <div className="glass-panel rounded-3xl border border-purple-500/20 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-purple-900/40 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Recent Check-ins & Audit Logs
            </h2>
            <p className="text-xs text-purple-300/70 mt-0.5">
              Live chronological record of scans at venue gates
            </p>
          </div>
          <Link
            to="/tickets"
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 hover:underline"
          >
            <span>View All Tickets</span>
            <Ticket className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-purple-950/40 text-[11px] uppercase font-bold text-purple-300/80 tracking-wider border-b border-purple-900/30">
              <tr>
                <th className="py-3 px-4 sm:px-6">Scan Time</th>
                <th className="py-3 px-4 sm:px-6">Ticket ID</th>
                <th className="py-3 px-4 sm:px-6">Participant Name</th>
                <th className="py-3 px-4 sm:px-6">Result</th>
                <th className="py-3 px-4 sm:px-6">Scanner / Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/20 text-purple-100">
              {stats?.recentCheckins && stats.recentCheckins.length > 0 ? (
                stats.recentCheckins.slice(0, 15).map((log) => {
                  let badge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> Valid Entry
                    </span>
                  );
                  if (log.result === 'ALREADY_USED') {
                    badge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" /> Already Used
                      </span>
                    );
                  } else if (log.result === 'INVALID') {
                    badge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-500/30">
                        <XCircle className="w-3 h-3" /> Invalid Pass
                      </span>
                    );
                  } else if (log.result === 'CANCELLED') {
                    badge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-500/30">
                        <XCircle className="w-3 h-3" /> Cancelled
                      </span>
                    );
                  }

                  return (
                    <tr key={log.id} className="hover:bg-purple-900/10 transition-colors">
                      <td className="py-3 px-4 sm:px-6 text-xs text-purple-300 font-mono">
                        {formatTime(log.scannedAt)}
                      </td>
                      <td className="py-3 px-4 sm:px-6 font-mono text-xs text-purple-200 font-bold">
                        {log.ticketId}
                      </td>
                      <td className="py-3 px-4 sm:px-6 font-medium text-white">
                        {log.participantName || <span className="text-purple-400/50 italic">Unregistered QR</span>}
                      </td>
                      <td className="py-3 px-4 sm:px-6">
                        {badge}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-xs text-purple-300">
                        {log.scannedBy || 'Admin'}
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
