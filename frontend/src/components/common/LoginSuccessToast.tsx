import { useEffect, useState } from 'react';
import { CheckCircle2, X, PartyPopper } from 'lucide-react';

interface LoginSuccessToastProps {
  name: string;
  avatarUrl?: string | null;
  isNewUser?: boolean;
  onDismiss: () => void;
}

export function LoginSuccessToast({ name, avatarUrl, isNewUser = false, onDismiss }: LoginSuccessToastProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // New users get 5s, returning users get 4s
  const duration = isNewUser ? 5000 : 4000;

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 50);
    const leaveTimer = setTimeout(() => {
      setLeaving(true);
      setTimeout(onDismiss, 400);
    }, duration);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(leaveTimer);
    };
  }, [onDismiss, duration]);

  const handleClose = () => {
    setLeaving(true);
    setTimeout(onDismiss, 400);
  };

  const firstLetter = name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      className={`fixed bottom-6 right-4 sm:right-6 z-[9999] transition-all duration-400 ease-out ${
        visible && !leaving
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-6 scale-95'
      }`}
      style={{ maxWidth: '340px', width: 'calc(100vw - 2rem)' }}
    >
      <div className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border ${
        isNewUser
          ? 'border-blue-200 dark:border-blue-800/60 shadow-blue-500/10'
          : 'border-emerald-200 dark:border-emerald-800/60 shadow-emerald-500/10'
      }`}>

        {/* Top progress bar */}
        <div
          className={`absolute top-0 left-0 h-1 rounded-t-2xl ${isNewUser ? 'bg-blue-500' : 'bg-emerald-500'}`}
          style={{
            animation: `shrink ${duration}ms linear forwards`,
            width: '100%',
          }}
        />

        <div className="flex items-start gap-3 px-4 py-4 pt-5">
          {/* Avatar / Icon */}
          <div className="relative shrink-0">
            {isNewUser ? (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <PartyPopper className="w-6 h-6 text-white" />
              </div>
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-400/40"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-lg text-white shadow-md">
                {firstLetter}
              </div>
            )}
            {/* Badge */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow ${
              isNewUser ? 'bg-blue-500' : 'bg-emerald-500'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            {isNewUser ? (
              <>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  🎉 ගිණුම සාර්ථකව සෑදුණා!
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  ආයුබෝවන්, {name}! දැන් ඔබ Dewmina Super Line හි member කෙනෙක්!
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  ✉️ Welcome email ඔබගේ inbox එකට ගිහිල්ලා
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                  ආයුබෝවන්, {name}! 👋
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  ✅ Google හරහා සාර්ථකව Login විය
                </p>
              </>
            )}
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
