import React from 'react';
import { X, Download, ExternalLink, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function QrModal({ ticket, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!ticket) return null;

  const verifyUrl = ticket.verificationUrl || `${window.location.origin}/verify/${ticket.ticketId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(ticket.ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById('ticket-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${ticket.ticketId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl bg-dark-900 border border-purple-500/30 p-6 shadow-glow-purple-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-purple-400 hover:text-white hover:bg-purple-900/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-[11px] font-bold tracking-widest text-purple-400 uppercase">
            Official QR Verification
          </span>
          <h3 className="mt-1 text-xl font-bold text-white">
            {ticket.participantName}
          </h3>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="font-mono text-xs text-purple-300 font-semibold bg-purple-950/80 px-2.5 py-1 rounded-md border border-purple-800/50">
              {ticket.ticketId}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 text-purple-400 hover:text-white transition-colors"
              title="Copy Ticket ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* QR Code Canvas Area */}
        <div className="my-6 p-4 rounded-2xl bg-white flex items-center justify-center shadow-xl mx-auto max-w-[260px]">
          <QRCodeSVG
            id="ticket-qr-svg"
            value={verifyUrl}
            size={220}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <a
            href={`/passes/${ticket.ticketId}.png`}
            download={`ILLUMINATE_Pass_${ticket.participantName ? ticket.participantName.replace(/\s+/g, '_') : 'Pass'}_${ticket.ticketId}.png`}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all text-center"
          >
            <Download className="w-4 h-4" />
            <span>Download Official Pass (HD)</span>
          </a>

          <a
            href={`/ticket/${ticket.ticketId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm bg-purple-950/60 hover:bg-purple-900 text-purple-200 border border-purple-500/30 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Digital Pass</span>
          </a>
        </div>
      </div>
    </div>
  );
}
