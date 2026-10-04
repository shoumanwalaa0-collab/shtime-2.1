import React, { useState, useEffect } from 'react';
import { Shield, Eye, Heart, Crosshair, ArrowLeft, Clock, CheckCircle, Skull, Award } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';
import { triggerStageWinConfetti } from '../utils/confetti';

interface MafiaGameProps {
  playersList: string[];
  isCreator: boolean;
  onBackToRoom: () => void;
  onAddLiras: (amount: number) => void;
}

type MafiaRole = 'mafia' | 'detective' | 'doctor' | 'citizen';

export const MafiaGame: React.FC<MafiaGameProps> = ({
  playersList,
  isCreator,
  onBackToRoom,
  onAddLiras,
}) => {
  const [phase, setPhase] = useState<'reveal' | 'night' | 'day' | 'voting' | 'verdict'>('reveal');
  const [myRole] = useState<MafiaRole>(() => {
    const roles: MafiaRole[] = ['mafia', 'detective', 'doctor', 'citizen'];
    return roles[Math.floor(Math.random() * roles.length)];
  });

  const [isRoleRevealed, setIsRoleRevealed] = useState(false);
  const [nightActionDone, setNightActionDone] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [investigatedResult, setInvestigatedResult] = useState<string | null>(null);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<string | null>(null);
  const [dayTimeLeft, setDayTimeLeft] = useState(45);
  const [voteCount, setVoteCount] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | null>(null);

  // Timer for day discussion
  useEffect(() => {
    if (phase !== 'day') return;
    if (dayTimeLeft <= 0) {
      setPhase('voting');
      soundFx.playLevelUpSound();
      return;
    }
    const t = setInterval(() => setDayTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(t);
  }, [phase, dayTimeLeft]);

  const handleStartNight = () => {
    soundFx.playClickSound();
    setPhase('night');
  };

  const handlePerformNightAction = (target: string) => {
    setSelectedTarget(target);
    setNightActionDone(true);
    soundFx.playClickSound();

    if (myRole === 'detective') {
      const isMafia = Math.random() > 0.5;
      setInvestigatedResult(isMafia ? `⚠️ اللاعب ${target} هو من المافيا!` : `✅ اللاعب ${target} بريء ومواطن شريف!`);
    }

    setTimeout(() => {
      // Transition to day
      setPhase('day');
      setDayTimeLeft(45);
      soundFx.playWinSound();
      const victim = target;
      if (myRole === 'mafia') {
        setEliminatedPlayer(victim);
      } else {
        const randomTarget = playersList.find((p) => p !== playersList[0]) || 'أحد اللاعبين';
        setEliminatedPlayer(randomTarget);
      }
    }, 2500);
  };

  const handleVotePlayer = (player: string) => {
    if (myVote) return;
    soundFx.playClickSound();
    setMyVote(player);
    setVoteCount((prev) => ({ ...prev, [player]: (prev[player] || 0) + 1 }));

    setTimeout(() => {
      setPhase('verdict');
      soundFx.playWinSound();
      triggerStageWinConfetti();
      onAddLiras(30);
    }, 2000);
  };

  return (
    <div className="space-y-4 animate-fade-in p-2">
      {/* Header */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-red-950/40 border border-red-500/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-500/20 text-red-300 font-black">
            👥
          </div>
          <div>
            <h3 className="text-base font-black text-white">لعبة المافيا أونلاين</h3>
            <p className="text-xs text-red-200">الأبرياء والمحقق ضد عصابة المافيا الغامضة!</p>
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

      {/* Phase 1: Reveal Role */}
      {phase === 'reveal' && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-red-500/40 text-center space-y-4 shadow-2xl">
          <h4 className="text-lg font-black text-white">انقر للكشف عن هويتك السرية:</h4>
          
          {!isRoleRevealed ? (
            <button
              onClick={() => {
                soundFx.playWinSound();
                setIsRoleRevealed(true);
              }}
              className="w-full py-8 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-lg shadow-xl cursor-pointer hover:scale-102 active:scale-98 transition-all flex flex-col items-center justify-center gap-2"
            >
              <Eye className="w-10 h-10 animate-bounce" />
              <span>اضغط هنا لمعرفة دورك السري 🎭</span>
            </button>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950 border-2 border-red-500 animate-fade-in space-y-3">
              <div className="text-4xl">
                {myRole === 'mafia' ? '🦹' : myRole === 'detective' ? '🕵️‍♂️' : myRole === 'doctor' ? '👨‍⚕️' : '🧑‍🌾'}
              </div>
              <div className="text-xl font-black text-white">
                دورك: {myRole === 'mafia' ? 'عضو مافيا (المجرم)' : myRole === 'detective' ? 'المحقق الذكي' : myRole === 'doctor' ? 'طبيب القرية' : 'مواطن صالح'}
              </div>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                {myRole === 'mafia' && 'مهمتك التخلص من الأبرياء وتضليل المحقق دون أن يشك فيك أحد عبر الفويس!'}
                {myRole === 'detective' && 'مهمتك التحقيق ليلاً وكشف أعضاء المافيا وتوجيه أصابع الاتهام نهاراً!'}
                {myRole === 'doctor' && 'مهمتك حماية أحد اللاعبين ليلاً لمنع المافيا من القضاء عليه!'}
                {myRole === 'citizen' && 'مهمتك الاستماع للنقاش عبر الفويس واكتشاف وتصويت إعدام المافيا!'}
              </p>

              <button
                onClick={handleStartNight}
                className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm shadow-lg cursor-pointer hover:scale-105"
              >
                حلول الليل وبدء العمليات 🌙
              </button>
            </div>
          )}
        </div>
      )}

      {/* Phase 2: Night Phase */}
      {phase === 'night' && (
        <div className="p-6 rounded-3xl bg-slate-950 border-2 border-indigo-500/50 text-center space-y-4 shadow-2xl">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black">
            🌙 الليل يسدل ستاره على الجميع...
          </div>

          <h4 className="text-base font-black text-white">
            {myRole === 'mafia' && 'اختر ضحيتك لهذه الليلة:'}
            {myRole === 'detective' && 'اختر لاعباً للتحقيق في هويته:'}
            {myRole === 'doctor' && 'اختر لاعباً لإنقاذه وحمايته:'}
            {myRole === 'citizen' && 'أنت نائم بأمان في منزلك بانتظار طلوع الصباح...'}
          </h4>

          {myRole !== 'citizen' && !nightActionDone && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {playersList.map((player, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePerformNightAction(player)}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-400 text-white font-bold text-xs cursor-pointer"
                >
                  {player}
                </button>
              ))}
            </div>
          )}

          {nightActionDone && (
            <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs font-bold animate-pulse">
              {investigatedResult || 'تم تنفيذ المهمة بنجاح! بانتظار استيقاظ القرية...'}
            </div>
          )}

          {myRole === 'citizen' && (
            <button
              onClick={() => {
                setPhase('day');
                setDayTimeLeft(45);
              }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
            >
              استيقاظ القرية وشروق الشمس ☀️
            </button>
          )}
        </div>
      )}

      {/* Phase 3: Day Discussion with Voice */}
      {phase === 'day' && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/40 text-center space-y-4 shadow-2xl">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-xl font-black text-amber-300">{dayTimeLeft} ثانية</span>
          </div>

          {eliminatedPlayer && (
            <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500 text-red-300 text-xs font-bold flex items-center justify-center gap-2">
              <Skull className="w-4 h-4 text-red-400" />
              <span>أخبار الصباح: تعرض اللاعب ({eliminatedPlayer}) لهجوم الليلة الماضية!</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs font-bold leading-relaxed">
            🎙️ افتحوا الفويس عبر الزر الدائري بالأعلى وتناقشوا جميعاً: من يعتقد أنه المافيا؟ دافع عن نفسك وراقب نبرات الصوت!
          </div>

          <button
            onClick={() => setPhase('voting')}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-black text-xs hover:bg-red-500 cursor-pointer"
          >
            بدء التصويت على المشتبه به 🗳️
          </button>
        </div>
      )}

      {/* Phase 4: Voting */}
      {phase === 'voting' && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-red-500/40 text-center space-y-4 shadow-2xl">
          <h4 className="text-lg font-black text-white">جلسة المحاكمة: صوّت على المشتبه به لإعدامه!</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {playersList.map((player, idx) => (
              <button
                key={idx}
                onClick={() => handleVotePlayer(player)}
                disabled={!!myVote}
                className={`p-4 rounded-2xl border text-sm font-black flex items-center justify-between transition-all cursor-pointer ${
                  myVote === player
                    ? 'bg-red-500/30 border-red-400 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-red-400'
                }`}
              >
                <span>{player}</span>
                {myVote === player ? <CheckCircle className="w-5 h-5 text-red-400" /> : <span className="text-xs text-slate-500">اتهام</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase 5: Verdict */}
      {phase === 'verdict' && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 text-center space-y-4 shadow-2xl animate-fade-in">
          <div className="text-4xl">🏆</div>
          <h4 className="text-xl font-black text-white">حكم المحكمة والنتيجة!</h4>
          <p className="text-xs text-slate-300">
            تمت الجولة بنجاح! حصلت على جائزة مشاركة قيمتها 30 ليرة!
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setPhase('reveal');
                setIsRoleRevealed(false);
                setNightActionDone(false);
                setMyVote(null);
                setEliminatedPlayer(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs hover:scale-105 cursor-pointer"
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
