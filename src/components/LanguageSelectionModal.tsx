import React from 'react';
import { X, Globe, Check, Sparkles } from 'lucide-react';
import { Language } from '../utils/i18n';
import { soundFx } from '../utils/soundEffects';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
}

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
}) => {
  if (!isOpen) return null;

  const handleChoose = (lang: Language) => {
    soundFx.playClickSound();
    onSelectLanguage(lang);
    onClose();
  };

  const isArabic = currentLanguage === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#080f21] border-2 border-cyan-500/70 rounded-3xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.35)] text-center space-y-6">
        {/* Close Button */}
        <button
          onClick={() => {
            soundFx.playClickSound();
            onClose();
          }}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700 active:scale-95"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 pt-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <Globe className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-200 to-white">
            {isArabic ? 'لغات التطبيق' : 'Application Languages'}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {isArabic 
              ? 'اختر اللغة المفضلة للواجهة والأسئلة والألغاز'
              : 'Select preferred language for interface and riddles'}
          </p>
        </div>

        {/* Languages List */}
        <div className="space-y-3">
          {/* 1. عربي : مستخدم */}
          <button
            onClick={() => handleChoose('ar')}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer group active:scale-[0.98] ${
              currentLanguage === 'ar'
                ? 'bg-emerald-950/50 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇸🇦</span>
              <div className="text-right">
                <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>عربي</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                    مستخدم (الأساسية)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  اللغة الأساسية الافتراضية للتطبيق وكافة الألغاز
                </div>
              </div>
            </div>

            {currentLanguage === 'ar' && (
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>

          {/* 2. English */}
          <button
            onClick={() => handleChoose('en')}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer group active:scale-[0.98] ${
              currentLanguage === 'en'
                ? 'bg-blue-950/60 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇺🇸</span>
              <div className="text-left rtl:text-right">
                <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>English</span>
                  {currentLanguage === 'en' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 font-bold">
                      In Use
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Full English translation for entire app & all questions
                </div>
              </div>
            </div>

            {currentLanguage === 'en' && (
              <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            )}
          </button>
        </div>

        {/* Informative Note */}
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2 text-right">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
          <span>
            {isArabic
              ? 'حين تختار الإنجليزية، تتحول كل واجهات التطبيق والأسئلة والألغاز إلى الإنجليزية فوراً!'
              : 'When switching to English, all screens, buttons, and questions immediately switch to English!'}
          </span>
        </div>
      </div>
    </div>
  );
};
