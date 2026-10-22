import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import html2canvas from 'html2canvas';
import IlluminateTicketPass from '../components/IlluminateTicketPass';
import StudentFeedbackSection from '../components/StudentFeedbackSection';
import { 
  Download, 
  Share2, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles,
  ShieldCheck,
  RotateCw,
  Layers,
  ArrowLeft,
  QrCode
} from 'lucide-react';

export default function DigitalPass() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const passCardRef = useRef(null);

  const fetchTicket = async (silent = false) => {
    if (!ticketId) return;
    if (!silent) setLoading(true);
    try {
      const data = await api.getTicket(ticketId);
      setTicket(data);
    } catch (err) {
      if (
        ticketId.toUpperCase() === 'ILL26A7F3' || 
        ticketId.toLowerCase().includes('sample') || 
        ticketId.toLowerCase() === 'demo'
      ) {
        setTicket({
          ticketId: ticketId,
          participantName: 'Alan Albin (Organizer Sample)',
          email: 'alanalbin06112005@gmail.com',
          phone: '+91 8848563266',
          course: 'Event Coordinator',
          college: 'KMCT College of Engineering, Kasaragod',
          status: 'ACTIVE',
          checkedIn: false,
        });
      } else {
        setError(err.message || 'Ticket not found.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();

    const handleUpdate = () => {
      fetchTicket(true);
    };

    window.addEventListener('illuminate_attendance_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('illuminate_attendance_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [ticketId]);



  const verifyUrl = typeof window !== 'undefined' ? `${window.location.origin}/ticket/${ticketId}` : '';

  const handleCopyId = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ILLUMINATE 2026 Pass - ${ticket?.participantName}`,
          text: `Official Entry Pass for Illuminate 2026 by IIT Bombay E-Cell. Ticket ID: ${ticket?.ticketId}`,
          url: window.location.href,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyId();
        }
      }
    } else {
      handleCopyId();
    }
  };

  const handleDownloadPass = async () => {
    if (ticket?.ticketId) {
      const a = document.createElement('a');
      a.href = `/passes/${ticket.ticketId}.png`;
      a.download = `ILLUMINATE_Pass_${ticket.participantName ? ticket.participantName.replace(/\s+/g, '_') : 'Pass'}_${ticket.ticketId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (!passCardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(passCardRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#080511',
      });
      const image = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = image;
      a.download = `ILLUMINATE_Pass_${ticket?.ticketId || 'Pass'}.png`;
      a.click();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-purple-300 font-medium">Generating Official Event Pass...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 text-center border border-red-500/30">
          <XCircle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Pass Not Found</h2>
          <p className="text-xs text-purple-300/70 mt-2">
            Ticket ID <span className="font-mono text-purple-200 font-bold">{ticketId}</span> was not found in the Illuminate system.
          </p>
          <div className="mt-6 p-4 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-purple-300/80">
            Please make sure you clicked the exact link sent to your email or WhatsApp. For help, contact Event Coordinator Alan Albin at <strong>+91 8848563266</strong>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] py-6 px-3 sm:px-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background radial ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Official Attendee Header Bar */}
      <div className="w-full max-w-[1020px] flex items-center justify-between pb-3 mb-4 border-b border-purple-500/20 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-purple-900/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-wider text-white">ILLUMINATE 2026</h1>
            <p className="text-[10px] text-purple-300/70 font-semibold">Official Entry Pass &bull; E-Cell IIT Bombay & KMCT</p>
          </div>
        </div>

        <div>
          {ticket.checkedIn ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>ENTRY VERIFIED</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-950/80 text-purple-200 border border-purple-500/40">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>SEAT CONFIRMED</span>
            </span>
          )}
        </div>
      </div>

      {/* Render the Pass Design (Screen & html2canvas capture target) */}
      <div className="w-full flex justify-center z-10">
        <IlluminateTicketPass
          customRef={passCardRef}
          ticket={ticket}
          verifyUrl={verifyUrl}
          passType="OFFICIAL PASS"
          eventDate="22nd October 2026"
          venue="KMCT College of Engineering, Kasaragod"
        />
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full max-w-[920px] mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopyId}
            className="flex-1 sm:flex-initial justify-center py-2.5 px-4 rounded-xl text-xs font-bold bg-dark-900/90 hover:bg-purple-950 text-purple-200 border border-purple-600/40 flex items-center gap-2 transition-colors active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
            <span>{copied ? 'ID COPIED!' : `COPY ID (${ticket.ticketId})`}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex-1 sm:flex-initial justify-center py-2.5 px-4 rounded-xl text-xs font-bold bg-dark-900/90 hover:bg-purple-950 text-purple-200 border border-purple-600/40 flex items-center gap-2 transition-colors active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>SHARE PASS</span>
          </button>
        </div>

        <button
          onClick={handleDownloadPass}
          disabled={downloading}
          className="w-full sm:w-auto py-2.5 px-6 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'GENERATING PASS IMAGE...' : 'DOWNLOAD HIGH-RES PASS'}</span>
        </button>
      </div>

      {/* Student Workshop Feedback & Rating Section */}
      <div className="w-full max-w-[1020px] z-10">
        <StudentFeedbackSection ticket={ticket} />
      </div>

    </div>
  );
}
