import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  Phone, 
  RotateCcw, 
  ExternalLink, 
  Calendar, 
  Ticket, 
  Upload, 
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { useBookingStore } from '../../store/bookingStore';
import { 
  type ChatMessage, 
  INITIAL_BOT_MESSAGE_LANG_SELECT,
  INITIAL_BOT_MESSAGE_SI,
  INITIAL_BOT_MESSAGE_EN,
  sendChatMessage 
} from '../../services/botClient';

const WHATSAPP_CONTACTS_SI = [
  {
    number: '076 258 1841',
    rawNumber: '94762581841',
    title: 'Seat Booking & Inquiries',
    subtitle: 'Conductor & Online Support',
    status: 'Online Now',
    message: 'Hello Dewmina Super Line, I would like to inquire about bus seat booking.',
  },
  {
    number: '072 417 3143',
    rawNumber: '94724173143',
    title: 'Express Dispatch & Helpline',
    subtitle: 'Route & Schedule Support',
    status: 'Active 24/7',
    message: 'Hello Dewmina Super Line, I need assistance with bus schedule/dispatch.',
  },
];

const WHATSAPP_CONTACTS_EN = [
  {
    number: '076 258 1841',
    rawNumber: '94762581841',
    title: 'Seat Booking & Inquiries',
    subtitle: 'Conductor & Online Support',
    status: 'Online Now',
    message: 'Hello Dewmina Super Line, I would like to inquire about bus seat booking.',
  },
  {
    number: '072 417 3143',
    rawNumber: '94724173143',
    title: 'Express Dispatch & Helpline',
    subtitle: 'Route & Schedule 24/7 Helpline',
    status: 'Active 24/7',
    message: 'Hello Dewmina Super Line, I need assistance with bus schedule/dispatch.',
  },
];

export const FloatingWhatsApp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'bot' | 'whatsapp'>('bot');
  const [botLang, setBotLang] = useState<'si' | 'en' | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_BOT_MESSAGE_LANG_SELECT]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setCurrentView } = useBookingStore();
  const isPwaPromptOpen = useBookingStore((state) => state.isPwaPromptOpen);

  // Detect when document body is locked by any modal/drawer
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsModalOpen(document.body.style.overflow === 'hidden');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen && activeTab === 'bot') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, activeTab]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && activeTab === 'bot') {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, activeTab]);

  const handleSelectLanguage = (lang: 'si' | 'en') => {
    setBotLang(lang);
    const userLabel = lang === 'en' ? '🇬🇧 English' : '🇱🇰 සිංහල (Sinhala)';
    const welcomeMsg = lang === 'en' ? INITIAL_BOT_MESSAGE_EN : INITIAL_BOT_MESSAGE_SI;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-lang-${Date.now()}`,
        sender: 'user',
        text: userLabel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      welcomeMsg,
    ]);
  };

  const handleSwitchLanguage = (newLang: 'si' | 'en') => {
    if (botLang === newLang) return;
    setBotLang(newLang);
    const switchedMsg: ChatMessage = newLang === 'en'
      ? {
          id: `bot-lang-switch-${Date.now()}`,
          sender: 'bot',
          text: `🇬🇧 **Language changed to English.**\n\nHow can I help you today? Please choose an option below or type your question:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          options: INITIAL_BOT_MESSAGE_EN.options,
        }
      : {
          id: `bot-lang-switch-${Date.now()}`,
          sender: 'bot',
          text: `🇱🇰 **භාෂාව සිංහල වෙත මාරු කරන ලදී.**\n\nඔබට අවශ්‍ය සේවාව පහතින් තෝරන්න හෝ ප්‍රශ්නය මෙහි සටහන් කරන්න:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          options: INITIAL_BOT_MESSAGE_SI.options,
        };

    setMessages((prev) => [...prev, switchedMsg]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    // Check if selecting initial language
    if (text === 'LANG_SI' || text === '🇱🇰 සිංහල (Sinhala)' || text === 'සිංහල') {
      handleSelectLanguage('si');
      setInputText('');
      return;
    }

    if (text === 'LANG_EN' || text === '🇬🇧 English' || text.toLowerCase() === 'english') {
      handleSelectLanguage('en');
      setInputText('');
      return;
    }

    // Auto-determine language if not yet selected
    const activeLang = botLang || (/[ඐ-෦]/.test(text) ? 'si' : 'en');
    if (!botLang) {
      setBotLang(activeLang);
    }

    setInputText('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const reply = await sendChatMessage(text, activeLang);
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: activeLang === 'en'
            ? 'Sorry, a temporary response error occurred. Please try again or contact conductor.'
            : 'සමාවන්න, ප්‍රතිචාර දැක්වීමේදී සුළු දෝෂයක් ඇති විය. කරුණාකර නැවත උත්සාහ කරන්න.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleOpenWhatsapp = (rawNumber: string, message: string) => {
    const url = `https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleResetChat = () => {
    setBotLang(null);
    setMessages([INITIAL_BOT_MESSAGE_LANG_SELECT]);
  };

  const handleActionClick = (action: any) => {
    if (action.type === 'VIEW_SCHEDULES') {
      setCurrentView('schedules-dashboard');
      setIsOpen(false);
    } else if (action.type === 'BOOK_SEAT') {
      setCurrentView('passenger-search');
      setIsOpen(false);
      setTimeout(() => {
        const searchEl = document.getElementById('search-routes') || document.querySelector('section');
        searchEl?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (action.type === 'VIEW_SLIP_UPLOAD') {
      setCurrentView('slip-upload');
      setIsOpen(false);
    } else if (action.type === 'WHATSAPP_CONTACT') {
      const num = action.data?.number || '94762581841';
      handleOpenWhatsapp(num, 'Hello Dewmina Super Line, I need assistance.');
    } else if (action.type === 'CALL_PHONE') {
      window.location.href = `tel:${action.data?.phone || '0762581841'}`;
    }
  };

  if (isModalOpen || isPwaPromptOpen) return null;

  // Active quick options depending on current state
  const currentQuickOptions = !botLang
    ? INITIAL_BOT_MESSAGE_LANG_SELECT.options
    : botLang === 'en'
    ? INITIAL_BOT_MESSAGE_EN.options
    : INITIAL_BOT_MESSAGE_SI.options;

  const contactsList = botLang === 'en' ? WHATSAPP_CONTACTS_EN : WHATSAPP_CONTACTS_SI;

  return (
    <div className="fixed bottom-[calc(4.2rem+max(0.35rem,calc(env(safe-area-inset-bottom,0px)*0.35)))] md:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-end select-none font-sans" ref={menuRef}>
      {/* ─── LIVE BOT & WHATSAPP CHAT MODAL ─────────────────────────────────────── */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[400px] h-[550px] max-h-[82vh] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-up origin-bottom-right transition-all">
          {/* Top Header */}
          <div className="bg-gradient-to-r from-[#128C7E] via-[#075E54] to-slate-900 p-3.5 text-white relative flex-shrink-0 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
                    <Bot className="w-5 h-5 text-emerald-300" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#075E54] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-sm tracking-tight text-white">Dewmina Live Bot</h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      AI 24/7
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300 inline" />
                    {botLang === 'en' ? 'Instant AI Assistance' : 'ක්ෂණික සහය සේවාව'}
                  </p>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-1.5">
                {/* Language Switch Pill in Header */}
                <div className="flex items-center bg-black/30 p-0.5 rounded-xl border border-white/15 backdrop-blur-sm text-[11px] font-bold">
                  <button
                    onClick={() => handleSwitchLanguage('si')}
                    title="සිංහල භාෂාවට මාරු වන්න"
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      botLang === 'si'
                        ? 'bg-emerald-500 text-white shadow-xs font-black'
                        : 'text-emerald-100/70 hover:text-white'
                    }`}
                  >
                    සිං
                  </button>
                  <button
                    onClick={() => handleSwitchLanguage('en')}
                    title="Switch to English"
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      botLang === 'en'
                        ? 'bg-emerald-500 text-white shadow-xs font-black'
                        : 'text-emerald-100/70 hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                </div>

                {activeTab === 'bot' && (
                  <button
                    onClick={handleResetChat}
                    title={botLang === 'en' ? 'Reset Chat & Language' : 'නැවත ආරම්භ කරන්න (Reset)'}
                    className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Reset Chat"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="mt-3 grid grid-cols-2 gap-1.5 bg-black/25 p-1 rounded-xl backdrop-blur-xs text-xs font-semibold">
              <button
                onClick={() => setActiveTab('bot')}
                className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'bot'
                    ? 'bg-emerald-500 text-white shadow-sm font-bold'
                    : 'text-emerald-100/70 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" /> Live AI Bot
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'whatsapp'
                    ? 'bg-emerald-500 text-white shadow-sm font-bold'
                    : 'text-emerald-100/70 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" /> Conductor WhatsApp
              </button>
            </div>
          </div>

          {/* ─── TAB 1: LIVE BOT CHAT ────────────────────────────────────────────── */}
          {activeTab === 'bot' && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">
              {/* Message List */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isLangSelectPrompt = msg.id === 'init-lang-select';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                    >
                      <div
                        className={`p-3 rounded-2xl max-w-[88%] leading-relaxed shadow-xs whitespace-pre-wrap select-text ${
                          isUser
                            ? 'bg-emerald-600 text-white rounded-br-xs font-medium'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}

                        {/* Interactive Language Selector Buttons inside initial bubble */}
                        {isLangSelectPrompt && msg.options && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                            {msg.options.map((opt, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSendMessage(opt.value)}
                                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons attached to Bot message */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                            {msg.actions.map((act, i) => (
                              <button
                                key={i}
                                onClick={() => handleActionClick(act)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                              >
                                {act.type === 'VIEW_SCHEDULES' && <Calendar className="w-3 h-3 text-emerald-600" />}
                                {act.type === 'BOOK_SEAT' && <Ticket className="w-3 h-3 text-emerald-600" />}
                                {act.type === 'VIEW_SLIP_UPLOAD' && <Upload className="w-3 h-3 text-emerald-600" />}
                                {act.type === 'WHATSAPP_CONTACT' && <ExternalLink className="w-3 h-3 text-emerald-600" />}
                                {act.type === 'CALL_PHONE' && <Phone className="w-3 h-3 text-emerald-600" />}
                                {act.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-16 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Suggestion Chips */}
              <div className="px-3 py-2 bg-slate-100/80 dark:bg-slate-900 border-t border-slate-200/70 dark:border-slate-800 overflow-x-auto flex gap-1.5 scrollbar-none">
                {currentQuickOptions?.map((opt, i) => (
                  <button
                    key={i}
                    disabled={isTyping}
                    onClick={() => handleSendMessage(opt.value)}
                    className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 hover:border-emerald-400 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    botLang === 'en'
                      ? 'Type a question or PNR number...'
                      : 'ප්‍රශ්නයක් හෝ PNR අංකය ලියන්න...'
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <button
                  disabled={!inputText.trim() || isTyping}
                  onClick={() => handleSendMessage()}
                  className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-emerald-600 shadow-sm cursor-pointer"
                  aria-label="Send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ─── TAB 2: DIRECT WHATSAPP CONDUCTORS ─────────────────────────────────── */}
          {activeTab === 'whatsapp' && (
            <div className="flex-1 p-3.5 space-y-3 bg-slate-50/70 dark:bg-slate-950 overflow-y-auto">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium px-1">
                {botLang === 'en'
                  ? 'Select a conductor number to connect directly via WhatsApp:'
                  : 'WhatsApp හරහා Conductor වරුන් සමඟ සෘජුවම සම්බන්ධ වීමට අංකයක් තෝරන්න:'}
              </p>

              {contactsList.map((contact, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOpenWhatsapp(contact.rawNumber, contact.message)}
                  className="w-full text-left p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 text-slate-800 dark:text-slate-100 transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 text-[#128C7E] dark:text-[#25D366] flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366] group-hover:text-white transition-colors duration-300">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-mono text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {contact.number}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                          {contact.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{contact.title}</p>
                      <p className="text-[10px] text-slate-400">{contact.subtitle}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}

              <div className="mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200">
                {botLang === 'en' ? (
                  <>
                    💡 <strong>Notice:</strong> Conductors can be contacted for seat reservations, ticket confirmation, and live bus dispatch details.
                  </>
                ) : (
                  <>
                    💡 <strong>දැනුවත් කිරීම:</strong> ආසන වෙන්කිරීම්, ප්‍රවේශපත්‍ර තහවුරු කිරීම් සහ බස් රථය ධාවනය වන වේලාවන් සජීවීව දැනගැනීමට Conductor වරුන් සම්බන්ධ කරගත හැක.
                  </>
                )}
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="px-3.5 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 flex-shrink-0">
            <span className="flex items-center gap-1 font-medium">
              {botLang === 'en' ? '🚌 Monaragala ⇄ Colombo' : '🚌 මොනරාගල ⇄ කොළඹ'}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">24/7 Available</span>
          </div>
        </div>
      )}

      {/* ─── MAIN FLOATING TRIGGER BUTTON ────────────────────────────────────────── */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasInteracted(true);
        }}
        aria-label="Open Dewmina Live Bot and WhatsApp Support"
        className="relative group flex items-center justify-center w-14 h-14 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl shadow-emerald-600/35 hover:shadow-2xl hover:shadow-emerald-600/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
      >
        {/* Pulsing ring */}
        <span className="absolute inset-0 rounded-2xl bg-[#25D366] opacity-40 animate-ping pointer-events-none group-hover:opacity-0" />

        {isOpen ? (
          <X className="w-6 h-6 relative z-10" />
        ) : (
          <div className="relative z-10 flex items-center justify-center">
            {/* WhatsApp + Chat icon combo */}
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.301-.15-1.781-.879-2.057-.98-.276-.1-.476-.15-.676.15s-.776.98-.952 1.18c-.176.2-.351.226-.652.075s-1.269-.468-2.417-1.493c-.894-.799-1.497-1.786-1.673-2.087s-.019-.464.132-.614c.135-.135.301-.351.451-.527s.2-.301.301-.502c.1-.2.05-.376-.025-.526s-.677-1.631-.927-2.233c-.244-.587-.492-.507-.677-.517l-.577-.01c-.2 0-.526.075-.802.376s-1.053 1.028-1.053 2.507 1.078 2.908 1.228 3.109c.15.2 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.23 1.378.197 1.897.12.578-.087 1.781-.728 2.032-1.431.25-.703.25-1.305.175-1.431-.075-.125-.275-.2-.576-.351zm-5.467 7.604c-2.179 0-4.218-.621-5.962-1.698l-.427-.26-4.437 1.164 1.185-4.323-.279-.444c-1.185-1.884-1.812-4.067-1.812-6.307 0-6.685 5.439-12.124 12.124-12.124 3.24 0 6.287 1.261 8.578 3.553 2.292 2.291 3.554 5.338 3.554 8.579 0 6.686-5.439 12.124-12.124 12.124zm9.431-21.555c-2.52-2.52-5.87-3.909-9.431-3.909-7.346 0-13.324 5.978-13.324 13.324 0 2.348.613 4.639 1.776 6.666l-1.888 6.897 7.057-1.851c1.947 1.062 4.148 1.621 6.379 1.621 7.346 0 13.324-5.978 13.324-13.324 0-3.561-1.389-6.911-3.909-9.431z"/>
            </svg>
            <span className="absolute -bottom-1 -right-1 bg-white text-emerald-600 rounded-full p-0.5 shadow-xs">
              <MessageSquare className="w-3 h-3 fill-emerald-600" />
            </span>
          </div>
        )}

        {/* Unread badge / alert */}
        {!isOpen && !hasInteracted && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>
        )}
      </button>
    </div>
  );
};
