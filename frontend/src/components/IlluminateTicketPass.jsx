import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Download, 
  Copy, 
  Check, 
  CheckCircle2, 
  Sparkles,
  Printer
} from 'lucide-react';

export default function IlluminateTicketPass({
  ticket = {},
  verifyUrl = '',
  customRef = null,
}) {
  const ticketId = ticket?.ticketId || 'ILM-KMCT-SAMPLE';
  const participantName = ticket?.participantName || 'PARTICIPANT';
  const course = ticket?.course || 'Engineering';
  const college = ticket?.college || 'KMCT College of Engineering, Kasaragod';
  const checkedIn = ticket?.checkedIn || false;
  
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const passImageUrl = `/passes/${ticketId}.png`;
  const qrValue = verifyUrl || (typeof window !== 'undefined' ? `${window.location.origin}/ticket/${ticketId}` : `https://illuminatescanner.vercel.app/ticket/${ticketId}`);

  const handleCopyId = () => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = passImageUrl;
    a.download = `Illuminate_Pass_${ticketId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div ref={customRef} className="w-full flex flex-col items-center justify-center gap-5 p-2 sm:p-4 select-none">
      {/* Participant Identity Ribbon */}
      <div className="w-full max-w-[1020px] flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-[#0e0722]/85 border border-purple-500/30 backdrop-blur-md shadow-lg shadow-purple-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md text-base">
            {participantName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">{participantName}</h2>
              {checkedIn ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Checked In
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Official Pass
                </span>
              )}
            </div>
            <p className="text-xs text-purple-300/80 mt-0.5">{course} • {college}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            title="Download high-resolution official pass"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Pass (HD)</span>
          </button>
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/20 text-xs font-medium transition-all cursor-pointer hidden sm:flex"
            title="Print Pass"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyId}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/20 text-xs font-medium transition-all cursor-pointer"
            title="Copy Ticket ID"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Official Pass Banner Container */}
      <div className="w-full max-w-[1020px] relative rounded-[28px] overflow-hidden border border-purple-500/40 shadow-[0_25px_70px_-15px_rgba(147,51,234,0.4)] group bg-[#05030a]">
        {!imageError ? (
          <img
            src={passImageUrl}
            alt={`Official Pass for ${participantName}`}
            className="w-full h-auto object-contain block select-none"
            onError={() => setImageError(true)}
          />
        ) : (
          /* Dynamic overlay fallback */
          <div className="relative w-full aspect-[1536/520] bg-[#05030a] overflow-hidden">
            <img
              src="/pass-assets/pass_base.png"
              alt="Pass Template"
              className="w-full h-full object-cover"
            />
            {/* Dynamic QR overlay */}
            <div className="absolute left-[83.1%] top-[28.8%] w-[12.2%] h-[36.2%] flex items-center justify-center bg-white p-1 rounded-sm">
              <QRCodeSVG
                value={qrValue}
                size={160}
                level="M"
                className="w-full h-full"
              />
            </div>
            {/* Dynamic Ticket ID text overlay */}
            <div className="absolute left-[82.3%] top-[83.8%] w-[13.8%] flex items-center justify-center pointer-events-none">
              <span className="text-[9px] sm:text-[11px] md:text-[13px] font-mono font-black text-white tracking-wider truncate">
                {ticketId}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pass Footer Metadata */}
      <div className="w-full max-w-[1020px] flex flex-wrap items-center justify-between text-xs text-purple-300/70 px-2 gap-2">
        <span className="font-mono">Ticket ID: <strong className="text-white font-mono">{ticketId}</strong></span>
        <span className="font-mono">Organized by KMCT E-Cell (Nxt Byte) & E-Cell IIT Bombay</span>
      </div>
    </div>
  );
}
