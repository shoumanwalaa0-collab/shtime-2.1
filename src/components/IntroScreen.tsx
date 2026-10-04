import React from 'react';
import { soundFx } from '../utils/soundEffects';
import { Play, Sparkles, Globe2, Coins, Trophy, CheckCircle2 } from 'lucide-react';
import { UserGameState } from '../types';

interface IntroScreenProps {
  onStart: () => void;
  gameState: UserGameState;
  onOpenAdmin?: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onStart, gameState, onOpenAdmin }) => {
  const hasProgress = gameState.currentStage > 1 || gameState.liras > 0 || gameState.completedStages > 0;

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white flex flex-col items-center justify-center relative overflow-hidden px-4 select-none font-sans" dir="rtl">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1e3a8a_0%,transparent_70%)] opacity-40 pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center max-w-lg w-full text-center space-y-7 animate-fade-in">
        {/* Game Title Header */}
        <div className="flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-blue-950/90 via-indigo-900/90 to-purple-950/90 border border-cyan-400/60 shadow-[0_0_20px_rgba(56,189,248,0.4)] backdrop-blur-md mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 uppercase">i-xon x</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-black mb-3 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Globe2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>لعبة ذكاء أون لاين بالكامل 100%</span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-xs font-bold tracking-widest text-blue-300 uppercase">عالم الألغاز والذكاء الفائق</span>
            <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          <h1 
            onClick={() => {
              if (onOpenAdmin) {
                soundFx.playClickSound();
                onOpenAdmin();
              }
            }}
            title="انقر لتسجيل دخول الأدمن"
            className="text-6xl sm:text-7xl md:text-8xl font-black mb-2 tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 drop-shadow-[0_0_25px_rgba(234,179,8,0.6)] cursor-pointer hover:scale-105 transition-transform"
          >
            SHtime2
          </h1>
          <span className="text-[11px] text-amber-300/80 font-bold block mb-1">
            👑 انقر على الاسم لتسجيل دخول الأدمن
          </span>
        </div>

        {/* Persistence Indicator & Progress Badge */}
        {hasProgress ? (
          <div className="w-full bg-[#0b142d] border border-blue-500/40 rounded-2xl p-4 shadow-xl flex flex-col items-center gap-2 animate-fade-in">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم حفظ تقدمك تلقائياً بنجاح</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm font-black">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>المرحلة: {gameState.currentStage}</span>
              </div>
              <div className="h-4 w-px bg-slate-700"></div>
              <div className="flex items-center gap-1.5 text-yellow-400">
                <Coins className="w-4 h-4" />
                <span>الرصيد: {gameState.liras} ليرة</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Start / Continue Button */}
        <button
          onClick={() => {
            soundFx.playClickSound();
            onStart();
          }}
          id="btn-start-playing"
          className={`w-full max-w-sm px-8 py-4 rounded-full font-black text-xl shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all border hover:scale-105 cursor-pointer flex items-center justify-center gap-3 group active:scale-95 ${
            hasProgress
              ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
              : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400'
          }`}
        >
          <span>{hasProgress ? `متابعة اللعب (المرحلة ${gameState.currentStage})` : 'ابدأ اللعب'}</span>
          <Play className={`w-6 h-6 fill-current group-hover:translate-x-[-4px] transition-transform ${hasProgress ? 'text-slate-950' : 'text-yellow-300'}`} />
        </button>

        {/* Creator tagline */}
        <p className="text-xs text-gray-400 italic font-medium">
          crating with me walaa shouman
        </p>
      </div>
    </div>
  );
};
