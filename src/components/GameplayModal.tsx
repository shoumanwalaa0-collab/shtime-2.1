import React, { useState, useEffect } from 'react';
import { RIDDLES, checkAnswer, STAGE_CATEGORIES } from '../data/riddles';
import { UserGameState, Riddle } from '../types';
import { soundFx } from '../utils/soundEffects';
import { triggerStageWinConfetti } from '../utils/confetti';
import { translations } from '../utils/i18n';
import { 
  X, Clock, Lightbulb, Send, AlertTriangle, CheckCircle2, 
  Coins, ArrowLeft, AlertCircle, Sparkles, Trophy, HelpCircle, Bot
} from 'lucide-react';

interface GameplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  onWinRiddle: (rewardLiras: number) => void;
  onDeductLiras: (amount: number) => boolean;
  onForceDeductLiras: (amount: number, reason: string) => void;
  onRecordStageRetry: (stage: number) => void;
  onResetStageRetry: (stage: number) => void;
  onFallBackThreeStages: () => void;
  onTriggerAiGeneration?: () => void;
  onOpenStages?: () => void;
  onOpenUpgrades?: () => void;
  onOpenSettings?: () => void;
}

export const GameplayModal: React.FC<GameplayModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onWinRiddle,
  onDeductLiras,
  onForceDeductLiras,
  onRecordStageRetry,
  onResetStageRetry,
  onFallBackThreeStages,
  onTriggerAiGeneration,
}) => {
  if (!isOpen) return null;

  const isEn = gameState.language === 'en';
  const t = translations[isEn ? 'en' : 'ar'];

  const allRiddles: Riddle[] = [...RIDDLES, ...(gameState.aiRiddles || [])];
  const currentRiddleIndex = Math.min(gameState.currentStage - 1, allRiddles.length - 1);
  const currentRiddle = allRiddles[currentRiddleIndex] || allRiddles[0];
  const currentCategory = STAGE_CATEGORIES[currentRiddle.categoryIndex] || STAGE_CATEGORIES[0];

  const questionText = (isEn && currentRiddle.questionEn) ? currentRiddle.questionEn : currentRiddle.question;
  const hintText = (isEn && currentRiddle.hintEn) ? currentRiddle.hintEn : currentRiddle.hint;
  const answerDisplay = (isEn && currentRiddle.answerEn) ? currentRiddle.answerEn : currentRiddle.answer;

  const [userAnswer, setUserAnswer] = useState('');
  const [showHintText, setShowHintText] = useState(false);
  const [extraSecondsAdded, setExtraSecondsAdded] = useState(0);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [loseReason, setLoseReason] = useState<'timeout' | 'wrong_answer'>('wrong_answer');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [insufficientFundsMsg, setInsufficientFundsMsg] = useState<string | null>(null);
  const [isPaidRetryAttempt, setIsPaidRetryAttempt] = useState(false);

  // Timer is active from Stage 3 onwards
  const isTimerActiveForStage = gameState.currentStage >= 3;
  const baseTimeLimit = isPaidRetryAttempt ? 20 : 30;
  const initialTimeLimit = baseTimeLimit + gameState.bonusTimeSeconds + extraSecondsAdded;
  const [timeLeft, setTimeLeft] = useState(initialTimeLimit);

  // Hint costs 5 liras
  const hintCost = 5;

  // Reset state when stage changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setUserAnswer('');
      setShowHintText(false);
      setExtraSecondsAdded(0);
      setGameResult(null);
      setErrorMessage(null);
      setInsufficientFundsMsg(null);
      setIsPaidRetryAttempt(false);
      setTimeLeft(30 + gameState.bonusTimeSeconds);
    }
  }, [isOpen, gameState.currentStage, gameState.bonusTimeSeconds]);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || !isTimerActiveForStage || gameResult !== null) return;

    if (timeLeft <= 0) {
      soundFx.playWrongSound();
      setLoseReason('timeout');
      setGameResult('lose');
      return;
    }

    if (timeLeft <= 5) {
      soundFx.playTickSound();
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isTimerActiveForStage, timeLeft, gameResult]);

  // Answer submission handler
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || gameResult !== null) return;

    setErrorMessage(null);
    setInsufficientFundsMsg(null);
    const isCorrect = checkAnswer(userAnswer, currentRiddle);

    if (isCorrect) {
      soundFx.playWinSound();
      triggerStageWinConfetti();
      setGameResult('win');
      onResetStageRetry(gameState.currentStage);
      onWinRiddle(5);

      // Check if finished stage 205 (all primary questions finished) -> Trigger Gemini AI Question Generator
      if (gameState.currentStage >= 205 && onTriggerAiGeneration) {
        onTriggerAiGeneration();
      }
    } else {
      soundFx.playWrongSound();
      setLoseReason('wrong_answer');
      setGameResult('lose');
    }
  };

  // Buy hint
  const handleBuyHint = () => {
    if (showHintText || gameResult !== null) return;
    setErrorMessage(null);
    setInsufficientFundsMsg(null);
    const success = onDeductLiras(hintCost);
    if (success) {
      soundFx.playCoinSound();
      setShowHintText(true);
    } else {
      soundFx.playWrongSound();
      setErrorMessage(isEn ? `Not enough Liras for hint! (Needs ${hintCost} Liras)` : `أنت لا تملك ليرات كافية لشراء التلميح! (تحتاج ${hintCost} ليرات)`);
    }
  };

  // Action 1: Pay 20 Liras and retry current stage
  const handlePayTwentyToStay = () => {
    if (gameState.liras < 20) {
      soundFx.playWrongSound();
      setInsufficientFundsMsg(isEn ? 'Insufficient funds (need 20 Liras)' : 'أنت لست معك مال كافٍ (تحتاج 20 ليرة)');
      return;
    }

    soundFx.playCoinSound();
    onForceDeductLiras(20, isEn ? 'Paid 20 Liras to stay at stage' : 'تم دفع 20 ليرة للبقاء في نفس المرحلة');
    onRecordStageRetry(gameState.currentStage);
    setIsPaidRetryAttempt(true);
    setUserAnswer('');
    setGameResult(null);
    setErrorMessage(null);
    setInsufficientFundsMsg(null);
    setShowHintText(false);
    setTimeLeft(20 + gameState.bonusTimeSeconds);
  };

  // Action 2: Return back 3 stages and deduct 15 liras
  const handleReturnBackThreeStages = () => {
    soundFx.playWrongSound();
    onFallBackThreeStages();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#0a1128] via-[#0d1633] to-[#060a19] border-2 border-cyan-500/60 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(6,182,212,0.3)] my-auto text-right rtl:text-right ltr:text-left">
        
        {/* Stage Header Info */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{currentRiddle.isAiGenerated ? '🤖' : currentCategory.badge}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-200 to-white">
                  {isEn ? `Stage ${gameState.currentStage}` : `المرحلة ${gameState.currentStage}`}
                </h2>
                {currentRiddle.isAiGenerated && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                    Gemini AI ⚡
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-bold">
                {isEn ? 'Category: ' : 'فئة: '}
                <span className="text-cyan-300">
                  {isEn ? (t.categories[currentRiddle.categoryIndex as 0 | 1 | 2 | 3 | 4 | 5] || 'Master') : currentCategory.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Coins Balance */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-black">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>{gameState.liras} {t.liras}</span>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timer Bar */}
        {isTimerActiveForStage && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold mb-1.5">
              <div className={`flex items-center gap-1.5 ${timeLeft <= 5 ? 'text-red-400 animate-pulse font-black' : 'text-blue-300'}`}>
                <Clock className="w-4 h-4" />
                <span>{isEn ? `Time left: ${timeLeft}s` : `الوقت المتبقي: ${timeLeft} ثانية`}</span>
              </div>
              {gameState.bonusTimeSeconds > 0 && (
                <span className="text-[11px] text-emerald-400 font-medium">
                  {isEn ? `(+${gameState.bonusTimeSeconds}s bonus active)` : `(+${gameState.bonusTimeSeconds}ث إضافية مفعلة)`}
                </span>
              )}
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-700">
              <div 
                className={`h-full transition-all duration-300 ${
                  timeLeft <= 5 
                    ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' 
                    : 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, (timeLeft / (baseTimeLimit + gameState.bonusTimeSeconds)) * 100))}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Question Box */}
        <div className="bg-[#080d1e] border border-blue-500/30 rounded-2xl p-5 sm:p-6 mb-5 shadow-inner text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-400/30 text-cyan-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isEn ? 'Riddle Challenge' : 'السؤال والتحدي'}</span>
          </div>
          <p className="text-base sm:text-xl font-bold text-slate-100 leading-relaxed max-w-xl mx-auto">
            {questionText}
          </p>

          {/* Hint text if purchased */}
          {showHintText && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-bold animate-fade-in flex items-center justify-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>{isEn ? `Hint: ${hintText}` : `تلميح: ${hintText}`}</span>
            </div>
          )}
        </div>

        {/* Error / Alert Message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs sm:text-sm font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Answer Form (Active Play Mode) */}
        {gameResult === null && (
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={t.placeholderAnswer}
                autoFocus
                className="w-full flex-1 px-4 py-3 rounded-2xl bg-slate-900/90 border border-blue-500/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white font-bold placeholder-slate-500 outline-none text-sm sm:text-base transition-all"
              />
              <button
                type="submit"
                disabled={!userAnswer.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
              >
                <span>{t.submitAnswer}</span>
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Hint and Helpers row */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleBuyHint}
                disabled={showHintText}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                  showHintText
                    ? 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 cursor-pointer active:scale-95'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span>{showHintText ? (isEn ? 'Hint Revealed' : 'تم إظهار التلميح') : t.hint}</span>
              </button>

              <span className="text-[11px] text-slate-400 font-medium">
                {isEn ? 'Win reward: ' : 'جائزة الفوز: '}
                <span className="text-amber-300 font-bold">+5 {t.liras}</span> 💰
              </span>
            </div>
          </form>
        )}

        {/* Win Modal Dialog */}
        {gameResult === 'win' && (
          <div className="p-6 bg-emerald-950/70 border-2 border-emerald-500/80 rounded-2xl text-center space-y-4 animate-scale-up shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">{t.correctAnswerTitle}</h3>
              <p className="text-sm text-emerald-300 font-bold mt-1">
                {t.correctAnswerDesc}
              </p>
              {gameState.currentStage >= 205 && (
                <div className="mt-3 p-3 rounded-xl bg-cyan-950/60 border border-cyan-400/50 text-xs text-cyan-200 font-bold flex items-center justify-center gap-2">
                  <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>
                    {isEn 
                      ? '🤖 You finished all standard riddles! Gemini AI has automatically created brand new stages for you!'
                      : '🤖 لقد أتممت جميع مراحل وألغاز اللعبة! تم تفعيل الذكاء الاصطناعي (Gemini AI) لصناعة مراحل جديدة لك تلقائياً!'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                soundFx.playClickSound();
                onClose();
              }}
              className="w-full max-w-xs mx-auto py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer active:scale-95 transition-all"
            >
              <span>{t.nextStage}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Lose Modal Dialog */}
        {gameResult === 'lose' && (
          <div className="p-5 sm:p-6 bg-red-950/80 border-2 border-red-500/80 rounded-2xl text-center space-y-4 animate-scale-up shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 border border-red-400 flex items-center justify-center text-red-300 animate-shake">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                {loseReason === 'timeout' ? t.timeoutTitle : t.wrongAnswerTitle}
              </h3>
              <p className="text-xs sm:text-sm text-red-200 mt-1">
                {isEn ? 'Choose an option below to proceed:' : 'اختر أحد الخيارين للمتابعة أدناه:'}
              </p>
            </div>

            {/* Answer Box when losing */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#070c1d] border-2 border-amber-400/60 text-center shadow-[0_0_20px_rgba(245,158,11,0.2)] space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 font-bold">
                <HelpCircle className="w-4 h-4 text-yellow-400" />
                <span>{t.theAnswerIs}</span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 tracking-wide drop-shadow">
                « {answerDisplay} »
              </div>
            </div>

            {insufficientFundsMsg && (
              <div className="p-2.5 rounded-xl bg-red-900 border border-red-400 text-white text-xs font-bold animate-pulse">
                ⚠️ {insufficientFundsMsg}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handlePayTwentyToStay}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Coins className="w-4 h-4" />
                <span>{t.payToStay}</span>
              </button>

              <button
                onClick={handleReturnBackThreeStages}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(225,29,72,0.4)] cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.fallBackThree}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
