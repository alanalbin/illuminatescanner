import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import html2canvas from 'html2canvas';
import IlluminateTicketPass from '../components/IlluminateTicketPass';
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
  const [activeSide, setActiveSide] = useState('both'); // 'both' | 'front' | 'back'
  const passCardRef = useRef(null);

  useEffect(() => {
    if (!ticketId) return;
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const data = await api.getTicket(ticketId);
        setTicket(data);
      } catch (err) {
        if (ticketId.toUpperCase() === 'ILL26A7F3' || ticketId.toLowerCase() === 'sample' || ticketId.toLowerCase() === 'demo') {
          setTicket({
            ticketId: 'ILL26A7F3',
            participantName: 'General Attendee',
            email: 'attendee@illuminate.org',
            phone: '+91 98765 43210',
            status: 'ACTIVE',
            checkedIn: false,
          });
        } else {
          setError(err.message || 'Ticket not found.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
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
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/passes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white"
            >
              Browse All Passes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-3 sm:px-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background radial ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Header controls bar */}
      <div className="w-full max-w-[920px] flex flex-wrap items-center justify-between gap-4 mb-5 z-10">
        <Link
          to="/passes"
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Passes</span>
        </Link>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-purple-950/70 border border-purple-500/30 p-1 rounded-2xl">
          <button
            onClick={() => setActiveSide('both')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              activeSide === 'both' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-purple-300/80 hover:text-white'
            }`}
          >
            Both Sides
          </button>
          <button
            onClick={() => setActiveSide('front')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              activeSide === 'front' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-purple-300/80 hover:text-white'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setActiveSide('back')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              activeSide === 'back' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-purple-300/80 hover:text-white'
            }`}
          >
            Back
          </button>
        </div>

        {/* Status Pill */}
        <div>
          {ticket.checkedIn ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ENTRY VERIFIED</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>OFFICIAL TICKET</span>
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
          showSide={activeSide}
          passType="GENERAL PASS"
          eventDate="14 - 16 March 2026"
          venue="IIT Bombay, Mumbai"
        />
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full max-w-[920px] mt-6 flex flex-wrap items-center justify-center sm:justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyId}
            className="py-2.5 px-4 rounded-xl text-xs font-bold bg-dark-900/90 hover:bg-purple-950 text-purple-200 border border-purple-600/40 flex items-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
            <span>{copied ? 'ID COPIED!' : `COPY ID (${ticket.ticketId})`}</span>
          </button>

          <button
            onClick={handleShare}
            className="py-2.5 px-4 rounded-xl text-xs font-bold bg-dark-900/90 hover:bg-purple-950 text-purple-200 border border-purple-600/40 flex items-center gap-2 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>SHARE PASS</span>
          </button>
        </div>

        <button
          onClick={handleDownloadPass}
          disabled={downloading}
          className="py-2.5 px-6 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'GENERATING PASS IMAGE...' : 'DOWNLOAD HIGH-RES PASS'}</span>
        </button>
      </div>

    </div>
  );
}
