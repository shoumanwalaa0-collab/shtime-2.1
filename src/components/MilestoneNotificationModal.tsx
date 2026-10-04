import React, { useEffect } from 'react';
import { Milestone } from '../data/milestones';
import { soundFx } from '../utils/soundEffects';
import { triggerStageWinConfetti } from '../utils/confetti';
import { Sparkles, Trophy, CheckCircle2, ArrowRight } from 'lucide-react';

interface MilestoneNotificationModalProps {
  milestone: Milestone;
  currentLiras: number;
  currentCompletedStages: number;
  onClose: () => void;
}

export const MilestoneNotificationModal: React.FC<MilestoneNotificationModalProps> = ({
  milestone,
  currentLiras,
  currentCompletedStages,
  onClose,
}) => {
  useEffect(() => {
    triggerStageWinConfetti();
  }, []);

  const handleConfirm = () => {
    soundFx.playClickSound();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 relative shadow-[0_0_50px_rgba(245,158,11,0.35)] flex flex-col items-center text-center overflow-hidden animate-in zoom-in-95 duration-300"
      >
        {/* Background Glowing Ambient */}
        <div
          className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ backgroundColor: milestone.glowColor }}
        ></div>
        <div
          className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ backgroundColor: milestone.glowColor }}
        ></div>

        {/* Top Tag */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span>إنجاز جديد تم تحقيقه! 🎉</span>
        </div>

        {/* Milestone Icon Avatar */}
        <div className="relative my-2">
          <div
            className="w-24 h-24 rounded-3xl bg-gradient-to-br flex items-center justify-center text-5xl shadow-2xl border-2 border-white/20 transform hover:scale-105 transition-transform"
            style={{
              boxShadow: `0 0 35px ${milestone.glowColor}`,
            }}
          >
            <span>{milestone.icon}</span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-lg border border-white/40">
            <Trophy className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-2xl sm:text-3xl font-black text-white mt-4 mb-1">
          {milestone.title}
        </h2>
        <p className="text-sm font-bold text-amber-400 mb-3">
          {milestone.subtitle}
        </p>

        {/* Description */}
        <p className="text-sm text-slate-300 leading-relaxed mb-6 px-2">
          {milestone.description}
        </p>

        {/* Quick Stats Pill */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[11px] mb-0.5">رصيد الليرات الحالي</span>
            <span className="text-base font-black text-amber-400">{currentLiras} 🪙</span>
          </div>
          <div className="flex flex-col items-center border-r border-slate-800">
            <span className="text-slate-400 text-[11px] mb-0.5">المراحل المكتملة</span>
            <span className="text-base font-black text-cyan-400">{currentCompletedStages} / 205 🎯</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-base shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>متابعة اللعب والاستمرار</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
