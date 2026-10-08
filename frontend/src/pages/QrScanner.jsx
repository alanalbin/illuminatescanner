import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { soundEffects } from '../services/sound';
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCw, 
  RefreshCw, 
  Keyboard, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Clock,
  User,
  UserCheck,
  Ticket as TicketIcon
} from 'lucide-react';

export default function QrScanner() {
  const [stats, setStats] = useState({ totalRegistrations: 50, checkedIn: 0, remaining: 50 });
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [autoCheckin, setAutoCheckin] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Fetch stats for the bottom counter
  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats({
        totalRegistrations: data.totalRegistrations || 50,
        checkedIn: data.checkedIn || 0,
        remaining: data.remaining != null ? data.remaining : 50,
      });
    } catch (e) {
      console.warn('Stats fetch error:', e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Camera Scanner
  useEffect(() => {
    let isMounted = true;

    async function initScanner() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer back / environment camera
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment'));
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
      isMounted = false;
      stopCamera();
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
        () => {} // scan failure is continuous, ignore
      );
      setIsScanning(true);
      setCameraError('');
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraError('Unable to start camera. Please check camera permissions.');
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
    if (decodedText === lastScannedTextRef.current && (now - lastScannedTimeRef.current) < 3000) {
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
        soundEffects.playSuccess();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#a855f7', '#22c55e', '#ffffff'],
        });
        fetchStats();
      } else if (isAlreadyUsed) {
        soundEffects.playWarning();
      } else {
        soundEffects.playError();
      }

      // Auto return to scanning mode after 4.5 seconds
      setTimeout(() => {
        if (isProcessingRef.current) {
          handleScanAgain();
        }
      }, 4500);

    } catch (err) {
      soundEffects.playError();
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

  const handleConfirmCheckin = async () => {
    if (!scanResult?.ticketId) return;
    setLoading(true);
    try {
      const res = await api.checkinTicket(scanResult.ticketId, 'Volunteer Scanner');
      setScanResult(res);
      if (res.valid) {
        soundEffects.playSuccess();
        fetchStats();
      }
    } catch (err) {
      soundEffects.playError();
      alert(err.message || 'Checkin failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUndoCheckin = async (ticketId) => {
    if (!ticketId) return;
    try {
      await api.undoCheckin(ticketId);
      handleScanAgain();
      fetchStats();
    } catch (err) {
      alert(err.message || 'Undo check-in failed');
    }
  };

  const handleScanAgain = () => {
    setScanResult(null);
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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between max-w-md mx-auto px-4 py-4 relative">
      
      {/* Official Organizers Logo Strip */}
      <div className="flex items-center justify-center gap-3 py-1.5 px-3 rounded-2xl bg-white/[0.03] border border-purple-500/20 shadow-md">
        <img src="/logos/ecell-iitb.png" alt="E-Cell IIT Bombay" className="h-5 w-auto object-contain brightness-110" title="E-Cell IIT Bombay" />
        <div className="w-px h-3.5 bg-purple-500/30" />
        <img src="/logos/nec-iitb.png" alt="NEC 2026" className="h-5 w-auto object-contain" title="National Entrepreneurship Challenge 2026" />
        <div className="w-px h-3.5 bg-purple-500/30" />
        <img src="/logos/kmct-college.png" alt="KMCT College" className="h-4 w-auto object-contain" title="KMCT College of Engineering, Kasaragod" />
        <div className="w-px h-3.5 bg-purple-500/30" />
        <img src="/logos/nxtbyte-ecell.png" alt="NxT Byte E-Cell" className="h-5 w-auto object-contain" title="NxT Byte E-Cell" />
      </div>

      {/* Top Header */}
      <div className="text-center pt-1 pb-3">
        <div className="flex items-center justify-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-base font-extrabold tracking-wider text-white uppercase">
            ILLUMINATE ENTRY SCANNER
          </h1>
        </div>
        <p className="text-[11px] text-purple-300/70 font-medium">
          IIT Bombay E-Cell &bull; KMCT Official Gate Check-in
        </p>
      </div>

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
            <p className="text-[11px] text-purple-200/80 font-medium mt-3 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
              Align QR Code within the box
            </p>
          </div>
        )}

        {/* Camera Controls Bar */}
        {cameras.length > 1 && !scanResult && (
          <button
            onClick={switchCamera}
            className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 shadow-lg transition-transform active:scale-95"
            title="Switch Camera"
          >
            <RotateCw className="w-4 h-4" />
          </button>
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

        {/* RESULT OVERLAY (Instant Real-time Feedback) */}
        {scanResult && (
          <div className="absolute inset-0 z-30 flex flex-col justify-between p-5 bg-dark-950/95 backdrop-blur-xl animate-fade-in">
            
            {/* Header Badge */}
            <div className="text-center pt-2">
              {(scanResult.valid || scanResult.status === 'VALID' || scanResult.status === 'SUCCESS' || scanResult.success) ? (
                <div className="space-y-1">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-glow-green">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="text-xl font-black text-emerald-400 tracking-wider">
                    VALID PASS
                  </div>
                  <div className="text-xs uppercase font-extrabold tracking-widest text-emerald-300">
                    ENTRY APPROVED • ATTENDANCE RECORDED
                  </div>
                </div>
              ) : (scanResult.status === 'ALREADY_USED' || scanResult.status === 'ALREADY_CHECKED_IN') ? (
                <div className="space-y-1">
                  <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 shadow-glow-amber">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="text-xl font-black text-amber-400 tracking-wider">
                    ALREADY CHECKED IN
                  </div>
                  <div className="text-xs uppercase font-extrabold tracking-widest text-amber-300">
                    ATTENDANCE ALREADY TAKEN
                  </div>
                </div>
              ) : scanResult.status === 'CANCELLED' ? (
                <div className="space-y-1">
                  <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 shadow-glow-red">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <div className="text-xl font-black text-rose-400 tracking-wider">
                    CANCELLED PASS
                  </div>
                  <div className="text-xs uppercase font-extrabold tracking-widest text-rose-400">
                    ENTRY NOT PERMITTED
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 shadow-glow-red">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div className="text-xl font-black text-rose-400 tracking-wider">
                    UNRECOGNIZED PASS
                  </div>
                  <div className="text-xs uppercase font-extrabold tracking-widest text-rose-300">
                    NOT IN REGISTERED ATTENDEE LIST
                  </div>
                </div>
              )}
            </div>

            {/* Participant Details Body */}
            <div className="my-auto text-center space-y-2 p-3 rounded-2xl bg-dark-900 border border-purple-800/40">
              {(scanResult.participantName || scanResult.ticket?.participantName) ? (
                <>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-purple-400">PARTICIPANT</div>
                    <div className="text-base font-extrabold text-white">
                      {scanResult.participantName || scanResult.ticket?.participantName}
                    </div>
                  </div>

                  {(scanResult.ticketId || scanResult.ticket?.ticketId) && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-purple-400">TICKET ID</div>
                      <div className="font-mono text-xs font-bold text-purple-200">
                        {scanResult.ticketId || scanResult.ticket?.ticketId}
                      </div>
                    </div>
                  )}

                  {(scanResult.course || scanResult.ticket?.course) && (
                    <div className="text-xs text-purple-300 font-medium">
                      {scanResult.course || scanResult.ticket?.course}
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

              {scanResult.message && (
                <div className={`text-xs pt-1 ${
                  (scanResult.valid || scanResult.status === 'VALID' || scanResult.status === 'SUCCESS' || scanResult.success)
                    ? 'text-emerald-300 font-semibold'
                    : (scanResult.status === 'ALREADY_USED' || scanResult.status === 'ALREADY_CHECKED_IN')
                    ? 'text-amber-300 font-semibold'
                    : 'text-rose-300'
                }`}>
                  {scanResult.message}
                </div>
              )}

              {(scanResult.status === 'ALREADY_USED' || scanResult.status === 'ALREADY_CHECKED_IN') && scanResult.checkedInAt && (
                <div className="text-[11px] text-amber-300 font-semibold pt-1">
                  Checked In At: {new Date(scanResult.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {!autoCheckin && scanResult.valid && !scanResult.checkedInAt && (
                <button
                  onClick={handleConfirmCheckin}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-green transition-all"
                >
                  {loading ? 'Confirming...' : 'MARK CHECK-IN'}
                </button>
              )}

              {(scanResult.status === 'ALREADY_USED' || scanResult.status === 'ALREADY_CHECKED_IN') && (scanResult.ticketId || scanResult.ticket?.ticketId) && (
                <button
                  onClick={() => handleUndoCheckin(scanResult.ticketId || scanResult.ticket?.ticketId)}
                  className="w-full py-2 rounded-xl font-semibold text-xs bg-dark-800 hover:bg-dark-700 text-amber-300 border border-amber-800/40 transition-all"
                >
                  Undo Check-in (Mark as Absent)
                </button>
              )}

              <button
                onClick={handleScanAgain}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-glow-purple transition-all flex items-center justify-center gap-2"
              >
                <span>Scan Next Pass</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/attendance"
                className="w-full py-2 rounded-xl font-semibold text-xs bg-dark-900/80 hover:bg-purple-950 text-purple-200 border border-purple-700/50 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>View in Live Attendance Desk ({stats.checkedIn} Present)</span>
              </Link>
            </div>

          </div>
        )}

      </div>

      {/* Manual Entry Fallback / Toggle Bar */}
      <div className="my-3">
        <button
          onClick={() => setShowManual(!showManual)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-purple-300/80 hover:text-white transition-colors"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>{showManual ? 'Hide Manual Ticket Entry' : 'Manual Ticket ID Entry (Keyboard)'}</span>
        </button>

        {showManual && (
          <form onSubmit={handleManualSubmit} className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="e.g. ILM-KMCT-MUTD4OFR-2F58F8"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-dark-900 border border-purple-800 text-white text-xs font-mono focus:border-purple-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !manualInput.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white disabled:opacity-50"
            >
              Verify
            </button>
          </form>
        )}
      </div>

      {/* Bottom Live Gate Counters */}
      {/* 38 Registered | X Checked In | Y Remaining */}
      <div className="p-3.5 rounded-2xl glass-panel border border-purple-500/20 shadow-md">
        <div className="grid grid-cols-3 divide-x divide-purple-900/50 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-purple-400/80 block">
              Registered
            </span>
            <span className="text-lg font-black text-white">
              {stats.totalRegistrations}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">
              Checked In
            </span>
            <span className="text-lg font-black text-emerald-400">
              {stats.checkedIn}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400/80 block">
              Remaining
            </span>
            <span className="text-lg font-black text-amber-400">
              {stats.remaining}
            </span>
          </div>
        </div>
        <Link
          to="/attendance"
          className="flex items-center justify-center gap-1.5 pt-2.5 mt-2.5 border-t border-purple-900/40 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>View Live Attendance Roster ({stats.checkedIn} Present) &rarr;</span>
        </Link>
      </div>

    </div>
  );
}
