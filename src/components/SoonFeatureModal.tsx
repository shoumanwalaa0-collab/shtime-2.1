import React from 'react';
import { 
  ArrowRight, ArrowLeft, Sparkles, PenTool, Coins, 
  Share2, Bot, Trophy, CheckCircle, ShieldCheck 
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

interface SoonFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEnglish?: boolean;
}

export const SoonFeatureModal: React.FC<SoonFeatureModalProps> = ({
  isOpen,
  onClose,
  isEnglish = false,
}) => {
  if (!isOpen) return null;

  const handleBack = () => {
    soundFx.playClickSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#020617] text-white flex flex-col animate-fade-in">
      {/* Top Header Bar with Back Button */}
      <header className="sticky top-0 z-20 w-full bg-[#080f21]/95 backdrop-blur-md border-b border-cyan-500/30 px-4 py-3 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer active:scale-95 transition-all group"
          title="عودة خطوة واحدة للوراء"
        >
          {isEnglish ? (
            <>
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span>العودة للوراء</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs sm:text-sm font-black text-amber-300 font-mono tracking-wider">
            SHTIME-2 EXCLUSIVE • SOON
          </span>
        </div>
      </header>

      {/* Main Full Page Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-center">
        {/* Prominent Golden & Cyan Styled Outer Container Box */}
        <div className="w-full relative rounded-3xl p-6 sm:p-10 bg-gradient-to-b from-[#0b132b] via-[#0d1b3a] to-[#070b19] border-2 border-amber-400/90 shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-8 text-center overflow-hidden">
          
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-xs sm:text-sm font-black text-amber-200">
              {isEnglish ? '🚀 UPCOMING MEGA UPDATE 2026_2027' : '🚀 التحديث الأضخم القادم للعبة 2026_2027'}
            </span>
          </div>

          {/* THE EXACT REQUESTED PHRASE INSIDE A BEAUTIFUL BOX */}
          <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-amber-950/60 via-[#161f36] to-cyan-950/60 border-2 border-yellow-400/80 shadow-[0_0_30px_rgba(245,158,11,0.35)]">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 leading-tight drop-shadow-[0_2px_15px_rgba(245,158,11,0.6)]">
              1. قريباً انت بنفسك سوف تصنع سؤال
            </h1>
            <p className="mt-2 text-sm sm:text-lg text-cyan-200 font-bold">
              {isEnglish 
                ? '1. Soon you yourself will create questions'
                : 'كن صانع التحديات الأول واختبر عقول اللاعبين حول العالم!'}
            </p>
          </div>

          {/* Detailed Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-right rtl:text-right ltr:text-left pt-2">
            {/* Box 1 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0e172e]/80 border border-cyan-400/40 hover:border-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-slate-950 shrink-0 shadow">
                <PenTool className="w-6 h-6 text-slate-950 font-bold" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-cyan-200">
                  {isEnglish ? 'Custom Riddle Creator' : 'منشئ الألغاز والأسئلة الذكية'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isEnglish
                    ? 'Write your own unique questions, set correct & accepted answers, and formulate smart hints.'
                    : 'ستتمكن من كتابة أسئلتك الخاصة، وإضافة الإجابات الصحيحة والخيارات البديلة وصياغة تلميحات ذكية.'}
                </p>
              </div>
            </div>

            {/* Box 2 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0e172e]/80 border border-amber-400/40 hover:border-amber-300 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shrink-0 shadow">
                <Coins className="w-6 h-6 text-slate-950 font-bold" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-amber-300">
                  {isEnglish ? 'Earn Liras & Jewels per Player' : 'اربح ليرات ومجوهرات من كل لاعب'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isEnglish
                    ? 'Every player who attempts or solves your riddle yields passive rewards directly to your in-game balance.'
                    : 'في كل مرة يقوم لاعب بلعب سؤالك أو محاولة حله، ستربح تلقائياً نسبة من الليرات والمجوهرات في رصيدك.'}
                </p>
              </div>
            </div>

            {/* Box 3 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0e172e]/80 border border-purple-400/40 hover:border-purple-300 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0 shadow">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-purple-200">
                  {isEnglish ? 'Global Community Publishing' : 'نشر وتحدي على مستوى العالم'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isEnglish
                    ? 'Publish your questions instantly to community stages where thousands of online players can compete.'
                    : 'انشر أسئلتك فوراً في مراحل المجتمع وتحدى آلاف اللاعبين المتصلين أونلاين بلعبة Shtime-2.'}
                </p>
              </div>
            </div>

            {/* Box 4 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0e172e]/80 border border-emerald-400/40 hover:border-emerald-300 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shrink-0 shadow">
                <Bot className="w-6 h-6 text-slate-950" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-emerald-300">
                  {isEnglish ? 'Gemini AI Assistant' : 'مساعد الذكاء الاصطناعي (Gemini)'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isEnglish
                    ? 'AI helps you refine question wording, generate smart distractor options, and optimize challenge levels.'
                    : 'الذكاء الاصطناعي يساعدك في تدقيق صياغة السؤال واقتراح خيارات بديلة لضبط الصعوبة وموازنة التحدي.'}
                </p>
              </div>
            </div>
          </div>

          {/* Under development note banner */}
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-400/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-cyan-300 shrink-0" />
              <span className="text-xs sm:text-sm text-cyan-100 font-bold">
                {isEnglish 
                  ? 'Feature development is in full progress and will be activated directly in the game!'
                  : 'الميزة قيد البرمجة والتجهيز الكامل وسيتم إطلاقها قريباً مع شارة صانع الأسئلة!'}
              </span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black">
              {isEnglish ? 'SOON 2026_2027' : 'قريباً 2026_2027'}
            </div>
          </div>

          {/* Return Back Button at bottom as well */}
          <div className="pt-2">
            <button
              onClick={handleBack}
              className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.5)] cursor-pointer active:scale-95 transition-all"
            >
              <span>{isEnglish ? 'Back to Main Screen' : 'العودة إلى الشاشة الرئيسية'}</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};
