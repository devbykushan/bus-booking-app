import React, { useState, useEffect } from 'react';
import { whatsappApi } from '../../services/api';
import { 
  MessageSquare, RefreshCw, CheckCircle2, AlertTriangle, 
  Smartphone, Send, Loader2, Sparkles, Phone, ShieldCheck
} from 'lucide-react';

export const WhatsAppManagerSection: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'qr_ready' | 'disconnected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);

  // Test message state
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('🚌 Hello! This is a test message from Dewmina Super Line automated WhatsApp service.');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await whatsappApi.getStatus();
      setStatus(res.status);
      setQrCode(res.qrCode);
      setUser(res.user);
    } catch (err: any) {
      console.error('Failed to fetch WhatsApp status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 3 seconds if not connected or waiting for QR scan
    const interval = setInterval(() => {
      fetchStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRestart = async () => {
    setRestarting(true);
    setTestResult(null);
    try {
      await whatsappApi.restart();
      await fetchStatus();
    } catch (err: any) {
      alert(`Restart failed: ${err.message}`);
    } finally {
      setRestarting(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMsg.trim()) return;

    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await whatsappApi.testSend(testPhone.trim(), testMsg.trim());
      if (res.success) {
        setTestResult({ success: true, message: `Message sent successfully to ${testPhone}!` });
      } else {
        setTestResult({ success: false, message: res.error || 'Failed to send message.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Error occurred while sending.' });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pure Node.js WhatsApp Engine (Baileys)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <MessageSquare className="w-7 h-7" />
              <span>Automated WhatsApp Gateway</span>
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
              Sends instant E-Tickets, PNR confirmations, and OTPs to passengers directly from the backend server with 0 Docker load.
            </p>
          </div>

          <button
            type="button"
            disabled={restarting}
            onClick={handleRestart}
            className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${restarting ? 'animate-spin' : ''}`} />
            <span>{restarting ? 'Restarting...' : 'Restart / New QR'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Connection Status & QR Code (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Connection Status</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live socket state with WhatsApp Multi-Device servers</p>
            </div>

            {loading ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Checking...</span>
              </span>
            ) : status === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-extrabold animate-pulse-subtle">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ACTIVE & CONNECTED</span>
              </span>
            ) : status === 'qr_ready' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300 text-xs font-extrabold animate-bounce-subtle">
                <Smartphone className="w-4 h-4 text-amber-600" />
                <span>SCAN QR CODE</span>
              </span>
            ) : status === 'connecting' ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-300 text-xs font-extrabold">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>CONNECTING...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-300 text-xs font-extrabold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>DISCONNECTED</span>
              </span>
            )}
          </div>

          {/* Status Display Body */}
          {status === 'connected' ? (
            <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-emerald-900 dark:text-emerald-200">WhatsApp Service is Online!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Connected Account: <strong className="font-mono">{user?.id?.replace(/:.*@/, '@') || 'Dewmina Super Line Bot'}</strong>
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  All automated E-Tickets and verification messages are being delivered in real-time.
                </p>
              </div>
            </div>
          ) : qrCode ? (
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 space-y-4 animate-fadeIn">
              <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-56 h-56 object-contain" />
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Scan this QR code with WhatsApp
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  1. Open WhatsApp on your phone ➜ <strong>Settings</strong> ➜ <strong>Linked Devices</strong><br />
                  2. Tap <strong>Link a Device</strong> and point your camera at this QR code.
                </p>
              </div>

              <button
                type="button"
                disabled={restarting}
                onClick={handleRestart}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${restarting ? 'animate-spin' : ''}`} />
                <span>Refresh QR Code</span>
              </button>
            </div>
          ) : restarting || status === 'connecting' ? (
            <div className="p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Generating WhatsApp QR Code...</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Connecting to WhatsApp Multi-Device network. The pairing QR code will appear in a few seconds.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <Smartphone className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">WhatsApp Service is Ready to Pair</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Click the button below to initialize the WhatsApp engine and generate a pairing QR code.
                </p>
              </div>
              <button
                type="button"
                disabled={restarting}
                onClick={handleRestart}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 inline-flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${restarting ? 'animate-spin' : ''}`} />
                <span>{restarting ? 'Generating QR Code...' : '⚡ Generate Pairing QR Code'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Col: Live WhatsApp Message Tester (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Send className="w-4 h-4 text-indigo-600" />
              <span>Test WhatsApp Dispatcher</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Send a test message to verify delivery</p>
          </div>

          <form onSubmit={handleSendTest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Mobile / WhatsApp Number:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. 0771234567 or +94771234567"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-mono dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Message Content:
              </label>
              <textarea
                rows={4}
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                testResult.success 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={sendingTest || status !== 'connected'}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {sendingTest ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Message...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Test Message</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
