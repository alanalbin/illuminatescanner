import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QrCode, LayoutDashboard, Ticket, Settings, ScanLine, UserCheck, Sparkles, MapPin } from 'lucide-react';
import { localAttendanceStore } from '../services/localAttendanceStore';

export default function Navbar() {
  const location = useLocation();
  const [stats, setStats] = useState(() => localAttendanceStore.getStats());

  useEffect(() => {
    const updateStats = () => {
      try {
        setStats(localAttendanceStore.getStats());
      } catch (e) {
        console.warn('Navbar stats error:', e);
      }
    };

    window.addEventListener('illuminate_attendance_updated', updateStats);
    window.addEventListener('storage', updateStats);
    const interval = setInterval(updateStats, 4000);

    return () => {
      window.removeEventListener('illuminate_attendance_updated', updateStats);
      window.removeEventListener('storage', updateStats);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { label: 'Pass Scanner', path: '/scanner', icon: ScanLine, highlight: true },
    { label: 'Live Attendance', path: '/attendance', icon: LayoutDashboard },
    { label: 'Attendee List', path: '/tickets', icon: Ticket },
    { label: 'QR Passes', path: '/passes', icon: QrCode },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-dark-950/90 border-b border-purple-900/40">
      
      {/* Tier 1: Official Organizers Co-Branded Institutional Ribbon */}
      <div className="w-full border-b border-purple-900/30 bg-black/40 px-3 sm:px-6 py-1.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          
          {/* Partner Logos Strip with Normalized Heights and Optical Alignments */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-purple-300/70 shrink-0">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Organized By
            </span>

            <div className="flex items-center gap-2.5 sm:gap-3 bg-white/[0.03] px-2.5 py-1 rounded-xl border border-purple-500/20 shadow-sm shrink-0">
              {/* E-Cell IIT Bombay */}
              <img 
                src="/logos/ecell-iitb.png" 
                alt="E-Cell IIT Bombay" 
                className="h-5 sm:h-6 w-auto object-contain hover:scale-105 transition-transform brightness-110 drop-shadow" 
                title="The Entrepreneurship Cell, IIT Bombay"
              />
              
              <div className="w-px h-3.5 sm:h-4 bg-purple-500/30" />

              {/* NEC 2026 */}
              <img 
                src="/logos/nec-iitb.png" 
                alt="NEC 2026" 
                className="h-4.5 sm:h-5 w-auto object-contain hover:scale-105 transition-transform drop-shadow" 
                title="National Entrepreneurship Challenge 2026"
              />

              <div className="w-px h-3.5 sm:h-4 bg-purple-500/30" />

              {/* KMCT College of Engineering */}
              <img 
                src="/logos/kmct-college.png" 
                alt="KMCT College" 
                className="h-4 sm:h-5 w-auto object-contain hover:scale-105 transition-transform drop-shadow" 
                title="KMCT College of Engineering, Kasaragod"
              />

              <div className="w-px h-3.5 sm:h-4 bg-purple-500/30" />

              {/* NxT Byte E-Cell */}
              <img 
                src="/logos/nxtbyte-ecell.png" 
                alt="NxT Byte E-Cell" 
                className="h-5 sm:h-6 w-auto object-contain hover:scale-105 transition-transform drop-shadow" 
                title="Organized by Nxt Byte E-Cell"
              />
            </div>
          </div>

          {/* Right Event Ribbon Metadata */}
          <div className="flex items-center gap-2 text-[11px] shrink-0 ml-auto">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-200">
              <MapPin className="w-3 h-3 text-purple-400" />
              <span>22 Oct 2026 &bull; KMCT Kasaragod</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-[10px] font-bold text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Gate Live</span>
            </div>
          </div>

        </div>
      </div>

      {/* Tier 2: Main Brand & Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Beautiful Illuminated Brand Sign */}
        <Link to="/scanner" className="flex items-center gap-3 group shrink-0">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-600 to-indigo-700 p-0.5 shadow-[0_0_20px_rgba(168,85,247,0.45)] group-hover:shadow-[0_0_28px_rgba(217,70,239,0.6)] transition-all">
            <div className="w-full h-full bg-dark-950 rounded-[14px] flex items-center justify-center overflow-hidden">
              <img 
                src="/logos/torch-icon.png" 
                alt="Illuminate Flame" 
                className="w-6 h-6 object-contain filter brightness-110 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)] group-hover:scale-110 transition-transform"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <QrCode className="w-5 h-5 text-purple-400 hidden group-hover:scale-110 transition-transform" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black tracking-wider text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-fuchsia-100 to-white drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                ILLUMINATE
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-900 to-fuchsia-950 text-purple-200 border border-purple-500/50 shadow-glow-purple">
                2026
              </span>
            </div>
            <p className="text-[11px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-200 flex items-center gap-1.5">
              <span>IIT Bombay E-Cell</span>
              <span className="text-purple-500">&bull;</span>
              <span>KMCT Attendance Desk</span>
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path === '/attendance' && (location.pathname === '/admin' || location.pathname === '/dashboard'));

            if (item.highlight) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all shadow-glow-purple ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-glow-purple-lg'
                      : 'bg-purple-950/70 text-purple-200 border border-purple-500/40 hover:bg-purple-600 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 animate-pulse" />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-purple-900/40 border border-purple-500/30'
                    : 'text-purple-200/70 hover:text-white hover:bg-purple-900/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Badge & Mobile Scan */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Live Check-in Counter Pill (Live real-time count synced across all tabs) */}
          <Link
            to="/attendance"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-xs transition-colors shadow-sm"
            title="Click to view live attendee check-in roster"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <div className="flex items-center gap-1 font-bold">
              <span className="text-emerald-400">{stats.checkedIn}</span>
              <span className="text-purple-400/80">/</span>
              <span className="text-white">{stats.totalRegistrations || 51}</span>
            </div>
            <span className="hidden sm:inline text-purple-300/80 text-[11px] font-medium">Checked In</span>
          </Link>

          {/* Mobile Quick Scanner Button */}
          <Link
            to="/scanner"
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 text-white shadow-glow-purple hover:bg-purple-500 transition-all"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Scan</span>
          </Link>

        </div>

      </div>
    </header>
  );
}
