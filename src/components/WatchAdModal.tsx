import React, { useState, useEffect } from 'react';
import { X, Tv, Coins, CheckCircle2, Smartphone, Download, Star, ExternalLink } from 'lucide-react';

interface WatchAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdCompleted: (rewardLiras: number) => void;
}

// Clean, family-friendly mobile app advertisement showcases
const APP_ADS = [
  {
    id: 'duolingo',
    title: 'تطبيق تعلم اللغات المجاني',
    developer: 'Language Learning Inc.',
    rating: '4.9 ★',
    downloads: '100M+',
    description: 'تعلم أكثر من 30 لغة عالمية بطريقة تفاعلية وممتعة مجاناً بدون رسوم.',
    videoUrl: 'https://www.youtube.com/embed/8O_MwlZ2dEg?autoplay=1&mute=1&controls=0',
    color: 'from-green-600 to-emerald-800',
    iconBg: 'bg-green-500',
    badge: 'تطبيق تعليمي'
  },
  {
    id: 'math_puzzle',
    title: 'تطبيق ألغاز الذكاء والرياضيات',
    developer: 'Smart Mind Games',
    rating: '4.8 ★',
    downloads: '50M+',
    description: 'درّب عقلك يومياً مع مئات الألغاز الحسابية والتحديات الذهنية الممتعة.',
    videoUrl: 'https://www.youtube.com/embed/Q4A8-r9dJp8?autoplay=1&mute=1&controls=0',
    color: 'from-blue-600 to-indigo-800',
    iconBg: 'bg-blue-500',
    badge: 'تطبيق ألغاز'
  },
  {
    id: 'productivity_notes',
    title: 'تطبيق تنظيم المهام والملاحظات',
    developer: 'Pro Productivity Tools',
    rating: '4.9 ★',
    downloads: '10M+',
    description: 'نظّم جدولك اليومي وسجل ملاحظاتك ومشاريعك بسهولة في مكان واحد.',
    videoUrl: 'https://www.youtube.com/embed/aA7si7AmPkY?autoplay=1&mute=1&controls=0',
    color: 'from-purple-600 to-violet-800',
    iconBg: 'bg-purple-500',
    badge: 'تطبيق إنتاجية'
  },
  {
    id: 'scanner_ai',
    title: 'تطبيق الماسح الضوئي والترجمة الفورية',
    developer: 'AI Scan & Translate',
    rating: '4.7 ★',
    downloads: '20M+',
    description: 'صوّر أي مستند أو نص وترجمه فوراً إلى العربية بدقة عالية باستخدام الذكاء الاصطناعي.',
    videoUrl: 'https://www.youtube.com/embed/n4fCqC3MhDk?autoplay=1&mute=1&controls=0',
    color: 'from-amber-600 to-yellow-800',
    iconBg: 'bg-amber-500',
    badge: 'تطبيق أدوات'
  }
];

export const WatchAdModal: React.FC<WatchAdModalProps> = ({ isOpen, onClose, onAdCompleted }) => {
  const [adSecondsLeft, setAdSecondsLeft] = useState(8);
  const [isAdFinished, setIsAdFinished] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setAdSecondsLeft(8); // 8 seconds duration
      setIsAdFinished(false);
      setIsWatching(true);
      // Select a random app ad every time the ad modal opens
      setCurrentAdIndex(Math.floor(Math.random() * APP_ADS.length));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isWatching || isAdFinished) return;

    if (adSecondsLeft <= 0) {
      setIsAdFinished(true);
      setIsWatching(false);
      onAdCompleted(30); // Award 30 Liras
      return;
    }

    const timer = setInterval(() => {
      setAdSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isWatching, adSecondsLeft, isAdFinished]);

  if (!isOpen) return null;

  const currentAd = APP_ADS[currentAdIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-3 animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-lg bg-[#0a1128] border border-blue-500/50 rounded-3xl p-5 shadow-[0_0_60px_rgba(37,99,235,0.5)] flex flex-col items-center text-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-blue-500/20 pb-3 mb-4">
          <div className="flex items-center gap-2 text-amber-300 font-black">
            <Tv className="w-5 h-5 text-amber-400" />
            <span>إعلان تطبيق مفيد</span>
          </div>
          {isAdFinished && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Video Player & App Showcase Frame (Works 100% Offline) */}
        <div className="w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-blue-500/40 relative mb-3 shadow-2xl flex flex-col justify-between p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/60 via-slate-950 to-slate-950">
          {/* Animated App Promo Showcase Container */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-2">
            <div className={`w-14 h-14 ${currentAd.iconBg} rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.2)] animate-pulse`}>
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{currentAd.title}</h3>
              <p className="text-xs text-blue-200/90 max-w-xs mt-1 leading-relaxed">{currentAd.description}</p>
            </div>
          </div>

          {/* Ad Countdown Overlay */}
          {!isAdFinished && (
            <div className="absolute top-3 right-3 bg-black/85 border border-amber-400/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-amber-300 flex items-center gap-2 shadow-lg z-20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>متبقي: {adSecondsLeft} ثوانٍ للحصول على 30 ليرة</span>
            </div>
          )}

          {/* App Category Badge */}
          <div className="absolute top-3 left-3 bg-blue-900/80 border border-blue-400/50 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-200 z-20">
            {currentAd.badge}
          </div>

          {/* Animated Progress Bar at bottom of frame */}
          {!isAdFinished && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-1000"
                style={{ width: `${((8 - adSecondsLeft) / 8) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* App Meta Info Card */}
        <div className={`w-full p-3 rounded-2xl bg-gradient-to-r ${currentAd.color} border border-white/10 mb-4 flex items-center justify-between text-right`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 ${currentAd.iconBg} rounded-xl flex items-center justify-center text-white shadow-md shrink-0`}>
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">{currentAd.title}</h4>
              <div className="flex items-center gap-2 text-[11px] text-white/80 mt-0.5">
                <span className="text-yellow-300 font-bold">{currentAd.rating}</span>
                <span>•</span>
                <span>{currentAd.downloads} تنزيل</span>
              </div>
            </div>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 backdrop-blur-sm border border-white/20 transition-all cursor-pointer">
            <span>تحميل</span>
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status / Reward Banner */}
        {isAdFinished ? (
          <div className="w-full p-4 bg-emerald-950/90 border border-emerald-500 rounded-2xl text-center space-y-2 animate-bounce">
            <div className="flex justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h4 className="text-lg font-black text-emerald-300">مبروك! شاهدت الإعلان بنجاح</h4>
            <p className="text-xs text-emerald-100">تمت إضافة <span className="text-amber-300 font-black text-sm">+30 ليرة</span> إلى حسابك</p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm cursor-pointer shadow-lg transition-all"
            >
              متابعة اللعب
            </button>
          </div>
        ) : (
          <div className="p-3 bg-blue-950/60 border border-blue-500/30 rounded-xl text-xs text-blue-200 font-semibold flex items-center justify-center gap-2 w-full">
            <Coins className="w-4 h-4 text-amber-400 animate-spin" />
            <span>انتظر 8 ثوانٍ للحصول على المكافأة تلقائياً (+30 ليرة)</span>
          </div>
        )}
      </div>
    </div>
  );
};
