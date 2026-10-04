import React, { useState } from 'react';
import { STAGE_CATEGORIES } from '../data/riddles';
import { Riddle } from '../types';
import { soundFx } from '../utils/soundEffects';
import { translations } from '../utils/i18n';
import { 
  X, Trophy, Lock, CheckCircle2, ChevronRight, Sparkles, 
  Bot, RefreshCw 
} from 'lucide-react';

interface StagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedStages: number;
  currentStage: number;
  aiRiddles?: Riddle[];
  isEnglish?: boolean;
  onSelectStage: (stageNum: number) => void;
  onGenerateAiRiddles?: () => Promise<void>;
}

export const StagesModal: React.FC<StagesModalProps> = ({
  isOpen,
  onClose,
  completedStages,
  currentStage,
  aiRiddles = [],
  isEnglish = false,
  onSelectStage,
  onGenerateAiRiddles,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  if (!isOpen) return null;

  const t = translations[isEnglish ? 'en' : 'ar'];
  const totalBaseStages = 205;
  const totalStagesAvailable = totalBaseStages + aiRiddles.length;
  const allStagesFinished = completedStages >= totalBaseStages;

  const handleGenerate = async () => {
    if (!onGenerateAiRiddles || isGenerating) return;
    soundFx.playClickSound();
    setIsGenerating(true);
    try {
      await onGenerateAiRiddles();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0b1329] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(30,58,138,0.5)] my-auto max-h-[92vh] flex flex-col text-right rtl:text-right ltr:text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isEnglish ? 'Stages & Category Boxes' : 'مربعات المراحل والتحديات'}
              </h2>
              <p className="text-xs text-blue-300">
                {isEnglish ? 'Total Completed Stages: ' : 'مجموع المراحل المكتملة: '}
                <span className="text-amber-400 font-bold">{completedStages}</span> {isEnglish ? 'of' : 'من'} {totalStagesAvailable}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* AI GENERATED STAGES BANNER / ACTIVATION */}
        {(allStagesFinished || aiRiddles.length > 0) && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-purple-950/80 border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(6,182,212,0.35)] flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3 text-right">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0">
                <Bot className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-black text-sm sm:text-base text-cyan-200">
                  <span>{isEnglish ? 'Gemini AI Infinite Riddles Service' : 'خدمة الذكاء الاصطناعي (Gemini AI) للألغاز اللانهائية'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] border border-cyan-400/40 font-bold">
                    نشط ✅
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  {isEnglish
                    ? `You unlocked AI riddle generation! ${aiRiddles.length} AI stages created so far.`
                    : `تم تفعيل الذكاء الاصطناعي بعد إتمام المراحل! تم إنشاء ${aiRiddles.length} مرحلة ذكية جديدة حتى الآن.`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onGenerateAiRiddles && (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? (isEnglish ? 'Generating...' : 'جاري الإنشاء...') : (isEnglish ? 'Generate +10 AI Stages' : 'صناعة 10 ألغاز جديدة')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4 perspective-1000">
            {STAGE_CATEGORIES.map((cat, idx) => {
              // Calculate category progress
              const catCompleted = Math.max(0, Math.min(cat.stagesCount, completedStages - (cat.startLevel - 1)));
              const isUnlocked = currentStage >= cat.startLevel || completedStages >= cat.startLevel - 1;
              const isFullyFinished = catCompleted >= cat.stagesCount;
              const catName = isEnglish ? (t.categories[idx as 0 | 1 | 2 | 3 | 4 | 5] || cat.name) : cat.name;

              return (
                <div
                  key={cat.id}
                  className={`relative group rounded-2xl p-5 border transition-all duration-300 transform hover:-translate-y-2 hover:rotate-1 hover:shadow-2xl ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-[#111a36] to-[#0a1124] border-blue-500/40 hover:border-amber-400/60 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
                      : 'bg-slate-900/40 border-slate-800 opacity-60'
                  }`}
                >
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{cat.badge}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-900/60 border border-blue-400/30 text-blue-200">
                      {isEnglish ? `Stages ${cat.startLevel} - ${cat.endLevel}` : `المراحل ${cat.startLevel} - ${cat.endLevel}`}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-amber-300 mb-1">{catName}</h3>
                  <p className="text-xs text-slate-300 mb-4">
                    {isEnglish ? `Contains ${cat.stagesCount} progressive stages` : `يحتوي على ${cat.stagesCount} مرحلة متدرجة`}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-yellow-300 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${(catCompleted / cat.stagesCount) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <span>{isEnglish ? 'Progress: ' : 'الإنجاز: '} {catCompleted}/{cat.stagesCount}</span>
                    {isFullyFinished && (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> {isEnglish ? 'Completed' : 'مكتمل'}
                      </span>
                    )}
                  </div>

                  {/* Play Action Button */}
                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        soundFx.playClickSound();
                        const targetStage = isFullyFinished
                          ? cat.startLevel
                          : Math.max(cat.startLevel, Math.min(cat.endLevel, currentStage));
                        onSelectStage(targetStage);
                        onClose();
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span>{isFullyFinished ? (isEnglish ? 'Review Box' : 'إعادة استعراض') : (isEnglish ? 'Start Box' : 'بدء المربع')}</span>
                      <ChevronRight className={`w-4 h-4 ${isEnglish ? '' : 'rotate-180'}`} />
                    </button>
                  ) : (
                    <div className="w-full py-2.5 px-4 bg-slate-800/80 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700/50">
                      <Lock className="w-4 h-4" />
                      <span>{isEnglish ? 'Currently Locked' : 'مقفل حالياً'}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Generated Category Card */}
            {aiRiddles.length > 0 && (
              <div className="relative group rounded-2xl p-5 border-2 border-cyan-400/80 bg-gradient-to-br from-[#071d33] to-[#0a122c] shadow-[0_0_30px_rgba(6,182,212,0.3)] transform hover:-translate-y-2 hover:shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">🤖</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-900/60 border border-cyan-400/40 text-cyan-200">
                    {isEnglish ? `Stages 206 - ${205 + aiRiddles.length}` : `المراحل 206 - ${205 + aiRiddles.length}`}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-300 mb-1">
                  {isEnglish ? 'Gemini AI Infinite' : 'ألغاز الذكاء الاصطناعي'}
                </h3>
                <p className="text-xs text-cyan-200 mb-4">
                  {isEnglish ? `${aiRiddles.length} AI generated riddles` : `${aiRiddles.length} لغز ذكي تم توليدها بالذكاء الاصطناعي`}
                </p>

                <button
                  onClick={() => {
                    soundFx.playClickSound();
                    onSelectStage(Math.max(206, currentStage));
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{isEnglish ? 'Play AI Stages' : 'لعب مراحل الذكاء الاصطناعي'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Under the last box notice requested by user */}
          <div className="mt-8 p-4 rounded-2xl bg-amber-900/20 border border-amber-500/30 text-amber-200 text-center text-sm font-semibold shadow-inner">
            <p>
              {isEnglish 
                ? 'There will be more than 10 other boxes coming, or in Part 3 with full AI question generation.'
                : 'سوف يكون هناك اكثر من 10 مربعات اخرى لكن ليس الان او ربما بالجزء الثالث، مع خدمة توليد الأسئلة المستمرة بالذكاء الاصطناعي.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
