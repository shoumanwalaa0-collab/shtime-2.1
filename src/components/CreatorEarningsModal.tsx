import React, { useState } from 'react';
import { UserCustomGame, UserGameState } from '../types';
import { soundFx } from '../utils/soundEffects';
import { calculateCreatorOverall, calculateGameEarnings, GameEarningsBreakdown } from '../utils/earningsCalculator';
import { RealCashEarningsModal } from './RealCashEarningsModal';
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Coins,
  DollarSign,
  Trash2,
  Award,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Play,
  ArrowRight,
} from 'lucide-react';

interface CreatorEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  myGames: UserCustomGame[];
  onAddLiras: (amount: number, reason?: string) => void;
  onDeleteGame: (gameId: string) => Promise<boolean>;
  onRefreshGames: () => void;
}

export const CreatorEarningsModal: React.FC<CreatorEarningsModalProps> = ({
  isOpen,
  onClose,
  gameState: _gameState,
  myGames,
  onAddLiras,
  onDeleteGame,
  onRefreshGames,
}) => {
  const [selectedGameForDetails, setSelectedGameForDetails] = useState<UserCustomGame | null>(null);
  const [gameToDelete, setGameToDelete] = useState<UserCustomGame | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [claimingGameId, setClaimingGameId] = useState<string | null>(null);
  const [claimingAll, setClaimingAll] = useState(false);
  const [showRealCashModal, setShowRealCashModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Sort games strictly by likes descending (الأكثر إعجاباً في البداية)
  const sortedMyGames = [...myGames].sort((a, b) => {
    const likesA = Number(a.likes) || 0;
    const likesB = Number(b.likes) || 0;
    if (likesB !== likesA) {
      return likesB - likesA;
    }
    const timeA = new Date(a.createdAt || 0).getTime() || 0;
    const timeB = new Date(b.createdAt || 0).getTime() || 0;
    return timeA - timeB;
  });

  // Calculate overall statistics across all games
  const overall = calculateCreatorOverall(sortedMyGames);

  // Claim all earnings
  const handleClaimAll = async () => {
    if (overall.totalUnclaimed <= 0 || claimingAll) return;
    setClaimingAll(true);
    soundFx.playWinSound();

    try {
      const claimAmount = overall.totalUnclaimed;
      for (const game of sortedMyGames) {
        const breakdown = calculateGameEarnings(game);
        if (breakdown.unclaimedEarnings > 0) {
          await fetch(`/api/custom-games/${game.id}/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amountToClaim: breakdown.unclaimedEarnings }),
          });
        }
      }

      onAddLiras(claimAmount, `استلام أرباح جميع الألعاب المصنوعة (${claimAmount} ليرة)`);
      soundFx.playCoinSound();
      setToastMsg(`تم استلام كامل الأرباح المتاحة (+${claimAmount} ليرة) بنجاح! 💰🎉`);
      setTimeout(() => setToastMsg(null), 4000);
      onRefreshGames();
    } catch {
      soundFx.playWrongSound();
      setToastMsg('حدث خطأ أثناء استلام الأرباح، يرجى المحاولة ثانية');
      setTimeout(() => setToastMsg(null), 3500);
    } finally {
      setClaimingAll(false);
    }
  };

  // Claim specific game earnings
  const handleClaimSpecificGame = async (game: UserCustomGame) => {
    const breakdown = calculateGameEarnings(game);
    if (breakdown.unclaimedEarnings <= 0 || claimingGameId) return;

    setClaimingGameId(game.id);
    soundFx.playWinSound();

    try {
      const claimAmount = breakdown.unclaimedEarnings;
      await fetch(`/api/custom-games/${game.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountToClaim: claimAmount }),
      });

      onAddLiras(claimAmount, `أرباح لعبة «${game.name}» (+${claimAmount} ليرة)`);
      soundFx.playCoinSound();
      setToastMsg(`تم استلام أرباح لعبة «${game.name}» (+${claimAmount} ليرة) بنجاح! 💰✨`);
      setTimeout(() => setToastMsg(null), 4000);

      // Update current selected game state
      setSelectedGameForDetails((prev) =>
        prev && prev.id === game.id
          ? { ...prev, claimedEarnings: (prev.claimedEarnings || 0) + claimAmount }
          : prev
      );
      onRefreshGames();
    } catch {
      soundFx.playWrongSound();
      setToastMsg('حدث خطأ أثناء الاستلام، حاول مرة أخرى');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setClaimingGameId(null);
    }
  };

  // Confirm and delete game
  const handleConfirmDelete = async () => {
    if (!gameToDelete || isDeleting) return;
    setIsDeleting(true);
    soundFx.playClickSound();

    try {
      const success = await onDeleteGame(gameToDelete.id);
      if (success) {
        soundFx.playWinSound();
        setToastMsg(`تم حذف لعبة «${gameToDelete.name}» بنجاح 🗑️`);
        setTimeout(() => setToastMsg(null), 3500);
        if (selectedGameForDetails?.id === gameToDelete.id) {
          setSelectedGameForDetails(null);
        }
        setGameToDelete(null);
        onRefreshGames();
      } else {
        soundFx.playWrongSound();
        setToastMsg('فشل حذف اللعبة، يرجى المحاولة لاحقاً');
        setTimeout(() => setToastMsg(null), 3500);
      }
    } catch {
      soundFx.playWrongSound();
      setToastMsg('حدث خطأ غير متوقع أثناء الحذف');
      setTimeout(() => setToastMsg(null), 3500);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedBreakdown: GameEarningsBreakdown | null = selectedGameForDetails
    ? calculateGameEarnings(selectedGameForDetails)
    : null;

  return (
    <div
      id="creator-earnings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[80] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-5 py-2.5 rounded-full font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.8)] border border-yellow-200 animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 fill-current" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <div
        id="creator-earnings-card-container"
        className="w-full max-w-2xl bg-gradient-to-b from-[#121c38] via-[#0c1326] to-[#070b17] border-2 border-amber-400/80 rounded-3xl p-4 sm:p-6 shadow-[0_0_45px_rgba(245,158,11,0.35)] flex flex-col max-h-[92vh] text-right overflow-hidden relative"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.6)] flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400">
                فقرة الأرباح 💰
              </h3>
              <p className="text-[11px] text-blue-300 font-semibold">
                إحصائيات تفاعل ألعابك والمبالغ المحققة والمستلمة بالليرات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClickSound();
                setShowRealCashModal(true);
              }}
              className="px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm border-2 border-yellow-200 shadow-[0_0_20px_rgba(245,158,11,0.7)] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
              title="جدول أرباح مالية حقيقية بالدولار"
            >
              <DollarSign className="w-4 h-4 text-slate-950" />
              <span>أرباح مالية حقيقية 💵</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-full cursor-pointer transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* 1. TOP SUMMARY STATS CARD (جمع كل ألعابك) */}
          <div className="bg-gradient-to-br from-[#1a2548] to-[#0f1730] border-2 border-amber-400/50 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                  إجمالي تفاعل جميع ألعابي ({overall.totalGames} لعبة)
                </span>
              </div>
              <span className="text-[10px] text-blue-300 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                تحديث فوري
              </span>
            </div>

            {/* 4 Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Metric 1: إجمالي الإعجابات */}
              <div className="bg-[#0b1224] border border-red-500/30 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-red-400 text-xs font-bold mb-0.5">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>إجمالي الإعجابات</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-white">
                  {overall.totalLikes.toLocaleString()}
                </div>
                <span className="text-[9px] text-red-300/80 font-medium">50 ليرة / 1,000 إعجاب</span>
              </div>

              {/* Metric 2: إجمالي التعليقات */}
              <div className="bg-[#0b1224] border border-blue-500/30 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-blue-400 text-xs font-bold mb-0.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>إجمالي التعليقات</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-white">
                  {overall.totalComments.toLocaleString()}
                </div>
                <span className="text-[9px] text-blue-300/80 font-medium">10 ليرات / تعليق</span>
              </div>

              {/* Metric 3: إجمالي المشاركات */}
              <div className="bg-[#0b1224] border border-cyan-500/30 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold mb-0.5">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>إجمالي المشاركات</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-white">
                  {overall.totalShares.toLocaleString()}
                </div>
                <span className="text-[9px] text-cyan-300/80 font-medium">150 ليرة / مشاركة</span>
              </div>

              {/* Metric 4: إجمالي الأرباح الكلية */}
              <div className="bg-[#0b1224] border border-amber-400/40 rounded-xl p-2.5 text-center flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold mb-0.5">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span>الأرباح الكلية</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-yellow-300">
                  {overall.totalEarnings.toLocaleString()}
                </div>
                <span className="text-[9px] text-amber-300/80 font-medium">ليرة سورية</span>
              </div>
            </div>

            {/* Claim All Banner */}
            <div className="bg-gradient-to-r from-amber-950/60 via-[#1c1505] to-[#120e03] border border-amber-500/50 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="text-center sm:text-right">
                <div className="text-xs text-amber-200 font-bold">
                  الأرباح المتاحة للاستلام الآن:
                </div>
                <div className="text-2xl font-black text-yellow-300 flex items-center justify-center sm:justify-start gap-1">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span>{overall.totalUnclaimed.toLocaleString()} ليرة</span>
                </div>
              </div>

              <button
                onClick={handleClaimAll}
                disabled={overall.totalUnclaimed <= 0 || claimingAll}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  overall.totalUnclaimed > 0
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>{claimingAll ? 'جاري الاستلام...' : 'استلام جميع الأرباح 💰'}</span>
              </button>
            </div>
          </div>

          {/* Rules Explanation Note */}
          <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-[11px] text-blue-200/90 leading-relaxed space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>نظام احتساب أرباح الألعاب:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-[10px] text-slate-300">
              <div>• <strong>الإعجاب:</strong> 50 ليرة لكل 1,000 إعجاب</div>
              <div>• <strong>التعليق:</strong> 10 ليرات لكل تعليق</div>
              <div>• <strong>المشاركة:</strong> 150 ليرة لكل مشاركة</div>
            </div>
            <div className="text-[10px] text-emerald-300 font-semibold pt-1 border-t border-blue-500/20">
              • <strong>الدعم المالي المباشر:</strong> أي شخص يرسل مالاً (مثلاً 500 ليرة) يتم تحويله فورا لصانع اللعبة 100%!
            </div>
          </div>

          {/* 2. LIST OF MY GAMES (Sorted by Most Likes First) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>ألعابي المصنوعة</span>
                <span className="text-xs text-amber-400">(مرتبة حسب الأكثر إعجاباً)</span>
              </h4>
              <span className="text-[11px] text-slate-400">{sortedMyGames.length} لعبة</span>
            </div>

            {sortedMyGames.length === 0 ? (
              <div className="bg-[#0b1224] border border-blue-500/20 rounded-2xl p-8 text-center text-slate-400 text-sm">
                لم تصنع أي ألعاب حتى الآن
              </div>
            ) : (
              <div className="space-y-3">
                {sortedMyGames.map((game, index) => {
                  const b = calculateGameEarnings(game);
                  const isFirst = index === 0;

                  return (
                    <div
                      key={game.id || index}
                      onClick={() => {
                        soundFx.playClickSound();
                        setSelectedGameForDetails(game);
                      }}
                      className={`bg-gradient-to-r from-[#101934] to-[#0a1020] border-2 rounded-2xl p-3.5 sm:p-4 transition-all hover:scale-[1.01] cursor-pointer relative overflow-hidden group shadow-md ${
                        isFirst
                          ? 'border-amber-400/90 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                          : 'border-blue-500/30 hover:border-amber-400/60'
                      }`}
                    >
                      {/* Top Rank Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {isFirst ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow">
                              <Award className="w-3 h-3 text-slate-950" />
                              <span>#1 الأكثر إعجاباً 👑</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-200 border border-blue-400/30 font-bold text-[10px]">
                              #{index + 1}
                            </span>
                          )}
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            {game.name}
                          </span>
                        </div>

                        {/* Total game earnings badge */}
                        <div className="text-xs font-black text-amber-300 bg-amber-950/70 border border-amber-400/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{b.totalEarnings.toLocaleString()} ليرة</span>
                        </div>
                      </div>

                      {/* Game Quick Stats Grid */}
                      <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-800 text-center">
                        <div>
                          <span className="text-[10px] text-red-300 flex items-center justify-center gap-0.5">
                            <Heart className="w-2.5 h-2.5 fill-current" />
                            <span>إعجاب</span>
                          </span>
                          <span className="text-xs font-bold text-white block">
                            {b.likes.toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-blue-300 flex items-center justify-center gap-0.5">
                            <MessageCircle className="w-2.5 h-2.5" />
                            <span>تعليق</span>
                          </span>
                          <span className="text-xs font-bold text-white block">
                            {b.commentsCount.toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-cyan-300 flex items-center justify-center gap-0.5">
                            <Share2 className="w-2.5 h-2.5" />
                            <span>مشاركة</span>
                          </span>
                          <span className="text-xs font-bold text-white block">
                            {b.sharesCount.toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-emerald-300 flex items-center justify-center gap-0.5">
                            <DollarSign className="w-2.5 h-2.5" />
                            <span>للاستلام</span>
                          </span>
                          <span className="text-xs font-bold text-emerald-300 block">
                            {b.unclaimedEarnings.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-amber-300/90 group-hover:text-amber-200">
                        <span>انقر لعرض تفاصيل الأرباح، زر الحذف، وزر استلام الربح 👈</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* 3. GAME DETAILS POPUP (تفاصيل اللعبة، كبسة حذف، كبسة الربح) */}
        {selectedGameForDetails && selectedBreakdown && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3">
            <div className="w-full max-w-lg bg-gradient-to-b from-[#131e3d] via-[#0d1428] to-[#070b16] border-2 border-amber-400 rounded-3xl p-5 shadow-[0_0_35px_rgba(245,158,11,0.4)] text-right space-y-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black">
                    🎮
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">{selectedGameForDetails.name}</h4>
                    <span className="text-[11px] text-blue-300">تفاصيل تفاعل اللعبة وأرباحها المستحقة</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGameForDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Top Stats of this game */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#090f20] border border-red-500/40 rounded-xl p-2.5">
                  <span className="text-[10px] text-red-300 flex items-center justify-center gap-1">
                    <Heart className="w-3 h-3 fill-current" />
                    <span>اللايكات</span>
                  </span>
                  <div className="text-base font-black text-white mt-0.5">
                    {selectedBreakdown.likes.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-amber-300 font-bold">
                    +{selectedBreakdown.likesEarnings} ليرة
                  </span>
                </div>

                <div className="bg-[#090f20] border border-blue-500/40 rounded-xl p-2.5">
                  <span className="text-[10px] text-blue-300 flex items-center justify-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>التعليقات</span>
                  </span>
                  <div className="text-base font-black text-white mt-0.5">
                    {selectedBreakdown.commentsCount.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-amber-300 font-bold">
                    +{selectedBreakdown.commentsEarnings} ليرة
                  </span>
                </div>

                <div className="bg-[#090f20] border border-cyan-500/40 rounded-xl p-2.5">
                  <span className="text-[10px] text-cyan-300 flex items-center justify-center gap-1">
                    <Share2 className="w-3 h-3" />
                    <span>المشاركات</span>
                  </span>
                  <div className="text-base font-black text-white mt-0.5">
                    {selectedBreakdown.sharesCount.toLocaleString()}
                  </div>
                  <span className="text-[9px] text-amber-300 font-bold">
                    +{selectedBreakdown.sharesEarnings} ليرة
                  </span>
                </div>
              </div>

              {/* Earnings Breakdown Table */}
              <div className="bg-[#090f20] border border-amber-400/30 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300 border-b border-slate-800 pb-1.5">
                  <span>ربح الإعجابات (50 ليرة لكل 1,000 إعجاب):</span>
                  <span className="font-bold text-amber-300">+{selectedBreakdown.likesEarnings} ليرة</span>
                </div>

                <div className="flex justify-between items-center text-slate-300 border-b border-slate-800 pb-1.5">
                  <span>ربح التعليقات (10 ليرات للتعليق الواحد):</span>
                  <span className="font-bold text-amber-300">+{selectedBreakdown.commentsEarnings} ليرة</span>
                </div>

                <div className="flex justify-between items-center text-slate-300 border-b border-slate-800 pb-1.5">
                  <span>ربح المشاركات (150 ليرة للمشاركة الواحدة):</span>
                  <span className="font-bold text-amber-300">+{selectedBreakdown.sharesEarnings} ليرة</span>
                </div>

                {selectedBreakdown.directTips > 0 && (
                  <div className="flex justify-between items-center text-emerald-300 border-b border-slate-800 pb-1.5">
                    <span>مبالغ الدعم المالي المرسلة للعبة (100% لك):</span>
                    <span className="font-bold text-emerald-400">+{selectedBreakdown.directTips} ليرة</span>
                  </div>
                )}

                {selectedBreakdown.playsEarnings > 0 && (
                  <div className="flex justify-between items-center text-blue-300 border-b border-slate-800 pb-1.5">
                    <span>أرباح ضريبة اللعب (50% من دخول اللاعبين):</span>
                    <span className="font-bold text-blue-300">+{selectedBreakdown.playsEarnings} ليرة</span>
                  </div>
                )}

                <div className="flex justify-between items-center font-bold text-white pt-1">
                  <span>المجموع الكلي لأرباح هذه اللعبة:</span>
                  <span className="text-yellow-300 text-sm">{selectedBreakdown.totalEarnings} ليرة</span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>تم استلامه مسبقاً: {selectedBreakdown.claimedEarnings} ليرة</span>
                  <span className="text-emerald-300 font-bold">
                    المتاح للاستلام: {selectedBreakdown.unclaimedEarnings} ليرة
                  </span>
                </div>
              </div>

              {/* BOTTOM ACTIONS: کپسة حذف + کپسة الربح (جنباً إلى جنب كما طلب المستخدم تماماً) */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* 1. کپسة حذف اللعبة */}
                <button
                  onClick={() => {
                    soundFx.playWrongSound();
                    setGameToDelete(selectedGameForDetails);
                  }}
                  className="py-3 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/60 text-red-200 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-102 active:scale-98"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>حذف اللعبة 🗑️</span>
                </button>

                {/* 2. کپسة الربح (استلام أرباح اللعبة) */}
                <button
                  onClick={() => handleClaimSpecificGame(selectedGameForDetails)}
                  disabled={selectedBreakdown.unclaimedEarnings <= 0 || !!claimingGameId}
                  className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    selectedBreakdown.unclaimedEarnings > 0
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:scale-102 active:scale-98 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Coins className="w-4 h-4 text-slate-950" />
                  <span>
                    {claimingGameId === selectedGameForDetails.id
                      ? 'جاري الاستلام...'
                      : selectedBreakdown.unclaimedEarnings > 0
                      ? `استلام الربح (+${selectedBreakdown.unclaimedEarnings}) 💰`
                      : 'تم استلام الربح ✅'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. DELETE CONFIRMATION MODAL */}
        {gameToDelete && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#160a0a] border-2 border-red-500 rounded-2xl p-5 text-right space-y-4 shadow-[0_0_40px_rgba(239,68,68,0.5)]">
              <div className="flex items-center gap-2.5 text-red-400 border-b border-red-500/30 pb-3">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 animate-bounce" />
                <h4 className="text-base font-black text-white">تأكيد حذف اللعبة نهائياً</h4>
              </div>

              <p className="text-xs text-red-200 leading-relaxed font-semibold">
                هل أنت متأكد من رغبتك في حذف لعبة «<strong>{gameToDelete.name}</strong>» نهائياً من مجتمع الألعاب ومن حسابك؟
                <br />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  ⚠️ لن يتمكن أي لاعب آخر من لعبها بعد الحذف.
                </span>
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setGameToDelete(null)}
                  disabled={isDeleting}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                >
                  إلغاء التراجع
                </button>

                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'جاري الحذف...' : 'نعم، احذف اللعبة'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: REAL CASH EARNINGS (أرباح مالية حقيقية) */}
        <RealCashEarningsModal
          isOpen={showRealCashModal}
          onClose={() => setShowRealCashModal(false)}
          gameName={sortedMyGames[0]?.name || 'shtime-2.'}
        />

      </div>
    </div>
  );
};
