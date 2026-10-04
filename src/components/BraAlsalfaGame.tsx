import React, { useState, useEffect } from 'react';
import { Users, Clock, HelpCircle, Award, AlertCircle, ArrowLeft, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { triggerStageWinConfetti } from '../utils/confetti';

interface BraAlsalfaGameProps {
  playersList: string[];
  isCreator: boolean;
  onBackToRoom: () => void;
  onAddLiras: (amount: number) => void;
}

const TOPICS_LIST = [
  { word: 'الشاورما 🌯', hint: 'أكلة سريعة مشهورة جداً وشهية' },
  { word: 'كرة القدم ⚽', hint: 'رياضة جماعية بها 11 لاعباً في كل فريق' },
  { word: 'المستشفى 🏥', hint: 'مكان يذهب إليه المرضى وفيه أطباء وممرضون' },
  { word: 'المدرسة 🏫', hint: 'مكان للتعليم والصفوف والكتب والمعلمين' },
  { word: 'المطار 🛫', hint: 'مكان إقلاع وهبوط الطائرات والسفر' },
  { word: 'السينما 🎬', hint: 'مكان بشاشة عملاقة وفشار لمشاهدة الأفلام' },
  { word: 'السوبرماركت 🛒', hint: 'مكان للتسوق وشراء الأطعمة والأغراض' },
  { word: 'حديقة الحيوان 🦁', hint: 'مكان فيه أقفاص وحيوانات برية متنوعة' },
  { word: 'البحر والشاطئ 🏖️', hint: 'مكان رملي وماء للسباحة والاستجمام' },
  { word: 'المطعم 🍽️', hint: 'مكان لتناول الوجبات وطلب الأكل' },
];

export const BraAlsalfaGame: React.FC<BraAlsalfaGameProps> = ({
  playersList,
  isCreator,
  onBackToRoom,
  onAddLiras,
}) => {
  const [gamePhase, setGamePhase] = useState<'reveal' | 'discussion' | 'voting' | 'result'>('reveal');
  const [secretTopic] = useState(() => TOPICS_LIST[Math.floor(Math.random() * TOPICS_LIST.length)]);
  
  // Decide who is Outside the loop (first player or a random assigned player)
  const [spyIndex] = useState(() => Math.floor(Math.random() * Math.max(1, playersList.length)));
  const isMeTheSpy = spyIndex === 0; // Local player is at index 0

  const [timeLeft, setTimeLeft] = useState(60);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVotePlayer, setSelectedVotePlayer] = useState<string | null>(null);
  const [votedCounts, setVotedCounts] = useState<Record<string, number>>({});
  const [isRevealed, setIsRevealed] = useState(false);

  // Timer for discussion phase
  useEffect(() => {
    if (gamePhase !== 'discussion') return;
    if (timeLeft <= 0) {
      setGamePhase('voting');
      soundFx.playLevelUpSound();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gamePhase, timeLeft]);

  const handleStartDiscussion = () => {
    soundFx.playClickSound();
    setGamePhase('discussion');
  };

  const handleVoteForPlayer = (player: string) => {
    if (hasVoted) return;
    soundFx.playClickSound();
    setSelectedVotePlayer(player);
    setHasVoted(true);

    setVotedCounts((prev) => ({
      ...prev,
      [player]: (prev[player] || 0) + 1,
    }));

    setTimeout(() => {
      setGamePhase('result');
      soundFx.playWinSound();
      triggerStageWinConfetti();
      // Reward
      const actualSpy = playersList[spyIndex] || 'لاعب غير معروف';
      if (player === actualSpy && !isMeTheSpy) {
        onAddLiras(25);
      } else if (isMeTheSpy) {
        onAddLiras(35);
      }
    }, 2000);
  };

  const spyPlayerName = playersList[spyIndex] || playersList[0] || 'اللاعب';

  return (
    <div className="space-y-4 animate-fade-in p-2">
      {/* Header */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 font-black">
            🕵️
          </div>
          <div>
            <h3 className="text-base font-black text-white">لعبة برّا السالفة أونلاين</h3>
            <p className="text-xs text-amber-200">اكتشفوا من لا يعرف الكلمة السرية قبل انتهاء الوقت!</p>
          </div>
        </div>

        <button
          onClick={onBackToRoom}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>الغرفة</span>
        </button>
      </div>

      {/* Phase 1: Reveal Secret Role */}
      {gamePhase === 'reveal' && (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/40 text-center space-y-4 shadow-2xl">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black">
            الخطوة 1: معرفة دورك السري
          </div>

          <h4 className="text-lg font-black text-white">انقر للكشف عن دورك في هذه الجولة:</h4>

          {!isRevealed ? (
            <button
              onClick={() => {
                soundFx.playWinSound();
                setIsRevealed(true);
              }}
              className="w-full py-8 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 font-black text-lg shadow-xl cursor-pointer hover:scale-102 active:scale-98 transition-all flex flex-col items-center justify-center gap-2"
            >
              <HelpCircle className="w-10 h-10 animate-bounce" />
              <span>اضغط هنا لإظهار السالفة / دورك 👁️</span>
            </button>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950 border-2 border-amber-400 animate-fade-in space-y-3">
              {isMeTheSpy ? (
                <div className="space-y-2">
                  <div className="text-3xl">🕵️‍♂️</div>
                  <div className="text-xl font-black text-red-400">أنت برّا السالفة!</div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                    لا أحد يعرف أنك لا تعرف الكلمة! استمع جيداً للأسئلة عبر الفويس وحاول التظاهر بأنك تعرف السالفة دون أن يكتشفك أحد!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-3xl">📜</div>
                  <div className="text-xs text-amber-300 font-bold">السالفة والكلمة السرية هي:</div>
                  <div className="text-2xl font-black text-emerald-400">{secretTopic.word}</div>
                  <p className="text-xs text-slate-400">{secretTopic.hint}</p>
                </div>
              )}

              <button
                onClick={handleStartDiscussion}
                className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-sm shadow-lg cursor-pointer hover:scale-105"
              >
                جاهز! بدء النقاش والأسئلة بالفويس 🎙️
              </button>
            </div>
          )}
        </div>
      )}

      {/* Phase 2: Discussion using Voice Chat */}
      {gamePhase === 'discussion' && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/40 text-center space-y-4 shadow-2xl">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-xl font-black text-amber-300">{timeLeft} ثانية</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs font-bold leading-relaxed">
            🎙️ استخدم زر الفويس الدائري بالأعلى واسأل اللاعبين بالدور! حاول أن تسأل أسئلة ذكية تكشف من هو برّا السالفة دون أن تفضح الكلمة!
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {playersList.map((player, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate">{player}</span>
                <span className="text-[10px] text-cyan-400 font-semibold">جاهز</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setGamePhase('voting')}
            className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-black text-xs hover:bg-amber-500 cursor-pointer"
          >
            الانتقال للتصويت الآن 🗳️
          </button>
        </div>
      )}

      {/* Phase 3: Voting */}
      {gamePhase === 'voting' && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/40 text-center space-y-4 shadow-2xl">
          <h4 className="text-lg font-black text-white">من برأيك هو "برّا السالفة"؟</h4>
          <p className="text-xs text-slate-300">صوّت على اللاعب المشبوه:</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {playersList.map((player, idx) => (
              <button
                key={idx}
                onClick={() => handleVoteForPlayer(player)}
                disabled={hasVoted}
                className={`p-4 rounded-2xl border text-sm font-black flex items-center justify-between transition-all cursor-pointer ${
                  selectedVotePlayer === player
                    ? 'bg-amber-500/30 border-amber-400 text-white shadow-lg'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-amber-400'
                }`}
              >
                <span>{player}</span>
                {selectedVotePlayer === player ? (
                  <CheckCircle className="w-5 h-5 text-amber-400" />
                ) : (
                  <span className="text-xs text-slate-500">تصويت</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase 4: Result */}
      {gamePhase === 'result' && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 text-center space-y-4 shadow-2xl animate-fade-in">
          <div className="text-4xl">🎉</div>
          <h4 className="text-xl font-black text-white">انتهت الجولة!</h4>
          
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400">اللاعب الذي كان برّا السالفة هو:</div>
            <div className="text-xl font-black text-red-400">{spyPlayerName}</div>
            <div className="text-xs text-slate-400">الكلمة السرية كانت:</div>
            <div className="text-lg font-black text-emerald-400">{secretTopic.word}</div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setGamePhase('reveal');
                setTimeLeft(60);
                setIsRevealed(false);
                setHasVoted(false);
                setSelectedVotePlayer(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:scale-105 cursor-pointer"
            >
              جولة جديدة 🔄
            </button>
            <button
              onClick={onBackToRoom}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 cursor-pointer"
            >
              العودة للغرفة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
