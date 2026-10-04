import React, { useState, useEffect } from 'react';
import { UserGameState } from '../types';
import { DraggableTopHeader } from './DraggableTopHeader';
import { StagesModal } from './StagesModal';
import { LevelRewardsModal } from './LevelRewardsModal';
import { GameplayModal } from './GameplayModal';
import { UpgradesModal } from './UpgradesModal';
import { OnlineGameModal } from './OnlineGameModal';
import { OtherGamesModal } from './OtherGamesModal';
import { SendReceiveModal } from './SendReceiveModal';
import { AdminLoginModal } from './AdminLoginModal';
import { CustomGameStudioModal } from './CustomGameStudioModal';
import { AiCommunityGamesModal } from './AiCommunityGamesModal';
import { RealCashEarningsModal } from './RealCashEarningsModal';
import { MilestoneNotificationModal } from './MilestoneNotificationModal';
import { ReportIssueModal } from './ReportIssueModal';
import { SoonFeatureModal } from './SoonFeatureModal';
import { LanguageSelectionModal } from './LanguageSelectionModal';
import { STAGE_CATEGORIES, RIDDLES } from '../data/riddles';
import { Milestone, checkNewMilestones } from '../data/milestones';
import { savePermanentlyUsedCode } from '../utils/codeStorage';
import { soundFx } from '../utils/soundEffects';
import { useInactivityReminder } from '../utils/useInactivityReminder';
import { triggerStageWinConfetti } from '../utils/confetti';
import { translations, saveLanguage } from '../utils/i18n';
import { fcmScheduler } from '../services/notificationService';
import { fetchAiGeneratedRiddles } from '../services/aiRiddleService';
import { 
  Trophy, Award, Play, Sparkles, LogOut, 
  ShieldCheck, Zap, Gamepad2, Globe2, CheckCircle2,
  AlertTriangle, Bell, Clock, MessageSquare, Gem,
  Coins, ChevronLeft, ChevronRight, Video, Crown, DollarSign,
  TrendingUp, HelpCircle, Settings, Layers, User, PlusCircle, ArrowRight,
  Ticket, Globe, Bot
} from 'lucide-react';

interface MainScreenProps {
  gameState: UserGameState;
  setGameState: React.Dispatch<React.SetStateAction<UserGameState>>;
  onLogout: () => void;
  onActiveModalChange?: (modal: string | null) => void;
  initialDeepLinkGameId?: string | null;
}

export const MainScreen: React.FC<MainScreenProps> = ({
  gameState,
  setGameState,
  onLogout,
  onActiveModalChange,
  initialDeepLinkGameId,
}) => {
  const [activeModal, setActiveModal] = useState<
    'stages' | 'level' | 'gameplay' | 'upgrades' | 'online' | 'otherGames' | 'sendReceive' | 'admin' | 'customGame' | 'aiCommunityGames' | 'realCash' | 'soon' | 'language' | null
  >(() => (initialDeepLinkGameId ? 'aiCommunityGames' : null));
  const [upgradesInitialTab, setUpgradesInitialTab] = useState<'time' | 'money' | 'jewels' | 'mental_math'>('time');
  const [showCreateGameConfirm, setShowCreateGameConfirm] = useState(false);

  const isEnglish = gameState.language === 'en';
  const t = translations[isEnglish ? 'en' : 'ar'];

  useEffect(() => {
    fcmScheduler.setLanguage(gameState.language || 'ar');
    fcmScheduler.start(gameState.language || 'ar');
  }, [gameState.language]);

  const handleGenerateAiRiddles = async () => {
    const currentAiCount = gameState.aiRiddles?.length || 0;
    const startStage = RIDDLES.length + currentAiCount + 1;
    const newBatch = await fetchAiGeneratedRiddles(startStage, 10, gameState.language || 'ar');
    if (newBatch && newBatch.length > 0) {
      setGameState((prev) => ({
        ...prev,
        aiRiddles: [...(prev.aiRiddles || []), ...newBatch],
      }));
      soundFx.playWinSound();
      triggerStageWinConfetti();
      setDeductionToast({
        message: isEnglish
          ? '🎉 Gemini AI has crafted 10 brand new stages for you!'
          : '🎉 قام الذكاء الاصطناعي (Gemini AI) بصناعة 10 ألغاز ومراحل جديدة لك بنجاح!',
        id: Date.now(),
      });
      setTimeout(() => setDeductionToast(null), 5000);
    }
  };

  useEffect(() => {
    if (initialDeepLinkGameId) {
      setActiveModal('aiCommunityGames');
    }
  }, [initialDeepLinkGameId]);

  useEffect(() => {
    if (onActiveModalChange) {
      onActiveModalChange(activeModal);
    }
  }, [activeModal, onActiveModalChange]);

  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [publishedGameCelebration, setPublishedGameCelebration] = useState<string | null>(null);
  const [deductionToast, setDeductionToast] = useState<{ message: string; id: number } | null>(null);
  const [idleNotice, setIdleNotice] = useState<string | null>(null);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);

  useInactivityReminder((msg) => {
    setIdleNotice(msg);
    setTimeout(() => setIdleNotice(null), 10000);
  });

  useEffect(() => {
    const unnotifiedMilestone = checkNewMilestones(
      gameState.liras,
      gameState.completedStages,
      gameState.notifiedMilestones || []
    );

    if (unnotifiedMilestone) {
      setCurrentMilestone(unnotifiedMilestone);
      soundFx.playWinSound();
      setGameState((prev) => ({
        ...prev,
        notifiedMilestones: Array.from(new Set([...(prev.notifiedMilestones || []), unnotifiedMilestone.id])),
      }));
    }
  }, [gameState.liras, gameState.completedStages, gameState.notifiedMilestones, setGameState]);

  const completedCategoryCount = STAGE_CATEGORIES.filter((cat) => {
    const catCompleted = Math.max(0, Math.min(cat.stagesCount, gameState.completedStages - (cat.startLevel - 1)));
    return catCompleted >= cat.stagesCount;
  }).length;

  const currentCategory = STAGE_CATEGORIES.find(
    (cat) => gameState.currentStage >= cat.startLevel && gameState.currentStage <= cat.endLevel
  ) || STAGE_CATEGORIES[0];

  const handleWinRiddle = (rewardLiras: number) => {
    setGameState((prev) => {
      const isAdvancing = prev.currentStage === prev.completedStages + 1;
      const nextStage = prev.currentStage + 1;
      const newCompleted = isAdvancing ? prev.completedStages + 1 : prev.completedStages;
      
      const updatedRetries = { ...(prev.stageRetryCount || {}) };
      delete updatedRetries[prev.currentStage];

      // Auto trigger AI questions generation if finishing stage 205 or beyond
      if (prev.currentStage >= 205 && (!prev.aiRiddles || prev.aiRiddles.length === 0)) {
        setTimeout(() => {
          handleGenerateAiRiddles();
        }, 1000);
      }

      return {
        ...prev,
        liras: prev.liras + rewardLiras,
        currentStage: nextStage,
        completedStages: newCompleted,
        stageRetryCount: updatedRetries,
      };
    });
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

  const handleForceDeductLiras = (amount: number, reason: string) => {
    setGameState((prev) => ({
      ...prev,
      liras: prev.liras - amount,
    }));
    setDeductionToast({
      message: `${reason} (الرصيد الآن: ${gameState.liras - amount} ليرة)`,
      id: Date.now(),
    });
    setTimeout(() => {
      setDeductionToast(null);
    }, 4500);
  };

  const handleAddLiras = (amount: number, reason?: string) => {
    setGameState((prev) => ({
      ...prev,
      liras: prev.liras + amount,
    }));
    soundFx.playWinSound();
    if (reason) {
      setDeductionToast({
        message: `${reason} (+${amount} ليرة 💰)`,
        id: Date.now(),
      });
      setTimeout(() => setDeductionToast(null), 4500);
    }
  };

  const handleFallBackThreeStages = () => {
    setGameState((prev) => {
      const newStage = Math.max(1, prev.currentStage - 3);
      return {
        ...prev,
        currentStage: newStage,
        liras: prev.liras - 15,
      };
    });
    setDeductionToast({
      message: `تم التراجع 3 مراحل للوراء وخصم 15 ليرة! (الرصيد: ${gameState.liras - 15} ليرة)`,
      id: Date.now(),
    });
    setTimeout(() => {
      setDeductionToast(null);
    }, 4500);
  };

  const handleRecordStageRetry = (stage: number) => {
    setGameState((prev) => ({
      ...prev,
      stageRetryCount: {
        ...(prev.stageRetryCount || {}),
        [stage]: ((prev.stageRetryCount?.[stage]) || 0) + 1,
      },
    }));
  };

  const handleResetStageRetry = (stage: number) => {
    setGameState((prev) => {
      const updated = { ...(prev.stageRetryCount || {}) };
      delete updated[stage];
      return {
        ...prev,
        stageRetryCount: updated,
      };
    });
  };

  const handleBuyPermanentTime = (cost: number, extraSeconds: number) => {
    setGameState((prev) => ({
      ...prev,
      liras: prev.liras - cost,
      bonusTimeSeconds: prev.bonusTimeSeconds + extraSeconds,
    }));
  };

  const handleRedeemCode = (code: string, rewardLiras: number): boolean => {
    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.includes('PROMO') || normalizedCode.includes('FREE') || normalizedCode.includes('SHTIME')) {
      return false;
    }
    if (gameState.usedCodes.includes(normalizedCode)) {
      return false;
    }
    savePermanentlyUsedCode(normalizedCode);
    setGameState((prev) => ({
      ...prev,
      liras: prev.liras + rewardLiras,
      usedCodes: Array.from(new Set([...prev.usedCodes, normalizedCode])),
    }));
    return true;
  };

  const handleRedeemJewelsCode = (code: string, jewelsToAdd: number): boolean => {
    const normalizedCode = code.trim();
    if (gameState.usedCodes.includes(normalizedCode)) {
      return false;
    }
    savePermanentlyUsedCode(normalizedCode);
    setGameState((prev) => ({
      ...prev,
      jewels: (prev.jewels || 0) + jewelsToAdd,
      usedCodes: Array.from(new Set([...prev.usedCodes, normalizedCode])),
    }));
    return true;
  };

  const handleBuyMentalMathTime = (costLiras: number, extraSeconds: number): boolean => {
    if (costLiras > 0 && gameState.liras < costLiras) {
      return false;
    }
    setGameState((prev) => ({
      ...prev,
      liras: prev.liras - costLiras,
      mentalMathBonusSeconds: (prev.mentalMathBonusSeconds || 0) + extraSeconds,
    }));
    return true;
  };

  // Unlocks specific in-game rewards based on upgrade_type from Firestore
  const handleApplyUpgradeReward = (
    upgradeType: string,
    rewardValue?: number
  ): { title: string; description: string } => {
    const lower = upgradeType.toLowerCase();

    // Strict rule: No free money / promo money!
    if (lower.startsWith('liras') || lower.includes('lira') || lower.includes('coin') || lower.includes('money')) {
      return {
        title: 'تم إلغاء نظام الأكواد الترويجية (Promo)',
        description: 'لا يمكن لأي شخص الحصول مجاناً على مال! اكسب المال من خلال لعب الألغاز والتحديات فقط.',
      };
    }

    let title = 'تم استبدال الكود بنجاح! 🎉';
    let description = '';

    if (lower.startsWith('jewel') || lower.includes('gem')) {
      const amount = rewardValue || parseInt(lower.replace(/[^0-9]/g, '')) || 25;
      setGameState((prev) => ({ ...prev, jewels: (prev.jewels || 0) + amount }));
      title = 'شحن مجوهرات ملكية! 💎';
      description = `تمت إضافة +${amount} جوهرة لحسابك بنجاح!`;
    } else if (lower.startsWith('time') || lower.includes('riddle_time')) {
      const seconds = rewardValue || parseInt(lower.replace(/[^0-9]/g, '')) || 15;
      setGameState((prev) => ({ ...prev, bonusTimeSeconds: prev.bonusTimeSeconds + seconds }));
      title = 'زيادة وقت الألغاز! ⏱️';
      description = `تمت إضافة +${seconds} ثانية دائمية للألغاز!`;
    } else if (lower.includes('math') || lower.includes('mental')) {
      const seconds = rewardValue || parseInt(lower.replace(/[^0-9]/g, '')) || 20;
      setGameState((prev) => ({ ...prev, mentalMathBonusSeconds: (prev.mentalMathBonusSeconds || 0) + seconds }));
      title = 'زيادة وقت الحساب الذهني! 🧠';
      description = `تمت إضافة +${seconds} ثانية دائمية في الحساب الذهني!`;
    } else {
      return {
        title: 'تم إلغاء نظام الأكواد الترويجية (Promo)',
        description: 'لا يمكن لأي شخص الحصول مجاناً على مال وفق التحديث الأخير.',
      };
    }

    triggerStageWinConfetti();
    soundFx.playWinSound();
    return { title, description };
  };

  const handleClaimLevelReward = (levelIndex: number, rewardAmount: number) => {
    setGameState((prev) => ({
      ...prev,
      liras: prev.liras + rewardAmount,
      claimedLevelRewards: [...prev.claimedLevelRewards, levelIndex],
    }));
  };

  const handleDeductLockedLevelClick = (penaltyAmount: number) => {
    setGameState((prev) => ({
      ...prev,
      liras: prev.liras - penaltyAmount,
    }));
  };

  const handleAddBonusLiras = (amount: number) => {
    setGameState((prev) => ({
      ...prev,
      liras: prev.liras + amount,
    }));
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white flex flex-col items-center select-none font-sans relative" dir="rtl">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,#1e3a8a_0%,transparent_70%)] opacity-30 pointer-events-none" />

      {/* FLOATING TOP NOTIFICATION TOASTS */}
      {deductionToast && (
        <div className="fixed top-4 z-50 animate-bounce py-2.5 px-5 rounded-2xl bg-red-950/95 border-2 border-red-500 text-white font-black text-xs sm:text-sm shadow-[0_0_30px_rgba(239,68,68,0.7)] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-300 shrink-0" />
          <span>{deductionToast.message}</span>
        </div>
      )}

      {idleNotice && (
        <div className="fixed top-16 z-50 animate-pulse py-2 px-4 rounded-2xl bg-amber-950/95 border-2 border-amber-400 text-amber-200 font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center gap-2">
          <Bell className="w-4 h-4 text-yellow-400 shrink-0" />
          <span>🔔 {idleNotice}</span>
        </div>
      )}

      {/* 1. INTERACTIVE DRAGGABLE TOP HEADER (shtime-2.) */}
      <DraggableTopHeader bgClassName="bg-[#080c1e]" lineMarginClass="my-2">
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-3 pb-2 flex flex-col gap-3">
          
          {/* Top Row: Game Name, Balances & Logout */}
          <div className="w-full flex items-center justify-between gap-2 flex-wrap">
            {/* Logo */}
            <div 
              onClick={() => {
                soundFx.playClickSound();
                setActiveModal('admin');
              }}
              className="flex items-center gap-2 cursor-pointer group"
              title="انقر لتسجيل دخول الأدمن"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.6)] group-hover:scale-105 transition-transform">
                <Crown className="w-5 h-5 text-slate-950" />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 font-mono tracking-wider drop-shadow">
                  shtime-2.
                </span>
                <span className="text-[10px] text-blue-300 font-bold -mt-1">
                  {t.appSubtitle}
                </span>
              </div>
            </div>

            {/* Balances & Logout Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Liras Balance */}
              <div 
                onClick={() => {
                  soundFx.playClickSound();
                  setUpgradesInitialTab('money');
                  setActiveModal('upgrades');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer hover:scale-105 transition-transform"
                title="رصيد الليرات - انقر للشحن أو الترقية"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-xs shadow">
                  $
                </div>
                <span className="text-amber-300 font-black font-mono text-xs sm:text-sm">{gameState.liras}</span>
                <span className="text-[10px] text-amber-200/80 font-bold">{t.liras}</span>
              </div>

              {/* Jewels Balance */}
              <div 
                onClick={() => {
                  soundFx.playClickSound();
                  setUpgradesInitialTab('jewels');
                  setActiveModal('upgrades');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer hover:scale-105 transition-transform"
                title="رصيد المجوهرات - انقر للشحن"
              >
                <Gem className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span className="text-cyan-300 font-black font-mono text-xs sm:text-sm">{gameState.jewels || 0}</span>
                <span className="text-[10px] text-cyan-200/80 font-bold">{t.jewels}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  onLogout();
                }}
                className="px-3.5 py-1.5 rounded-2xl bg-red-700/80 hover:bg-red-600 text-white font-bold text-xs border border-red-500/60 shadow flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons Row: فوق الخط الأبيض السحاب */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-center sm:justify-start pt-1">
            {/* 1. الألغاز */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setActiveModal('stages');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800/80 border border-blue-400/40 text-blue-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow"
            >
              <Layers className="w-3.5 h-3.5 text-blue-300" />
              <span>{t.riddles}</span>
            </button>

            {/* 2. المستويات والجوائز */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setActiveModal('level');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-400/40 text-purple-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow"
            >
              <Award className="w-3.5 h-3.5 text-purple-300" />
              <span>{t.levelsAndRewards}</span>
            </button>

            {/* 3. الترقية والمتجر */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setUpgradesInitialTab('time');
                setActiveModal('upgrades');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-900/60 hover:bg-amber-800/80 border border-amber-400/40 text-amber-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>{t.upgradesAndShop}</span>
            </button>

            {/* 4. ألعاب أون لاين */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setActiveModal('online');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-400/40 text-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow"
            >
              <Globe2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t.onlineGames}</span>
            </button>

            {/* 5. ألعاب أخرى */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setActiveModal('otherGames');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-400/40 text-indigo-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-indigo-300" />
              <span>{t.otherGames}</span>
            </button>

            {/* 6. إرسال أو استلام مال */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setActiveModal('sendReceive');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-teal-900/60 hover:bg-teal-800/80 border border-teal-400/40 text-teal-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow"
            >
              <DollarSign className="w-3.5 h-3.5 text-teal-300" />
              <span>{t.sendReceive}</span>
            </button>

            {/* 7. صناعة لعبة خاصة بك */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                if ((gameState.jewels || 0) >= 3) {
                  setShowCreateGameConfirm(true);
                } else {
                  setUpgradesInitialTab('jewels');
                  setActiveModal('upgrades');
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs border border-yellow-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
              <span>{t.createGame}</span>
            </button>

            {/* 8. ألعاب المجتمع بالذكاء الاصطناعي */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setActiveModal('aiCommunityGames');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-900/60 hover:bg-cyan-800/80 border border-cyan-400/40 text-cyan-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>{t.communityGames}</span>
            </button>

            {/* 9. أرباح مالية حقيقية */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setActiveModal('realCash');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-yellow-900/60 hover:bg-yellow-800/80 border border-yellow-400/40 text-yellow-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow"
            >
              <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
              <span>{t.realCash}</span>
            </button>

            {/* 10. كبسة SOON المحدثة */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setActiveModal('soon');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs border-2 border-yellow-200 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-[0_0_18px_rgba(245,158,11,0.6)] animate-pulse"
              title="SOON - قريباً انت بنفسك سوف تصنع سؤال"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>SOON 🚀</span>
            </button>

            {/* 11. كبسة تغيير اللغة */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setActiveModal('language');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-cyan-900/80 hover:from-blue-800 hover:to-cyan-800 border border-cyan-400/50 text-cyan-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow"
              title="اختر لغة التطبيق / Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-300" />
              <span>{isEnglish ? 'Language: English' : 'اللغة: عربي (مستخدم)'}</span>
            </button>
          </div>

          {/* NOTICE BANNER: فوق الخط الأبيض بقليل وواضح تماماً بدون أي تشويش */}
          <div 
            onClick={() => {
              soundFx.playClickSound();
              setShowReportIssueModal(true);
            }}
            className="w-full mt-1 p-3 sm:p-3.5 rounded-2xl bg-[#0e1628] border-2 border-amber-400/90 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-300 transition-all cursor-pointer flex flex-col md:flex-row items-center justify-between gap-3 text-right group"
          >
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-5 h-5 text-slate-950" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed">
                إن رأيت أي خلل أو أي شيء غير جيد داخل التطبيق أو أي مشكلة غير جيدة داخل التطبيق فأبلغنا فوراً وممكن أن تحصل على مكافأة حسب المشكلة وممكن أن تصل المكافأة{' '}
                <span className="text-yellow-300 font-black underline decoration-yellow-400 decoration-2 px-1">
                  (1000) ليرة
                </span>{' '}
                أو{' '}
                <span className="text-cyan-300 font-black underline decoration-cyan-400 decoration-2 px-1">
                  5 مجوهرات
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playClickSound();
                setShowReportIssueModal(true);
              }}
              className="w-full md:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer active:scale-95 transition-all"
            >
              <span>أبلغنا فوراً</span>
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            </button>
          </div>
        </div>
      </DraggableTopHeader>

      {/* 2. MAIN DASHBOARD CONTENT BODY */}
      <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6 z-10">
        
        {/* CURRENT STAGE HERO CARD */}
        <div className="relative w-full rounded-3xl bg-gradient-to-br from-[#0c1633] via-[#091228] to-[#040916] border border-blue-500/40 p-6 sm:p-8 shadow-[0_0_40px_rgba(30,58,138,0.4)] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Current Stage Info */}
          <div className="flex flex-col text-center md:text-right space-y-3 z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-400/40 text-blue-300 text-xs font-bold w-fit mx-auto md:mx-0">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>التصنيف الحالي: {currentCategory.name} {currentCategory.badge}</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wide">
                المرحلة {gameState.currentStage}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
                تحدَّ عقلك بحل الألغاز والأسئلة الذكية واجمع الليرات للمنافسة!
              </p>
            </div>

            {/* Progress status */}
            <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-bold pt-1">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                المكتملة: {gameState.completedStages} من {RIDDLES.length}
              </span>
              <span className="text-amber-300 flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                المربعات المكتملة: {completedCategoryCount} من 6
              </span>
            </div>
          </div>

          {/* Big Play Action Button */}
          <div className="flex flex-col items-center gap-2 z-10 w-full md:w-auto">
            <button
              onClick={() => {
                soundFx.playClickSound();
                setActiveModal('gameplay');
              }}
              className="w-full md:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-lg sm:text-xl shadow-[0_0_35px_rgba(245,158,11,0.6)] border-2 border-yellow-200 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              <Play className="w-7 h-7 fill-current text-slate-950 group-hover:scale-110 transition-transform" />
              <span>ابدأ اللعب الآن (المرحلة {gameState.currentStage})</span>
            </button>
            <span className="text-[11px] text-slate-400 font-medium">
              جائزة الفوز: +5 ليرات 💰
            </span>
          </div>
        </div>

        {/* PROGRESS OVERVIEW BAR */}
        <div className="w-full bg-[#0b1329] border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
            <span className="text-white">التقدم الكلي في المراحل</span>
            <span className="text-cyan-300 font-mono">
              {Math.round((gameState.completedStages / RIDDLES.length) * 100)}% ({gameState.completedStages}/{RIDDLES.length})
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-900 border border-blue-500/30 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-amber-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
              style={{
                width: `${Math.min(100, Math.max(2, (gameState.completedStages / RIDDLES.length) * 100))}%`
              }}
            />
          </div>
        </div>

        {/* 6 STAGE CATEGORIES GRID */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg sm:text-xl font-black text-white">تصنيفات ومربعات المراحل</h2>
            </div>
            <button
              onClick={() => {
                soundFx.playClickSound();
                setActiveModal('stages');
              }}
              className="text-xs text-cyan-300 hover:text-cyan-200 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>عرض جميع المراحل</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STAGE_CATEGORIES.map((cat) => {
              const catCompleted = Math.max(0, Math.min(cat.stagesCount, gameState.completedStages - (cat.startLevel - 1)));
              const isUnlocked = gameState.currentStage >= cat.startLevel || gameState.completedStages >= cat.startLevel - 1;
              const isFullyFinished = catCompleted >= cat.stagesCount;

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    soundFx.playClickSound();
                    setActiveModal('stages');
                  }}
                  className={`relative rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-[#0c1630] to-[#070e20] border-blue-500/40 hover:border-amber-400/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]'
                      : 'bg-slate-900/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{cat.badge}</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-400/30 text-blue-200">
                      المراحل {cat.startLevel} - {cat.endLevel}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-white mb-1">{cat.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">
                    {cat.stagesCount} مرحلة وتحدي ذكاء
                  </p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-400">الإنجاز:</span>
                      <span className={isFullyFinished ? 'text-emerald-400' : 'text-amber-300'}>
                        {catCompleted}/{cat.stagesCount} {isFullyFinished && '✓'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-700">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isFullyFinished ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(catCompleted / cat.stagesCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODALS AND OVERLAYS                                                       */}
      {/* ========================================================================= */}
      <StagesModal
        isOpen={activeModal === 'stages'}
        onClose={() => setActiveModal(null)}
        completedStages={gameState.completedStages}
        currentStage={gameState.currentStage}
        aiRiddles={gameState.aiRiddles || []}
        isEnglish={isEnglish}
        onSelectStage={(stage) => {
          setGameState((prev) => ({ ...prev, currentStage: stage }));
          setActiveModal('gameplay');
        }}
        onGenerateAiRiddles={handleGenerateAiRiddles}
      />

      <LevelRewardsModal
        isOpen={activeModal === 'level'}
        onClose={() => setActiveModal(null)}
        completedCategoryCount={completedCategoryCount}
        completedStages={gameState.completedStages}
        claimedLevelRewards={gameState.claimedLevelRewards || []}
        onClaimReward={(catIdx) => {
          const rewardAmount = [50, 100, 150, 200, 300, 500][catIdx] || 50;
          handleClaimLevelReward(catIdx, rewardAmount);
        }}
        onDeductForLockedClick={() => handleDeductLockedLevelClick(1)}
      />

      <GameplayModal
        isOpen={activeModal === 'gameplay'}
        onClose={() => setActiveModal(null)}
        gameState={gameState}
        onWinRiddle={handleWinRiddle}
        onDeductLiras={handleDeductLiras}
        onForceDeductLiras={handleForceDeductLiras}
        onRecordStageRetry={handleRecordStageRetry}
        onResetStageRetry={handleResetStageRetry}
        onFallBackThreeStages={handleFallBackThreeStages}
        onTriggerAiGeneration={handleGenerateAiRiddles}
      />

      <UpgradesModal
        isOpen={activeModal === 'upgrades'}
        onClose={() => setActiveModal(null)}
        gameState={gameState}
        onBuyPermanentTime={handleBuyPermanentTime}
        onRedeemCode={handleRedeemCode}
        onRedeemJewelsCode={handleRedeemJewelsCode}
        onBuyMentalMathTime={handleBuyMentalMathTime}
        onApplyUpgradeReward={handleApplyUpgradeReward}
        initialTab={upgradesInitialTab}
        onShowToast={(msg) => {
          setDeductionToast({ message: msg, id: Date.now() });
          setTimeout(() => setDeductionToast(null), 4000);
        }}
      />

      <OnlineGameModal
        isOpen={activeModal === 'online'}
        onClose={() => setActiveModal(null)}
        gameState={gameState}
        onAddLiras={handleAddBonusLiras}
        onDeductLiras={handleDeductLiras}
      />

      <OtherGamesModal
        isOpen={activeModal === 'otherGames'}
        onClose={() => setActiveModal(null)}
        gameState={gameState}
        onAddBonusLiras={handleAddBonusLiras}
        onDeductLiras={handleDeductLiras}
      />

      <SendReceiveModal
        isOpen={activeModal === 'sendReceive'}
        onClose={() => setActiveModal(null)}
        gameState={gameState}
        onDeductLiras={handleDeductLiras}
        onAddLiras={handleAddLiras}
      />

      <AdminLoginModal
        isOpen={activeModal === 'admin'}
        onClose={() => setActiveModal(null)}
        gameState={gameState}
        setGameState={setGameState}
      />

      <CustomGameStudioModal
        isOpen={activeModal === 'customGame'}
        onClose={() => setActiveModal(null)}
        gameState={gameState}
        onDeductJewels={(amt) => {
          if ((gameState.jewels || 0) < amt) return false;
          setGameState((prev) => ({ ...prev, jewels: (prev.jewels || 0) - amt }));
          return true;
        }}
        onPublishGame={(game) => {
          setGameState((prev) => ({
            ...prev,
            customGames: [...(prev.customGames || []), game],
          }));
        }}
        onShowPublishCelebration={(name) => {
          setPublishedGameCelebration(name);
          soundFx.playWinSound();
        }}
      />

      <AiCommunityGamesModal
        isOpen={activeModal === 'aiCommunityGames'}
        onClose={() => setActiveModal(null)}
        gameState={gameState}
        onForceDeductLiras={handleForceDeductLiras}
        onAddLiras={handleAddLiras}
        onDeductJewels={(amt) => {
          if ((gameState.jewels || 0) < amt) return false;
          setGameState((prev) => ({ ...prev, jewels: (prev.jewels || 0) - amt }));
          return true;
        }}
        onDeleteCustomGame={(gameId) => {
          setGameState((prev) => ({
            ...prev,
            customGames: (prev.customGames || []).filter((g) => String(g.id) !== String(gameId)),
          }));
        }}
        initialDeepLinkGameId={initialDeepLinkGameId}
        onOpenStudio={() => {
          if ((gameState.jewels || 0) >= 3) {
            setShowCreateGameConfirm(true);
          } else {
            setUpgradesInitialTab('jewels');
            setActiveModal('upgrades');
          }
        }}
        onOpenJewelsUpgrade={() => {
          if ((gameState.jewels || 0) >= 3) {
            setShowCreateGameConfirm(true);
          } else {
            setUpgradesInitialTab('jewels');
            setActiveModal('upgrades');
          }
        }}
      />

      <RealCashEarningsModal
        isOpen={activeModal === 'realCash'}
        onClose={() => setActiveModal(null)}
        gameName={gameState.customGames?.[0]?.name || 'shtime-2.'}
      />

      {/* CONFIRMATION MODAL FOR GAME CREATION */}
      {showCreateGameConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none" dir="rtl">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#1c1302] via-[#0c0901] to-slate-950 border-2 border-yellow-300 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(234,179,8,0.7)] text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100">
                هل أنت متأكد أنك تريد صناعة لعبة؟
              </h3>
              <div className="p-4 bg-black/70 rounded-2xl border border-amber-500/40 text-right space-y-2 shadow-inner">
                <p className="text-xs sm:text-sm text-yellow-200 font-bold leading-relaxed">
                  اصنع وطوّر عبر أي ذكاء اصطناعي أو عبر أي موقع صناعة ألعاب وتطبيقات، ثم انسخ الرابط وتأكد وتأكد أن هذا هو الرابط الصحيح ثم ضعه داخل هذه التفاصيل.
                </p>
                <p className="text-[11px] sm:text-xs text-amber-300/90 font-medium pt-1 border-t border-amber-500/30">
                  (سيتم استخدام 3 مجوهرات 💎 للبدء في صناعة ونشر لعبتك مع جميع مستخدمي Shtime-2)
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => {
                  soundFx.playWinSound();
                  setShowCreateGameConfirm(false);
                  setActiveModal('customGame');
                }}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-400 cursor-pointer active:scale-95 transition-all"
              >
                نعم
              </button>

              <button
                onClick={() => {
                  soundFx.playClickSound();
                  setShowCreateGameConfirm(false);
                }}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-[0_0_25px_rgba(225,29,72,0.5)] border border-red-400 cursor-pointer active:scale-95 transition-all"
              >
                لا
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH SURPRISE CELEBRATION MODAL */}
      {publishedGameCelebration && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none" dir="rtl">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#211802] via-[#0f0b01] to-slate-950 border-2 border-yellow-300 rounded-3xl p-6 shadow-[0_0_60px_rgba(234,179,8,0.7)] text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.8)] animate-bounce">
              <Sparkles className="w-10 h-10 fill-current text-slate-950" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-yellow-300 text-xs font-bold inline-block">
                مفاجأة المطور 🎁✨
              </span>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100">
                تم نشر لعبتك بذكاء وخفة!
              </h3>
            </div>

            <p className="text-sm text-amber-200 font-bold leading-relaxed">
              تم تجهيز لعبتك «{publishedGameCelebration}» وحفظها بنجاح. اذهب إلى قائمة الألعاب وانظر إليها في قسم ألعاب أخرى!
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  setPublishedGameCelebration(null);
                  setActiveModal('aiCommunityGames');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-[0_0_25px_rgba(234,179,8,0.7)] border-2 border-yellow-200 cursor-pointer transition-all active:scale-95"
              >
                🎮 اذهب إلى قائمة الألعاب الآن
              </button>

              <button
                onClick={() => setPublishedGameCelebration(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT ISSUE / BUG MODAL */}
      <ReportIssueModal
        isOpen={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        username={gameState.playerName || 'اللاعب'}
      />

      {/* SOON FEATURE FULL PAGE MODAL */}
      <SoonFeatureModal
        isOpen={activeModal === 'soon'}
        onClose={() => setActiveModal(null)}
        isEnglish={isEnglish}
      />

      {/* APPLICATION LANGUAGE SELECTION MODAL */}
      <LanguageSelectionModal
        isOpen={activeModal === 'language'}
        onClose={() => setActiveModal(null)}
        currentLanguage={gameState.language || 'ar'}
        onSelectLanguage={(lang) => {
          setGameState((prev) => ({ ...prev, language: lang }));
          saveLanguage(lang);
        }}
      />

      {/* MILESTONE / ACHIEVEMENT NOTIFICATION POPUP */}
      {currentMilestone && (
        <MilestoneNotificationModal
          milestone={currentMilestone}
          onClose={() => setCurrentMilestone(null)}
        />
      )}
    </div>
  );
};
