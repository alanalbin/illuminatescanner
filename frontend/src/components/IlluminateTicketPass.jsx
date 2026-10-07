import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Handshake, 
  Lightbulb, 
  Share2, 
  TrendingUp, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function IlluminateTicketPass({
  ticket = {},
  verifyUrl = '',
  showSide = 'both', // 'both' | 'front' | 'back'
  customRef = null,
  passType = 'GENERAL PASS',
  eventDate = '14 - 16 March 2026',
  venue = 'IIT Bombay, Mumbai',
}) {
  const ticketId = ticket?.ticketId || 'ILL26A7F3';
  const participantName = ticket?.participantName || 'PARTICIPANT';
  const qrValue = verifyUrl || (typeof window !== 'undefined' ? `${window.location.origin}/ticket/${ticketId}` : `https://illuminate-pass/${ticketId}`);

  return (
    <div 
      ref={customRef}
      className="w-full flex flex-col items-center justify-center gap-6 p-2 sm:p-4 select-none"
    >
      {/* ======================================================== */}
      {/* 1. FRONT SIDE PASS                                       */}
      {/* ======================================================== */}
      {(showSide === 'both' || showSide === 'front') && (
        <div className="w-full max-w-[920px] relative rounded-[28px] overflow-hidden border border-purple-500/40 shadow-[0_20px_60px_-15px_rgba(147,51,234,0.35)] bg-[#090514]">
          
          {/* Background Architectural Artwork + Cosmic Nebula */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <img 
              src="/pass-assets/pass_front_bg.jpg" 
              alt="IIT Bombay Architecture" 
              className="w-full h-full object-cover object-center opacity-70 filter contrast-125 saturate-150"
            />
            {/* Vignette & Ultraviolet overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#090514]/90 via-[#0d0720]/75 to-[#090514]/95" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#090514]/40 to-[#090514]" />
            {/* Ambient Purple Glow */}
            <div className="absolute -top-24 left-1/4 w-96 h-96 bg-purple-600/25 rounded-full blur-[100px]" />
          </div>

          {/* Ticket Cutout Notches */}
          {/* Outer Left Notch */}
          <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#080511] border-r border-purple-500/40 z-20 shadow-inner" />
          {/* Outer Right Notch */}
          <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#080511] border-l border-purple-500/40 z-20 shadow-inner" />
          
          {/* Perforation Tear Line Notches (at ~72% split) */}
          <div className="hidden sm:block absolute -top-3.5 right-[27.5%] w-7 h-7 rounded-full bg-[#080511] border-b border-purple-500/40 z-20" />
          <div className="hidden sm:block absolute -bottom-3.5 right-[27.5%] w-7 h-7 rounded-full bg-[#080511] border-t border-purple-500/40 z-20" />

          {/* Card Layout: Grid of Main Section (72.5%) + Stub Section (27.5%) */}
          <div className="relative z-10 flex flex-col sm:flex-row min-h-[300px] sm:min-h-[320px]">
            
            {/* ----------------- LEFT MAIN SECTION ----------------- */}
            <div className="flex-1 p-5 sm:p-7 flex flex-col justify-between relative sm:border-r-2 sm:border-dashed sm:border-purple-400/30">
              
              {/* TOP HEADER ROW */}
              <div className="flex items-center justify-between gap-4">
                {/* E-Cell IIT Bombay Logo */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-1.5 shadow-sm">
                    {/* Geometric E-Cell 'E' Monogram */}
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
                      <path d="M4 4H20V8H8V10H18V14H8V16H20V20H4V4Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="leading-tight">
                    <div className="text-white font-extrabold tracking-tight text-sm sm:text-base font-heading">
                      E-Cell
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.22em] text-purple-200/80 font-medium">
                      IIT BOMBAY
                    </div>
                  </div>
                </div>

                {/* ILLUMINATE 3-Bar Brand Logo */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3.5 rounded-full bg-purple-300"></span>
                    <span className="w-1 h-5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                    <span className="w-1 h-3.5 rounded-full bg-purple-300"></span>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-white font-heading">
                    ILLUMINATE
                  </span>
                </div>
              </div>

              {/* CENTER HEADLINE & PILLARS */}
              <div className="my-4 sm:my-2 flex flex-col items-center text-center">
                {/* Participant badge if known */}
                {ticket?.participantName && (
                  <div className="mb-2 inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-purple-950/70 border border-purple-500/30 text-[10px] sm:text-xs font-semibold text-purple-200">
                    <span className="text-purple-400 uppercase tracking-wider text-[9px]">ATTENDEE</span>
                    <span className="text-white font-bold">{participantName}</span>
                  </div>
                )}

                {/* Massive ILLUMINATE Typography */}
                <div className="relative inline-block">
                  <h1 className="font-heading font-black text-3xl sm:text-5xl md:text-[54px] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-100 via-white to-purple-300 drop-shadow-[0_2px_15px_rgba(192,132,252,0.4)]">
                    ILLUMINATE
                  </h1>
                  {/* Glowing 4-point Sparkle */}
                  <span className="absolute -top-1 -right-4 sm:-right-6 text-purple-300 text-lg sm:text-2xl animate-pulse">
                    ✦
                  </span>
                </div>

                {/* Subtitle: IIT BOMBAY E-CELL */}
                <div className="text-[10px] sm:text-xs uppercase font-bold tracking-[0.38em] text-purple-200/90 mt-1">
                  IIT BOMBAY E-CELL
                </div>

                {/* Pillars: IDEAS | INNOVATION | IMPACT */}
                <div className="mt-2.5 flex items-center justify-center gap-2 sm:gap-4 text-[9px] sm:text-[11px] font-mono tracking-[0.2em] text-purple-300/80">
                  <span>IDEAS</span>
                  <span className="text-purple-500">|</span>
                  <span>INNOVATION</span>
                  <span className="text-purple-500">|</span>
                  <span>IMPACT</span>
                </div>
              </div>

              {/* BOTTOM INFO ROW & SCRIPT MOTTO */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-t border-purple-500/20">
                {/* Meta Details: Date, Venue, Audience */}
                <div className="space-y-1.5 text-[11px] sm:text-xs text-purple-200/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="font-medium">{eventDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="font-medium">{venue}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-0.5">
                    <Users className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span className="text-[10px] sm:text-[11px] text-purple-300/80 leading-tight">
                      Entrepreneurs &bull; Innovators &bull; Creators &bull; Change Makers
                    </span>
                  </div>
                </div>

                {/* Calligraphic Script Accent: "Bigger Brighter Bolder" */}
                <div className="text-right self-end sm:self-auto sm:pr-3">
                  <div className="font-script text-xl sm:text-2xl md:text-3xl text-purple-300 leading-none drop-shadow-[0_0_10px_rgba(216,180,254,0.6)] transform -rotate-3 select-none">
                    Bigger<br/>
                    Brighter<br/>
                    Bolder
                  </div>
                  {/* Underline Flourish */}
                  <svg className="w-24 sm:w-28 h-3 text-purple-400/80 ml-auto mt-0.5" viewBox="0 0 100 12" fill="none">
                    <path d="M2 9C25 3 65 3 98 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

            </div>

            {/* ----------------- RIGHT STUB SECTION ----------------- */}
            <div className="w-full sm:w-[27.5%] min-w-[200px] p-5 sm:p-6 bg-[#0c071d]/85 backdrop-blur-md flex flex-col items-center justify-between border-t-2 border-dashed sm:border-t-0 border-purple-400/30 relative">
              
              {/* Pass Type Badge */}
              <div className="w-full">
                <div className="w-full py-1.5 px-3 rounded-full bg-gradient-to-r from-purple-300 via-purple-200 to-pink-200 text-[#090414] font-black text-center text-xs tracking-wider uppercase shadow-[0_4px_15px_rgba(216,180,254,0.3)] font-heading">
                  {passType}
                </div>
              </div>

              {/* Scannable High-Contrast QR Box */}
              <div className="my-3 sm:my-auto p-3 bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center">
                <QRCodeSVG
                  value={qrValue}
                  size={120}
                  level="H"
                  includeMargin={false}
                  className="w-28 h-28 sm:w-32 sm:h-32"
                />
                <div className="mt-2 text-[8px] sm:text-[9px] font-black tracking-[0.2em] text-slate-800 uppercase">
                  SCAN FOR ENTRY
                </div>
              </div>

              {/* Ticket ID Pill Box */}
              <div className="w-full rounded-xl bg-black/60 border border-purple-500/40 px-3 py-1.5 text-center shadow-inner">
                <div className="text-[8px] uppercase tracking-[0.2em] font-bold text-purple-300/80">
                  TICKET ID
                </div>
                <div className="font-mono text-xs sm:text-sm font-extrabold text-white tracking-widest mt-0.5">
                  {ticketId}
                </div>
              </div>

              {/* Check-in status indicator pill */}
              {ticket?.checkedIn && (
                <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>CHECKED IN</span>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. BACK SIDE PASS (Terms & Architecture Headline)       */}
      {/* ======================================================== */}
      {(showSide === 'both' || showSide === 'back') && (
        <div className="w-full max-w-[920px] relative rounded-[28px] overflow-hidden border border-purple-500/40 shadow-[0_20px_60px_-15px_rgba(147,51,234,0.35)] bg-[#090514]">
          
          {/* Ticket Cutout Notches */}
          <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#080511] border-r border-purple-500/40 z-20 shadow-inner" />
          <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#080511] border-l border-purple-500/40 z-20 shadow-inner" />

          {/* Layout: Left Terms (55%) + Right Inspirational Artwork (45%) */}
          <div className="relative z-10 flex flex-col md:flex-row min-h-[300px]">
            
            {/* ----------------- LEFT TERMS & ACTIONS ----------------- */}
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
              
              {/* Header */}
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-[0.25em] text-white font-heading">
                    EVENT PASS
                  </h2>
                  <div className="flex-1 h-px bg-purple-500/30" />
                </div>

                <div className="mt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 font-heading">
                    TERMS & CONDITIONS
                  </div>
                  <ol className="space-y-1.5 text-[11px] sm:text-xs text-purple-200/80 leading-relaxed list-decimal list-inside marker:text-purple-400 marker:font-bold">
                    <li>This pass is valid only for the specified dates.</li>
                    <li>Entry is subject to security checks.</li>
                    <li>This pass is non-transferable and cannot be resold.</li>
                    <li>Please carry a valid ID card along with this pass.</li>
                    <li>Organisers reserve the right to deny entry.</li>
                  </ol>
                </div>
              </div>

              {/* Bottom 4 Pillar Action Icons */}
              <div className="pt-6 border-t border-purple-500/20 grid grid-cols-4 gap-2 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-950/70 border border-purple-600/40 flex items-center justify-center text-purple-300">
                    <Handshake className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-purple-200/90">
                    NETWORK
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-950/70 border border-purple-600/40 flex items-center justify-center text-purple-300">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-purple-200/90">
                    LEARN
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-950/70 border border-purple-600/40 flex items-center justify-center text-purple-300">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-purple-200/90">
                    COLLABORATE
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-950/70 border border-purple-600/40 flex items-center justify-center text-purple-300">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-purple-200/90">
                    GROW
                  </span>
                </div>
              </div>

            </div>

            {/* ----------------- RIGHT INSPIRATIONAL SECTION ----------------- */}
            <div className="w-full md:w-[45%] relative min-h-[220px] md:min-h-[auto] overflow-hidden flex items-center p-6 sm:p-8">
              
              {/* Archway building background photo */}
              <div className="absolute inset-0 z-0">
                <img 
                  src="/pass-assets/pass_back_bg.jpg" 
                  alt="Campus Heritage Archway" 
                  className="w-full h-full object-cover object-center filter contrast-125 saturate-125"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#090514] via-[#090514]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090514]/80 via-transparent to-transparent" />
              </div>

              {/* Foreground Bold Inspirational Typography */}
              <div className="relative z-10">
                <div className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight uppercase leading-[1.08] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  <div>IDEAS</div>
                  <div className="text-purple-200">TODAY</div>
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-300 to-indigo-300">
                    A BRIGHTER
                  </div>
                  <div className="text-white">
                    TOMORROW
                  </div>
                </div>

                {/* Purple Brush Underline Flourish */}
                <div className="mt-2">
                  <svg className="w-24 sm:w-32 h-3.5 text-purple-400" viewBox="0 0 120 14" fill="none">
                    <path d="M3 10C35 4 85 4 117 9" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
