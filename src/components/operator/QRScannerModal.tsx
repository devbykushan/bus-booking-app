import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { QrCode, Camera, CheckCircle2, XCircle, Search, UserCheck, Bus, ShieldCheck } from 'lucide-react';

interface QRScannerModalProps {
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ onClose }) => {
  const { validateTicketByPNR, bookings } = useBookingStore();

  const [pnrInput, setPnrInput] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; booking?: any; message: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleValidate = async (pnrToTest: string) => {
    if (!pnrToTest.trim()) return;
    setIsScanning(true);
    setScanResult(null);

    // Simulate a brief camera scanning delay
    await new Promise(r => setTimeout(r, 800));

    const result = await validateTicketByPNR(pnrToTest.trim());
    setScanResult(result);
    setIsScanning(false);

    // Audio beep
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      osc.type = result.success ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(result.success ? 880 : 300, audioCtx.currentTime);
      osc.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (_) {}
  };

  const handleSimulateSampleScan = () => {
    if (bookings.length > 0) {
      handleValidate(bookings[0].pnr);
    } else {
      handleValidate('OMNI-89021');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel p-6 md:p-8 rounded-3xl max-w-lg w-full border border-slate-700 space-y-6 shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <QrCode className="w-6 h-6 text-teal-400" />
            <span>Conductor Ticket Validator</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Live Camera Viewfinder Simulator Box */}
        <div className="relative bg-slate-900 rounded-2xl p-8 border-2 border-dashed border-teal-500/50 flex flex-col items-center justify-center text-center space-y-4 overflow-hidden">
          
          {/* Animated Viewfinder Corner Reticles */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-teal-400" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-teal-400" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-teal-400" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-teal-400" />

          {/* Laser Scan Animation Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-400 shadow-lg shadow-teal-400/80 animate-bounce" />

          <Camera className="w-12 h-12 text-teal-400 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-white">Camera Viewfinder Active</p>
            <p className="text-xs text-slate-400">Position passenger QR code inside frame to validate boarding pass.</p>
          </div>

          <button
            onClick={handleSimulateSampleScan}
            disabled={isScanning}
            className="px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold transition-all"
          >
            {isScanning ? 'Scanning QR Code...' : '⚡ Simulate Live Camera QR Scan'}
          </button>
        </div>

        {/* Manual PNR Entry Form */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Or Type PNR Ticket Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. OMNI-89021"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-teal-500 uppercase"
            />
            <button
              onClick={() => handleValidate(pnrInput)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
            >
              Verify PNR
            </button>
          </div>
        </div>

        {/* Scan Result Feedback Card */}
        {scanResult && (
          <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-fade-in ${
            scanResult.success 
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
          }`}>
            <div className="flex items-center gap-2 font-bold text-sm">
              {scanResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
              <span>{scanResult.message}</span>
            </div>

            {scanResult.booking && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-300">
                <p><strong>Passenger:</strong> {scanResult.booking.passenger?.fullName} ({scanResult.booking.passenger?.phone})</p>
                <p><strong>Seats:</strong> {(scanResult.booking.seats as any[])?.map((s: any) => s.number || s).join(', ') || scanResult.booking.seatIds?.join(', ')}</p>
                <p><strong>Route:</strong> {scanResult.booking.route || `${scanResult.booking.origin} → ${scanResult.booking.destination}`}</p>
                <p><strong>Boarding:</strong> {scanResult.booking.boardingPoint}</p>
                <p><strong>Status:</strong> <span className="text-emerald-400 font-bold uppercase">{scanResult.booking.bookingStatus}</span></p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
