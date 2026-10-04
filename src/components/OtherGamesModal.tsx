import React, { useState } from 'react';
import { UserGameState } from '../types';
import { TicTacToeGame } from './TicTacToeGame';
import { MentalMathGame } from './MentalMathGame';
import { soundFx } from '../utils/soundEffects';
import { triggerStageWinConfetti } from '../utils/confetti';
import {
  X,
  ArrowRight,
  Sparkles,
  Gamepad2,
  Trophy,
  Coins,
  Bot,
  Users,
  Brain,
  Zap,
  Flame,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface OtherGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  onDeductLiras: (amount: number) => boolean;
  onForceDeductLiras: (amount: number, reason: string) => void;
  onAddLiras?: (amount: number) => void;
}

type ActiveSubGame = 'tictactoe' | 'rockpaper' | 'math' | null;

export const OtherGamesModal: React.FC<OtherGamesModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onDeductLiras,
  onForceDeductLiras,
  onAddLiras,
}) => {
  const [activeGame, setActiveGame] = useState<ActiveSubGame>(null);

  // Mini-game 2: Rock Paper Scissors state
  const [rpsPlayerChoice, setRpsPlayerChoice] = useState<string | null>(null);
  const [rpsRobotChoice, setRpsRobotChoice] = useState<string | null>(null);
  const [rpsResult, setRpsResult] = useState<string | null>(null);
  const [rpsScores, setRpsScores] = useState({ wins: 0, losses: 0, draws: 0 });
  const [previousPlayerChoices, setPreviousPlayerChoices] = useState<('rock' | 'paper' | 'scissors')[]>([]);

  const [insufficientFundsBanner, setInsufficientFundsBanner] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartSubGame = (game: ActiveSubGame) => {
    // Mental Math is 100% FREE! Other games require checking liras and 5 liras fee
    if (game !== 'math') {
      if (gameState.liras <= 0) {
        soundFx.playWrongSound();
        setInsufficientFundsBanner('أنت لا تملك أي مال');
        setTimeout(() => setInsufficientFundsBanner(null), 3500);
        return;
      }
      onForceDeductLiras(5, 'ضريبة اللعبة الواحدة: تم خصم 5 ليرات');
    }
    soundFx.playClickSound();
    setActiveGame(game);
  };

  // Handle Rock Paper Scissors play (2x harder AI with pattern recognition & adaptive counters)
  const playRPS = (choice: 'rock' | 'paper' | 'scissors') => {
    soundFx.playClickSound();
    
    // AI Strategy: 2x harder
    // 65% of the time, the Robot attempts to counter what beats the user's preferred or previous choice
    // 35% of the time it chooses randomly so the player can still win with unpredictable play
    const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];
    let robot: 'rock' | 'paper' | 'scissors';

    const isSmartCounter = Math.random() < 0.65;
    if (isSmartCounter) {
      // Counter what beats the current choice
      if (choice === 'rock') robot = 'paper';
      else if (choice === 'paper') robot = 'scissors';
      else robot = 'rock';
    } else {
      robot = choices[Math.floor(Math.random() * choices.length)];
    }

    setPreviousPlayerChoices((prev) => [...prev.slice(-4), choice]);
    setRpsPlayerChoice(choice);
    setRpsRobotChoice(robot);

    if (choice === robot) {
      setRpsResult('draw');
      soundFx.playTone(440, 'triangle', 0.2);
      setRpsScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
    } else if (
      (choice === 'rock' && robot === 'scissors') ||
      (choice === 'paper' && robot === 'rock') ||
      (choice === 'scissors' && robot === 'paper')
    ) {
      setRpsResult('win');
      soundFx.playWinSound();
      triggerStageWinConfetti();
      setRpsScores((prev) => ({ ...prev, wins: prev.wins + 1 }));
      if (onAddLiras) onAddLiras(3); // +3 Liras win reward as specified
    } else {
      // Player lost in RPS: deduct 3 Liras!
      setRpsResult('lose');
      soundFx.playWrongSound();
      setRpsScores((prev) => ({ ...prev, losses: prev.losses + 1 }));
      onForceDeductLiras(3, 'خسرت الجولة في حجر ورقة مقص! تم خصم 3 ليرات');
    }
  };

  // Back step handler
  const handleGoBackStep = () => {
    soundFx.playClickSound();
    if (activeGame !== null) {
      setActiveGame(null);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-[#0a1128] to-slate-950 border-2 border-blue-500/40 rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.35)] p-4 sm:p-6 text-white my-auto overflow-hidden animate-fade-in">
        
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. TOP BAR (App Name, Back Step Button, Liras) */}
        <div className="relative z-10 flex items-center justify-between pb-3">
          
          {/* Back 1 Step Button */}
          <button
            onClick={handleGoBackStep}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="الرجوع إلى الخلف خطوة"
          >
            <ArrowRight className="w-4 h-4 text-cyan-400" />
            <span>الرجوع للخلف خطوة</span>
          </button>

          {/* App Branding Badge */}
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-blue-950 via-indigo-900 to-purple-950 border border-cyan-400/60 shadow-[0_0_12px_rgba(56,189,248,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 uppercase">
                i-xon x
              </span>
            </div>
            <span className="text-[10px] font-black text-amber-300 tracking-wider mt-0.5">
              SHtime 2
            </span>
          </div>

          {/* Coins / Balance with negative alert styling if < 0 */}
          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-black shadow-sm ${
            gameState.liras < 0
              ? 'bg-red-950/90 border-red-500 text-red-300 animate-pulse'
              : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
          }`}>
            <Coins className={`w-4 h-4 fill-current ${gameState.liras < 0 ? 'text-red-400' : 'text-yellow-400'}`} />
            <span>{gameState.liras} ليرة</span>
          </div>
        </div>

        {/* THE PROMINENT WHITE LINE with generous margins */}
        <div className="w-full my-4 sm:my-5 shrink-0 relative z-10">
          <div className="w-full h-1.5 sm:h-2 bg-white shadow-[0_0_25px_rgba(255,255,255,0.95)] rounded-full" />
        </div>

        {/* 2. MAIN CONTENT AREA with generous padding */}
        <div className="relative z-10 pt-2 pb-16 sm:pb-24">
          
          {/* A. TIC TAC TOE GAME */}
          {activeGame === 'tictactoe' && (
            <TicTacToeGame
              gameState={gameState}
              onDeductLiras={onDeductLiras}
              onForceDeductLiras={onForceDeductLiras}
              onAddLiras={onAddLiras}
              onBackToHub={() => setActiveGame(null)}
            />
          )}

          {/* B. ROCK PAPER SCISSORS GAME */}
          {activeGame === 'rockpaper' && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <h3 className="text-xl sm:text-2xl font-black text-white mb-1">حجر ورقة مقص ✊✋✌️</h3>
              <p className="text-xs text-slate-300 mb-2">
                تحدَّ الروبوت الذكي (أصعب بمرتين)! الخسارة تخصم 3 ليرات والفوز يكسبك 3 ليرات.
              </p>

              {/* Scoreboard */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-3 text-center">
                <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400 font-bold">فوز (+3 ليرات)</div>
                  <div className="text-lg font-black text-emerald-300">{rpsScores.wins}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold">تعادل</div>
                  <div className="text-lg font-black text-slate-300">{rpsScores.draws}</div>
                </div>
                <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/30">
                  <div className="text-[10px] text-red-400 font-bold">خسارة (-3 ليرات)</div>
                  <div className="text-lg font-black text-red-300">{rpsScores.losses}</div>
                </div>
              </div>

              {/* Duel Arena */}
              <div className="w-full max-w-sm p-4 rounded-2xl bg-slate-950/80 border border-slate-800 mb-4 flex items-center justify-around">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-cyan-300 font-bold mb-1">اختيارك</span>
                  <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-3xl shadow-inner">
                    {rpsPlayerChoice === 'rock' ? '✊' : rpsPlayerChoice === 'paper' ? '✋' : rpsPlayerChoice === 'scissors' ? '✌️' : '❓'}
                  </div>
                </div>

                <div className="text-sm font-black text-yellow-400 px-2">VS</div>

                <div className="flex flex-col items-center">
                  <span className="text-xs text-amber-300 font-bold mb-1">الروبوت 🤖</span>
                  <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner">
                    {rpsRobotChoice === 'rock' ? '✊' : rpsRobotChoice === 'paper' ? '✋' : rpsRobotChoice === 'scissors' ? '✌️' : '❓'}
                  </div>
                </div>
              </div>

              {/* Result Banner */}
              {rpsResult && (
                <div className={`w-full max-w-sm py-2 px-3 rounded-xl mb-4 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md animate-fade-in ${
                  rpsResult === 'win' ? 'bg-green-900/90 text-green-200 border border-green-500' :
                  rpsResult === 'lose' ? 'bg-red-950/90 text-red-200 border border-red-500' :
                  'bg-slate-800 text-slate-200 border border-slate-700'
                }`}>
                  {rpsResult === 'win' ? '🎉 أحسنت! فزت في الجولة (+3 ليرات)' :
                   rpsResult === 'lose' ? '⚠️ فاز الروبوت! تم خصم 3 ليرات بسبب الخسارة!' :
                   '🤝 تعادل!'}
                </div>
              )}

              {/* Choice Buttons */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-4">
                <button
                  onClick={() => playRPS('rock')}
                  className="py-3 px-2 rounded-2xl bg-gradient-to-b from-blue-900 to-indigo-950 border border-blue-500/40 hover:border-blue-400 flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="text-2xl">✊</span>
                  <span className="text-xs font-bold text-white">حجر</span>
                </button>

                <button
                  onClick={() => playRPS('paper')}
                  className="py-3 px-2 rounded-2xl bg-gradient-to-b from-emerald-900 to-teal-950 border border-emerald-500/40 hover:border-emerald-400 flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="text-2xl">✋</span>
                  <span className="text-xs font-bold text-white">ورقة</span>
                </button>

                <button
                  onClick={() => playRPS('scissors')}
                  className="py-3 px-2 rounded-2xl bg-gradient-to-b from-purple-900 to-violet-950 border border-purple-500/40 hover:border-purple-400 flex flex-col items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="text-2xl">✌️</span>
                  <span className="text-xs font-bold text-white">مقص</span>
                </button>
              </div>

              <button
                onClick={() => setActiveGame(null)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>الرجوع لقائمة الألعاب</span>
              </button>
            </div>
          )}

          {/* C. 40-STAGE SPEED MENTAL MATH GAME */}
          {activeGame === 'math' && (
            <MentalMathGame
              gameState={gameState}
              onForceDeductLiras={onForceDeductLiras}
              onAddLiras={onAddLiras}
              onBackToHub={() => setActiveGame(null)}
            />
          )}

          {/* D. GAMES HUB (When no subgame is active) */}
          {activeGame === null && (
            <div className="animate-fade-in">
              {/* Header inside modal */}
              <div className="text-center mb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/40 text-blue-300 text-xs font-bold mb-2">
                  <Gamepad2 className="w-4 h-4 text-yellow-400" />
                  <span>مركز الألعاب التفاعلية</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">ألعاب أخرى</h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  اختر من بين الألعاب المتنوعة للتسلية والتحدي المباشر!
                </p>
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-[11px] text-amber-300 font-bold">
                  ⚠️ قانون الألعاب: ضريبة دخول اللعبة الواحدة 5 ليرات (-5 ليرات)، والفوز يكسبك 3 ليرات، وخسارة أي لعبة تخصم 3 ليرات.
                </div>

                {insufficientFundsBanner && (
                  <div className="mt-3 p-3 bg-red-950/90 border-2 border-red-500 rounded-2xl text-red-200 text-sm font-black animate-shake flex items-center justify-center gap-2 shadow-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <span>{insufficientFundsBanner}</span>
                  </div>
                )}
              </div>

              {/* Multiple Game Boxes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. First Box: X - O Game */}
                <div
                  onClick={() => handleStartSubGame('tictactoe')}
                  className="p-4 rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-950/70 via-blue-950/50 to-slate-950 hover:border-cyan-400 transition-all cursor-pointer group shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:scale-[1.02] active:scale-98 relative overflow-hidden"
                >
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                    مطلوب ومميز 🔥
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-xl font-black text-cyan-300 group-hover:scale-110 transition-transform">
                      X O
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                        لعبة إكس أو (X - O)
                      </h4>
                      <span className="text-[11px] text-cyan-400 font-semibold">
                        مع شخص 👥 أو روبوت 🤖 (أصعب بمرتين)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    الروبوت ذكي وأصعب بمرتين ولكنه ليس مستحيلاً. الخسارة تخصم 3 ليرات والفوز يمنحك 3 ليرات.
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-2 border-t border-slate-800">
                    <span className="text-yellow-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" />
                      ميزة اللعب مرتين (40 ليرة)
                    </span>
                    <span className="text-cyan-400 group-hover:translate-x-[-3px] transition-transform">
                      بدء اللعب (-5 ليرات) ←
                    </span>
                  </div>
                </div>

                {/* 2. Second Box: Rock Paper Scissors */}
                <div
                  onClick={() => handleStartSubGame('rockpaper')}
                  className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/70 via-teal-950/50 to-slate-950 hover:border-emerald-400 transition-all cursor-pointer group shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-98 relative"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      ✊
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                        حجر ورقة مقص
                      </h4>
                      <span className="text-[11px] text-emerald-400 font-semibold">
                        تحدي سريع ضد الروبوت (-3 ليرات عند الخسارة)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    تحدَّ ذكاء الروبوت المتقدم! الفوز يمنحك 3 ليرات، والخسارة تخصم 3 ليرات.
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-2 border-t border-slate-800">
                    <span className="text-emerald-400">+3 ليرات عند الفوز</span>
                    <span className="text-emerald-400 group-hover:translate-x-[-3px] transition-transform">
                      بدء اللعب (-5 ليرات) ←
                    </span>
                  </div>
                </div>

                {/* 3. Third Box: 40-Stage Speed Mental Math */}
                <div
                  onClick={() => handleStartSubGame('math')}
                  className="p-4 rounded-2xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-950/80 via-indigo-950/60 to-slate-950 hover:border-purple-400 transition-all cursor-pointer group shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-98 relative overflow-hidden"
                >
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                    40 مرحلة ⚡
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                        التحدي الأسرع (الحساب الذهني)
                      </h4>
                      <span className="text-[11px] text-purple-400 font-semibold">
                        مؤقت 15 ثانية و 6 خيارات للأجوبة
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    40 مرحلة بالإنجليزية تبدأ من الصف السادس حتى الثالث الثانوي! الفوز يمنحك 3 ليرات، وانتهاء الوقت يخصم 3 ليرات.
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-2 border-t border-slate-800">
                    <span className="text-amber-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      15 ثانية لكل مرحلة
                    </span>
                    <span className="text-purple-400 group-hover:translate-x-[-3px] transition-transform">
                      بدء التحدي (-5 ليرات) ←
                    </span>
                  </div>
                </div>

                {/* 4. Fourth Box: 2-Player Match on same device */}
                <div
                  onClick={() => handleStartSubGame('tictactoe')}
                  className="p-4 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/70 via-yellow-950/50 to-slate-950 hover:border-amber-400 transition-all cursor-pointer group shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-98 relative"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-amber-600/30 border border-amber-400/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                        تحدي الأصدقاء الثنائي
                      </h4>
                      <span className="text-[11px] text-amber-400 font-semibold">
                        مبارزات ثنائية مباشرة على شاشة الهاتف
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2">
                    تنافس مع صديقك أو عائلتك جنباً إلى جنب على جهاز واحد في مواجهات شيقة وسريعة.
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-2 border-t border-slate-800">
                    <span className="text-amber-400">لعب مباشر ثنائي</span>
                    <span className="text-amber-400 group-hover:translate-x-[-3px] transition-transform">
                      الدخول ←
                    </span>
                  </div>
                </div>

              </div>

              {/* 5. USER CREATED CUSTOM GAMES SECTION (ألعاب مصنعة من الأشخاص الآخرين) */}
              <div className="mt-6 pt-6 border-t-2 border-amber-500/30 text-center">
                {/* Shiny Yellow Button requested by user at the very end of Other Games */}
                <button
                  onClick={() => {
                    soundFx.playClickSound();
                    // Toggle or view user-created games
                    const section = document.getElementById('user-created-games-container');
                    if (section) {
                      section.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_25px_rgba(234,179,8,0.7)] border-2 border-yellow-200 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Sparkles className="w-5 h-5 text-slate-950 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>رؤية الألعاب الأخرى التي تم صناعتها من قبل مستخدمين آخرين</span>
                </button>

                <div id="user-created-games-container" className="mt-4">
                  {(!gameState.customGames || gameState.customGames.length === 0) ? (
                    <div className="p-6 rounded-3xl bg-slate-950/80 border-2 border-dashed border-amber-500/40 text-center text-amber-200/80 text-xs font-semibold">
                      🎮 لا توجد ألعاب تم صناعتها من قبل مستخدمين آخرين حتى الآن. جميع الألعاب المعروضة حقيقية 100% وليست مزيفة! كن أول من يصنع لعبته من زر «صناعة لعبة خاصة بك».
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                      {gameState.customGames.map((game) => (
                        <div
                          key={game.id}
                          onClick={() => {
                            if (gameState.liras < game.tax) {
                              soundFx.playWrongSound();
                              alert(`أنت لا تملك ليرات كافية لدخول هذه اللعبة! ضريبة الدخول هي ${game.tax} ليرة.`);
                              return;
                            }
                            soundFx.playWinSound();
                            // Deduct the requested tax from player
                            onForceDeductLiras(
                              game.tax,
                              `ضريبة دخول لعبة «${game.name}»: تم خصم ${game.tax} ليرة (نصفها للمطور ونصفها للعبة)`
                            );
                            window.open(game.url, '_blank');
                          }}
                          className="w-full rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-950/90 via-yellow-950/70 to-slate-950 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] flex flex-col justify-between group cursor-pointer hover:scale-[1.01] active:scale-98 transition-all relative overflow-hidden text-right"
                        >
                          <div className="flex items-center gap-3.5 mb-3">
                            <img
                              src={game.imageUrl}
                              alt={game.name}
                              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/80 shrink-0 shadow-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80';
                              }}
                            />
                            <div>
                              <h4 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                                {game.name}
                              </h4>
                              <span className="text-[11px] text-amber-300 font-black px-2.5 py-0.5 bg-amber-500/20 rounded-full border border-amber-400/40 inline-block mt-1">
                                المطور: {game.creatorName}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-amber-100/90 font-medium leading-relaxed mb-3 line-clamp-3">
                            {game.description}
                          </p>

                          <div className="flex items-center justify-between text-xs font-black pt-3 border-t border-amber-500/30 text-yellow-300">
                            <span className="px-2.5 py-1 bg-black/60 rounded-xl border border-amber-400/30">
                              ضريبة الدخول: {game.tax} ليرة
                            </span>
                            <span className="text-cyan-300 group-hover:translate-x-[-4px] transition-transform flex items-center gap-1">
                              ابدأ اللعب الآن 🚀
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
