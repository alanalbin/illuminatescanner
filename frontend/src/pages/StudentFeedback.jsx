import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';
import StudentFeedbackSection from '../components/StudentFeedbackSection';
import Interactive3DBackground from '../components/Interactive3DBackground';

export default function StudentFeedback() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(Boolean(ticketId));

  useEffect(() => {
    if (!ticketId) return;
    
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const found = await api.getTicket(ticketId);
        setTicket(found);
      } catch (e) {
        console.warn('Could not prefetch ticket for feedback:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  return (
    <div className="min-h-screen bg-[#070312] text-slate-100 py-6 px-3 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center selection:bg-purple-600 selection:text-white">
      
      {/* 3D Interactive Background Animation (Responds to mouse & touch) */}
      <Interactive3DBackground />

      {/* Ambient Radial Color Highlights */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-purple-600/10 rounded-full blur-[170px] pointer-events-none z-0" />
      <div className="fixed bottom-10 right-10 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Clean Official Header Strip (NO LOGOS) */}
      <header className="w-full max-w-[920px] mb-4 p-4 sm:p-5 rounded-3xl glass-card flex flex-col sm:flex-row items-center justify-between gap-3 z-10 shadow-2xl shadow-purple-950/40 border border-purple-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/40 shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                ILLUMINATE 2026
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 uppercase tracking-widest">
                Student Review Portal
              </span>
            </div>
            <p className="text-xs text-purple-300/80">
              Trainer: <strong className="text-amber-300">Mr. Naveen Paul</strong> &bull; KMCT & E-Cell IIT Bombay
            </p>
          </div>
        </div>

        {/* Clean Badges (Replaced Logos) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-purple-950/70 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-medium text-[11px]">KMCT Kasaragod</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-[11px]">IIT Bombay E-Cell</span>
          </div>
        </div>
      </header>

      {/* Main Feedback Form Component */}
      <main className="w-full max-w-[920px] z-10 flex-1">
        <StudentFeedbackSection ticket={ticket} standalone={true} />
      </main>

      {/* Clean Distraction-Free Student Footer */}
      <footer className="w-full max-w-[920px] mt-8 pt-4 pb-2 border-t border-purple-900/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-purple-300/60 z-10">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-purple-400" />
          <span>KMCT College of Engineering, Kasaragod &bull; 22nd October 2026</span>
        </div>
        <div>
          <span>Official Event Feedback &bull; Coordinator: Alan Albin (+91 8848563266)</span>
        </div>
      </footer>

    </div>
  );
}
