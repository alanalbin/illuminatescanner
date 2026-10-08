import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { localAttendanceStore } from '../services/localAttendanceStore';
import { soundEffects } from '../services/sound';
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCw, 
  Keyboard, 
  Sparkles, 
  ArrowRight,
  UserCheck,
  RotateCcw,
  Clock,
  Building,
  GraduationCap,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Zap,
  CheckCheck
} from 'lucide-react';

export default function QrScanner() {
  const [stats, setStats] = useState(() => {
    const s = localAttendanceStore.getStats();
    return {
      totalRegistrations: s.totalRegistrations || 51,
      checkedIn: s.checkedIn || 0,
      remaining: s.remaining != null ? s.remaining : 51,
      checkedInAttendees: s.checkedInAttendees || [],
    };
  });

  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [autoCheckin, setAutoCheckin] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);
  const autoAdvanceTimerRef = useRef(null);

  // Fetch stats and live recent check-ins
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats({
        totalRegistrations: data.totalRegistrations || 51,
        checkedIn: data.checkedIn || 0,
        remaining: data.remaining != null ? data.remaining : 51,
        checkedInAttendees: data.checkedInAttendees || [],
      });
    } catch (e) {
      console.warn('Stats fetch error:', e);
    }
  }, []);

  // Real-time synchronization listeners across tabs and local stores
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);

    const handleRealtimeUpdate = () => {
      fetchStats();
    };

    window.addEventListener('illuminate_attendance_updated', handleRealtimeUpdate);
    window.addEventListener('storage', handleRealtimeUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('illuminate_attendance_updated', handleRealtimeUpdate);
      window.removeEventListener('storage', handleRealtimeUpdate);
    };
  }, [fetchStats]);

  // Initialize Camera Scanner
  useEffect(() => {
    async function initScanner() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setCameras(devices);
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('environment')
          );
          const camId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(camId);

          if (!html5QrCodeRef.current) {
            html5QrCodeRef.current = new Html5Qrcode('qr-reader');
          }

          startCamera(camId);
        } else {
          setCameraError('No camera found on this device. You can test using manual ID entry below.');
        }
      } catch (err) {
        console.warn('Camera permission or init error:', err);
        setCameraError('Camera access not granted or unavailable. You can use manual entry or grant camera permission in browser.');
      }
    }

    initScanner();

    return () => {
      stopCamera();
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  const startCamera = async (cameraId) => {
    if (!html5QrCodeRef.current) return;
    try {
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        () => {} // continuous scanning frames
      );
      setIsScanning(true);
      setCameraError('');
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraError('Unable to start camera. Please check camera permissions in browser.');
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.warn('Camera stop error:', e);
      }
    }
    setIsScanning(false);
  };

  const lastScannedTextRef = useRef('');
  const lastScannedTimeRef = useRef(0);

  const onScanSuccess = (decodedText) => {
    const now = Date.now();
    if (decodedText === lastScannedTextRef.current && (now - lastScannedTimeRef.current) < 2500) {
      return;
    }
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    lastScannedTextRef.current = decodedText;
    lastScannedTimeRef.current = now;
    handleProcessQr(decodedText);
  };

  const handleProcessQr = async (text) => {
    setLoading(true);
    setActionNotice(null);
    try {
      let res;
      if (autoCheckin) {
        res = await api.checkinTicket(text, 'Volunteer Scanner');
      } else {
        res = await api.validateTicket(text);
      }

      res.rawScanned = text;
      setScanResult(res);

      const isValid = res.valid || res.status === 'VALID' || res.status === 'SUCCESS' || res.success;
      const isAlreadyUsed = res.status === 'ALREADY_USED' || res.status === 'ALREADY_CHECKED_IN';

      if (isValid) {
        if (soundEnabled) soundEffects.playSuccess();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#a855f7', '#22c55e', '#ffffff'],
        });
        fetchStats();
      } else if (isAlreadyUsed) {
        if (soundEnabled) soundEffects.playWarning();
      } else {
        if (soundEnabled) soundEffects.playError();
      }

      // Optional auto-advance timer if enabled by user
      if (autoAdvance) {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = setTimeout(() => {
          handleScanAgain();
        }, 8000);
      }

    } catch (err) {
      if (soundEnabled) soundEffects.playError();
      setScanResult({
        valid: false,
        status: 'INVALID',
        message: err.message || 'Validation error',
        rawScanned: text,
      });
    } finally {
      setLoading(false);
    }
  };

  // CHECK IN ACTION
  const handleConfirmCheckin = async () => {
    const ticketId = scanResult?.ticketId || scanResult?.ticket?.ticketId;
    if (!ticketId) return;
    setLoading(true);
    try {
      const res = await api.checkinTicket(ticketId, 'Volunteer Scanner');
      const now = new Date().toISOString();
      setScanResult(prev => ({
        ...prev,
        ...res,
        valid: true,
        checkedIn: true,
        checkedInAt: now,
        status: 'VALID',
        message: `Attendance marked successfully for ${res.participantName || prev?.participantName}!`,
      }));

      setActionNotice('Checked in successfully!');
      if (soundEnabled) soundEffects.playSuccess();
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#a855f7', '#22c55e', '#ffffff'],
      });
      fetchStats();
    } catch (err) {
      if (soundEnabled) soundEffects.playError();
      alert(err.message || 'Checkin failed');
    } finally {
      setLoading(false);
    }
  };

  // UNDO ACTION (Reverts check-in to absent / awaiting entry)
  const handleUndoCheckin = async (ticketIdToUndo) => {
    const targetId = ticketIdToUndo || scanResult?.ticketId || scanResult?.ticket?.ticketId;
    if (!targetId) return;
    setLoading(true);
    try {
      await api.undoCheckin(targetId);
      if (soundEnabled) soundEffects.playWarning();

      // If this pass is currently open in modal, update state in-place
      if (scanResult && (scanResult.ticketId === targetId || scanResult.ticket?.ticketId === targetId)) {
        setScanResult(prev => ({
          ...prev,
          valid: true,
          checkedIn: false,
          checkedInAt: null,
          status: 'UNDONE',
          message: `Check-in reverted! ${prev.participantName || 'Attendee'} is now marked as Absent / Awaiting Entry.`,
        }));
      }

      setActionNotice('Check-in undone! Attendee marked as Absent.');
      fetchStats();
    } catch (err) {
      if (soundEnabled) soundEffects.playError();
      alert(err.message || 'Undo check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleScanAgain = () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    setScanResult(null);
    setActionNotice(null);
    isProcessingRef.current = false;
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleProcessQr(manualInput.trim());
    setManualInput('');
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextId = cameras[nextIndex].id;
    setSelectedCameraId(nextId);
    startCamera(nextId);
  };

  const copyTicketId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Determine current result status
  const isCheckedIn = scanResult && (
    scanResult.checkedIn ||
    scanResult.status === 'VALID' ||
    scanResult.status === 'SUCCESS' ||
    scanResult.status === 'ALREADY_USED' ||
    scanResult.status === 'ALREADY_CHECKED_IN'
  ) && scanResult.status !== 'UNDONE';

  const isUndone = scanResult && scanResult.status === 'UNDONE';
  const isUnrecognized = scanResult && (scanResult.status === 'INVALID' || !scanResult.valid && !isCheckedIn && !isUndone);
  const isCancelled = scanResult && scanResult.status === 'CANCELLED';

  return (
    <div className="min-h-[calc(100vh-5.5rem)] flex flex-col justify-between max-w-lg mx-auto px-4 py-3 relative">
      
      {/* Scanner Control Strip (Camera Switch, Sound, Auto-Checkin) */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-dark-900/90 border border-purple-500/20 backdrop-blur-md text-xs mb-3 shadow-md">
        
        {/* Auto Check-in Toggle */}
        <button
          onClick={() => setAutoCheckin(!autoCheckin)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold transition-all ${
            autoCheckin 
              ? 'bg-purple-600 text-white shadow-glow-purple' 
              : 'bg-dark-950 text-purple-300 border border-purple-800/40 hover:bg-dark-800'
          }`}
          title="When enabled, scanning a QR code instantly records attendance"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-300" />
          <span>Auto-Checkin: {autoCheckin ? 'ON' : 'OFF'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl bg-dark-950 hover:bg-purple-950 text-purple-300 border border-purple-800/40 transition-colors"
            title={soundEnabled ? 'Mute Scan Sound Effects' : 'Enable Scan Sound Effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Camera Switch */}
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-1.5 rounded-xl bg-dark-950 hover:bg-purple-950 text-purple-300 border border-purple-800/40 transition-colors"
              title="Switch Camera (Front / Rear)"
            >
              <RotateCw className="w-4 h-4 text-purple-400" />
            </button>
          )}

          {/* Manual Entry Toggle */}
          <button
            onClick={() => setShowManual(!showManual)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold border transition-all ${
              showManual 
                ? 'bg-purple-900 text-white border-purple-500' 
                : 'bg-dark-950 text-purple-300 border-purple-800/40 hover:bg-dark-800'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>ID Entry</span>
          </button>
        </div>

      </div>

      {/* Manual Entry Form Dropdown */}
      {showManual && (
        <form onSubmit={handleManualSubmit} className="mb-3 p-3 rounded-2xl bg-dark-900 border border-purple-500/40 shadow-lg flex gap-2 animate-fade-in">
          <input
            type="text"
            placeholder="Type Ticket ID, name, or phone..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-dark-950 border border-purple-800 text-white text-xs font-mono focus:border-purple-400 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !manualInput.trim()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-glow-purple disabled:opacity-50"
          >
            Verify
          </button>
        </form>
      )}

      {/* Camera Viewport / Scanning Area */}
      <div className="relative w-full aspect-square max-w-[360px] mx-auto rounded-3xl overflow-hidden bg-black border-2 border-purple-500/40 shadow-glow-purple flex items-center justify-center">
        
        {/* html5-qrcode video viewport */}
        <div id="qr-reader" className="w-full h-full object-cover" />

        {/* Scanning Reticle & Laser line overlay */}
        {!scanResult && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Target box corners */}
            <div className="w-[230px] h-[230px] relative border-2 border-purple-400/40 rounded-2xl">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-purple-400 rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-purple-400 rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-purple-400 rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-purple-400 rounded-br-xl" />
              
              {/* Animated laser scan line */}
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-glow-purple animate-scan absolute top-0" />
            </div>
            <p className="text-[11px] text-purple-200/90 font-medium mt-3 bg-black/70 px-3.5 py-1 rounded-full backdrop-blur-md border border-purple-500/30">
              Align Participant QR Code within box
            </p>
          </div>
        )}

        {/* Camera Error Message Banner */}
        {cameraError && !scanResult && (
          <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-dark-950/95">
            <Camera className="w-10 h-10 text-purple-400/50 mb-3" />
            <p className="text-xs text-purple-200 font-medium max-w-xs mb-3">
              {cameraError}
            </p>
            <button
              onClick={() => setShowManual(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white shadow-glow-purple"
            >
              Enter Ticket ID Manually
            </button>
          </div>
        )}

        {/* INTERACTIVE SCAN RESULT MODAL (Shows Check & Undo Options) */}
        {scanResult && (
          <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-5 bg-dark-950/98 backdrop-blur-2xl animate-fade-in overflow-y-auto no-scrollbar">
            
            {/* Top Status Header */}
            <div className="text-center pt-1">
              {isCheckedIn ? (
                <div className="space-y-1">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-glow-green">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="text-lg font-black text-emerald-400 tracking-wider">
                    CHECKED IN
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">
                    ATTENDANCE RECORDED &bull; ENTRY APPROVED
                  </div>
                </div>
              ) : isUndone ? (
                <div className="space-y-1">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 shadow-glow-amber">
                    <RotateCcw className="w-7 h-7" />
                  </div>
                  <div className="text-lg font-black text-amber-400 tracking-wider">
                    CHECK-IN UNDONE
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                    MARKED AS ABSENT &bull; READY TO RE-CHECK
                  </div>
                </div>
              ) : isCancelled ? (
                <div className="space-y-1">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 shadow-glow-red">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <div className="text-lg font-black text-rose-400 tracking-wider">
                    CANCELLED PASS
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-rose-400">
                    ENTRY NOT PERMITTED
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 shadow-glow-red">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div className="text-lg font-black text-rose-400 tracking-wider">
                    UNRECOGNIZED PASS
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-rose-300">
                    NOT IN REGISTERED 51 ATTENDEE LIST
                  </div>
                </div>
              )}
            </div>

            {/* Attendee Details Card */}
            <div className="my-2 p-3 rounded-2xl bg-dark-900/90 border border-purple-800/50 space-y-2 text-center">
              {(scanResult.participantName || scanResult.ticket?.participantName) ? (
                <>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-purple-400">PARTICIPANT</div>
                    <div className="text-base font-extrabold text-white">
                      {scanResult.participantName || scanResult.ticket?.participantName}
                    </div>
                  </div>

                  {(scanResult.ticketId || scanResult.ticket?.ticketId) && (
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-purple-200 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800/40">
                        {scanResult.ticketId || scanResult.ticket?.ticketId}
                      </span>
                      <button
                        onClick={() => copyTicketId(scanResult.ticketId || scanResult.ticket?.ticketId)}
                        className="p-1 rounded-md text-purple-400 hover:text-white"
                        title="Copy Ticket ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {(scanResult.college || scanResult.ticket?.college) && (
                    <div className="text-[11px] text-purple-300 font-medium flex items-center justify-center gap-1">
                      <Building className="w-3 h-3 text-purple-400" />
                      <span className="truncate max-w-[260px]">{scanResult.college || scanResult.ticket?.college}</span>
                    </div>
                  )}

                  {(scanResult.course || scanResult.ticket?.course) && (
                    <div className="text-[11px] text-purple-300/80 flex items-center justify-center gap-1">
                      <GraduationCap className="w-3 h-3 text-purple-400" />
                      <span>{scanResult.course || scanResult.ticket?.course}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1.5 text-left px-2">
                  <div className="text-[11px] font-bold text-rose-300">
                    Scanned code was not recognized:
                  </div>
                  <div className="font-mono text-[11px] bg-dark-950 p-2 rounded-xl border border-rose-900/50 text-rose-200 break-all max-h-20 overflow-y-auto">
                    {scanResult.rawScanned || 'No QR text detected'}
                  </div>
                  <div className="text-[10px] text-purple-300/80 pt-0.5">
                    Tip: Enter ticket ID manually or select the attendee from the list below.
                  </div>
                </div>
              )}

              {/* Status Notice */}
              {actionNotice && (
                <div className="text-xs font-bold text-emerald-300 bg-emerald-950/60 py-1 px-2 rounded-lg border border-emerald-800/40 animate-fade-in">
                  {actionNotice}
                </div>
              )}
            </div>

            {/* DUAL ACTION BUTTONS: CHECK & UNDO OPTIONS */}
            <div className="space-y-2 pt-1">
              
              <div className="grid grid-cols-2 gap-2">
                
                {/* 1. CHECK OPTION */}
                {isCheckedIn ? (
                  <div className="py-2.5 rounded-xl font-bold text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-1.5 shadow-sm">
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                    <span>✓ Checked In</span>
                  </div>
                ) : (
                  <button
                    onClick={handleConfirmCheckin}
                    disabled={loading || isCancelled || isUnrecognized}
                    className="py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-green transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{loading ? 'Checking...' : 'Check In Pass'}</span>
                  </button>
                )}

                {/* 2. UNDO OPTION */}
                {isCheckedIn ? (
                  <button
                    onClick={() => handleUndoCheckin(scanResult.ticketId || scanResult.ticket?.ticketId)}
                    disabled={loading}
                    className="py-2.5 rounded-xl font-bold text-xs bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-600/50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>{loading ? 'Reverting...' : 'Undo Check-in'}</span>
                  </button>
                ) : (
                  <div className="py-2.5 rounded-xl font-bold text-xs bg-dark-900 text-slate-400 border border-purple-900/40 flex items-center justify-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 opacity-50" />
                    <span>(Marked Absent)</span>
                  </div>
                )}

              </div>

              {/* 3. SCAN NEXT PASS (Primary Advance Button) */}
              <button
                onClick={handleScanAgain}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-glow-purple transition-all flex items-center justify-center gap-2"
              >
                <span>Scan Next Pass</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>

          </div>
        )}

      </div>

      {/* Live Gate Counters (51 Registered | X Checked In | Y Remaining) */}
      <div className="my-3 p-3 rounded-2xl glass-panel border border-purple-500/20 shadow-md">
        <div className="grid grid-cols-3 divide-x divide-purple-900/50 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-purple-400/80 block">
              Registered
            </span>
            <span className="text-base font-black text-white">
              {stats.totalRegistrations}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">
              Checked In
            </span>
            <span className="text-base font-black text-emerald-400 flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {stats.checkedIn}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400/80 block">
              Remaining
            </span>
            <span className="text-base font-black text-amber-400">
              {stats.remaining}
            </span>
          </div>
        </div>
      </div>

      {/* Live Check-ins Feed with Direct Undo Option */}
      <div className="p-3 rounded-2xl bg-dark-900/80 border border-purple-500/20 shadow-md">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-900/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold uppercase tracking-wider text-purple-200 text-[11px]">
              Live Check-ins Feed
            </span>
          </div>
          <span className="text-[10px] text-purple-300/70 font-medium">
            {stats.checkedIn} Present &bull; Real-time
          </span>
        </div>

        {stats.checkedInAttendees && stats.checkedInAttendees.length > 0 ? (
          <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar pr-1">
            {stats.checkedInAttendees.slice(0, 4).map((att) => (
              <div 
                key={att.ticketId}
                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-purple-950/30 hover:bg-purple-950/60 border border-purple-900/30 text-xs transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white truncate text-[11px]">
                    {att.participantName}
                  </div>
                  <div className="text-[10px] text-purple-300/70 font-mono truncate">
                    {att.ticketId}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    Checked In
                  </span>
                  
                  {/* Direct Undo Button right on the live feed */}
                  <button
                    onClick={() => handleUndoCheckin(att.ticketId)}
                    className="p-1 rounded-lg text-amber-300 hover:text-white hover:bg-amber-950/60 border border-amber-800/40 transition-colors"
                    title={`Undo check-in for ${att.participantName}`}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-3 text-center text-xs text-purple-300/60">
            No attendees checked in yet. Scan any attendee pass to take live attendance!
          </div>
        )}

        <Link
          to="/attendance"
          className="flex items-center justify-center gap-1.5 pt-2 mt-2 border-t border-purple-900/40 text-[11px] font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Open Full Live Attendance Desk ({stats.checkedIn} Present) &rarr;</span>
        </Link>
      </div>

    </div>
  );
}
