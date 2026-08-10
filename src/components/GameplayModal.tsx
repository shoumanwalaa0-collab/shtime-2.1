import React, { useState, useEffect } from 'react';
import { RIDDLES, checkAnswer } from '../data/riddles';
import { UserGameState } from '../types';
import { X, Clock, Lightbulb, Send, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface GameplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  onWinRiddle: (rewardLiras: number) => void;
  onLoseRiddle: (penaltyLiras: number) => void;
  onDeductLiras: (amount: number) => boolean; // returns true if had enough money
}

export const GameplayModal: React.FC<GameplayModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onWinRiddle,
  onLoseRiddle,
  onDeductLiras,
}) => {
  const currentRiddleIndex = Math.min(gameState.currentStage - 1, RIDDLES.length - 1);
  const currentRiddle = RIDDLES[currentRiddleIndex] || RIDDLES[0];

  const [userAnswer, setUserAnswer] = useState('');
  const [showHintText, setShowHintText] = useState(false);
  const [extraSecondsAdded, setExtraSecondsAdded] = useState(0);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer logic
  // Base timer is 18 seconds (after stage 3) + permanent bonus time + temporary help extra seconds
  const isTimerActiveForLevel = gameState.completedStages >= 3;
  const initialTimeLimit = 18 + gameState.bonusTimeSeconds + extraSecondsAdded;
  const [timeLeft, setTimeLeft] = useState(initialTimeLimit);

  // Reset state when riddle changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setUserAnswer('');
      setShowHintText(false);
      setExtraSecondsAdded(0);
      setGameResult(null);
      setErrorMessage(null);
      setTimeLeft(18 + gameState.bonusTimeSeconds);
    }
  }, [isOpen, gameState.currentStage]);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || !isTimerActiveForLevel || gameResult !== null) return;

    if (timeLeft <= 0) {
      // Time expired -> Loss!
      setGameResult('lose');
      onLoseRiddle(3); // Deduct 3 liras as specified
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isTimerActiveForLevel, timeLeft, gameResult]);

  if (!isOpen) return null;

  const handleSubmitAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userAnswer.trim() || gameResult !== null) return;

    setErrorMessage(null);
    const isCorrect = checkAnswer(userAnswer, currentRiddle);

    if (isCorrect) {
      setGameResult('win');
      onWinRiddle(3); // +3 Liras on correct answer
    } else {
      setErrorMessage('إجابة خاطئة! حاول مجدداً قبل انتهاء الوقت');
    }
  };

  // Buy extra 5 seconds help (+5s for 20 Liras)
  const handleBuyExtraTime = () => {
    setErrorMessage(null);
    const success = onDeductLiras(20);
    if (success) {
      setExtraSecondsAdded((prev) => prev + 5);
      setTimeLeft((prev) => prev + 5);
    } else {
      setErrorMessage('انت لا تملك المال');
    }
  };

  // Buy Hint help (Hint for 25 Liras)
  const handleBuyHint = () => {
    setErrorMessage(null);
    const success = onDeductLiras(25);
    if (success) {
      setShowHintText(true);
    } else {
      setErrorMessage('انت لا تملك المال');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0a1226] border border-blue-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(37,99,235,0.4)] my-auto max-h-[95vh] flex flex-col justify-between">
        
        {/* Top Header & Timer */}
        <div>
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                المرحلة {gameState.currentStage}
              </span>
              <span className="text-xs text-blue-300 font-semibold">
                المجال: {currentRiddle.categoryIndex === 0 ? 'مبتدئ' : currentRiddle.categoryIndex === 1 ? 'الصعود' : currentRiddle.categoryIndex === 2 ? 'تقدم' : currentRiddle.categoryIndex === 3 ? 'متقدم' : currentRiddle.categoryIndex === 4 ? 'الرفع' : 'صعب'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timer Display at top of game box */}
          <div className="mb-6 text-center">
            {isTimerActiveForLevel ? (
              <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-2xl border font-black text-lg shadow-lg ${
                timeLeft <= 2
                  ? 'bg-red-950/90 text-red-400 border-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : 'bg-blue-950/80 text-amber-300 border-blue-500/50'
              }`}>
                <Clock className="w-5 h-5 text-amber-400" />
                <span>المؤقت: {timeLeft} ثوانٍ</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-bold shadow-inner">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>لفلك متاخر ليصل الى المؤقت</span>
              </div>
            )}
          </div>

          {/* Riddle Challenge Card Box */}
          <div className="bg-[#101b38] border border-blue-400/30 rounded-2xl p-5 mb-5 text-center shadow-xl relative overflow-hidden">
            <div className="text-xs text-amber-400 font-bold mb-2 flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4" /> اللغز رقم {gameState.currentStage}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {currentRiddle.question}
            </h3>

            {showHintText && (
              <div className="mt-4 p-3 bg-amber-950/60 border border-amber-500/50 rounded-xl text-amber-200 text-xs text-center font-semibold animate-fade-in">
                💡 تلميح المساعدة: {currentRiddle.hint}
              </div>
            )}
          </div>

          {/* Answer Input Section */}
          <form onSubmit={handleSubmitAnswer} className="space-y-3 mb-6">
            <div className="relative">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="اكتب الجواب"
                disabled={gameResult !== null}
                className="w-full py-3.5 px-4 bg-[#080d1d] border-2 border-blue-500/40 focus:border-amber-400 rounded-xl text-white placeholder-slate-500 font-bold text-center outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={!userAnswer.trim() || gameResult !== null}
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>إرسال الجواب</span>
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>

          {/* Spacing ~1cm (~38px) before Assistance buttons */}
          <div className="mt-9 space-y-2">
            <p className="text-center text-xs font-bold text-slate-400 mb-2">وسائل المساعدة المتاحة:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleBuyExtraTime}
                disabled={gameResult !== null}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-blue-500/30 hover:border-blue-400 rounded-xl text-xs font-bold text-blue-200 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-1 text-amber-300">
                  <Clock className="w-3.5 h-3.5" />
                  <span>+5 ثوانٍ إضافية</span>
                </div>
                <span className="text-[10px] text-amber-400/90">(مقابل 20 ليرة)</span>
              </button>

              <button
                onClick={handleBuyHint}
                disabled={gameResult !== null || showHintText}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400 rounded-xl text-xs font-bold text-amber-200 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-1 text-amber-300">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>إظهار تلميح</span>
                </div>
                <span className="text-[10px] text-amber-400/90">(مقابل 25 ليرة)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerts / Win / Loss Notification Overlay */}
        <div className="mt-4">
          {errorMessage && (
            <div className="p-3 bg-red-950/90 border border-red-500 rounded-xl text-red-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-bounce">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {gameResult === 'win' && (
            <div className="p-4 bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl text-center space-y-2 animate-fade-in shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              <div className="flex justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
              </div>
              <h4 className="text-xl font-black text-emerald-300">إجابة صحيحة ورائعة!</h4>
              <p className="text-xs text-emerald-100">لقد ربحت <span className="text-amber-300 font-bold">+3 ليرات</span> وانتقلت للمرحلة التالية</p>
              <button
                onClick={onClose}
                className="mt-2 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all"
              >
                الانتقال للمرحلة التالية ➔
              </button>
            </div>
          )}

          {gameResult === 'lose' && (
            <div className="p-4 bg-red-950/90 border-2 border-red-500 rounded-2xl text-center space-y-2 animate-fade-in shadow-[0_0_30px_rgba(239,68,68,0.5)]">
              <div className="flex justify-center">
                <AlertTriangle className="w-10 h-10 text-red-400 animate-bounce" />
              </div>
              <h4 className="text-2xl font-black text-red-400">لقد خسرت</h4>
              <p className="text-xs text-red-200">انتهى الوقت أو كانت الإجابة غير صحيحة. تم خصم <span className="text-amber-300 font-bold">3 ليرات</span></p>
              <button
                onClick={() => {
                  setGameResult(null);
                  setTimeLeft(18 + gameState.bonusTimeSeconds);
                  setUserAnswer('');
                }}
                className="mt-2 w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-sm transition-all"
              >
                إعادة المحاولة
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
