import React, { useState } from 'react';
import { UserGameState } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { StagesModal } from './StagesModal';
import { LevelRewardsModal } from './LevelRewardsModal';
import { GameplayModal } from './GameplayModal';
import { UpgradesModal } from './UpgradesModal';
import { WatchAdModal } from './WatchAdModal';
import { STAGE_CATEGORIES } from '../data/riddles';
import { savePermanentlyUsedCode } from '../utils/codeStorage';
import { Coins, Trophy, Award, Play, Tv, Sparkles, LogOut, ShieldCheck, Zap, WifiOff } from 'lucide-react';

interface MainScreenProps {
  gameState: UserGameState;
  setGameState: React.Dispatch<React.SetStateAction<UserGameState>>;
  onLogout: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({ gameState, setGameState, onLogout }) => {
  const [activeModal, setActiveModal] = useState<'stages' | 'level' | 'gameplay' | 'upgrades' | 'ad' | null>(null);

  // Calculate completed stage categories (how many stage boxes fully finished)
  const completedCategoryCount = STAGE_CATEGORIES.filter((cat) => {
    const catCompleted = Math.max(0, Math.min(cat.stagesCount, gameState.completedStages - (cat.startLevel - 1)));
    return catCompleted >= cat.stagesCount;
  }).length;

  // Handlers for game updates
  const handleWinRiddle = (rewardLiras: number) => {
    setGameState((prev) => ({
      ...prev,
      liras: prev.liras + rewardLiras,
      currentStage: prev.currentStage + 1,
      completedStages: Math.max(prev.completedStages, prev.currentStage),
    }));
  };

  const handleLoseRiddle = (penaltyLiras: number) => {
    setGameState((prev) => ({
      ...prev,
      liras: Math.max(0, prev.liras - penaltyLiras),
    }));
  };

  const handleDeductLiras = (amount: number): boolean => {
    if (gameState.liras >= amount) {
      setGameState((prev) => ({
        ...prev,
        liras: prev.liras - amount,
      }));
      return true;
    }
    return false;
  };

  const handleClaimLevelReward = (categoryIndex: number) => {
    if (!gameState.claimedLevelRewards.includes(categoryIndex)) {
      setGameState((prev) => ({
        ...prev,
        liras: prev.liras + 20, // +20 Liras bonus
        claimedLevelRewards: [...prev.claimedLevelRewards, categoryIndex],
      }));
    }
  };

  const handleDeductLockedLevelClick = () => {
    setGameState((prev) => ({
      ...prev,
      liras: Math.max(0, prev.liras - 1), // Deduct 1 lira
    }));
  };

  const handleBuyPermanentTime = (seconds: number, costLiras: number): boolean => {
    if (gameState.liras >= costLiras) {
      setGameState((prev) => ({
        ...prev,
        liras: prev.liras - costLiras,
        bonusTimeSeconds: prev.bonusTimeSeconds + seconds,
      }));
      return true;
    }
    return false;
  };

  const handleRedeemCode = (lirasToAdd: number, code: string): boolean => {
    savePermanentlyUsedCode(code);
    setGameState((prev) => ({
      ...prev,
      liras: prev.liras + lirasToAdd,
      usedCodes: Array.from(new Set([...prev.usedCodes, code])),
    }));
    return true;
  };

  const handleAdCompleted = (rewardLiras: number) => {
    setGameState((prev) => ({
      ...prev,
      liras: prev.liras + rewardLiras,
    }));
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white flex flex-col items-center justify-between p-4 sm:p-8 relative select-none overflow-x-hidden font-sans" dir="rtl">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1e3a8a_0%,transparent_70%)] opacity-40 pointer-events-none"></div>

      {/* Decorative Stages Path Floating Accent (Right side on larger screens) */}
      <div className="hidden xl:flex absolute top-1/2 -right-12 -translate-y-1/2 flex-col gap-6 scale-75 opacity-30 pointer-events-none z-0">
        <div className="w-32 h-32 bg-blue-900/40 border-4 border-blue-500 rounded-2xl transform rotate-45 flex items-center justify-center">
          <span className="transform -rotate-45 font-bold text-white text-sm">متقدم</span>
        </div>
        <div className="w-32 h-32 bg-blue-900/20 border-4 border-white/20 rounded-2xl transform rotate-45 flex items-center justify-center">
          <span className="transform -rotate-45 font-bold text-white/40 text-sm">صعب</span>
        </div>
      </div>

      {/* YouTube Background Music Player for Main Screen */}
      <AudioPlayer isPlaying={true} />

      {/* Main Container */}
      <div className="z-10 w-full max-w-4xl flex flex-col items-center my-auto py-6">
        
        {/* Welcome Header / Title */}
        <div className="w-full pt-2 sm:pt-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-blue-950/90 via-indigo-900/90 to-purple-950/90 border border-cyan-400/60 shadow-[0_0_20px_rgba(56,189,248,0.4)] backdrop-blur-md mb-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 uppercase">i-xon x</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-2 shadow-sm">
            <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
            <span>لعبة أوفلاين (بدون إنترنت)</span>
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black mb-2 tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 drop-shadow-[0_0_25px_rgba(234,179,8,0.6)]">
            SHtime2
          </h1>
          <button
            onClick={() => setActiveModal('gameplay')}
            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-8 sm:px-12 py-3 rounded-full text-xl sm:text-2xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all border border-blue-400 hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <Play className="w-6 h-6 fill-current text-yellow-300" />
            <span>ابدأ اللعب</span>
          </button>
        </div>

        {/* 1. MAIN HUD STATS (المال، المراحل، الليفل) */}
        <div className="w-full mt-8 mb-6">
          <div className="grid grid-cols-3 gap-3 items-center text-center font-bold bg-black/40 backdrop-blur-md py-4 px-3 sm:px-6 rounded-xl border border-blue-900/50 shadow-inner">
            {/* Money Item */}
            <div className="flex flex-col items-center">
              <span className="text-blue-400 text-xs sm:text-sm mb-1 font-semibold">المال (ليرة)</span>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black font-extrabold text-xs shadow-[0_0_10px_rgba(234,179,8,0.8)]">L</span>
                <span className="text-2xl sm:text-3xl font-mono tracking-tighter text-yellow-300">{gameState.liras}</span>
              </div>
            </div>
            
            {/* Stages Button */}
            <button
              onClick={() => setActiveModal('stages')}
              className="flex flex-col items-center group cursor-pointer transition-all hover:scale-105"
            >
              <span className="text-blue-400 text-xs sm:text-sm mb-1 font-semibold">المراحل</span>
              <div className="text-base sm:text-xl group-hover:text-yellow-400 transition-colors flex items-center gap-2">
                <span className="bg-blue-900/50 px-2.5 sm:px-4 py-1 rounded-lg border border-blue-700 text-white font-bold text-xs sm:text-sm">
                  المرحلة {gameState.currentStage}
                </span>
              </div>
            </button>

            {/* Level Button */}
            <button
              onClick={() => setActiveModal('level')}
              className="flex flex-col items-center group cursor-pointer transition-all hover:scale-105"
            >
              <span className="text-blue-400 text-xs sm:text-sm mb-1 font-semibold">الليفل</span>
              <div className="text-2xl sm:text-3xl font-bold group-hover:text-yellow-400 transition-colors text-amber-300">
                {completedCategoryCount}
              </div>
            </button>
          </div>
        </div>

        {/* Shiny White Line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_12px_rgba(255,255,255,0.8)]"></div>

        {/* 2. MAIN GRID CONTENT CARDS */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 my-8">
          {/* Card 1: اللعب حر */}
          <div
            onClick={() => setActiveModal('gameplay')}
            className="h-44 sm:h-48 rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-900/40 to-transparent flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-all group overflow-hidden relative shadow-[0_0_25px_rgba(37,99,235,0.2)] hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-8 h-8 fill-current text-yellow-400 group-hover:scale-110 transition-transform" />
              <span className="text-3xl sm:text-4xl font-black text-white">اللعب حر</span>
            </div>
            <span className="text-blue-400 text-xs sm:text-sm uppercase tracking-widest font-semibold">Free Mode</span>
          </div>
          
          {/* Card 2: شاهد إعلان */}
          <div
            onClick={() => setActiveModal('ad')}
            className="h-44 sm:h-48 rounded-2xl border-2 border-green-500/30 bg-gradient-to-br from-green-900/40 to-transparent flex flex-col items-center justify-center cursor-pointer hover:border-green-400 transition-all group relative shadow-[0_0_25px_rgba(34,197,94,0.2)] hover:scale-[1.02]"
          >
            <div className="absolute -top-3 -left-3 bg-green-500 text-black font-extrabold px-3 py-1 rounded-full text-xs shadow-[0_0_12px_rgba(34,197,94,0.8)]">
              +30 ليرة
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Tv className="w-7 h-7 text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-2xl sm:text-3xl font-black text-white">شاهد إعلان</span>
            </div>
            <span className="text-green-400 text-xs sm:text-sm font-semibold">كسب المال مجاناً</span>
            <div className="mt-4 flex gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        </div>

        {/* Bottom Shiny White Line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_12px_rgba(255,255,255,0.8)]"></div>

        {/* 3. FOOTER & ACTIONS */}
        <div className="w-full mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 px-2">
          <div className="flex gap-3 w-full sm:w-auto justify-center">
            <button
              onClick={() => setActiveModal('upgrades')}
              className="bg-blue-900/30 border border-blue-700/50 px-6 py-2.5 rounded-lg hover:bg-blue-800 transition-colors text-sm font-bold text-blue-200 cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-yellow-400 fill-current" />
              <span>الترقية</span>
            </button>
            <button
              onClick={onLogout}
              className="bg-red-900/30 border border-red-700/50 px-6 py-2.5 rounded-lg hover:bg-red-800 transition-colors text-sm font-bold text-red-200 cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>تسجيل خروج</span>
            </button>
          </div>
          
          <div className="text-center sm:text-right">
            <p className="text-gray-400 text-xs italic font-medium">crating with me walaa shouman</p>
            <div className="flex items-center justify-center sm:justify-end gap-2 mt-1">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-blue-300 font-mono">Music: SHtime_OST_v1</span>
            </div>
          </div>
        </div>

      </div>

      {/* MODALS */}
      <StagesModal
        isOpen={activeModal === 'stages'}
        onClose={() => setActiveModal(null)}
        completedStages={gameState.completedStages}
        currentStage={gameState.currentStage}
        onSelectStage={(stageNum) => {
          setGameState((prev) => ({ ...prev, currentStage: stageNum }));
          setActiveModal('gameplay');
        }}
      />

      <LevelRewardsModal
        isOpen={activeModal === 'level'}
        onClose={() => setActiveModal(null)}
        completedCategoryCount={completedCategoryCount}
        completedStages={gameState.completedStages}
        claimedLevelRewards={gameState.claimedLevelRewards}
        onClaimReward={handleClaimLevelReward}
        onDeductForLockedClick={handleDeductLockedLevelClick}
      />

      <GameplayModal
        isOpen={activeModal === 'gameplay'}
        onClose={() => setActiveModal(null)}
        gameState={gameState}
        onWinRiddle={handleWinRiddle}
        onLoseRiddle={handleLoseRiddle}
        onDeductLiras={handleDeductLiras}
      />

      <UpgradesModal
        isOpen={activeModal === 'upgrades'}
        onClose={() => setActiveModal(null)}
        gameState={gameState}
        onBuyPermanentTime={handleBuyPermanentTime}
        onRedeemCode={handleRedeemCode}
      />

      <WatchAdModal
        isOpen={activeModal === 'ad'}
        onClose={() => setActiveModal(null)}
        onAdCompleted={handleAdCompleted}
      />
    </div>
  );
};
