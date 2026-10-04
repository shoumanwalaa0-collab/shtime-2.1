import React, { useState, useEffect } from 'react';
import { soundFx } from '../utils/soundEffects';
import { triggerStageWinConfetti } from '../utils/confetti';
import { UserGameState } from '../types';
import { RotateCcw, Zap, Bot, Users, Trophy, Award, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface TicTacToeGameProps {
  gameState: UserGameState;
  onDeductLiras: (amount: number) => boolean;
  onForceDeductLiras?: (amount: number, reason: string) => void;
  onAddLiras?: (amount: number) => void;
  onBackToHub: () => void;
}

type Player = 'X' | 'O';
type BoardState = (Player | null)[];
type GameMode = 'person' | 'robot';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({
  gameState,
  onDeductLiras,
  onForceDeductLiras,
  onAddLiras,
  onBackToHub
}) => {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  
  // Scores
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  // "اللعب مرتين" feature for Robot mode
  const [consecutiveMovesLeft, setConsecutiveMovesLeft] = useState<number>(0);
  const [doubleMoveMessage, setDoubleMoveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRobotThinking, setIsRobotThinking] = useState(false);

  // Check winner
  const checkWinner = (currentBoard: BoardState): { winner: Player | 'draw' | null; line: number[] | null } => {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a] as Player, line: combo };
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: 'draw', line: null };
    }
    return { winner: null, line: null };
  };

  // Reset board for new round
  const handleResetRound = () => {
    if (gameState.liras <= 0) {
      soundFx.playWrongSound();
      setErrorMessage('أنت لا تملك أي مال');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    soundFx.playClickSound();
    if (onForceDeductLiras) {
      onForceDeductLiras(5, 'ضريبة بدء جولة جديدة في إكس أو: تم خصم 5 ليرات');
    }
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine(null);
    setConsecutiveMovesLeft(0);
    setDoubleMoveMessage(null);
    setErrorMessage(null);
    setIsRobotThinking(false);
  };

  // Reset entire game
  const handleFullReset = () => {
    handleResetRound();
    setScores({ X: 0, O: 0, draws: 0 });
    setGameMode(null);
  };

  // Robot Move Logic (2x Harder AI with tactical play, but has occasional silly blunders so player can defeat it)
  const getBestRobotMove = (currentBoard: BoardState): number => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);

    if (emptyIndices.length === 0) return -1;

    // 1. Can Robot ('O') win in 1 move? ALWAYS take the instant victory!
    for (const idx of emptyIndices) {
      const testBoard = [...currentBoard];
      testBoard[idx] = 'O';
      if (checkWinner(testBoard).winner === 'O') return idx;
    }

    // 2. Can Player ('X') win in 1 move?
    // ~75% of the time, Robot is smart and blocks the win immediately.
    // ~25% of the time, Robot is "أهبل" (silly) and misses the block if multiple moves remain!
    const isSilly = Math.random() < 0.25;

    for (const idx of emptyIndices) {
      const testBoard = [...currentBoard];
      testBoard[idx] = 'X';
      if (checkWinner(testBoard).winner === 'X') {
        if (!isSilly || emptyIndices.length <= 2) {
          return idx; // Block player!
        }
      }
    }

    // 3. Take Center if available (crucial tactical position)
    if (emptyIndices.includes(4) && (!isSilly || Math.random() > 0.3)) {
      return 4;
    }

    // 4. Take Corners if available
    const corners = [0, 2, 6, 8].filter((c) => emptyIndices.includes(c));
    if (corners.length > 0 && !isSilly) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5. Random empty spot
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  };

  // Trigger Robot move when it's O's turn in robot mode
  useEffect(() => {
    if (gameMode === 'robot' && currentPlayer === 'O' && !winner && consecutiveMovesLeft === 0) {
      setIsRobotThinking(true);
      const timer = setTimeout(() => {
        const bestMove = getBestRobotMove(board);
        if (bestMove !== undefined && bestMove >= 0) {
          const newBoard = [...board];
          newBoard[bestMove] = 'O';
          
          const result = checkWinner(newBoard);
          setBoard(newBoard);
          setIsRobotThinking(false);

          if (result.winner) {
            setWinner(result.winner);
            setWinningLine(result.line);
            if (result.winner === 'O') {
              soundFx.playWrongSound();
              setScores((prev) => ({ ...prev, O: prev.O + 1 }));
              if (onForceDeductLiras) {
                onForceDeductLiras(3, 'خسرت الجولة ضد الروبوت في إكس أو!');
              }
            } else if (result.winner === 'draw') {
              soundFx.playTone(440, 'triangle', 0.2);
              setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
            }
          } else {
            soundFx.playTone(350, 'sine', 0.08, 0.08);
            setCurrentPlayer('X');
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameMode, winner, board, consecutiveMovesLeft, onForceDeductLiras]);

  // Handle Player clicking a cell
  const handleCellClick = (index: number) => {
    if (board[index] !== null || winner || isRobotThinking) return;

    soundFx.playClickSound();
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.line);
      setConsecutiveMovesLeft(0);
      setDoubleMoveMessage(null);

      if (result.winner === 'X') {
        soundFx.playWinSound();
        triggerStageWinConfetti();
        setScores((prev) => ({ ...prev, X: prev.X + 1 }));
        if (onAddLiras) onAddLiras(3); // +3 Liras win reward as specified
      } else if (result.winner === 'O') {
        if (gameMode === 'robot') {
          soundFx.playWrongSound();
          if (onForceDeductLiras) {
            onForceDeductLiras(3, 'خسرت الجولة ضد الروبوت في إكس أو! تم خصم 3 ليرات');
          }
        } else {
          soundFx.playWinSound();
          triggerStageWinConfetti();
        }
        setScores((prev) => ({ ...prev, O: prev.O + 1 }));
      } else if (result.winner === 'draw') {
        soundFx.playTone(440, 'triangle', 0.2);
        setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
      }
      return;
    }

    // Turn advancement logic
    if (gameMode === 'person') {
      // 2 players on same device: X then O then X
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    } else {
      // Against Robot
      if (consecutiveMovesLeft > 1) {
        // Player had extra turns from "اللعب مرتين"
        setConsecutiveMovesLeft((prev) => prev - 1);
        setDoubleMoveMessage('⚡ حركتك الثانية المتبقية الآن! العب مرة أخرى!');
        // Keep currentPlayer as 'X'
      } else if (consecutiveMovesLeft === 1) {
        // Finished double turn, hand over to Robot 'O'
        setConsecutiveMovesLeft(0);
        setDoubleMoveMessage(null);
        setCurrentPlayer('O');
      } else {
        // Normal 1-turn mode
        setCurrentPlayer('O');
      }
    }
  };

  // Special "اللعب مرتين" Handler (Cost 40 Liras)
  const handlePlayTwice = () => {
    setErrorMessage(null);
    setDoubleMoveMessage(null);

    if (winner || isRobotThinking) return;

    if (currentPlayer !== 'X') {
      setErrorMessage('يمكن تفعيل الميزة فقط في دورك (دور اللاعب X)');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const countEmpty = board.filter((c) => c === null).length;
    if (countEmpty < 2) {
      setErrorMessage('لا توجد خانات كافية في اللوحة للعب مرتين');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const success = onDeductLiras(40);
    if (success) {
      soundFx.playUpgradeSound();
      // Gives the player 2 consecutive moves
      setConsecutiveMovesLeft(2);
      setDoubleMoveMessage('⚡ تم تفعيل "اللعب مرتين"! يمكنك الآن وضع حركتين متتاليتين قبل الروبوت!');
    } else {
      soundFx.playWrongSound();
      setErrorMessage('انت لا تملك المال (تحتاج إلى 40 ليرة)');
      setTimeout(() => setErrorMessage(null), 3500);
    }
  };

  // 1. Initial Choice Dialog: مع شخص أم مع روبوت؟
  if (!gameMode) {
    return (
      <div className="flex flex-col items-center max-w-md mx-auto w-full text-center py-4 animate-fade-in" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 border border-cyan-300 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
          <span className="text-3xl font-black text-white">X O</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">لعبة إكس أو (X - O)</h2>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          اختر نظام اللعب الذي تفضله: هل تريد التحدي مع شخص حقيقي على نفس الهاتف أم ضد الروبوت؟
        </p>

        {errorMessage && (
          <div className="w-full mb-4 p-3 bg-red-950/90 border-2 border-red-500 rounded-xl text-red-200 text-sm font-black animate-shake flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="w-full space-y-4">
          {/* Option 1: مع شخص */}
          <button
            onClick={() => {
              soundFx.playClickSound();
              setGameMode('person');
            }}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-950/90 to-indigo-950/90 border-2 border-blue-500/50 hover:border-blue-400 flex items-center justify-between group transition-all hover:scale-[1.02] active:scale-98 shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-white group-hover:text-blue-300 transition-colors">
                  مع شخص (لاعبان 👥)
                </div>
                <div className="text-xs text-slate-400">
                  لاعب 1 (X) ثم لاعب 2 (O) على نفس الهاتف بالتناوب
                </div>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              تحدي ثنائي
            </span>
          </button>

          {/* Option 2: مع روبوت */}
          <button
            onClick={() => {
              soundFx.playClickSound();
              setGameMode('robot');
            }}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-950/90 to-cyan-950/90 border-2 border-cyan-500/50 hover:border-cyan-400 flex items-center justify-between group transition-all hover:scale-[1.02] active:scale-98 shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <Bot className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                  <span>مع روبوت (ذكاء اصطناعي 🤖)</span>
                </div>
                <div className="text-xs text-slate-400">
                  أنت (X) ضد الروبوت (O) + ميزة اللعب مرتين (40 ليرة)
                </div>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              فردي ضد الذكاء
            </span>
          </button>
        </div>

        <button
          onClick={onBackToHub}
          className="mt-6 text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرجوع لقائمة الألعاب</span>
        </button>
      </div>
    );
  }

  // 2. Active Game Board Screen
  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full animate-fade-in" dir="rtl">
      {/* Game Mode Header */}
      <div className="w-full flex items-center justify-between bg-slate-900/80 border border-slate-700/60 rounded-2xl px-4 py-2.5 mb-3 shadow-md">
        <div className="flex items-center gap-2">
          {gameMode === 'person' ? (
            <div className="flex items-center gap-1.5 text-blue-400 text-sm font-bold">
              <Users className="w-4 h-4" />
              <span>مع شخص (لاعبان)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-cyan-400 text-sm font-bold">
              <Bot className="w-4 h-4" />
              <span>ضد الروبوت (الذكاء)</span>
            </div>
          )}
        </div>

        <button
          onClick={handleFullReset}
          className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg border border-slate-600 transition-colors cursor-pointer"
        >
          تغيير الوضع
        </button>
      </div>

      {/* Scoreboard */}
      <div className="w-full grid grid-cols-3 gap-2 text-center mb-3">
        <div className={`p-2.5 rounded-xl border transition-all ${currentPlayer === 'X' && !winner ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="text-xs text-cyan-400 font-bold">اللاعب (X)</div>
          <div className="text-xl font-black text-cyan-300">{scores.X}</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400 font-bold">تعادل</div>
          <div className="text-xl font-black text-slate-300">{scores.draws}</div>
        </div>

        <div className={`p-2.5 rounded-xl border transition-all ${currentPlayer === 'O' && !winner ? 'bg-amber-950/80 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[1.02]' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="text-xs text-amber-400 font-bold">{gameMode === 'person' ? 'اللاعب (O)' : 'الروبوت (O)'}</div>
          <div className="text-xl font-black text-amber-300">{scores.O}</div>
        </div>
      </div>

      {/* Status / Turn Banner */}
      <div className="w-full text-center mb-3">
        {winner ? (
          <div className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-900/90 to-green-900/90 border border-emerald-500/60 text-white font-black text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-bounce">
            <Trophy className="w-5 h-5 text-yellow-400 fill-current" />
            <span>
              {winner === 'draw'
                ? 'انتهت الجولة بالتعادل!'
                : winner === 'X'
                ? '🎉 فاز اللاعب (X) في هذه الجولة!'
                : gameMode === 'person'
                ? '🎉 فاز اللاعب (O) في هذه الجولة!'
                : '🤖 فاز الروبوت (O) في هذه الجولة!'}
            </span>
          </div>
        ) : (
          <div className="py-1.5 px-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm font-bold flex items-center justify-center gap-2">
            {isRobotThinking ? (
              <span className="text-amber-400 flex items-center gap-1.5 animate-pulse">
                <Bot className="w-4 h-4" />
                الروبوت يفكر في حركته...
              </span>
            ) : (
              <span className={currentPlayer === 'X' ? 'text-cyan-300' : 'text-amber-300'}>
                الدور الحالي: <strong className="text-base font-black uppercase">{currentPlayer}</strong> {currentPlayer === 'X' ? (gameMode === 'robot' ? '(أنت)' : '(اللاعب 1)') : (gameMode === 'robot' ? '(الروبوت)' : '(اللاعب 2)')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Double Move Active Notification */}
      {doubleMoveMessage && (
        <div className="w-full py-2 px-3 mb-3 bg-gradient-to-r from-amber-950/90 via-yellow-900/90 to-amber-950/90 border border-yellow-400 text-yellow-200 text-xs font-black rounded-xl text-center shadow-[0_0_15px_rgba(234,179,8,0.4)] animate-pulse flex items-center justify-center gap-1.5">
          <Zap className="w-4 h-4 text-yellow-400 fill-current" />
          <span>{doubleMoveMessage}</span>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="w-full py-2 px-3 mb-3 bg-red-950/90 border border-red-500 text-red-200 text-xs font-bold rounded-xl text-center shadow-lg animate-shake flex items-center justify-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3x3 Tic Tac Toe Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-64 sm:w-72 aspect-square p-3 rounded-2xl bg-slate-950/90 border-2 border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.8)] mb-4">
        {board.map((cell, index) => {
          const isWinningCell = winningLine?.includes(index);
          return (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={cell !== null || !!winner || isRobotThinking}
              className={`w-full h-full rounded-xl flex items-center justify-center text-4xl sm:text-5xl font-black transition-all cursor-pointer select-none active:scale-95 disabled:cursor-not-allowed ${
                cell === 'X'
                  ? isWinningCell
                    ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-pulse border-2 border-white'
                    : 'bg-gradient-to-br from-cyan-950 to-blue-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : cell === 'O'
                  ? isWinningCell
                    ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-pulse border-2 border-white'
                    : 'bg-gradient-to-br from-amber-950 to-orange-950 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {cell}
            </button>
          );
        })}
      </div>

      {/* Bottom Controls / Special Features */}
      <div className="w-full space-y-2.5">
        {/* Play Twice Button (ONLY in Robot mode as requested by user) */}
        {gameMode === 'robot' && !winner && (
          <button
            onClick={handlePlayTwice}
            disabled={consecutiveMovesLeft > 0 || isRobotThinking || currentPlayer !== 'X'}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-sm sm:text-base flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all hover:scale-[1.02] active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-300"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 fill-current animate-bounce" />
              <span>اللعب مرتين (حركتان متتاليتان)</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-black/30 text-black font-black text-xs border border-black/20">
              تخصم 40 ليرة
            </div>
          </button>
        )}

        {/* Reset / New Round Button */}
        <div className="flex gap-2 w-full">
          <button
            onClick={handleResetRound}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>جولة جديدة</span>
          </button>

          <button
            onClick={onBackToHub}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span>خروج</span>
          </button>
        </div>
      </div>
    </div>
  );
};
