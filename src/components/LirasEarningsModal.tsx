import React, { useState } from 'react';
import { UserCustomGame, UserGameState } from '../types';
import { soundFx } from '../utils/soundEffects';
import { calculateGameEarnings, calculateCreatorOverall } from '../utils/earningsCalculator';
import {
  LogOut,
  Heart,
  MessageCircle,
  Share2,
  Coins,
  Trash2,
  Award,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Gamepad2,
  Gift,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LirasEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  myGames: UserCustomGame[];
  onAddLiras: (amount: number, reason?: string) => void;
  onDeleteGame: (gameId: string) => Promise<boolean>;
  onRefreshGames: () => void;
  onUpdateGameSettings?: (gameId: string, settings: Partial<UserCustomGame>) => void;
}

export const LirasEarningsModal: React.FC<LirasEarningsModalProps> = ({
  isOpen,
  onClose,
  gameState: _gameState,
  myGames,
  onAddLiras,
  onDeleteGame,
  onRefreshGames,
  onUpdateGameSettings,
}) => {
  // Selected game whose "معلوماتها" is active/expanded
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  // Game selected for delete confirmation modal ("نعم" أو "لا")
  const [gameToDelete, setGameToDelete] = useState<UserCustomGame | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Earnings claiming status
  const [claimingGameId, setClaimingGameId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Local state for allowComments toggles per game
  const [commentSettings, setCommentSettings] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    myGames.forEach((g) => {
      // Default is strictly enabled (true) as requested
      initial[g.id] = g.allowComments !== false;
    });
    return initial;
  });

  if (!isOpen) return null;

  // Toggle "معلوماتها" for a specific game
  const handleToggleInfo = (gameId: string) => {
    soundFx.playClickSound();
    setActiveGameId((prev) => (prev === gameId ? null : gameId));
  };

  // Toggle "السماح بالتعليقات" (Right = Yes/نعم, Left = No/لا)
  const handleToggleAllowComments = async (game: UserCustomGame) => {
    const currentVal = commentSettings[game.id] ?? (game.allowComments !== false);
    const newVal = !currentVal;

    soundFx.playClickSound();
    setCommentSettings((prev) => ({ ...prev, [game.id]: newVal }));

    try {
      await fetch(`/api/custom-games/${game.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowComments: newVal }),
      });

      if (onUpdateGameSettings) {
        onUpdateGameSettings(game.id, { allowComments: newVal });
      }

      setToastMsg(
        newVal
          ? 'تم تفعيل السماح بالتعليقات بنجاح! يمكن للجميع إرسال تعليقاتهم ✅'
          : 'تم إيقاف التعليقات العادية! يُسمح فقط بتعليقات الهدايا 🎁'
      );
      setTimeout(() => setToastMsg(null), 3500);
      onRefreshGames();
    } catch {
      // Revert on error
      setCommentSettings((prev) => ({ ...prev, [game.id]: currentVal }));
      soundFx.playWrongSound();
      setToastMsg('حدث خطأ أثناء تحديث إعدادات التعليقات!');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // Confirm delete game ("نعم")
  const handleConfirmDelete = async () => {
    if (!gameToDelete || isDeleting) return;
    setIsDeleting(true);
    soundFx.playWrongSound();

    try {
      const success = await onDeleteGame(gameToDelete.id);
      if (success) {
        soundFx.playWinSound();
        setToastMsg(`تم حذف لعبة «${gameToDelete.name}» نهائياً ولا يمكن العودة إليها أبداً.`);
        setTimeout(() => setToastMsg(null), 4000);
        if (activeGameId === gameToDelete.id) {
          setActiveGameId(null);
        }
        setGameToDelete(null);
        onRefreshGames();
      } else {
        setToastMsg('فشل حذف اللعبة، يرجى المحاولة مرة أخرى.');
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch {
      setToastMsg('حدث خطأ أثناء محاولة حذف اللعبة!');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Claim earnings for a specific game
  const handleClaimEarnings = async (game: UserCustomGame, amount: number) => {
    if (amount <= 0 || claimingGameId) return;
    setClaimingGameId(game.id);
    soundFx.playWinSound();

    try {
      await fetch(`/api/custom-games/${game.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountToClaim: amount }),
      });

      onAddLiras(amount, `استلام أرباح لعبة «${game.name}» (${amount} ليرة)`);
      soundFx.playCoinSound();
      setToastMsg(`تم استلام أرباح اللعبة (+${amount} ليرة) بنجاح! 💰🎉`);
      setTimeout(() => setToastMsg(null), 3500);
      onRefreshGames();
    } catch {
      soundFx.playWrongSound();
      setToastMsg('حدث خطأ أثناء استلام الأرباح!');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setClaimingGameId(null);
    }
  };

  // Calculate overall earnings across my games
  const overall = calculateCreatorOverall(myGames);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-fade-in"
      dir="rtl"
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[80] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-5 py-2.5 rounded-full font-black text-xs sm:text-sm shadow-[0_0_30px_rgba(245,158,11,0.9)] border-2 border-yellow-200 animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 fill-current text-slate-950" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Container: قائمة كبيرة على طول الصفحة */}
      <div className="relative w-full max-w-2xl h-[94vh] max-h-[840px] bg-gradient-to-b from-[#111933] via-[#0b1022] to-[#050812] border-2 border-amber-400/80 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.35)] flex flex-col overflow-hidden text-right">
        
        {/* ========================================================================= */}
        {/* 1. في الأعلى فوق الخط الأبيض: اسم اللعبة وحدها كبسة خروج                      */}
        {/* ========================================================================= */}
        <div className="w-full bg-[#080d1c] px-4 sm:px-8 pt-6 pb-4 flex items-center justify-between gap-4 shrink-0 z-10 border-b border-blue-900/30">
          {/* اسم اللعبة */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-yellow-400 via-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.8)]">
              <Gamepad2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-wider drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] block leading-tight">
                shtime-2.
              </span>
              <span className="text-xs text-amber-300 font-black mt-0.5 block">
                قائمة الأرباح الخاصة بالليرات 💰
              </span>
            </div>
          </div>

          {/* حدها كبسة خروج تعيد إلى مطرح ما كان */}
          <button
            onClick={() => {
              soundFx.playClickSound();
              onClose();
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-700 via-rose-800 to-red-700 hover:from-red-600 hover:to-rose-700 text-white font-black text-sm border border-red-400/80 shadow-[0_0_20px_rgba(225,29,72,0.5)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            title="خروج والعودة للصفحة السابقة"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>خروج</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. الخط الأبيض الصريح والناصع على طول الصفحة مع مسافة واسعة فوق وتحت          */}
        {/* ========================================================================= */}
        <div className="w-full px-4 sm:px-6 my-4 sm:my-5 shrink-0">
          <div className="w-full h-1.5 sm:h-2 bg-white shadow-[0_0_25px_rgba(255,255,255,0.95)] rounded-full" />
        </div>

        {/* ========================================================================= */}
        {/* 3. تحت الخط الأبيض: كل الألعاب التي صممها المستخدم مع مساحة أكثر من 30 سم     */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-2 pb-36 sm:pb-48 space-y-6">
          
          {/* شريط الإجمالي للأرباح بالليرات */}
          <div className="bg-gradient-to-r from-[#172242] to-[#0d142b] border border-amber-400/50 rounded-2xl p-3.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black">
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-xs text-amber-300 font-black block">إجمالي أرباح ألعابك المصنوعة</span>
                <span className="text-[11px] text-blue-200">
                  {myGames.length} {myGames.length === 1 ? 'لعبة صممتها' : 'ألعاب صممتها'}
                </span>
              </div>
            </div>

            <div className="text-left font-mono">
              <span className="text-base sm:text-lg font-black text-yellow-300 block">
                {overall.totalEarnings.toLocaleString()} ليرة
              </span>
              <span className="text-[10px] text-emerald-300 font-bold">
                متاح للاستلام: {overall.totalUnclaimed.toLocaleString()} ليرة
              </span>
            </div>
          </div>

          {/* قائمة الألعاب المصنوعة */}
          <div className="space-y-3">
            {myGames.length === 0 ? (
              <div className="bg-[#0b1226] border border-blue-500/30 rounded-3xl p-8 text-center space-y-3 shadow-inner">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 text-2xl">
                  🎨
                </div>
                <h4 className="text-base font-black text-white">لم تقم بصناعة أي لعبة حتى الآن!</h4>
                <p className="text-xs text-blue-200/80 max-w-sm mx-auto leading-relaxed">
                  عندما تقوم بصناعة ألعابك الخاصة من زر «صناعة لعبة»، ستظهر جميع ألعابك هنا مع إحصائياتها الدقيقة وإمكانية إدارتها واستلام أرباحها بالليرات.
                </p>
              </div>
            ) : (
              myGames.map((game, index) => {
                const b = calculateGameEarnings(game);
                const isExpanded = activeGameId === game.id;
                const isAllowComments = commentSettings[game.id] ?? (game.allowComments !== false);

                return (
                  <div
                    key={game.id || index}
                    className={`bg-gradient-to-b from-[#131c36] to-[#0a1022] border-2 rounded-2xl p-4 transition-all shadow-md ${
                      isExpanded
                        ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                        : 'border-blue-500/40 hover:border-amber-400/60'
                    }`}
                  >
                    {/* Game Card Header: Image + Name + Tax + Button «معلوماتها» */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Game Image */}
                        <img
                          src={game.imageUrl || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80'}
                          alt={game.name}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-400/50 shrink-0 shadow"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />

                        {/* Game Name & Index */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-950 border border-blue-400/40 text-blue-300 font-mono text-[10px] font-bold">
                              #{index + 1}
                            </span>
                            <h4 className="text-sm sm:text-base font-black text-white truncate">
                              {game.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-blue-300">
                            <span>ضريبة اللعب: {game.tax || 20} ليرة</span>
                            <span className="text-amber-300 font-bold">
                              | الربح: {b.totalEarnings.toLocaleString()} ليرة
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 
                        كبسة «معلوماتها»:
                        "حدها هناك كبسه معلوماتها كلهم نفس الكبسه يضغط على اي واحده يبين فيها عدد الاعجابات عدد المشاركه عدد التعليقات"
                      */}
                      <button
                        type="button"
                        onClick={() => handleToggleInfo(game.id)}
                        className={`px-3 sm:px-4 py-2 rounded-xl font-black text-xs sm:text-sm border flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0 ${
                          isExpanded
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                            : 'bg-gradient-to-r from-blue-900 to-indigo-950 hover:from-blue-800 hover:to-indigo-900 text-white border-blue-400/50 shadow'
                        }`}
                        title="عرض معلومات اللعبة وإحصائياتها"
                      >
                        <Info className="w-4 h-4 text-current" />
                        <span>معلوماتها</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* ========================================================================= */}
                    {/* DETAILS EXPANDED: عدد الإعجابات + عدد المشاركة + عدد التعليقات + حذف + التعليقات */}
                    {/* ========================================================================= */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-blue-500/25 space-y-4 animate-fade-in">
                        
                        {/* 1. إحصائيات تفاعل اللعبة الدقيقة */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {/* عدد الإعجابات */}
                          <div className="bg-[#070c1a] border border-red-500/40 rounded-xl p-2.5 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-1 text-red-400 text-xs font-bold mb-0.5">
                              <Heart className="w-3.5 h-3.5 fill-current" />
                              <span>عدد الإعجابات</span>
                            </div>
                            <div className="text-base sm:text-lg font-black text-white font-mono">
                              {b.likes.toLocaleString()}
                            </div>
                            <span className="text-[9px] text-amber-300 font-bold">
                              +{b.likesEarnings} ليرة
                            </span>
                          </div>

                          {/* عدد المشاركة */}
                          <div className="bg-[#070c1a] border border-cyan-500/40 rounded-xl p-2.5 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold mb-0.5">
                              <Share2 className="w-3.5 h-3.5" />
                              <span>عدد المشاركة</span>
                            </div>
                            <div className="text-base sm:text-lg font-black text-white font-mono">
                              {b.sharesCount.toLocaleString()}
                            </div>
                            <span className="text-[9px] text-amber-300 font-bold">
                              +{b.sharesEarnings} ليرة
                            </span>
                          </div>

                          {/* عدد التعليقات */}
                          <div className="bg-[#070c1a] border border-blue-500/40 rounded-xl p-2.5 flex flex-col items-center justify-center">
                            <div className="flex items-center gap-1 text-blue-400 text-xs font-bold mb-0.5">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>عدد التعليقات</span>
                            </div>
                            <div className="text-base sm:text-lg font-black text-white font-mono">
                              {b.commentsCount.toLocaleString()}
                            </div>
                            <span className="text-[9px] text-amber-300 font-bold">
                              +{b.commentsEarnings} ليرة
                            </span>
                          </div>
                        </div>

                        {/* شريط استلام أرباح اللعبة إن كانت متوفرة */}
                        {b.unclaimedEarnings > 0 && (
                          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 to-teal-950/70 border border-emerald-400/50 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-black text-emerald-300 block">
                                أرباح جاهزة للاستلام لهذه اللعبة
                              </span>
                              <span className="text-[10px] text-emerald-100/80">
                                {b.unclaimedEarnings} ليرة مستحقة
                              </span>
                            </div>
                            <button
                              type="button"
                              disabled={claimingGameId === game.id}
                              onClick={() => handleClaimEarnings(game, b.unclaimedEarnings)}
                              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs cursor-pointer shadow active:scale-95 transition-all"
                            >
                              {claimingGameId === game.id ? 'جاري الاستلام...' : `استلام ${b.unclaimedEarnings} ليرة 💰`}
                            </button>
                          </div>
                        )}

                        {/* 
                          2. ويكون في الأسفل أسفل الإعدادات أو عدد المشاركة والإعجابات والتعليقات:
                             هناك كبسة حذف اللعبة
                        */}
                        <div className="pt-2 border-t border-blue-500/20 space-y-3">
                          
                          {/* كبسة حذف اللعبة */}
                          <button
                            type="button"
                            onClick={() => {
                              soundFx.playWrongSound();
                              setGameToDelete(game);
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-950 via-rose-950 to-red-950 hover:from-red-900 hover:to-rose-900 border-2 border-red-500/70 text-red-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                            <span>حذف اللعبة 🗑️</span>
                          </button>

                          {/* 
                            3. وتحت كبسة حذف الفيديو (حذف اللعبة) يوجد هي بنعم أو لا:
                               شعار إلى اليمين يعني نعم وشعار إلى الشمال يعني لا
                               «السماح بالتعليقات» (من الأساس يكون مفعل)
                          */}
                          <div className="p-3.5 rounded-2xl bg-[#080e1f] border-2 border-blue-500/40 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                                  <span>السماح بالتعليقات</span>
                                  <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 border border-amber-400/40 px-2 py-0.5 rounded-full">
                                    {isAllowComments ? 'مفعل (نعم) ✅' : 'معطل (لا) 🔒'}
                                  </span>
                                </span>
                                <p className="text-[11px] text-blue-200/80 mt-0.5">
                                  {isAllowComments
                                    ? 'نعم: يمكن لأي شخص إرسال تعليقاته بحرية إلى هذه اللعبة.'
                                    : 'لا: لا يمكن لأي شخص إرسال تعليق عادي، ويُسمح فقط بإرسال تعليقات الهدايا 🎁'}
                                </p>
                              </div>

                              {/* Toggle switch: Right = نعم (Yes), Left = لا (No) */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[11px] font-black ${isAllowComments ? 'text-emerald-400' : 'text-slate-400'}`}>
                                  نعم
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleToggleAllowComments(game)}
                                  className={`relative w-14 h-7 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer border-2 ${
                                    isAllowComments
                                      ? 'bg-emerald-600 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.7)]'
                                      : 'bg-slate-800 border-slate-600'
                                  }`}
                                  title={isAllowComments ? 'انقر للتعطيل (لا)' : 'انقر للتفعيل (نعم)'}
                                >
                                  <span
                                    className={`inline-block w-5 h-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                      isAllowComments ? 'translate-x-0' : '-translate-x-7'
                                    }`}
                                  />
                                </button>

                                <span className={`text-[11px] font-black ${!isAllowComments ? 'text-rose-400' : 'text-slate-400'}`}>
                                  لا
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. كبسة حذف اللعبة: نافذة التأكيد بنعم أو لا                                */}
      {/* "الضغط عليها مستخدم يعطي عمليه تاكيد بنعم او لا يعود الى مطرح ما كان         */}
      {/* انه كبس نعم يتم حذف هذه اللعبه كليا ويمكن العوده اليها ابدا"                 */}
      {/* ========================================================================= */}
      {gameToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none animate-fade-in">
          <div className="w-full max-w-md bg-gradient-to-b from-[#1a0707] via-[#110505] to-[#0a0303] border-2 border-red-500 rounded-3xl p-5 sm:p-6 text-right space-y-4 shadow-[0_0_50px_rgba(239,68,68,0.6)]">
            <div className="flex items-center gap-2.5 text-red-400 border-b border-red-500/30 pb-3">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 animate-bounce" />
              <div>
                <h4 className="text-base font-black text-white">تأكيد حذف اللعبة نهائياً</h4>
                <span className="text-[11px] text-red-300">لا يمكن التراجع عن هذه الخطوة</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-red-100 leading-relaxed font-semibold">
              هل أنت متأكد من رغبتك في حذف لعبة «<strong className="text-yellow-300">{gameToDelete.name}</strong>»؟
              <br />
              <span className="text-[11px] text-red-300/80 mt-1 block">
                ⚠️ إذا كبست «نعم» سيتم حذف هذه اللعبة كلياً ولن تتمكن من العودة إليها أبداً.
              </span>
            </p>

            {/* الأزرار: نعم أو لا */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* لا: يعود إلى مطرح ما كان */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClickSound();
                  setGameToDelete(null);
                }}
                disabled={isDeleting}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs sm:text-sm cursor-pointer active:scale-95 transition-all text-center border border-slate-600"
              >
                لا (إلغاء التراجع)
              </button>

              {/* نعم: يتم حذف هذه اللعبة كلياً ولا يمكن العودة إليها أبداً */}
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95 transition-all border border-red-400"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'جاري الحذف...' : 'نعم، حذف نهائي'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
