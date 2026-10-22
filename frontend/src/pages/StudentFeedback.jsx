import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  GraduationCap,
  Calendar,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import StudentFeedbackSection from '../components/StudentFeedbackSection';
import Interactive3DBackground from '../components/Interactive3DBackground';

export default function StudentFeedback() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    if (!ticketId) return;
    
    const fetchTicket = async () => {
      try {
        const found = await api.getTicket(ticketId);
        setTicket(found);
      } catch (e) {
        console.warn('Could not prefetch ticket for feedback:', e);
      }
    };

    fetchTicket();
  }, [ticketId]);

  return (
    <div className="min-h-screen bg-[#05030a] text-slate-100 font-heading py-6 px-3 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center selection:bg-purple-600 selection:text-white">
      
      {/* Top Animated Theme Progress Bar from illuminate-wheat.vercel.app */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-[100] pointer-events-none">
        <div className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.8)] w-full" />
      </div>

      {/* 3D Interactive Canvas & Background Gradients */}
      <Interactive3DBackground />

      {/* Atmospheric Ambient Glows */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-900/20 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Header Bar — Strictly NO LOGOS, Clean Illuminate-Wheat Glassmorphism */}
      <header className="w-full max-w-[920px] mb-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-[#130926]/90 via-[#0a0418]/90 to-[#04010a]/90 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 shadow-2xl shadow-purple-950/80 backdrop-blur-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/60 shrink-0 border border-purple-400/30">
            <Sparkles className="w-5 h-5 text-purple-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-wider text-white uppercase font-heading drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                ILLUMINATE <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-300">2026</span>
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/30 text-purple-300">
                Official Survey
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Trainer: <strong className="text-amber-300 font-semibold">Mr. Naveen Paul</strong> &bull; E-Cell IIT Bombay & KMCT
            </p>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] font-mono">22 Oct 2026</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] font-mono">6-Hour Masterclass</span>
          </div>
        </div>
      </header>

      {/* Main Feedback Card Component */}
      <main className="w-full max-w-[920px] z-10 flex-1">
        <StudentFeedbackSection ticket={ticket} standalone={true} />
      </main>

      {/* Clean Distraction-Free Student Footer */}
      <footer className="w-full max-w-[920px] mt-8 pt-4 pb-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500 z-10 font-mono">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-purple-400" />
          <span>KMCT College of Engineering, Kasaragod &bull; 6-Hour Offline Venture Workshop</span>
        </div>
        <div>
          <span>Initiative of E-Cell IIT Bombay &bull; Coordinator: Alan Albin (+91 8848563266)</span>
        </div>
      </footer>

    </div>
  );
}
