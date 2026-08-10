import React from 'react';
import { Play, Sparkles, ShieldCheck, WifiOff } from 'lucide-react';

interface IntroScreenProps {
  onStart: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen w-full bg-[#020617] text-white flex flex-col items-center justify-center relative overflow-hidden px-4 select-none font-sans" dir="rtl">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1e3a8a_0%,transparent_70%)] opacity-40 pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center max-w-lg w-full text-center space-y-8 animate-fade-in">
        {/* Game Title Header */}
        <div className="flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-blue-950/90 via-indigo-900/90 to-purple-950/90 border border-cyan-400/60 shadow-[0_0_20px_rgba(56,189,248,0.4)] backdrop-blur-md mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 uppercase">i-xon x</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-3 shadow-sm">
            <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
            <span>لعبة أوفلاين (عمل كامل بدون إنترنت)</span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-xs font-bold tracking-widest text-blue-300 uppercase">عالم الألغاز والتحدي</span>
            <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black mb-2 tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 drop-shadow-[0_0_25px_rgba(234,179,8,0.6)]">
            SHtime2
          </h1>
        </div>

        {/* Start Game Immersive Button */}
        <button
          onClick={onStart}
          id="btn-start-playing"
          className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-3.5 rounded-full text-2xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all border border-blue-400 hover:scale-105 cursor-pointer flex items-center justify-center gap-3 group"
        >
          <span>ابدأ اللعب</span>
          <Play className="w-6 h-6 fill-current text-yellow-300 group-hover:translate-x-[-4px] transition-transform" />
        </button>

        {/* Creator tagline */}
        <p className="text-xs text-gray-400 italic font-medium">
          crating with me walaa shouman
        </p>
      </div>
    </div>
  );
};
