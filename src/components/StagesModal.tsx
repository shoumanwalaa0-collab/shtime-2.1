import React from 'react';
import { STAGE_CATEGORIES } from '../data/riddles';
import { X, Trophy, Lock, CheckCircle2, ChevronRight, Layers } from 'lucide-react';

interface StagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedStages: number;
  currentStage: number;
  onSelectStage: (stageNum: number) => void;
}

export const StagesModal: React.FC<StagesModalProps> = ({
  isOpen,
  onClose,
  completedStages,
  currentStage,
  onSelectStage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0b1329] border border-blue-500/30 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(30,58,138,0.5)] my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">مربعات المراحل والتحديات</h2>
              <p className="text-xs text-blue-300">مجموع المراحل المكتملة: <span className="text-amber-400 font-bold">{completedStages}</span> من 205</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 3D Perspective Container with spacious layout */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4 perspective-1000">
            {STAGE_CATEGORIES.map((cat) => {
              // Calculate category progress
              const catCompleted = Math.max(0, Math.min(cat.stagesCount, completedStages - (cat.startLevel - 1)));
              const isUnlocked = currentStage >= cat.startLevel || completedStages >= cat.startLevel - 1;
              const isFullyFinished = catCompleted >= cat.stagesCount;

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
                      المراحل {cat.startLevel} - {cat.endLevel}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-amber-300 mb-1">{cat.name}</h3>
                  <p className="text-xs text-slate-300 mb-4">يحتوي على {cat.stagesCount} مرحلة متدرجة</p>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-yellow-300 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${(catCompleted / cat.stagesCount) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <span>الإنجاز: {catCompleted}/{cat.stagesCount}</span>
                    {isFullyFinished && (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> مكتمل
                      </span>
                    )}
                  </div>

                  {/* Play Action Button */}
                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        const targetStage = isFullyFinished
                          ? cat.startLevel
                          : Math.max(cat.startLevel, Math.min(cat.endLevel, currentStage));
                        onSelectStage(targetStage);
                        onClose();
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <span>{isFullyFinished ? 'إعادة استعراض' : 'بدء المربع'}</span>
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                  ) : (
                    <div className="w-full py-2.5 px-4 bg-slate-800/80 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700/50">
                      <Lock className="w-4 h-4" />
                      <span>مقفل حالياً</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Under the last box notice requested by user */}
          <div className="mt-8 p-4 rounded-2xl bg-amber-900/20 border border-amber-500/30 text-amber-200 text-center text-sm font-semibold shadow-inner">
            <p>سوف يكون هناك اكثر من 10 مربعات اخرى لكن ليس الان او ربما بالجزء الثالث.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
