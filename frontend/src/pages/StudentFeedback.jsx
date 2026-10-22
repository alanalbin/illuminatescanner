import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  Calendar,
  Clock,
  ShieldCheck
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
    <div className="min-h-screen bg-[#07050e] text-slate-100 font-sans py-6 px-3 sm:px-6 relative overflow-hidden flex flex-col items-center selection:bg-purple-600 selection:text-white">
      
      {/* Top Subtle Gradient Line */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-[100] pointer-events-none">
        <div className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500 w-full" />
      </div>

      {/* 3D Interactive Canvas Background */}
      <Interactive3DBackground />

      {/* Ambient Lighting */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-purple-900/15 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Professional Neat Header — Strictly NO LOGOS */}
      <header className="w-full max-w-[880px] mb-3 p-4 sm:p-5 rounded-2xl bg-[#0b0816]/95 border border-white/[0.1] flex flex-col sm:flex-row items-center justify-between gap-3 z-10 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-950/60 shrink-0">
            <Sparkles className="w-5 h-5 text-purple-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
                ILLUMINATE <span className="text-purple-400">2026</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-300">
                Workshop Evaluation
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              KMCT College of Engineering, Kasaragod &bull; E-Cell IIT Bombay
            </p>
          </div>
        </div>

        {/* Clean Status Badges */}
        <div className="flex items-center gap-2 text-xs self-start sm:self-auto font-mono">
          <div className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-zinc-300 flex items-center gap-1.5 text-[11px]">
            <Calendar className="w-3 h-3 text-zinc-400" />
            <span>22 Oct 2026</span>
          </div>

          <div className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-zinc-300 flex items-center gap-1.5 text-[11px]">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>6-Hour Masterclass</span>
          </div>
        </div>
      </header>

      {/* Main Feedback Form */}
      <main className="w-full max-w-[880px] z-10 flex-1">
        <StudentFeedbackSection ticket={ticket} standalone={true} />
      </main>

      {/* Professional Minimal Footer */}
      <footer className="w-full max-w-[880px] mt-6 pt-4 pb-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500 z-10 font-mono">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-purple-400" />
          <span>KMCTCEEM Campus, Kasaragod &bull; Offline Masterclass</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Official Feedback System &bull; E-Cell IIT Bombay &amp; KMCT</span>
        </div>
      </footer>

    </div>
  );
}
