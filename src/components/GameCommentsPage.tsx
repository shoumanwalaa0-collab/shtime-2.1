import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserGameState, UserCustomGame, GameComment, GameCommentReply } from '../types';
import { soundFx } from '../utils/soundEffects';
import {
  LogOut,
  Heart,
  Send,
  MoreVertical,
  CornerDownLeft,
  MessageSquare,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  Calendar,
  User,
  X,
  Coins,
  Trash2,
  Share2,
} from 'lucide-react';

import { DraggableTopHeader } from './DraggableTopHeader';

interface GameCommentsPageProps {
  game: UserCustomGame;
  onClose: () => void;
  gameState: UserGameState;
  onForceDeductLiras: (amount: number, reason: string) => void;
  onDeductJewels?: (amount: number) => boolean;
  onUpdateGameComments: (gameId: string, comments: GameComment[]) => void;
}

export const GameCommentsPage: React.FC<GameCommentsPageProps> = ({
  game,
  onClose,
  gameState,
  onForceDeductLiras,
  onDeductJewels,
  onUpdateGameComments,
}) => {
  const [comments, setComments] = useState<GameComment[]>(game.comments || []);
  const [inputText, setInputText] = useState('');
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('shtime2_comment_author') || 'لاعب ' + Math.floor(100 + Math.random() * 900);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Attached tip (Heart with dollar / Jewels)
  const [attachedTipLiras, setAttachedTipLiras] = useState<number>(0);
  const [attachedTipJewels, setAttachedTipJewels] = useState<number>(0);
  const [showHalfSheet, setShowHalfSheet] = useState(false);

  // Dedicated gift submission state inside half-sheet
  const [giftCommentText, setGiftCommentText] = useState('');
  const [selectedGiftLiras, setSelectedGiftLiras] = useState<number>(100);
  const [selectedGiftJewels, setSelectedGiftJewels] = useState<number>(0);
  const [isSubmittingGift, setIsSubmittingGift] = useState(false);

  // Active three-dots menu for a specific comment
  const [openMenuCommentId, setOpenMenuCommentId] = useState<string | null>(null);

  // Active replying state
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Liked comments stored locally to toggle likes
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('shtime2_liked_comments');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Track comments written by current user to allow permanent deletion
  const [myCommentIds, setMyCommentIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('shtime2_my_comment_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Highlighted comment when user clicks "يرد على هذا التعليق"
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  // Jump smoothly to parent comment when clicking the blue "يرد على هذا التعليق" button
  const handleJumpToComment = (targetId: string) => {
    soundFx.playClickSound();
    const elem = document.getElementById(`comment-${targetId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedCommentId(targetId);
      setTimeout(() => {
        setHighlightedCommentId(null);
      }, 3000);
    }
  };

  // Permanently delete a comment authored by this user
  const handleDeleteComment = async (commentId: string) => {
    soundFx.playWrongSound();
    // Optimistic delete
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    onUpdateGameComments(game.id, updated);
    setOpenMenuCommentId(null);
    setToastMsg('تم حذف تعليقك تلقائياً وبشكل نهائي! 🗑️');
    setTimeout(() => setToastMsg(null), 3000);

    setMyCommentIds((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });

    try {
      await fetch(`/api/custom-games/${game.id}/comments/${commentId}`, {
        method: 'DELETE',
      });
    } catch {
      // offline
    }
  };

  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Save liked comment IDs
  useEffect(() => {
    try {
      localStorage.setItem('shtime2_liked_comments', JSON.stringify(Array.from(likedCommentIds)));
    } catch {
      // ignore
    }
  }, [likedCommentIds]);

  // Save my comment IDs
  useEffect(() => {
    try {
      localStorage.setItem('shtime2_my_comment_ids', JSON.stringify(Array.from(myCommentIds)));
    } catch {
      // ignore
    }
  }, [myCommentIds]);

  // Fetch latest comments periodically or on mount
  const refreshComments = useCallback(async () => {
    try {
      const res = await fetch('/api/custom-games');
      const data = await res.json();
      const allGames: UserCustomGame[] = Array.isArray(data) ? data : data?.games || [];
      const currentGame = allGames.find((g) => g.id === game.id);
      if (currentGame && Array.isArray(currentGame.comments)) {
        setComments(currentGame.comments);
        onUpdateGameComments(game.id, currentGame.comments);
      }
    } catch {
      // offline fallback
    }
  }, [game.id, onUpdateGameComments]);

  useEffect(() => {
    refreshComments();
    const interval = setInterval(refreshComments, 8000);
    return () => clearInterval(interval);
  }, [refreshComments]);

  // Close three dots menu when clicking outside
  useEffect(() => {
    const handleWindowClick = () => setOpenMenuCommentId(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Share direct link to comments page
  const handleShareCommentsLink = async () => {
    soundFx.playCoinSound();
    const url = new URL(window.location.href);
    url.searchParams.set('commentsGameId', game.id);
    url.searchParams.set('view', 'comments');
    url.hash = `comments=${game.id}`;
    const shareUrl = url.toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `تعليقات لعبة ${game.name}`,
          text: `شاهد التعليقات وشارك برأيك في لعبة ${game.name}!`,
          url: shareUrl,
        });
        setToastMsg('تمت مشاركة رابط صفحة التعليقات بنجاح! 🚀');
        setTimeout(() => setToastMsg(null), 3000);
        return;
      } catch {
        // clipboard fallback
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setToastMsg('تم نسخ رابط صفحة التعليقات للحافظة! يمكنك إرساله لأي هاتف أو صديق 📋✨');
    } catch {
      setToastMsg(`رابط صفحة التعليقات: ${shareUrl}`);
    }
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Format date and time in Arabic
  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';
    const formattedHours = hours % 12 || 12;
    const timeStr = `${formattedHours}:${minutes} ${ampm}`;

    const day = date.getDate();
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const monthStr = months[date.getMonth()];
    const yearStr = date.getFullYear();
    const dateStr = `${day} ${monthStr} ${yearStr}`;

    return { timeStr, dateStr };
  };

  // Submit regular comment
  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    // Check if normal comments are restricted by game owner
    if (game.allowComments === false && attachedTipLiras <= 0 && attachedTipJewels <= 0) {
      soundFx.playWrongSound();
      setToastMsg('⚠️ صاحب اللعبة لم يُفعّل خدمة التعليقات! يمكنك التعليق فقط عند إرسال هدية (ليرات) 💖$');
      if (inputText.trim()) {
        setGiftCommentText(inputText.trim());
      }
      setShowHalfSheet(true);
      setTimeout(() => setToastMsg(null), 4500);
      return;
    }

    // Check if user attached tip liras
    if (attachedTipLiras > 0) {
      if ((gameState.liras || 0) < attachedTipLiras) {
        soundFx.playWrongSound();
        setToastMsg(`رصيدك (${gameState.liras || 0} ليرة) لا يكفي لإرسال ${attachedTipLiras} ليرة!`);
        setTimeout(() => setToastMsg(null), 4000);
        return;
      }
      onForceDeductLiras(attachedTipLiras, `ترقية تعليق في لعبة «${game.name}» بـ ${attachedTipLiras} ليرة 💖$`);
    }

    // Check if user attached tip jewels
    if (attachedTipJewels > 0) {
      if ((gameState.jewels || 0) < attachedTipJewels) {
        soundFx.playWrongSound();
        setToastMsg(`رصيدك (${gameState.jewels || 0} 💎) لا يكفي لإرسال ${attachedTipJewels} مجوهرات!`);
        setTimeout(() => setToastMsg(null), 4000);
        return;
      }
      if (onDeductJewels) {
        onDeductJewels(attachedTipJewels);
      }
    }

    setIsSubmitting(true);
    soundFx.playClickSound();

    try {
      const res = await fetch(`/api/custom-games/${game.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: authorName.trim() || 'لاعب',
          text: inputText.trim(),
          tipLiras: attachedTipLiras,
          tipJewels: attachedTipJewels,
        }),
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.comments)) {
        soundFx.playWinSound();
        setComments(data.comments);
        onUpdateGameComments(game.id, data.comments);
        if (data.comment && data.comment.id) {
          setMyCommentIds((prev) => new Set(prev).add(data.comment.id));
        }
        setInputText('');
        setAttachedTipLiras(0);
        setAttachedTipJewels(0);
        setToastMsg('تم إرسال ونشر تعليقك الحقيقي بنجاح! 💬✨');
        setTimeout(() => setToastMsg(null), 3000);
        localStorage.setItem('shtime2_comment_author', authorName.trim());
      }
    } catch {
      setToastMsg('حدث خطأ أثناء الإرسال، يرجى المحاولة ثانية');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Gift + Comment from Half-Sheet:
  // "وحين ارسل هديه الهديه هذه لا يمكنني ان ارسلها بدون ان اكتب تعليق اكتب التعليق وادرس ارسال ثم ترسل الهديه ويرسل معها التعليق"
  // "التعليق يذهب الى صفحه التعليقات والمبلغ يذهب الى قائمه ارباح الليره"
  const handleSendGiftComment = async () => {
    if (!giftCommentText.trim() || isSubmittingGift) {
      soundFx.playWrongSound();
      setToastMsg('⚠️ لا يمكنك إرسال الهدية بدون كتابة تعليق! اكتب التعليق أولاً ثم اضغط إرسال.');
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }

    if (selectedGiftJewels > 0) {
      if ((gameState.jewels || 0) < selectedGiftJewels) {
        soundFx.playWrongSound();
        setToastMsg(`رصيدك (${gameState.jewels || 0} 💎) لا يكفي لإرسال ${selectedGiftJewels} مجوهرات!`);
        setTimeout(() => setToastMsg(null), 4000);
        return;
      }
      if (onDeductJewels) {
        onDeductJewels(selectedGiftJewels);
      }
    } else {
      const lirasToSend = selectedGiftLiras > 0 ? selectedGiftLiras : 100;
      if ((gameState.liras || 0) < lirasToSend) {
        soundFx.playWrongSound();
        setToastMsg(`رصيدك (${gameState.liras || 0} ليرة) لا يكفي لإرسال ${lirasToSend} ليرة!`);
        setTimeout(() => setToastMsg(null), 4000);
        return;
      }
      onForceDeductLiras(
        lirasToSend,
        `إرسال هدية (${lirasToSend} ليرة) مع تعليق في لعبة «${game.name}» 💖$`
      );
    }

    setIsSubmittingGift(true);
    soundFx.playClickSound();

    try {
      const tipL = selectedGiftJewels > 0 ? 0 : (selectedGiftLiras > 0 ? selectedGiftLiras : 100);
      const tipJ = selectedGiftJewels > 0 ? selectedGiftJewels : 0;

      const res = await fetch(`/api/custom-games/${game.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: authorName.trim() || 'لاعب',
          text: giftCommentText.trim(),
          tipLiras: tipL,
          tipJewels: tipJ,
        }),
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.comments)) {
        soundFx.playWinSound();
        setComments(data.comments);
        onUpdateGameComments(game.id, data.comments);
        if (data.comment && data.comment.id) {
          setMyCommentIds((prev) => new Set(prev).add(data.comment.id));
        }
        setGiftCommentText('');
        setInputText('');
        setShowHalfSheet(false);
        setToastMsg(
          tipL > 0
            ? `تم إرسال الهدية (${tipL} ليرة) مع تعليقك بنجاح! ذهب المبلغ إلى أرباح اللعبة 💰👑`
            : `تم إرسال الهدية (${tipJ} مجوهرات) مع تعليقك بنجاح! 💎👑`
        );
        setTimeout(() => setToastMsg(null), 4000);
        localStorage.setItem('shtime2_comment_author', authorName.trim());
      }
    } catch {
      setToastMsg('حدث خطأ أثناء إرسال الهدية، يرجى المحاولة ثانية');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsSubmittingGift(false);
    }
  };

  // 1. Like comment action (from three-dots menu)
  const handleLikeComment = async (commentId: string) => {
    soundFx.playWinSound();
    const isLiked = likedCommentIds.has(commentId);
    const newSet = new Set(likedCommentIds);
    const delta = isLiked ? -1 : 1;

    if (isLiked) {
      newSet.delete(commentId);
      setToastMsg('تم إلغاء الإعجاب بالتعليق 🤍');
    } else {
      newSet.add(commentId);
      setToastMsg('أعجبك هذا التعليق ❤️');
    }
    setLikedCommentIds(newSet);
    setTimeout(() => setToastMsg(null), 2500);

    // Optimistic update
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: Math.max(0, (c.likes || 0) + delta) } : c))
    );

    try {
      const res = await fetch(`/api/custom-games/${game.id}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.comments)) {
        setComments(data.comments);
        onUpdateGameComments(game.id, data.comments);
      }
    } catch {
      // ignore
    }
  };

  // 2. Reply to comment action (from three-dots menu)
  const handleSendReply = async (commentId: string) => {
    if (!replyText.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);
    soundFx.playClickSound();

    try {
      const res = await fetch(`/api/custom-games/${game.id}/comments/${commentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: authorName.trim() || 'لاعب',
          text: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.comments)) {
        soundFx.playWinSound();
        setComments(data.comments);
        onUpdateGameComments(game.id, data.comments);
        setReplyText('');
        setReplyingCommentId(null);
        setToastMsg('تم إضافة ردك بنجاح! ↩️');
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch {
      setToastMsg('حدث خطأ أثناء إضافة الرد');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Select Tip in half-sheet (Liras)
  const handleSelectLiraAmount = (amount: number) => {
    soundFx.playCoinSound();
    setSelectedGiftLiras(amount);
    setSelectedGiftJewels(0);
    setAttachedTipLiras(amount);
    setAttachedTipJewels(0);
  };

  // Select Tip in half-sheet (Jewels)
  const handleSelectJewelAmount = (amount: number) => {
    soundFx.playCoinSound();
    setSelectedGiftJewels(amount);
    setSelectedGiftLiras(0);
    setAttachedTipJewels(amount);
    setAttachedTipLiras(0);
  };

  // =========================================================================
  // SORTING ALGORITHM STRICTLY MATCHING USER INSTRUCTIONS:
  // "اكثر واحد لديه قلوب لديه 2000 قلب يبين اول واحد"
  // "نحن نعرف ان الالفين هي التي تساوي 100 ليره (1 ليرة = 20 إعجاب / قلب)"
  // "شخص دفع 200 ليره وشخص لديه 2000 قلب -> ال 200 ليره اعلى من 2000 قلب (4000 > 2000)"
  // "اذا تساويا (2000 قلب مع 100 ليرة مثلاً): من كتب التعليق اولا هو الذي يكون اول"
  // =========================================================================
  const getCommentScore = (c: GameComment): number => {
    const likes = Number(c.likes) || 0;
    const liras = Number(c.tipLiras) || 0;
    const jewels = Number(c.tipJewels) || 0;
    return likes + (liras * 20) + (jewels * 1200);
  };

  const sortedComments = [...comments].sort((a, b) => {
    const scoreA = getCommentScore(a);
    const scoreB = getCommentScore(b);

    if (scoreB !== scoreA) {
      return scoreB - scoreA; // Highest score first
    }
    // Tie-breaker: Whichever was posted first (earliest createdAt timestamp) wins!
    const createdA = Number(a.createdAt) || 0;
    const createdB = Number(b.createdAt) || 0;
    if (createdA !== createdB) {
      return createdA - createdB;
    }
    return 0;
  });

  return (
    <div
      className="fixed inset-0 z-50 w-screen h-screen min-h-screen bg-gradient-to-b from-[#0e0a02] via-[#050401] to-slate-950 flex flex-col select-none overflow-hidden"
      dir="rtl"
    >
      {/* 1. TOP HEADER */}
      {/* "في الاعلى هناك الخط الابيض من فوقه اسم اللعبه حبه كافه الخروج" */}
      <div className="w-full bg-[#0a0702] px-4 sm:px-8 pt-4 pb-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.6)]">
            <MessageSquare className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-black text-white font-mono tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] block leading-tight">
              {game.name}
            </span>
            <span className="text-xs text-amber-300 font-bold">
              صفحة التعليقات 💬
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Share Comments Link to any phone */}
          <button
            type="button"
            onClick={handleShareCommentsLink}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs flex items-center gap-1.5 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer active:scale-95 transition-all"
            title="مشاركة رابط صفحة التعليقات لأي هاتف"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">رابط التعليقات</span>
          </button>

          {/* Liras Balance */}
          <div className="px-3 py-1.5 rounded-2xl bg-black/60 border border-amber-400/40 text-xs text-amber-300 font-mono font-black flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-yellow-400 fill-current" />
            <span>{gameState.liras} ليرة</span>
          </div>

          {/* Exit button back to Games Page ("حبه كافه الخروج") */}
          <button
            onClick={() => {
              soundFx.playClickSound();
              onClose();
            }}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-600 hover:to-rose-700 text-white font-black text-xs sm:text-sm border border-red-500/80 shadow-[0_0_15px_rgba(225,29,72,0.4)] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            title="الخروج من صفحة التعليقات"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* الخط الأبيض في الأعلى: من فوقه اسم اللعبة وحبه كبسة الخروج */}
      <div className="w-full px-4 sm:px-8 my-2 sm:my-3 shrink-0">
        <div className="w-full h-1.5 sm:h-2 bg-white rounded-full shadow-[0_0_25px_rgba(255,255,255,1)]" />
      </div>

      {/* Toast message banner */}
      {toastMsg && (
        <div className="w-full bg-emerald-950/95 border-b border-emerald-400 py-2 px-4 text-center text-emerald-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-fade-in shrink-0">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. COMMENTS FEED (SCROLLABLE AREA) */}
      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {sortedComments.length === 0 ? (
            <div className="py-24 text-center space-y-3 bg-black/40 rounded-3xl border-2 border-dashed border-amber-500/30 p-8 max-w-lg mx-auto">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white">لا توجد تعليقات حتى الآن</h3>
              <p className="text-xs text-amber-200/70 leading-relaxed font-medium">
                جميع التعليقات حقيقية ومحفوظة بين جميع الهواتف. كن أول من يكتب تعليقاً حقيقياً في الأسفل!
              </p>
            </div>
          ) : (
            sortedComments.map((comment, index) => {
              const { timeStr, dateStr } = formatDateTime(comment.createdAt);
              const isLiked = likedCommentIds.has(comment.id);
              const isMyComment =
                myCommentIds.has(comment.id) ||
                (comment.author && comment.author.trim().toLowerCase() === authorName.trim().toLowerCase());
              const tipLiras = Number(comment.tipLiras) || 0;
              const tipJewels = Number(comment.tipJewels) || 0;
              const hasTip = tipLiras > 0 || tipJewels > 0;
              const isRankOne = index === 0 && (Number(comment.likes) > 0 || hasTip);
              const isMenuOpen = openMenuCommentId === comment.id;
              const isReplying = replyingCommentId === comment.id;
              const isHighlighted = highlightedCommentId === comment.id;

              return (
                <div
                  key={comment.id}
                  id={`comment-${comment.id}`}
                  className={`w-full rounded-3xl p-4 sm:p-5 bg-gradient-to-b ${
                    tipJewels > 0
                      ? 'from-sky-950/80 via-[#062033] to-slate-950 border-2 border-sky-400/80 shadow-[0_0_25px_rgba(56,189,248,0.4)]'
                      : tipLiras > 0
                      ? 'from-amber-950/70 via-[#1a1405] to-slate-950 border-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                      : isRankOne
                      ? 'from-amber-950/80 via-[#181103] to-slate-950 border-2 border-yellow-300 shadow-[0_0_25px_rgba(234,179,8,0.5)]'
                      : 'from-[#1a1405] via-[#100d02] to-slate-950 border border-amber-500/30'
                  } ${
                    isHighlighted
                      ? 'ring-4 ring-blue-500 shadow-[0_0_35px_rgba(59,130,246,0.95)] scale-[1.01]'
                      : ''
                  } transition-all duration-300 space-y-3 relative`}
                >
                  {/* 1. في الأعلى: الكاتب + الرتبة + بيان المبلغ المدفوع بوضوح (ويبين اني دفعت 100 ليره) */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-amber-500/20">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-sm sm:text-base font-black text-white">{comment.author}</span>

                      {/* Rank badge */}
                      <span className="px-2 py-0.5 rounded-full bg-black/60 border border-amber-400/40 text-[10px] font-mono text-amber-300 font-bold">
                        #{index + 1}
                      </span>

                      {/* Top Rank Badge */}
                      {isRankOne && (
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black shadow flex items-center gap-1">
                          <span>👑 التعليق الأول في الصدارة</span>
                        </span>
                      )}
                    </div>

                    {/* بيان المبلغ المدفوع: "ويبين اني دفعت 100 ليره" */}
                    {tipLiras > 0 && (
                      <div className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 text-xs sm:text-sm font-black shadow-[0_0_18px_rgba(245,158,11,0.9)] flex items-center gap-1.5 animate-pulse">
                        <span>🎁 دفع {tipLiras} ليرة</span>
                        <span className="text-[10px] font-mono text-slate-900 font-bold hidden sm:inline">
                          ({tipLiras * 20} إعجاب مكافئ)
                        </span>
                      </div>
                    )}
                    {tipJewels > 0 && tipLiras <= 0 && (
                      <div className="px-3.5 py-1 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-400 text-slate-950 text-xs sm:text-sm font-black shadow-[0_0_18px_rgba(56,189,248,0.9)] flex items-center gap-1.5 animate-pulse">
                        <span>💎 دفع {tipJewels} {tipJewels === 1 ? 'مجوهرة' : 'مجوهرات'}</span>
                      </div>
                    )}
                  </div>

                  {/* 2. وتحتها يكون تعليقه */}
                  <div className="py-2">
                    <p className="text-sm sm:text-base text-white leading-relaxed font-medium break-words px-1">
                      {comment.text}
                    </p>
                  </div>

                  {/* 3. وتحت يكون الوقت الارسال وحدها يكون ثلاث نقاط كبسه الثلاث نقاط */}
                  {/* "يبين تعليقه بشكل عادي وتحتها الساعه وحدها وثلاث نقاط كم سنه الثلاث نقاط" */}
                  <div className="flex items-center justify-between text-xs text-amber-200/80 pt-2 border-t border-amber-500/20 font-mono">
                    {/* وقت الإرسال: الساعة */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-amber-400/30 shadow">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-200 text-xs font-bold">الساعة: {timeStr}</span>
                      </div>
                      <span className="text-amber-500/40 hidden sm:inline">|</span>
                      <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-300/70">
                        <Calendar className="w-3 h-3 text-amber-400/70" />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    {/* وحدها يكون ثلاث نقاط كبسه الثلاث نقاط + الإعجابات */}
                    <div className="flex items-center gap-2">
                      {/* عدد الإعجابات */}
                      <button
                        type="button"
                        onClick={() => handleLikeComment(comment.id)}
                        className="flex items-center gap-1 text-amber-300 hover:text-red-400 font-bold font-mono text-xs px-2 py-1 rounded-lg bg-black/40 border border-amber-500/20 cursor-pointer active:scale-95 transition-all"
                        title="إعجاب بالتعليق"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            (Number(comment.likes) || 0) > 0 || isLiked ? 'text-red-500 fill-red-500' : 'text-white'
                          }`}
                        />
                        <span>{comment.likes || 0}</span>
                      </button>

                      {/* كبسة الثلاث نقاط */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFx.playClickSound();
                            setOpenMenuCommentId(isMenuOpen ? null : comment.id);
                          }}
                          className="p-1.5 px-2 rounded-xl bg-black/70 hover:bg-black text-amber-300 hover:text-white border border-amber-500/40 cursor-pointer active:scale-95 transition-all shadow flex items-center"
                          title="خيارات التعليق (ثلاث نقاط)"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* The Popup Menu */}
                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-0 bottom-9 w-44 bg-[#0d0902] border-2 border-amber-400 rounded-2xl p-1.5 shadow-[0_0_25px_rgba(245,158,11,0.6)] z-20 space-y-1 animate-fade-in text-right"
                          >
                            {isMyComment ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between hover:bg-red-950/80 text-red-300 border border-red-500/30 transition-all cursor-pointer"
                                >
                                  <span>حذف التعليق</span>
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundFx.playClickSound();
                                    setReplyingCommentId(comment.id);
                                    setOpenMenuCommentId(null);
                                    setReplyText('');
                                  }}
                                  className="w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between hover:bg-amber-500/20 text-white transition-all cursor-pointer"
                                >
                                  <span>رد ↩️</span>
                                  <CornerDownLeft className="w-3.5 h-3.5 text-cyan-300" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleLikeComment(comment.id);
                                    setOpenMenuCommentId(null);
                                  }}
                                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                    isLiked
                                      ? 'bg-red-950/80 text-red-400'
                                      : 'hover:bg-amber-500/20 text-white'
                                  }`}
                                >
                                  <span>{isLiked ? 'إلغاء الإعجاب' : 'أعجبني ❤️'}</span>
                                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundFx.playClickSound();
                                    setReplyingCommentId(comment.id);
                                    setOpenMenuCommentId(null);
                                    setReplyText('');
                                  }}
                                  className="w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between hover:bg-amber-500/20 text-white transition-all cursor-pointer"
                                >
                                  <span>الرد ↩️</span>
                                  <CornerDownLeft className="w-3.5 h-3.5 text-cyan-300" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nested Replies Section with Blue Jump Button */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2 pr-4 border-r-2 border-r-cyan-400/50">
                      <span className="text-[11px] text-cyan-300 font-bold block mb-1">
                        الردود ({comment.replies.length}):
                      </span>
                      {comment.replies.map((reply: GameCommentReply) => {
                        const replyTime = formatDateTime(reply.createdAt);
                        return (
                          <div
                            key={reply.id}
                            className="p-3 rounded-2xl bg-black/60 border border-cyan-500/30 text-right space-y-2"
                          >
                            {/* Blue button: "يرد على هذا التعليق" */}
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleJumpToComment(comment.id)}
                                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(37,99,235,0.7)] cursor-pointer active:scale-95 transition-all"
                                title="الانتقال إلى التعليق الأصلي الذي يتم الرد عليه"
                              >
                                <span>يرد على هذا التعليق</span>
                                <CornerDownLeft className="w-3 h-3 text-white" />
                              </button>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-cyan-300 text-xs">{reply.author}</span>
                                <span className="text-cyan-200/50 font-mono text-[10px]">
                                  {replyTime.timeStr}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-white leading-relaxed break-words px-1">{reply.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Active Reply Input Box */}
                  {isReplying && (
                    <div className="mt-3 p-3 rounded-2xl bg-black/80 border-2 border-cyan-400 space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-xs text-cyan-300 font-bold">
                        <span>الرد على تعليق {comment.author}:</span>
                        <button
                          type="button"
                          onClick={() => setReplyingCommentId(null)}
                          className="text-red-400 hover:text-white"
                        >
                          إلغاء
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="اكتب ردك هنا..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 bg-black/80 border border-cyan-400/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-cyan-200/40 outline-none focus:border-cyan-300"
                        />
                        <button
                          type="button"
                          disabled={!replyText.trim() || isSubmittingReply}
                          onClick={() => handleSendReply(comment.id)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                        >
                          <Send className="w-3 h-3" />
                          <span>رد</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* 3. BOTTOM INPUT BAR */}
      {/* "داخل التعليقات في الاسفل هناك مكان بحجم الخط الابيض ليس الخط بل فوق الخط الابيض */}
      {/* لكن موجود به مكان كتابه طوله ليس طويل حتى القلب عليه شعار دولار في الظهر الاخرى كبست ارسال */}
      {/* كبسه ارسال لا يمكن ارسال بدون كتابه شيء" */}
      <div className="w-full bg-[#0a0702] px-3 sm:px-6 py-2.5 shrink-0 z-10 border-t border-amber-500/20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-2">
          {/* Author Name Tag / Input */}
          <div className="flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-xl border border-amber-500/30 text-xs shrink-0">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <input
              type="text"
              placeholder="اسمك"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-20 sm:w-24 bg-transparent text-amber-200 text-xs font-bold outline-none"
              title="اسمك الظاهر في التعليقات"
            />
          </div>

          {/* Attached Tip indicator (if selected) */}
          {attachedTipJewels > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-950 border border-sky-400 text-sky-200 text-xs font-bold shrink-0 animate-pulse shadow-[0_0_12px_rgba(56,189,248,0.5)]">
              <span>💎💖 +{attachedTipJewels} {attachedTipJewels === 1 ? 'مجوهرة' : 'مجوهرات'}</span>
              <button
                type="button"
                onClick={() => setAttachedTipJewels(0)}
                className="text-white hover:text-red-300 mr-1 text-[10px] cursor-pointer"
                title="إلغاء الترقية"
              >
                ✕
              </button>
            </div>
          )}

          {attachedTipLiras > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950 border border-amber-400 text-amber-200 text-xs font-bold shrink-0 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              <span>💖$ +{attachedTipLiras} ليرة</span>
              <button
                type="button"
                onClick={() => setAttachedTipLiras(0)}
                className="text-white hover:text-red-300 mr-1 text-[10px] cursor-pointer"
                title="إلغاء الترقية"
              >
                ✕
              </button>
            </div>
          )}

          {/* Notification banner when normal comments are disabled */}
          {game.allowComments === false && (
            <div className="w-full px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-400/60 text-amber-200 text-[11px] font-bold flex items-center justify-between gap-2 shadow animate-pulse">
              <span className="flex items-center gap-1.5">
                <span>🔒</span>
                <span>التعليقات العادية مغلقة! يُسمح فقط بإرسال تعليقات الهدايا 🎁</span>
              </span>
              <button
                type="button"
                onClick={() => setShowHalfSheet(true)}
                className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black hover:bg-amber-400 cursor-pointer shrink-0"
              >
                إرفاق هدية 💖$
              </button>
            </div>
          )}

          {/* Main Input Row: Heart with Dollar + Text Input + Send Button */}
          <div className="flex items-center gap-2 flex-1 w-full">
            {/* 
              القلب الذي عليه شعار دولار (ترقية التعليق):
              "حتى القلب عليه شعار دولار في الظهر الاخرى كبست ارسال"
              "القلب الذي فيه شعار رونالدو يكبس عليه تفتح نصف صفحه لكنها تفتح من النصف الى الاسفل هو في عليها شعار اكس"
            */}
            {/* مكان تعليقات الهدايا: زر هدايا التعليقات والترقية (القلب عليه شعار دولار) */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClickSound();
                setShowHalfSheet(true);
              }}
              className={`px-3 py-2.5 rounded-2xl border-2 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0 ${
                attachedTipJewels > 0
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-400 border-white text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.9)] animate-pulse'
                  : attachedTipLiras > 0
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 border-white text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.9)] animate-pulse'
                  : 'bg-black/80 hover:bg-rose-950 border-rose-500/60 text-rose-400 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
              }`}
              title="مكان تعليقات الهدايا والترقية (نصف صفحة من الأسفل)"
            >
              <Heart className="w-5 h-5 fill-current" />
              <span className="font-black text-xs font-mono">$</span>
              <span className="text-[11px] font-black hidden sm:inline">هدايا 🎁</span>
            </button>

            {/* Comment Text Input - التعليقات العادية */}
            <input
              type="text"
              placeholder={
                game.allowComments === false
                  ? '🔒 التعليقات المجانية مغلقة - اضغط على زر الهدايا 💖$ للتعليق بإرفاق هدية'
                  : 'اكتب تعليقك الحقيقي هنا...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => {
                if (game.allowComments === false) {
                  if (inputText.trim() && !giftCommentText.trim()) {
                    setGiftCommentText(inputText.trim());
                  }
                  setShowHalfSheet(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (game.allowComments === false) {
                    if (inputText.trim() && !giftCommentText.trim()) {
                      setGiftCommentText(inputText.trim());
                    }
                    setShowHalfSheet(true);
                  } else {
                    handleSubmitComment();
                  }
                }
              }}
              className="flex-1 bg-black/90 border-2 border-amber-400/50 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-amber-200/40 outline-none shadow-inner"
            />

            {/* 
              كبسة إرسال:
              "كبسه ارسال لا يمكن ارسال بدون كتابه شيء"
            */}
            <button
              type="button"
              disabled={!inputText.trim() || isSubmitting}
              onClick={() => {
                if (game.allowComments === false) {
                  if (inputText.trim() && !giftCommentText.trim()) {
                    setGiftCommentText(inputText.trim());
                  }
                  setShowHalfSheet(true);
                } else {
                  handleSubmitComment();
                }
              }}
              className="px-4 sm:px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm border-2 border-yellow-200 shadow-[0_0_20px_rgba(234,179,8,0.7)] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0"
              title={!inputText.trim() ? 'اكتب شيئاً أولاً لتتمكن من الإرسال' : 'إرسال التعليق'}
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>إرسال</span>
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM MANDATORY WHITE LINE */}
      <div className="w-full h-[2px] bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] shrink-0" />

      {/* فراغ 3-4 سنتي (3-4 cm space) */}
      <div
        style={{ height: '3.5cm', minHeight: '3.5cm' }}
        className="w-full shrink-0 bg-[#050301]/95 border-t border-amber-500/10 pointer-events-none select-none"
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* BOTTOM HALF-SHEET (نصف صفحة تفتح من النصف إلى الأسفل مع شعار إكس)       */}
      {/* 10 خيارات ليرات بأصفر متصاعد + 5 خيارات مجوهرات بأزرق فاتح وساطع وجذاب   */}
      {/* ========================================================================= */}
      {showHalfSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-fade-in select-none"
          onClick={() => setShowHalfSheet(false)}
          dir="rtl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl mx-auto h-[66vh] max-h-[640px] bg-gradient-to-b from-[#191102] via-[#0d0901] to-[#040300] border-t-2 border-x-2 border-amber-400 rounded-t-[32px] shadow-[0_-15px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-slide-up"
          >
            {/* Top Drag Indicator bar */}
            <div className="w-12 h-1.5 bg-amber-400/40 rounded-full mx-auto mt-2.5 mb-1" />

            {/* Header: Title + Balances + X button */}
            <div className="px-5 py-3 border-b border-amber-500/20 flex items-center justify-between shrink-0 bg-black/40">
              {/* Close Button X (شعار إكس) */}
              <button
                type="button"
                onClick={() => setShowHalfSheet(false)}
                className="p-2 text-amber-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 rounded-full border border-amber-500/40 cursor-pointer transition-all active:scale-95 shadow"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Heart className="w-5 h-5 text-rose-400 fill-current animate-pulse" />
                  <h3 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100">
                    قائمة ترقية التعليقات والهدايا
                  </h3>
                </div>
                <p className="text-[11px] text-amber-200/80 font-medium">
                  اختر ما تريد إرساله مع تعليقك لدعمه وتصدره بالصدارة 👑
                </p>
              </div>

              {/* User Balances */}
              <div className="flex flex-col items-end gap-1 text-[11px] font-mono font-bold">
                <span className="text-yellow-300 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-lg border border-yellow-500/30">
                  <Coins className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                  <span>{gameState.liras} ليرة</span>
                </span>
                <span className="text-sky-300 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-lg border border-sky-500/30">
                  <span>💎 {gameState.jewels || 0}</span>
                </span>
              </div>
            </div>

            {/* Scrollable Content: 10 Liras tiers + 5 Jewels tiers + Dedicated Comment & Send section */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* التنبيه في حال كانت التعليقات مقفلة من صاحب اللعبة */}
              {game.allowComments === false && (
                <div className="p-3 rounded-2xl bg-amber-950/80 border-2 border-amber-400/80 text-amber-200 text-xs sm:text-sm font-black flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse">
                  <span className="text-xl">⚠️</span>
                  <span>
                    صاحب اللعبة لم يُفعّل خدمة التعليقات المجانية! يمكنك إرسال تعليقك فقط عند إرسال هدية (ليرات) 💖$
                  </span>
                </div>
              )}

              {/* 1. قسم الليرات (10 خيارات متدرجة في قوة اللون الأصفر حتى الذهبي المتوهج) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
                    <h4 className="text-sm font-black text-yellow-300">
                      خيارات إرسال الليرات (من 100 إلى 1000 ليرة)
                    </h4>
                  </div>
                  <span className="text-[10px] text-amber-200/70">
                    اللون الأصفر يقوى ويقوى مع كل زيادة ليرات
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { amount: 100, likes: '2,000', bg: 'from-[#241e03] via-[#171302] to-[#0a0801] border-yellow-500/30 text-yellow-200/90' },
                    { amount: 200, likes: '4,000', bg: 'from-[#332703] via-[#1f1702] to-[#0c0901] border-yellow-500/50 text-yellow-200' },
                    { amount: 300, likes: '6,000', bg: 'from-[#423303] via-[#291f02] to-[#100c01] border-yellow-400/60 text-yellow-200' },
                    { amount: 400, likes: '8,000', bg: 'from-[#543f04] via-[#352802] to-[#140f01] border-yellow-400/75 text-yellow-200' },
                    { amount: 500, likes: '10,000 👑', bg: 'from-[#694f05] via-[#433203] to-[#1a1301] border-yellow-400/80 text-yellow-100' },
                    { amount: 600, likes: '12,000', bg: 'from-[#7e5e06] via-[#523d03] to-[#201801] border-yellow-300 text-yellow-100' },
                    { amount: 700, likes: '14,000', bg: 'from-[#967007] via-[#634903] to-[#261c02] border-yellow-300 text-yellow-100' },
                    { amount: 800, likes: '16,000', bg: 'from-[#b38508] via-[#785904] to-[#2d2202] border-yellow-200 text-slate-950' },
                    { amount: 900, likes: '18,000', bg: 'from-[#d49e09] via-[#916b04] to-[#362802] border-yellow-100 text-slate-950' },
                    { amount: 1000, likes: '20,000 👑', bg: 'from-[#facc15] via-[#fbbf24] to-[#f59e0b] border-white text-slate-950', isMax: true },
                  ].map((tier) => {
                    const isSelected = selectedGiftLiras === tier.amount && selectedGiftJewels === 0;
                    return (
                      <button
                        key={tier.amount}
                        type="button"
                        onClick={() => handleSelectLiraAmount(tier.amount)}
                        className={`p-3 rounded-2xl bg-gradient-to-br ${tier.bg} transition-all cursor-pointer active:scale-95 text-center space-y-1 relative border-2 ${
                          isSelected
                            ? 'border-white ring-4 ring-yellow-400 shadow-[0_0_25px_rgba(250,204,21,1)] scale-[1.03]'
                            : 'hover:border-yellow-300 hover:scale-[1.01]'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-1 left-1.5 px-1.5 py-0.2 bg-white text-slate-950 text-[9px] font-black rounded-full shadow">
                            ✓ محدد
                          </span>
                        )}
                        <div className={`text-xs sm:text-sm font-black ${tier.amount >= 800 ? 'text-slate-950' : 'text-yellow-300'}`}>
                          إرسال {tier.amount} ليرة {tier.isMax && '🌟'}
                        </div>
                        <div className={`text-[10px] font-mono font-bold ${tier.amount >= 800 ? 'text-slate-900' : 'text-yellow-400/80'}`}>
                          = {tier.likes} إعجاب
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. قسم المجوهرات (5 خيارات: أزرق فاتح جداً وكبير وساطع وجذاب) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-sky-500/30 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
                    <h4 className="text-sm font-black text-sky-300">
                      خيارات إرسال المجوهرات (أزرق فاتح وكبير وساطع وجذاب)
                    </h4>
                  </div>
                  <span className="text-[10px] text-sky-200/70">
                    أعلى فئات الترقية الملكية في التطبيق 💎
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {[
                    { amount: 1, label: 'مجوهرة واحدة', gems: '💎', points: '+3,000 نقطة صدارة', bg: 'from-[#082f49] via-[#0c4a6e] to-[#082f49] text-sky-100' },
                    { amount: 2, label: 'مجوهرتين', gems: '💎💎', points: '+6,000 نقطة صدارة', bg: 'from-[#0369a1] via-[#0284c7] to-[#0369a1] text-white' },
                    { amount: 3, label: '3 مجوهرات', gems: '💎💎💎', points: '+9,000 نقطة صدارة', bg: 'from-[#0284c7] via-[#38bdf8] to-[#0284c7] text-slate-950' },
                    { amount: 4, label: '4 مجوهرات', gems: '💎💎💎💎', points: '+12,000 نقطة صدارة', bg: 'from-[#06b6d4] via-[#67e8f9] to-[#0284c7] text-slate-950' },
                    { amount: 5, label: '5 مجوهرات 👑', gems: '💎💎💎💎💎', points: '+15,000 صدارة مطلقة!', bg: 'from-[#38bdf8] via-[#e0f2fe] to-[#38bdf8] text-slate-950' },
                  ].map((j) => {
                    const isSelected = selectedGiftJewels === j.amount;
                    return (
                      <button
                        key={j.amount}
                        type="button"
                        onClick={() => handleSelectJewelAmount(j.amount)}
                        className={`p-4 rounded-3xl bg-gradient-to-br ${j.bg} transition-all cursor-pointer active:scale-95 text-center space-y-1.5 relative border-2 ${
                          isSelected
                            ? 'border-white ring-4 ring-cyan-400 shadow-[0_0_30px_rgba(56,189,248,1)] scale-[1.03]'
                            : 'border-sky-400 hover:border-cyan-200 hover:scale-[1.01]'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 left-2 px-1.5 py-0.2 bg-white text-slate-950 text-[9px] font-black rounded-full shadow">
                            ✓ محدد
                          </span>
                        )}
                        <div className="text-2xl">{j.gems}</div>
                        <div className="text-xs sm:text-sm font-black">
                          إرسال {j.label}
                        </div>
                        <div className="text-[11px] font-mono font-bold opacity-90">{j.points}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. كتابة التعليق مع الهدية وإرسالهما معاً: */}
              {/* "وحين ارسل هديه الهديه هذه لا يمكنني ان ارسلها بدون ان اكتب تعليق اكتب التعليق وادرس ارسال ثم ترسل الهديه ويرسل معها التعليق" */}
              {/* "التعليق يذهب الى صفحه التعليقات والمبلغ يذهب الى قائمه ارباح الليره" */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#140e02] border-2 border-amber-400/70 shadow-[0_0_30px_rgba(245,158,11,0.3)] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-400" />
                    <span className="text-xs sm:text-sm font-black text-white">
                      اكتب تعليقك المرافق للهدية ({selectedGiftJewels > 0 ? `${selectedGiftJewels} مجوهرات` : `${selectedGiftLiras} ليرة`}):
                    </span>
                  </div>
                  <span className="text-[11px] text-rose-400 font-black">
                    * شرط إلزامي: لا يمكن إرسال الهدية بدون كتابة تعليق
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-1/3">
                    <label className="text-[10px] text-amber-200/70 font-bold block mb-1">اسم الكاتب:</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="اسمك"
                      className="w-full bg-black/80 border border-amber-500/50 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder:text-amber-200/30 outline-none"
                    />
                  </div>
                  <div className="w-full sm:w-2/3">
                    <label className="text-[10px] text-amber-200/70 font-bold block mb-1">نص التعليق (مطلوب):</label>
                    <textarea
                      rows={2}
                      value={giftCommentText}
                      onChange={(e) => setGiftCommentText(e.target.value)}
                      placeholder="اكتب تعليقك هنا ليظهر في الصدارة 👑 مع شارة الهدية..."
                      className="w-full bg-black/80 border border-amber-500/50 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder:text-amber-200/30 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* زر الإرسال مع تنبيه عدم إمكانية الإرسال بدون تعليق */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-amber-500/20">
                  <div className="text-[11px] text-amber-200/80 font-mono">
                    المبلغ يذهب مباشرة إلى أرباح اللعبة 💰 والتعليق يتصدر القائمة 👑
                  </div>

                  <button
                    type="button"
                    disabled={!giftCommentText.trim() || isSubmittingGift}
                    onClick={handleSendGiftComment}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-yellow-300 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm border-2 border-white shadow-[0_0_25px_rgba(234,179,8,0.8)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all shrink-0"
                    title={!giftCommentText.trim() ? 'اكتب تعليقك أولاً لتتمكن من إرسال الهدية' : 'إرسال الهدية مع التعليق'}
                  >
                    <Send className="w-4 h-4 text-slate-950" />
                    <span>
                      {isSubmittingGift
                        ? 'جارٍ الإرسال والنشر...'
                        : `إرسال الهدية (${selectedGiftJewels > 0 ? `${selectedGiftJewels} مجوهرات` : `${selectedGiftLiras} ليرة`}) مع التعليق`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
