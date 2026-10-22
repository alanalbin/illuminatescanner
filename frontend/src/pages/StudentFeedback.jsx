import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Sparkles, 
  MessageSquareHeart, 
  ArrowLeft, 
  ScanLine, 
  QrCode, 
  ShieldCheck, 
  MapPin, 
  Award,
  Star
} from 'lucide-react';
import { api } from '../services/api';
import { localAttendanceStore } from '../services/localAttendanceStore';
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
    <div className="min-h-[calc(100vh-4rem)] py-6 px-3 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center">
      {/* Radial glow background */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Banner Navigation & Brand Bar */}
      <div className="w-full max-w-[920px] flex items-center justify-between pb-4 mb-4 border-b border-purple-900/40 z-10">
        <Link 
          to={ticketId ? `/ticket/${ticketId}` : "/scanner"} 
          className="inline-flex items-center gap-2 text-xs font-bold text-purple-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{ticketId ? 'Back to Pass' : 'Back to Scanner'}</span>
        </Link>

        <div className="flex items-center gap-2 text-[11px] text-purple-300/80 font-medium">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-950/70 border border-purple-700/40">
            <MapPin className="w-3 h-3 text-purple-400" />
            <span>KMCT Kasaragod &bull; 22 Oct 2026</span>
          </div>
        </div>
      </div>

      {/* Co-Branded Institutional Strip */}
      <div className="w-full max-w-[920px] mb-4 p-3 rounded-2xl glass-card flex flex-col sm:flex-row items-center justify-between gap-3 z-10 shadow-lg shadow-purple-950/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white tracking-wide">
              ILLUMINATE 2026 &bull; Student Experience Survey
            </h1>
            <p className="text-[10px] sm:text-xs text-purple-300/70">
              Joint initiative by The Entrepreneurship Cell, IIT Bombay & KMCT College of Engineering
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <img src="/logos/ecell-iitb.png" alt="E-Cell IIT Bombay" className="h-5 sm:h-6 w-auto object-contain filter drop-shadow brightness-110" />
          <div className="w-px h-3.5 bg-purple-500/30" />
          <img src="/logos/kmct-college.png" alt="KMCT College" className="h-4 sm:h-5 w-auto object-contain filter drop-shadow" />
          <div className="w-px h-3.5 bg-purple-500/30" />
          <img src="/logos/nxtbyte-ecell.png" alt="NxT Byte E-Cell" className="h-4 sm:h-5 w-auto object-contain filter drop-shadow" />
        </div>
      </div>

      {/* Render the Feedback Form */}
      <div className="w-full max-w-[920px] z-10">
        <StudentFeedbackSection ticket={ticket} standalone={true} />
      </div>

      {/* Bottom Helpful Navigation */}
      <div className="w-full max-w-[920px] mt-6 pt-4 border-t border-purple-900/30 flex flex-wrap items-center justify-between gap-3 text-xs text-purple-300/60 z-10">
        <div>
          <span>Need assistance? Contact Coordinator Alan Albin (+91 8848563266)</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/attendance" className="hover:text-purple-200 transition-colors">
            Live Attendance
          </Link>
          <span>&bull;</span>
          <Link to="/passes" className="hover:text-purple-200 transition-colors">
            QR Passes Gallery
          </Link>
          <span>&bull;</span>
          <Link to="/scanner" className="hover:text-purple-200 transition-colors">
            Gate Scanner
          </Link>
        </div>
      </div>

    </div>
  );
}
