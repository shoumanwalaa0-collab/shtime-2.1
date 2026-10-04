import React, { useState, useEffect } from 'react';
import { MENTAL_MATH_STAGES, MentalMathStage } from '../data/mentalMathStages';
import { UserGameState } from '../types';
import { soundFx } from '../utils/soundEffects';
import { triggerStageWinConfetti, triggerSuperWinConfetti } from '../utils/confetti';
import { 
  Clock, Flame, CheckCircle2, AlertTriangle, 
  RotateCcw, ArrowRight, Sparkles, Coins, Trophy, Brain 
} from 'lucide-react';

interface MentalMathGameProps {
  gameState: UserGameState;
  onForceDeductLiras: (amount: number, reason: string) => void;
  onAddLiras?: (amount: number) => void;
  onBackToHub: () => void;
}

export const MentalMathGame: React.FC<MentalMathGameProps> = ({
  gameState,
  onForceDeductLiras,
  onAddLiras,
  onBackToHub,
}) => {
  const [stageIndex, setStageIndex] = useState(0); // 0 to 39 (40 stages)
  const baseSeconds = 15 + (gameState.mentalMathBonusSeconds || 0); // 15s base + permanent purchased bonus
  const [timeLeft, setTimeLeft] = useState(baseSeconds);
  const [gameResult, setGameResult] = useState<'playing' | 'win_stage' | 'game_over' | 'completed_all'>('playing');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const currentStage: MentalMathStage = MENTAL_MATH_STAGES[stageIndex] || MENTAL_MATH_STAGES[0];

  // Reset timer on stage change or retry
  useEffect(() => {
    if (gameResult === 'playing') {
      setTimeLeft(15 + (gameState.mentalMathBonusSeconds || 0));
      setSelectedOption(null);
    }
  }, [stageIndex, gameResult, gameState.mentalMathBonusSeconds]);

  // Timer countdown effect
  useEffect(() => {
    if (gameResult !== 'playing') return;

    if (timeLeft <= 0) {
      // Time is up! Player lost -2 liras
      soundFx.playWrongSound();
      setGameResult('game_over');
      setStreak(0);
      onForceDeductLiras(2, `انتهى الوقت (${baseSeconds} ثانية) في الحساب الذهني! تم خصم ليرتين`);
      return;
    }

    if (timeLeft <= 4) {
      soundFx.playTickSound();
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameResult, onForceDeductLiras]);

  // Handle Option Click
  const handleSelectOption = (option: string) => {
    if (gameResult !== 'playing') return;

    setSelectedOption(option);

    if (option === currentStage.correctAnswer) {
      // Correct! +5 Liras reward
      soundFx.playWinSound();
      setScore((prev) => prev + 10);
      setStreak((prev) => prev + 1);

      const reward = 5;
      if (onAddLiras) onAddLiras(reward);

      if (stageIndex === MENTAL_MATH_STAGES.length - 1) {
        triggerSuperWinConfetti();
        setGameResult('completed_all');
      } else {
        triggerStageWinConfetti();
        setGameResult('win_stage');
      }
    } else {
      // Wrong answer! Player lost -2 Liras
      soundFx.playWrongSound();
      setGameResult('game_over');
      setStreak(0);
      onForceDeductLiras(2, 'إجابة خاطئة في الحساب الذهني! تم خصم ليرتين.');
    }
  };

  const [insufficientFundsMessage, setInsufficientFundsMessage] = useState<string | null>(null);

  // Next Stage
  const handleNextStage = () => {
    soundFx.playClickSound();
    if (stageIndex < MENTAL_MATH_STAGES.length - 1) {
      setStageIndex((prev) => prev + 1);
      setGameResult('playing');
    }
  };

  // Retry Current Stage (100% Free)
  const handleRetryStage = () => {
    soundFx.playClickSound();
    setGameResult('playing');
    setTimeLeft(15);
    setSelectedOption(null);
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full animate-fade-in select-none" dir="rtl">
      
      {/* Top Stage Header */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-purple-500/40 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-950/80 border border-purple-400/50 rounded-xl text-purple-300 text-xs font-black">
            المرحلة {currentStage.stage} من 40
          </span>
          <span className="text-[11px] text-amber-300 font-bold hidden sm:inline">
            {currentStage.levelTitle}
          </span>
        </div>

        {/* 15s Timer Display */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-sm border shadow-md ${
          timeLeft <= 4
            ? 'bg-red-950/90 text-red-400 border-red-500 animate-pulse'
            : 'bg-purple-950/70 text-yellow-300 border-purple-500/40'
        }`}>
          <Clock className="w-4 h-4 text-yellow-400" />
          <span>المؤقت: {timeLeft}s</span>
        </div>
      </div>

      {/* Level Title for Mobile */}
      <div className="sm:hidden w-full text-center text-xs text-amber-300 font-semibold mb-2">
        {currentStage.levelTitle}
      </div>

      {/* Progress Bar (40 Stages) */}
      <div className="w-full h-2 bg-slate-900 rounded-full mb-3 overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 transition-all duration-300"
          style={{ width: `${((stageIndex + 1) / 40) * 100}%` }}
        />
      </div>

      {/* Equation / Question Box */}
      <div className="w-full py-5 px-4 rounded-3xl bg-slate-950/90 border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.3)] mb-4 text-center relative overflow-hidden">
        <div className="text-[11px] text-purple-400 font-bold mb-1 flex items-center justify-center gap-1">
          <Brain className="w-4 h-4" />
          <span>احسب المعادلة الذهنية بالإنجليزية بسرعة:</span>
        </div>
        <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider my-2 text-center" dir="ltr">
          {currentStage.question}
        </div>
      </div>

      {/* 6 Answer Options Grid */}
      {gameResult === 'playing' && (
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
          {currentStage.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectOption(option)}
              className="py-3.5 px-2 rounded-2xl bg-gradient-to-b from-blue-950/80 via-purple-950/60 to-slate-950 border border-purple-400/40 hover:border-yellow-400 text-lg sm:text-xl font-mono font-black text-white active:scale-95 transition-all shadow-md hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer flex items-center justify-center"
              dir="ltr"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* WIN STAGE SCREEN */}
      {gameResult === 'win_stage' && (
        <div className="w-full p-4 rounded-3xl bg-emerald-950/90 border-2 border-emerald-500 text-center space-y-3 mb-4 animate-fade-in shadow-[0_0_30px_rgba(16,185,129,0.4)]">
          <div className="flex justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
          </div>
          <h4 className="text-xl font-black text-emerald-300">إجابة صحيحة وممتازة! 🎉 (+3 ليرات)</h4>
          <p className="text-xs text-emerald-100">
            {currentStage.explanation}
          </p>
          <button
            onClick={handleNextStage}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-base shadow-lg transition-all cursor-pointer"
          >
            الانتقال للمرحلة التالية ({stageIndex + 2}/40) ➔
          </button>
        </div>
      )}

      {/* GAME OVER (LOSS) SCREEN */}
      {gameResult === 'game_over' && (
        <div className="w-full p-5 rounded-3xl bg-red-950/95 border-2 border-red-500 text-center space-y-3 mb-4 animate-fade-in shadow-[0_0_35px_rgba(239,68,68,0.5)]">
          <div className="flex justify-center">
            <AlertTriangle className="w-12 h-12 text-red-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xl font-black text-red-300 mb-1">
              {timeLeft <= 0 ? 'انتهى الوقت (15 ثانية)!' : 'إجابة غير صحيحة!'}
            </h4>
            <div className="inline-block px-3 py-1 bg-red-900/90 border border-red-400/60 rounded-full text-xs font-black text-white mt-1">
              تم خصم 3 ليرات بسبب الخسارة!
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/50 border border-red-500/30 text-xs text-red-200">
            <span className="font-bold text-yellow-300">الجواب الصحيح هو: </span>
            <span className="font-mono font-bold text-base text-white ml-1" dir="ltr">{currentStage.correctAnswer}</span>
            <div className="text-[11px] text-slate-300 mt-1">{currentStage.explanation}</div>
          </div>

          {insufficientFundsMessage && (
            <div className="p-3 bg-red-950/90 border-2 border-red-500 rounded-xl text-red-200 text-sm font-black animate-shake flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{insufficientFundsMessage}</span>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              onClick={handleRetryStage}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة محاولة هذه المرحلة (-5 ليرات ضريبة)</span>
            </button>

            <button
              onClick={onBackToHub}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
            >
              الرجوع إلى قائمة الألعاب
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED ALL 40 STAGES */}
      {gameResult === 'completed_all' && (
        <div className="w-full p-5 rounded-3xl bg-gradient-to-b from-amber-950/95 via-yellow-950/90 to-slate-950 border-2 border-yellow-400 text-center space-y-3 mb-4 animate-fade-in shadow-[0_0_40px_rgba(245,158,11,0.6)]">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
          <h3 className="text-2xl font-black text-yellow-300">أنت أسطورة الرياضيات الخارقة! 🏆</h3>
          <p className="text-xs text-amber-100 leading-relaxed">
            لقد أتممت بنجاح جميع الـ 40 مرحلة للحساب الذهني من الصف السادس وحتى الثالث الثانوي!
          </p>
          <button
            onClick={onBackToHub}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm"
          >
            العودة لمركز الألعاب
          </button>
        </div>
      )}

      {/* Bottom Hub Navigation */}
      {gameResult === 'playing' && (
        <div className="w-full flex justify-between items-center pt-2">
          <button
            onClick={onBackToHub}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>الرجوع لقائمة الألعاب</span>
          </button>
          <span className="text-[11px] text-purple-300 font-mono">
            المؤقت صارم: 15 ثانية لكل مرحلة
          </span>
        </div>
      )}
    </div>
  );
};
