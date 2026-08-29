import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { MapPin, ArrowLeft, Radio, ShieldCheck, Zap, Bell, Navigation, Sparkles, Ticket } from 'lucide-react';

export const LiveMap: React.FC = () => {
  const { routes, trackingRouteId, goToSearchSchedules, setCurrentView, language } = useBookingStore();
  const activeRoute = routes.find(r => r.id === trackingRouteId) || routes[0];

  const content = {
    english: {
      title: 'Live GPS Satellite Telemetry',
      badge: 'COMING SOON',
      subtitle: 'Real-time GPS bus tracking for passengers is currently under hardware deployment across our Sri Lanka fleet.',
      desc: 'We are equipping all Dewmina Super Line coaches with high-precision satellite telemetry transponders. Once active, you will be able to track your bus in real time, view exact arrival ETAs at your boarding stop, and get live route updates.',
      featuresHeading: 'What to Expect when Live GPS Launches',
      backBtn: 'Back to Journeys',
      myTicketsBtn: 'View My Tickets',
      features: [
        {
          title: 'Sub-Second Live Tracking',
          desc: 'High-frequency satellite telemetry updating exact bus coordinates every few seconds on an interactive route map.',
          icon: Radio,
          color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30'
        },
        {
          title: 'Precision Boarding ETAs',
          desc: 'Traffic-aware estimated arrival times computed dynamically for your specific boarding stop.',
          icon: Navigation,
          color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30'
        },
        {
          title: 'WhatsApp & SMS Proximity Alerts',
          desc: 'Automated notification alerts dispatched directly to your mobile phone when your coach is 15 minutes away.',
          icon: Bell,
          color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
        },
        {
          title: 'Speed & Fleet Safety Telemetry',
          desc: 'Enforced speed tracking and driver telemetry monitoring to ensure maximum passenger comfort and road safety.',
          icon: ShieldCheck,
          color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
        }
      ]
    },
    sinhala: {
      title: 'සජීවී GPS රථ ලුහුබැඳීම',
      badge: 'ළඟදීම පැමිණේ',
      subtitle: 'මගීන් සඳහා සජීවී GPS බස් ලුහුබැඳීමේ පද්ධතිය දැනට අපගේ බස් රථ සමූහයේ සක්‍රිය කරමින් පවතී.',
      desc: 'දෙව්මිණ සුපර් ලයින් හි සියලුම බස් රථ සඳහා අධි-තත්වයේ උපග්‍රහණ GPS සම්ප්‍රේෂක සවි කරමින් පවතී. එය සක්‍රිය වූ පසු, ඔබට බස් රථයේ තත්‍ය කාලීන පිහිටීම, පැමිණීමේ නිශ්චිත වේලාව (ETA) සහ වේගය ඔබගේ ජංගම දුරකථනයෙන්ම නැරඹිය හැක.',
      featuresHeading: 'GPS පද්ධතියෙන් ඔබට ලැබෙන පහසුකම්',
      backBtn: 'ගමන් වාර වෙත',
      myTicketsBtn: 'මගේ ප්‍රවේශපත්',
      features: [
        {
          title: 'තත්‍ය කාලීන උපග්‍රහණ ලුහුබැඳීම',
          desc: 'තත්පර ගණනකින් යාවත්කාලීන වන නිවැරදි GPS සිතියම් සටහන්.',
          icon: Radio,
          color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30'
        },
        {
          title: 'නිවැරදි පැමිණීමේ වේලාවන් (ETA)',
          desc: 'ඔබගේ බෝඩිං නැවතුමට බස් රථය පැමිණෙන නිශ්චිත වේලාව.',
          icon: Navigation,
          color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30'
        },
        {
          title: 'WhatsApp සහ SMS පණිවිඩ',
          desc: 'බස් රථය ඔබගේ නැවතුමට විනාඩි 15 කට පෙර ස්වයංක්‍රීයව ලැබෙන SMS/WhatsApp පණිවිඩ.',
          icon: Bell,
          color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
        },
        {
          title: 'රියදුරු සහ වේග ආරක්ෂාව',
          desc: 'මගී ආරක්ෂාව උදෙසා පාලනය වන වේගයන් සහ නිරන්තර අධීක්ෂණය.',
          icon: ShieldCheck,
          color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
        }
      ]
    },
    tamil: {
      title: 'நேரடி ஜிபிஎஸ் பிளீட் கண்காணிப்பு',
      badge: 'விரைவில்',
      subtitle: 'பயணிகளுக்கான நேரடி ஜிபிஎஸ் பஸ் கண்காணிப்பு முறை தற்போது எங்கள் பஸ்களில் நிறுவப்பட்டு வருகிறது.',
      desc: 'எங்கள் அனைத்து பஸ்களிலும் துல்லியமான ஜிபிஎஸ் டிராக்கர்கள் பொருத்தப்பட்டு வருகின்றன. இது பயன்பாட்டிற்கு வந்ததும், பஸ்ஸின் நேரடி இருப்பிடம், வருகை நேரம் (ETA) மற்றும் வேகத்தை உங்கள் மொபைலில் நேரடியாகப் பார்க்கலாம்.',
      featuresHeading: 'நேரடி ஜிபிஎஸ் வழங்கும் நன்மைகள்',
      backBtn: 'பயணங்களுக்குத் திரும்பு',
      myTicketsBtn: 'என் டிக்கெட்டுகள்',
      features: [
        {
          title: 'நேரடி ஜிபிஎஸ் டிராக்கிங்',
          desc: 'சில நொடிகளுக்கு ஒருமுறை புதுப்பிக்கப்படும் துல்லியமான மேப் தகவல்கள்.',
          icon: Radio,
          color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30'
        },
        {
          title: 'துல்லியமான வருகை நேரம் (ETA)',
          desc: 'உங்கள் போர்டிங் நிறுத்தத்திற்கு பஸ் வரும் சரியான நேரம்.',
          icon: Navigation,
          color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30'
        },
        {
          title: 'WhatsApp & SMS எச்சரிக்கைகள்',
          desc: 'பஸ் உங்கள் நிறுத்தத்திற்கு 15 நிமிடங்களுக்கு முன் தானியங்கி எஸ்எம்எஸ்/வாட்ஸ்அப் எச்சரிக்கை.',
          icon: Bell,
          color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
        },
        {
          title: 'வேகம் மற்றும் பாதுகாப்பு',
          desc: 'பயணிகளின் பாதுகாப்பிற்கான நேரடி வேகக் கண்காணிப்பு.',
          icon: ShieldCheck,
          color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
        }
      ]
    }
  };

  const currentLangContent = content[language as keyof typeof content] || content.english;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
      {/* Top Header Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToSearchSchedules}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-all font-bold text-xs shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> {currentLangContent.backBtn}
        </button>

        {activeRoute && (
          <div className="text-right">
            <span className="text-xs text-slate-500 font-semibold">{activeRoute.origin} ➔ {activeRoute.destination}</span>
            <p className="text-xs font-bold text-blue-600">{activeRoute.operatorName} ({activeRoute.busNumber})</p>
          </div>
        )}
      </div>

      {/* Main Glassmorphic Hero Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-8 sm:p-12 text-white shadow-2xl border border-slate-800">
        {/* Decorative background glow accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
          {/* Animated GPS Icon & Badge */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-40 blur-lg animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center shadow-xl">
              <MapPin className="w-10 h-10 text-white animate-bounce" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 text-amber-300 text-xs font-extrabold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentLangContent.badge}</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-blue-200">
              {currentLangContent.title}
            </h1>
            <p className="text-base sm:text-lg text-blue-200/90 font-medium max-w-2xl leading-relaxed">
              {currentLangContent.subtitle}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300/80 max-w-xl leading-relaxed bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            {currentLangContent.desc}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={goToSearchSchedules}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Zap className="w-4 h-4 text-white" />
              {currentLangContent.backBtn}
            </button>
            <button
              onClick={() => setCurrentView('my-bookings')}
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm border border-white/20 backdrop-blur-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Ticket className="w-4 h-4 text-blue-300" />
              {currentLangContent.myTicketsBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-slate-800 tracking-tight text-center">
          {currentLangContent.featuresHeading}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentLangContent.features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-start gap-4"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} border flex items-center justify-center flex-shrink-0 shadow-xs`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="font-extrabold text-slate-800 text-sm">{f.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

