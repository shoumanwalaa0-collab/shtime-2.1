import React, { useState } from 'react';
import { STAGE_CATEGORIES } from '../data/riddles';
import { soundFx } from '../utils/soundEffects';
import { triggerStageWinConfetti } from '../utils/confetti';
import { X, Award, Lock, Unlock, Gift, AlertCircle, Coins, WifiOff } from 'lucide-react';

interface LevelRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedCategoryCount: number;
  completedStages: number;
  claimedLevelRewards: number[];
  onClaimReward: (categoryIndex: number) => void;
  onDeductForLockedClick: () => void;
}

export const LevelRewardsModal: React.FC<LevelRewardsModalProps> = ({
  isOpen,
  onClose,
  completedCategoryCount,
  completedStages,
  claimedLevelRewards,
  onClaimReward,
  onDeductForLockedClick,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRewardClick = (catIndex: number, isUnlocked: boolean) => {
    setErrorMessage(null);
    if (isUnlocked) {
      if (!claimedLevelRewards.includes(catIndex)) {
        soundFx.playCoinSound();
        triggerStageWinConfetti();
        onClaimReward(catIndex);
      }
    } else {
      // Deduct 1 lira and display required error toast
      soundFx.playWrongSound();
      onDeductForLockedClick();
      setErrorMessage('هذا غير مفتوح لحد الان (-1 ليرة)');
      setTimeout(() => {
        setErrorMessage(null);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0d162e] border border-amber-500/30 rounded-3xl p-5 shadow-[0_0_40px_rgba(245,158,11,0.3)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">جوائز الليفل والمستويات</h2>
              <p className="text-xs text-blue-300">المربعات المكتملة: <span className="text-amber-400 font-bold">{completedCategoryCount}</span> من 6</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error / Alert Notice */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs font-bold flex items-center gap-2 animate-bounce">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Vertical Scrollable Rewards List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {STAGE_CATEGORIES.map((cat, index) => {
            const catCompletedStages = Math.max(0, Math.min(cat.stagesCount, completedStages - (cat.startLevel - 1)));
            const isFullyUnlocked = catCompletedStages >= cat.stagesCount;
            const isClaimed = claimedLevelRewards.includes(index);

            return (
              <div
                key={cat.id}
                onClick={() => handleRewardClick(index, isFullyUnlocked)}
                className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                  isFullyUnlocked
                    ? isClaimed
                      ? 'bg-emerald-950/30 border-emerald-500/40 opacity-80'
                      : 'bg-gradient-to-r from-amber-950/50 to-blue-950/60 border-amber-400 hover:scale-[1.02] shadow-lg'
                    : 'bg-slate-900/50 border-slate-800 hover:border-red-500/40 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl border ${
                    isFullyUnlocked ? 'bg-amber-500/20 border-amber-400/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {isFullyUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>ليفل مربع {cat.name}</span>
                      {isFullyUnlocked ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          مفتوح
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                          مقفل
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      الجائزة: <span className="text-amber-300 font-bold">+20 ليرة</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {isFullyUnlocked ? (
                    isClaimed ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-900/40 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                        تمت المطالبة ✓
                      </span>
                    ) : (
                      <button className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-md hover:brightness-110 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5" />
                        <span>احصل علي +20</span>
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-red-400" />
                      <span>-1 ليرة عند الضغط</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
