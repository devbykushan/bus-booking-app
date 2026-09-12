import React, { useState, useRef } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { paymentSlipsApi } from '../../services/api';
import { Upload, CheckCircle2, AlertCircle, FileImage, FileText, ArrowLeft, Loader2, X } from 'lucide-react';

export const SlipUploadPage: React.FC = () => {
  const { latestConfirmedBooking, setCurrentView } = useBookingStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const booking = latestConfirmedBooking;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      setError('Only image files (JPG, PNG, WEBP) or PDF documents are accepted.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileChange(fakeEvent);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !booking) return;

    setUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const base64 = (ev.target?.result as string).split(',')[1];
          const mime = selectedFile.type || (selectedFile.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
          await paymentSlipsApi.upload({
            bookingId: booking.id,
            pnr: booking.pnr,
            imageData: base64,
            imageMime: mime,
            amount: booking.totalFare,
            passengerName: booking.passenger?.fullName || '',
            passengerPhone: booking.passenger?.phone || '',
          });
          setUploaded(true);
        } catch (err: any) {
          setError(err.message || 'Failed to upload slip.');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      setError(err.message || 'Failed to read file.');
      setUploading(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-slate-600">No booking found. Please start a new booking.</p>
          <button
            onClick={() => setCurrentView('passenger-search')}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (uploaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-6 animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-800">Slip Submitted!</h2>
            <p className="text-sm text-slate-500">
              Your payment slip has been submitted successfully. Our admin will review it within <strong>2–4 hours</strong>.
            </p>
            <p className="text-sm text-slate-500">
              You will receive a <strong>WhatsApp notification</strong> once your booking is confirmed.
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left space-y-2">
            <p className="text-xs text-slate-500">Booking Reference</p>
            <p className="text-lg font-extrabold text-blue-600 font-mono">{booking.pnr}</p>
            <p className="text-xs text-slate-600">{booking.origin} ➔ {booking.destination}</p>
            <p className="text-xs text-slate-600">Total: <strong>LKR {booking.totalFare.toLocaleString()}</strong></p>
          </div>
          <button
            onClick={() => setCurrentView('my-bookings')}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
          >
            View My Bookings
          </button>
          <button
            onClick={() => setCurrentView('passenger-search')}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isSelectedPdf = selectedFile?.type === 'application/pdf' || selectedFile?.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('passenger-search')}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Upload Payment Slip</h1>
            <p className="text-xs text-slate-500">PNR: <span className="font-mono font-bold text-blue-600">{booking.pnr}</span></p>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Booking Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-400">Route</p>
              <p className="font-semibold text-slate-800">{booking.origin} ➔ {booking.destination}</p>
            </div>
            <div>
              <p className="text-slate-400">Date</p>
              <p className="font-semibold text-slate-800">{booking.departureDate}</p>
            </div>
            <div>
              <p className="text-slate-400">Passenger</p>
              <p className="font-semibold text-slate-800">{booking.passenger?.fullName}</p>
            </div>
            <div>
              <p className="text-slate-400">Amount to Transfer</p>
              <p className="text-lg font-extrabold text-emerald-600">LKR {booking.totalFare.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Bank Details Reminder */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2">
          <p className="text-sm font-bold text-emerald-800">🏦 Transfer to this account:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-slate-400">Bank</p><p className="font-bold text-slate-800">Bank of Ceylon</p></div>
            <div><p className="text-slate-400">Account No</p><p className="font-bold font-mono text-slate-800">8001234567</p></div>
            <div><p className="text-slate-400">Account Name</p><p className="font-bold text-slate-800">Dewmina Super Line</p></div>
            <div><p className="text-slate-400">Branch</p><p className="font-bold text-slate-800">Monaragala</p></div>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">⚠️ Please transfer exactly <strong>LKR {booking.totalFare.toLocaleString()}</strong> and use your name as the reference.</p>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-700">Upload Transfer Slip</h3>
          
          {!previewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <FileImage className="w-8 h-8 text-blue-500" />
                <span className="text-slate-300 font-bold">/</span>
                <FileText className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Click or drag & drop your slip</p>
              <p className="text-xs text-slate-400 mt-1">Image (JPG, PNG) or PDF Document — Max 20MB</p>
            </div>
          ) : isSelectedPdf ? (
            <div className="relative p-5 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0 shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{selectedFile?.name}</p>
                <p className="text-xs text-slate-500">
                  PDF Document • {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700">
                  Ready to submit
                </span>
              </div>
              <button
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                className="p-1.5 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                title="Remove document"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <img src={previewUrl} alt="Slip preview" className="w-full rounded-xl border border-slate-200 max-h-64 object-contain bg-slate-50" />
              <button
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-md hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!selectedFile || uploading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="w-4 h-4" /> Submit Payment Slip</>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          After submitting, admin will verify your payment within 2–4 hours.
          You will receive a WhatsApp notification once confirmed.
        </p>
      </div>
    </div>
  );
};
