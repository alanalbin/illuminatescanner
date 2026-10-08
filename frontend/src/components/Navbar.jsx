import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QrCode, LayoutDashboard, Ticket, Settings, ScanLine, UserCheck } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { label: 'Pass Scanner', path: '/scanner', icon: ScanLine, highlight: true },
    { label: 'Live Attendance', path: '/attendance', icon: LayoutDashboard },
    { label: 'Attendee List', path: '/tickets', icon: Ticket },
    { label: 'QR Passes', path: '/passes', icon: QrCode },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-900/40 bg-dark-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logos */}
        <Link to="/scanner" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 p-0.5 shadow-glow-purple">
            <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center overflow-hidden">
              <img 
                src="/logos/illuminate-torch.png" 
                alt="Illuminate Torch" 
                className="w-6 h-6 object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <QrCode className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-purple-100 to-white text-lg">
                ILLUMINATE
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/30">
                2026
              </span>
            </div>
            <p className="text-[11px] text-purple-300/70 font-medium tracking-tight">
              IIT Bombay E-Cell &bull; KMCT Attendance Desk
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path === '/attendance' && (location.pathname === '/admin' || location.pathname === '/dashboard'));

            if (item.highlight) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-glow-purple ${
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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

        {/* Official Co-Organizing Partners Strip */}
        <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-purple-500/20 backdrop-blur-md">
          <img 
            src="/logos/ecell-iitb.png" 
            alt="E-Cell IIT Bombay" 
            className="h-5 w-auto object-contain hover:scale-105 transition-transform brightness-110" 
            title="E-Cell, IIT Bombay"
          />
          <div className="w-px h-3.5 bg-purple-500/30" />
          <img 
            src="/logos/nec-iitb.png" 
            alt="NEC 2026" 
            className="h-5 w-auto object-contain hover:scale-105 transition-transform" 
            title="National Entrepreneurship Challenge 2026"
          />
          <div className="w-px h-3.5 bg-purple-500/30" />
          <img 
            src="/logos/kmct-college.png" 
            alt="KMCT College" 
            className="h-4.5 w-auto object-contain hover:scale-105 transition-transform" 
            title="KMCT College of Engineering for Emerging Technologies and Management"
          />
          <div className="w-px h-3.5 bg-purple-500/30" />
          <img 
            src="/logos/nxtbyte-ecell.png" 
            alt="NxT Byte E-Cell" 
            className="h-5 w-auto object-contain hover:scale-105 transition-transform" 
            title="Organized by Nxt Byte E-Cell"
          />
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center gap-3">
          {/* Mobile Quick Scanner */}
          <Link
            to="/scanner"
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white shadow-glow-purple"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Scan</span>
          </Link>

          {/* Verification Active Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-300 font-semibold">Attendance Mode Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
