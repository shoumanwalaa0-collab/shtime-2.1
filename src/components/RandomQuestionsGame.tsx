import React, { useState } from 'react';
import { soundFx } from '../utils/soundEffects';
import { triggerStageWinConfetti } from '../utils/confetti';
import { HelpCircle, Sparkles, Send, CheckCircle2, ArrowRight, Trophy, AlertTriangle } from 'lucide-react';

interface QuestionItem {
  playerId: number;
  playerName: string;
  question: string;
  answer: string;
}

interface AssignedQuestion {
  targetPlayerName: string;
  fromPlayerName: string;
  question: string;
  originalAnswer: string;
}

interface RandomQuestionsGameProps {
  playersList: string[];
  isCreator: boolean;
  onBackToRoom: () => void;
  onForceDeductLiras: (amount: number, reason: string) => void;
  onAddLiras: (amount: number) => void;
}

export const RandomQuestionsGame: React.FC<RandomQuestionsGameProps> = ({
  playersList,
  isCreator,
  onBackToRoom,
  onForceDeductLiras,
  onAddLiras,
}) => {
  // Phase 1: Each player writes question and answer
  // Phase 2: Shuffling animation
  // Phase 3: Distributed answer phase (can never receive their own question)
  // Phase 4: Results & Score
  const [phase, setPhase] = useState<'input' | 'shuffling' | 'answering' | 'result'>('input');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [questionInput, setQuestionInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [submittedQuestions, setSubmittedQuestions] = useState<QuestionItem[]>([]);
  
  // Distributed questions for answering phase
  const [assignedQuestions, setAssignedQuestions] = useState<AssignedQuestion[]>([]);
  const [currentAnswererIndex, setCurrentAnswererIndex] = useState<number>(0);
  const [userGuessAnswer, setUserGuessAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; success: boolean } | null>(null);

  const players = playersList.length > 0 ? playersList : ['المنشئ (أنت)', 'اللاعب 2', 'اللاعب 3', 'اللاعب 4'];
  const currentWriter = players[currentPlayerIndex] || players[0];

  // Handle Question + Answer Submission
  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || !answerInput.trim()) {
      alert('يرجى كتابة السؤال مع الجواب!');
      return;
    }

    soundFx.playClickSound();

    const newQuestion: QuestionItem = {
      playerId: currentPlayerIndex,
      playerName: currentWriter,
      question: questionInput.trim(),
      answer: answerInput.trim(),
    };

    const updated = [...submittedQuestions, newQuestion];
    setSubmittedQuestions(updated);
    setQuestionInput('');
    setAnswerInput('');

    if (currentPlayerIndex + 1 < players.length) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else {
      // All players have written their questions!
      // Move to shuffling phase
      setPhase('shuffling');
      soundFx.playWinSound();

      setTimeout(() => {
        // Derangement algorithm: shuffle so NO ONE gets their own question!
        const shuffledAssigned: AssignedQuestion[] = [];
        const n = updated.length;
        // Shift by 1 or randomized derangement
        for (let i = 0; i < n; i++) {
          const targetIndex = i;
          // Target gets question from (i + 1) % n to guarantee it is NOT their own question
          const sourceQuestionIndex = (i + 1) % n;
          shuffledAssigned.push({
            targetPlayerName: players[targetIndex],
            fromPlayerName: updated[sourceQuestionIndex].playerName,
            question: updated[sourceQuestionIndex].question,
            originalAnswer: updated[sourceQuestionIndex].answer,
          });
        }

        setAssignedQuestions(shuffledAssigned);
        setCurrentAnswererIndex(0);
        setPhase('answering');
      }, 2500);
    }
  };

  // Handle Guessing the answer
  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userGuessAnswer.trim()) return;

    const currentTask = assignedQuestions[currentAnswererIndex];
    if (!currentTask) return;

    const isCorrect = userGuessAnswer.trim().toLowerCase() === currentTask.originalAnswer.trim().toLowerCase();

    if (isCorrect) {
      soundFx.playWinSound();
      triggerStageWinConfetti();
      onAddLiras(1);
      setFeedback({
        text: `🎉 إجابة صحيحة من ${currentTask.targetPlayerName}! حصل على 1 ليرة ذهبية 🪙`,
        success: true,
      });
    } else {
      soundFx.playWrongSound();
      onForceDeductLiras(1, `إجابة خاطئة في أسئلة عشوائية من ${currentTask.targetPlayerName}! تم خصم 1 ليرة`);
      setFeedback({
        text: `❌ إجابة خاطئة! الجواب الصحيح كان: "${currentTask.originalAnswer}". تم خصم 1 ليرة.`,
        success: false,
      });
    }

    setTimeout(() => {
      setFeedback(null);
      setUserGuessAnswer('');
      if (currentAnswererIndex + 1 < assignedQuestions.length) {
        setCurrentAnswererIndex(currentAnswererIndex + 1);
      } else {
        setPhase('result');
      }
    }, 2500);
  };

  return (
    <div className="w-full bg-[#090e1f] border-2 border-purple-500/50 rounded-3xl p-5 text-white animate-fade-in" dir="rtl">
      
      {/* Top Bar inside game */}
      <div className="flex items-center justify-between border-b border-purple-500/30 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-yellow-400" />
          <h3 className="text-lg font-black text-white">لعبة أسئلة عشوائية أونلاين 🎲</h3>
        </div>
        <button
          onClick={onBackToRoom}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-600 cursor-pointer"
        >
          العودة للغرفة
        </button>
      </div>

      {/* PHASE 1: WRITING QUESTIONS & ANSWERS */}
      {phase === 'input' && (
        <form onSubmit={handleSubmitQuestion} className="space-y-4 animate-fade-in">
          <div className="p-3 bg-purple-950/60 border border-purple-500/40 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-black text-purple-300">
              دور اللاعب: <span className="text-yellow-300 text-sm font-black">{currentWriter}</span>
            </span>
            <span className="text-[11px] text-purple-200 font-bold">
              ({currentPlayerIndex + 1} من {players.length})
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">اكتب سؤالك السري:</label>
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="اكتب سؤالاً ذكياً هنا..."
              className="w-full py-3 px-4 bg-slate-950 border border-purple-400/50 rounded-2xl text-white text-sm outline-none font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">اكتب الجواب الصحيح لسؤالك في الأسفل:</label>
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="اكتب الجواب الصحيح هنا..."
              className="w-full py-3 px-4 bg-slate-950 border border-purple-400/50 rounded-2xl text-white text-sm outline-none font-bold"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-black text-sm rounded-2xl shadow-lg hover:scale-[1.01] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>التالي وتسليم السؤال 🚀</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* PHASE 2: SHUFFLING & DERANGEMENT */}
      {phase === 'shuffling' && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-yellow-400 animate-spin flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
          </div>
          <h4 className="text-xl font-black text-white">جاري خلط الأسئلة عشوائياً...</h4>
          <p className="text-xs text-purple-200/80 max-w-sm">
            نظام الخلط الذكي يضمن أن كل شخص سيحصل على سؤال شخص آخر، ولا يمكن لأحد أن يحصل على سؤاله إطلاقاً!
          </p>
        </div>
      )}

      {/* PHASE 3: ANSWERING ASSIGNED QUESTION */}
      {phase === 'answering' && assignedQuestions[currentAnswererIndex] && (
        <div className="space-y-4 animate-fade-in">
          {feedback && (
            <div className={`p-3 rounded-2xl text-xs sm:text-sm font-black text-center shadow-lg animate-bounce ${
              feedback.success ? 'bg-emerald-950 border border-emerald-500 text-emerald-200' : 'bg-red-950 border border-red-500 text-red-200'
            }`}>
              {feedback.text}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>دور المجيب: <span className="text-yellow-300 font-black">{assignedQuestions[currentAnswererIndex].targetPlayerName}</span></span>
              <span>سؤال من لاعب آخر 🎭</span>
            </div>

            <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/20 text-center">
              <span className="text-xs text-purple-300 font-bold block mb-1">السؤال الموجه إليك:</span>
              <p className="text-base font-black text-white">
                "{assignedQuestions[currentAnswererIndex].question}"
              </p>
            </div>
          </div>

          <form onSubmit={handleCheckAnswer} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اكتب جوابك الآن:</label>
              <input
                type="text"
                value={userGuessAnswer}
                onChange={(e) => setUserGuessAnswer(e.target.value)}
                placeholder="اكتب جوابك..."
                className="w-full py-3 px-4 bg-slate-950 border border-purple-400/50 rounded-2xl text-white text-sm outline-none font-bold"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm rounded-2xl shadow-lg hover:scale-[1.01] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد الجواب (+1 ليرة للفوز / -1 ليرة للخسارة)</span>
            </button>
          </form>
        </div>
      )}

      {/* PHASE 4: GAME FINISHED */}
      {phase === 'result' && (
        <div className="text-center py-8 space-y-4 animate-fade-in">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
          <h4 className="text-2xl font-black text-white">انتهت جولة الأسئلة العشوائية! 🎉</h4>
          <p className="text-xs text-purple-200">
            أحسنت! تمت معالجة جميع الأسئلة وتوزيع الليرات والمكافآت بدقة.
          </p>
          <button
            onClick={onBackToRoom}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg cursor-pointer"
          >
            العودة إلى غرفة الماب الرئيسية ↩️
          </button>
        </div>
      )}

    </div>
  );
};
