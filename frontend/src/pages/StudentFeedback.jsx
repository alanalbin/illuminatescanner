import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  User,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import StudentFeedbackSection from '../components/StudentFeedbackSection';

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
    <div className="min-h-screen bg-dark-950 text-slate-100 py-6 px-3 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center selection:bg-purple-600 selection:text-white">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Official Header Strip */}
      <header className="w-full max-w-[920px] mb-4 p-3.5 sm:p-4 rounded-3xl glass-card flex flex-col sm:flex-row items-center justify-between gap-3 z-10 shadow-xl shadow-purple-950/30 border border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-purple-900/40">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-wide">
                ILLUMINATE 2026
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 uppercase tracking-widest">
                Student Review
              </span>
            </div>
            <p className="text-[11px] text-purple-300/80">
              Trainer: <strong className="text-amber-300">Mr. Naveen Paul</strong> &bull; E-Cell IIT Bombay & KMCT
            </p>
          </div>
        </div>

        {/* Co-Branded Institutional Partner Logos */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 py-1 px-3 rounded-2xl bg-white/[0.03] border border-purple-500/20">
          <img 
            src="/logos/ecell-iitb.png" 
            alt="E-Cell IIT Bombay" 
            className="h-5 sm:h-6 w-auto object-contain filter drop-shadow brightness-110" 
            title="The Entrepreneurship Cell, IIT Bombay"
          />
          <div className="w-px h-3.5 bg-purple-500/30" />
          <img 
            src="/logos/kmct-college.png" 
            alt="KMCT College" 
            className="h-4 sm:h-5 w-auto object-contain filter drop-shadow" 
            title="KMCT College of Engineering"
          />
          <div className="w-px h-3.5 bg-purple-500/30" />
          <img 
            src="/logos/nxtbyte-ecell.png" 
            alt="NxT Byte E-Cell" 
            className="h-4.5 sm:h-5.5 w-auto object-contain filter drop-shadow" 
            title="NxT Byte E-Cell KMCT"
          />
        </div>
      </header>

      {/* Main Feedback Card Component */}
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
          <span>Organized by E-Cell IIT Bombay &bull; Coordinator: Alan Albin (+91 8848563266)</span>
        </div>
      </footer>

    </div>
  );
}
