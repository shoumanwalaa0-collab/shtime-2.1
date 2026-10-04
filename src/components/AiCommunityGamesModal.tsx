import React, { useEffect, useState, useRef, useCallback } from 'react';
import { UserGameState, UserCustomGame, GameComment } from '../types';
import { soundFx } from '../utils/soundEffects';
import { GameCommentsPage } from './GameCommentsPage';
import { RealCashEarningsModal } from './RealCashEarningsModal';
import { LirasEarningsModal } from './LirasEarningsModal';
import { DraggableTopHeader } from './DraggableTopHeader';
import {
  X,
  Sparkles,
  Gamepad2,
  AlertCircle,
  LogOut,
  PlusCircle,
  ShieldCheck,
  Heart,
  Share2,
  Check,
  MessageCircle,
  Copy,
  Coins,
  DollarSign,
  Award,
  Send,
  User,
} from 'lucide-react';

interface AiCommunityGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  onForceDeductLiras: (amount: number, reason: string) => void;
  onAddLiras?: (amount: number, reason?: string) => void;
  initialDeepLinkGameId?: string | null;
  onOpenStudio: () => void;
  onOpenJewelsUpgrade: () => void;
  onDeductJewels?: (amount: number) => boolean;
  onDeleteCustomGame?: (gameId: string) => void;
}

export const AiCommunityGamesModal: React.FC<AiCommunityGamesModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onForceDeductLiras,
  onAddLiras,
  initialDeepLinkGameId,
  onOpenJewelsUpgrade,
  onDeductJewels,
  onDeleteCustomGame,
}) => {
  const [liveGames, setLiveGames] = useState<UserCustomGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Liked games tracking persisted in localStorage for real user tracking
  const [likedGameIds, setLikedGameIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('shtime2_liked_custom_games');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // In-app game playing state
  const [activePlayingGame, setActivePlayingGame] = useState<UserCustomGame | null>(null);

  // Confirmation modal when user presses back button
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Insufficient liras warning banner
  const [insufficientError, setInsufficientError] = useState<string | null>(null);

  // Modals for the 3 buttons and the Earnings button
  const [activeShareGame, setActiveShareGame] = useState<UserCustomGame | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const [activeCommentsGame, setActiveCommentsGame] = useState<UserCustomGame | null>(null);

  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showRealCashModal, setShowRealCashModal] = useState(false);
  const [claimingEarnings, setClaimingEarnings] = useState(false);

  // Tap timers for double tap gesture on touch devices
  const lastLineTapRef = useRef<number>(0);
  const lastLogoTapRef = useRef<number>(0);

  // Persist liked game IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shtime2_liked_custom_games', JSON.stringify(Array.from(likedGameIds)));
    } catch {
      // ignore
    }
  }, [likedGameIds]);

  // 1. Fetch real games from server + local storage (ABSOLUTELY NO FAKE DATA)
  const fetchGames = useCallback(() => {
    setLoading(true);
    fetch('/api/custom-games')
      .then((res) => res.json())
      .then((data) => {
        const serverGames: UserCustomGame[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.games)
          ? data.games
          : [];
        const localGames = gameState.customGames || [];
        const combinedMap = new Map<string, UserCustomGame>();

        localGames.forEach((g) => {
          if (g && g.name) combinedMap.set(g.id || g.name.toLowerCase().trim(), g);
        });
        serverGames.forEach((g) => {
          if (g && g.name) combinedMap.set(g.id || g.name.toLowerCase().trim(), g);
        });

        const sortedGames = Array.from(combinedMap.values()).sort((a, b) => {
          const likesA = Number(a.likes) || 0;
          const likesB = Number(b.likes) || 0;
          if (likesB !== likesA) return likesB - likesA;
          const createdA = Number(a.createdAt) || 0;
          const createdB = Number(b.createdAt) || 0;
          if (createdA !== createdB) return createdA - createdB;
          return 0;
        });

        setLiveGames(sortedGames);
      })
      .catch(() => {
        const sortedLocal = [...(gameState.customGames || [])].sort((a, b) => {
          const likesA = Number(a.likes) || 0;
          const likesB = Number(b.likes) || 0;
          if (likesB !== likesA) return likesB - likesA;
          const createdA = Number(a.createdAt) || 0;
          const createdB = Number(b.createdAt) || 0;
          if (createdA !== createdB) return createdA - createdB;
          return 0;
        });
        setLiveGames(sortedLocal);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [gameState.customGames]);

  useEffect(() => {
    if (isOpen) {
      fetchGames();
    }
  }, [isOpen, fetchGames]);

  // Auto-launch deep-linked game if provided (supports direct comments view or game play)
  useEffect(() => {
    if (isOpen && initialDeepLinkGameId && liveGames.length > 0) {
      const targetGame = liveGames.find(
        (g) => String(g.id) === String(initialDeepLinkGameId) || g.name.toLowerCase().trim() === initialDeepLinkGameId.toLowerCase().trim()
      );
      if (targetGame) {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const isComments =
            urlParams.get('view') === 'comments' ||
            Boolean(urlParams.get('commentsGameId')) ||
            Boolean(urlParams.get('comments')) ||
            window.location.hash.startsWith('#comments=');
          if (isComments && !activeCommentsGame) {
            setActiveCommentsGame(targetGame);
          } else if (!isComments && !activePlayingGame) {
            handleCardClick(targetGame);
          }
        } catch {
          if (!activePlayingGame) {
            handleCardClick(targetGame);
          }
        }
      }
    }
  }, [isOpen, initialDeepLinkGameId, liveGames, activeCommentsGame, activePlayingGame]);

  // Handle hardware / browser back button to prevent accidental exit from game
  useEffect(() => {
    if (!activePlayingGame) return;

    window.history.pushState({ playingCustomGame: true }, '');

    const handlePopState = () => {
      soundFx.playWrongSound();
      setShowExitConfirmModal(true);
      window.history.pushState({ playingCustomGame: true }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activePlayingGame]);

  // Exit from inside the game back to Community Games page
  const handleExitGameBackToCommunity = useCallback(() => {
    soundFx.playClickSound();
    setShowExitConfirmModal(false);
    setActivePlayingGame(null);
  }, []);

  // Double tap on the White Line
  const handleWhiteLineClickOrTap = () => {
    const now = Date.now();
    if (now - lastLineTapRef.current < 350) {
      soundFx.playClickSound();
      handleExitGameBackToCommunity();
    }
    lastLineTapRef.current = now;
  };

  // Double tap on the shtime-2. logo
  const handleLogoClickOrTap = () => {
    const now = Date.now();
    if (now - lastLogoTapRef.current < 350) {
      soundFx.playClickSound();
      handleExitGameBackToCommunity();
    }
    lastLogoTapRef.current = now;
  };

  // User clicks on a game card to play
  const handleCardClick = (game: UserCustomGame) => {
    const taxAmount = Number(game.tax) || 20;

    if ((gameState.liras || 0) < taxAmount) {
      soundFx.playWrongSound();
      setInsufficientError(
        `لا يمكنك الدخول! رصيدك (${gameState.liras || 0} ليرة) أقل من المبلغ المطلوب للدخول (${taxAmount} ليرة).`
      );
      setTimeout(() => setInsufficientError(null), 5000);
      return;
    }

    soundFx.playWinSound();
    onForceDeductLiras(taxAmount, `ضريبة دخول لعبة «${game.name}»: تم خصم ${taxAmount} ليرة`);

    // Record real play on server so creator earns 50% profit
    fetch(`/api/custom-games/${game.id}/play`, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.game) {
          setLiveGames((prev) =>
            prev.map((g) => (g.id === game.id ? { ...g, playsCount: data.game.playsCount, earningsTotal: data.game.earningsTotal } : g))
          );
        }
      })
      .catch(() => {});

    setActivePlayingGame(game);
  };

  // 1. Like Action: turns heart white -> red + updates real counter on server
  const handleLikeGame = async (e: React.MouseEvent, game: UserCustomGame) => {
    e.stopPropagation();
    const isCurrentlyLiked = likedGameIds.has(game.id);
    const newSet = new Set(likedGameIds);
    const delta = isCurrentlyLiked ? -1 : 1;

    if (isCurrentlyLiked) {
      newSet.delete(game.id);
      soundFx.playClickSound();
      setToastMsg(`تم إلغاء الإعجاب بلعبة «${game.name}» 🤍`);
    } else {
      newSet.add(game.id);
      soundFx.playWinSound();
      setToastMsg(`تم تسجيل إعجابك بلعبة «${game.name}» ❤️`);
    }
    setLikedGameIds(newSet);
    setTimeout(() => setToastMsg(null), 3000);

    // Optimistic update
    setLiveGames((prev) =>
      prev.map((g) => (g.id === game.id ? { ...g, likes: Math.max(0, (g.likes || 0) + delta) } : g))
    );

    try {
      const res = await fetch(`/api/custom-games/${game.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      const data = await res.json();
      if (data && typeof data.likes === 'number') {
        setLiveGames((prev) => prev.map((g) => (g.id === game.id ? { ...g, likes: data.likes } : g)));
      }
    } catch {
      // offline fallback
    }
  };

  // 2. Share Action: opens half-page square centered modal
  const handleOpenShareModal = (e: React.MouseEvent, game: UserCustomGame) => {
    e.stopPropagation();
    soundFx.playClickSound();
    setActiveShareGame(game);
    setCopiedShareLink(false);
  };

  // Generate Shtime-2 in-app deep link for this game
  const getGameDeepLink = (game: UserCustomGame): string => {
    if (typeof window === 'undefined') return game.url;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?gameId=${encodeURIComponent(game.id || game.name)}`;
  };

  const handleCopyLink = async () => {
    if (!activeShareGame) return;
    const link = getGameDeepLink(activeShareGame);
    try {
      await navigator.clipboard.writeText(link);
      soundFx.playWinSound();
      setCopiedShareLink(true);
      setToastMsg('تم نسخ الرابط المباشر بنجاح! عند فتحه سيتم تشغيل اللعبة تلقائياً داخل Shtime-2 🚀');
      setTimeout(() => setCopiedShareLink(false), 4000);
      setTimeout(() => setToastMsg(null), 4000);
    } catch {
      // fallback
      setToastMsg(`الرابط: ${link}`);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handleNativeShare = async () => {
    if (!activeShareGame || !navigator.share) return;
    const link = getGameDeepLink(activeShareGame);
    try {
      await navigator.share({
        title: `لعبة ${activeShareGame.name} - Shtime-2`,
        text: `العب الآن لعبة «${activeShareGame.name}» داخل Shtime-2!`,
        url: link,
      });
      soundFx.playWinSound();
    } catch {
      // user cancelled
    }
  };

  // 3. Comments Action: opens full-screen real comments page
  const handleOpenCommentsModal = (e: React.MouseEvent, game: UserCustomGame) => {
    e.stopPropagation();
    soundFx.playClickSound();
    setActiveCommentsGame(game);
  };

  // Determine if the current user has created any game
  // ONLY players who actually created a game will see the «الربح 💰» button in the top bar!
  const myCreatedGames = liveGames.filter((g) =>
    (gameState.customGames || []).some(
      (cg) => cg.id === g.id || cg.name.trim().toLowerCase() === g.name.trim().toLowerCase()
    )
  );
  const hasUserCreatedGame = myCreatedGames.length > 0 || (gameState.customGames && gameState.customGames.length > 0);

  // Creator total earnings calculation
  const totalEarningsFromPlays = myCreatedGames.reduce((acc, g) => acc + (Number(g.earningsTotal) || 0), 0);
  const totalClaimedEarnings = myCreatedGames.reduce((acc, g) => acc + (Number(g.claimedEarnings) || 0), 0);
  const uncollectedEarnings = Math.max(0, totalEarningsFromPlays - totalClaimedEarnings);

  const handleClaimEarnings = async () => {
    if (uncollectedEarnings <= 0 || claimingEarnings) return;
    setClaimingEarnings(true);
    soundFx.playWinSound();

    try {
      for (const game of myCreatedGames) {
        await fetch(`/api/custom-games/${game.id}/claim`, { method: 'POST' });
      }
      if (onAddLiras) {
        onAddLiras(uncollectedEarnings, `استلام أرباح الألعاب المصنوعة (${uncollectedEarnings} ليرة)`);
      }
      setToastMsg(`مبروك! تم تحويل ${uncollectedEarnings} ليرة إلى محفظتك بنجاح 💰🎉`);
      setTimeout(() => setToastMsg(null), 4000);
      fetchGames();
    } catch {
      setToastMsg('تعذر استلام الأرباح حالياً، حاول مجدداً');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setClaimingEarnings(false);
    }
  };

  // Handle permanent deletion of custom game
  const handleDeleteCustomGame = async (gameId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/custom-games/${gameId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data && data.success) {
        setLiveGames((prev) => prev.filter((g) => String(g.id) !== String(gameId)));
        try {
          const stored = localStorage.getItem('shtime2_user_custom_games');
          if (stored) {
            const list = JSON.parse(stored);
            const filtered = list.filter((g: any) => String(g.id) !== String(gameId));
            localStorage.setItem('shtime2_user_custom_games', JSON.stringify(filtered));
          }
        } catch {
          // ignore
        }
        if (onDeleteCustomGame) {
          onDeleteCustomGame(gameId);
        }
        fetchGames();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Update game settings (e.g. allowComments toggle)
  const handleUpdateGameSettings = (gameId: string, settings: Partial<UserCustomGame>) => {
    setLiveGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, ...settings } : g))
    );
  };

  // 4. SORTING: Strictly sort games by likes count descending!
  // "اكثر شخص لديه عدد اعجابات وهو يبين اول شيء حتى لو كان هناك شخص اول واحد صنع فيديو لقد اكثر هو حد لان اعجابات يطيره ويكون اول واحد"
  // "والذي ارسل لعبته اولا هو الذي يكون في المرتبه الاولى اذا تساويا"
  const sortedGames = [...liveGames].sort((a, b) => {
    const likesA = Number(a.likes) || 0;
    const likesB = Number(b.likes) || 0;
    if (likesB !== likesA) {
      return likesB - likesA;
    }
    const timeA = new Date(a.createdAt || 0).getTime() || 0;
    const timeB = new Date(b.createdAt || 0).getTime() || 0;
    return timeA - timeB;
  });

  if (!isOpen) return null;

  // =========================================================================
  // VIEW 0: FULL-SCREEN COMMENTS PAGE VIEW
  // "التعليقات حين يضغط عليها تفتح صفحه جديده كامله كامله في الاعلى اسم اللعبه وحدها كبسه خروج"
  // =========================================================================
  if (activeCommentsGame) {
    return (
      <GameCommentsPage
        game={activeCommentsGame}
        onClose={() => setActiveCommentsGame(null)}
        gameState={gameState}
        onForceDeductLiras={onForceDeductLiras}
        onDeductJewels={onDeductJewels}
        onUpdateGameComments={(gameId, updatedComments) => {
          setLiveGames((prev) =>
            prev.map((g) => (g.id === gameId ? { ...g, comments: updatedComments } : g))
          );
        }}
      />
    );
  }

  // =========================================================================
  // VIEW 1: IN-APP GAME PLAYER VIEW (When a game is active/playing)
  // =========================================================================
  if (activePlayingGame) {
    return (
      <div
        className="fixed inset-0 z-50 w-screen h-screen min-h-screen bg-black flex flex-col select-none overflow-hidden"
        dir="rtl"
      >
        {/* Top Header with Draggable White Line */}
        <DraggableTopHeader bgClassName="bg-[#080601]" lineMarginClass="my-1">
          <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs sm:text-sm font-bold text-amber-300">
                أنت تلعب الآن: <strong className="text-white font-black">{activePlayingGame.name}</strong>
              </span>
            </div>

            <div
              onClick={handleLogoClickOrTap}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all select-none"
              title="انقر نقراً مزدوجاً للخروج السريع"
            >
              <Gamepad2 className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-black text-white font-mono">shtime-2.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundFx.playWrongSound();
                  setShowExitConfirmModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-red-800/80 hover:bg-red-700 text-white font-bold text-xs border border-red-500/60 shadow flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </DraggableTopHeader>

        {/* Game iframe container */}
        <div className="w-full flex-1 relative bg-black">
          <iframe
            src={activePlayingGame.url}
            title={activePlayingGame.name}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />

          {/* Exit Confirmation Dialog */}
          {showExitConfirmModal && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
              <div className="relative w-full max-w-md bg-gradient-to-b from-[#1a1202] via-[#0d0901] to-slate-950 border-2 border-yellow-300 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(234,179,8,0.7)] text-center space-y-5">
                <button
                  onClick={() => {
                    soundFx.playClickSound();
                    setShowExitConfirmModal(false);
                  }}
                  className="absolute top-4 left-4 p-2 text-amber-300 hover:text-white bg-slate-900 rounded-full border border-amber-500/30 cursor-pointer transition-all active:scale-95"
                  title="العودة إلى اللعبة"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.6)]">
                  <ShieldCheck className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100">
                    هل تود حقاً الخروج من اللعبة؟
                  </h3>
                  <p className="text-xs text-amber-200/90 font-medium">
                    (اللعبة محمية ومتوقفة مؤقتاً بالكامل حتى لا تتعرض لأي ضرر)
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleExitGameBackToCommunity}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm rounded-2xl shadow-[0_0_25px_rgba(225,29,72,0.6)] border border-red-400 cursor-pointer active:scale-95 transition-all"
                  >
                    الخروج من اللعبة
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FULL-SCREEN COMMUNITY GAMES PAGE
  // =========================================================================
  return (
    <div
      className="fixed inset-0 z-50 w-screen h-screen min-h-screen bg-gradient-to-b from-[#0e0a02] via-[#050401] to-slate-950 flex flex-col select-none overflow-hidden"
      dir="rtl"
    >
      {/* 1. TOP HEADER WITH INTERACTIVE DRAGGABLE WHITE LINE */}
      <DraggableTopHeader bgClassName="bg-[#090702]" lineMarginClass="my-2">
        <div className="w-full px-4 sm:px-8 pt-5 pb-3 flex flex-col gap-3.5">
          {/* Top: Game Name and Exit button on their own clean line */}
          <div className="w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
                shtime-2.
              </span>
            </div>

            <button
              onClick={() => {
                soundFx.playClickSound();
                onClose();
              }}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-600 hover:to-rose-700 text-white font-black text-xs sm:text-sm border border-red-500/80 shadow-[0_0_15px_rgba(225,29,72,0.4)] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              title="خروج إلى الصفحة السابقة"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span>خروج</span>
            </button>
          </div>

          {/* Buttons Row: منزلين سطر لتحت مع مساحة مريحة وواسعة */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap justify-center sm:justify-start w-full pt-1">
            {/* 
              كبسة «قائمة الليرات 💰» فوق الخط الأبيض:
              تبين فقط للأشخاص الذين صنعوا لعبة وتفتح قائمة الليرات الكبيرة
            */}
            {hasUserCreatedGame && (
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  setShowEarningsModal(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm border-2 border-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.8)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all animate-pulse"
                title="قائمة الأرباح الخاصة بالليرات لألعابك المصنوعة"
              >
                <Coins className="w-4 h-4 text-slate-950 fill-current" />
                <span>قائمة الليرات 💰</span>
                {uncollectedEarnings > 0 && (
                  <span className="bg-slate-950 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                    +{uncollectedEarnings}
                  </span>
                )}
              </button>
            )}

            {/* 
              كبسة أخرى حد الأرباح: أرباح مالية حقيقية
              تفتح جدول تحويل الأرباح إلى أموال حقيقية بالدولار
            */}
            {hasUserCreatedGame && (
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  setShowRealCashModal(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm border-2 border-yellow-200 shadow-[0_0_25px_rgba(245,158,11,0.8)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                title="جدول أرباح مالية حقيقية بالدولار"
              >
                <DollarSign className="w-4 h-4 text-slate-950 fill-current" />
                <span>أرباح مالية حقيقية 💵</span>
              </button>
            )}

            {/* صناعة لعبة button */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                onClose();
                onOpenJewelsUpgrade();
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm border-2 border-yellow-200 shadow-[0_0_20px_rgba(234,179,8,0.7)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>صناعة لعبة</span>
            </button>
          </div>
        </div>
      </DraggableTopHeader>

      {/* Insufficient liras error toast */}
      {insufficientError && (
        <div className="w-full bg-red-950/90 border-b border-red-500 py-2.5 px-4 text-center text-red-200 font-bold text-xs sm:text-sm animate-shake flex items-center justify-center gap-2 shadow-lg shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{insufficientError}</span>
        </div>
      )}

      {/* Action Toast (Like / Share / Comment / Earnings) */}
      {toastMsg && (
        <div className="w-full bg-emerald-950/95 border-b border-emerald-400 py-2.5 px-4 text-center text-emerald-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-fade-in shrink-0">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 3. UNDER THE WHITE LINE: The Real Community Games (STRICTLY NO FAKE CONTENT) with generous bottom space */}
      <div className="w-full flex-1 overflow-y-auto px-4 sm:px-8 pt-3 pb-36 sm:pb-48">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Subheader Title */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
            <div className="text-center sm:text-right">
              <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100">
                ألعاب صُنعت بواسطة المستخدمين بالذكاء الاصطناعي 🎮⚡
              </h1>
              <p className="text-xs text-amber-200/80 mt-1 font-medium">
                جميع الألعاب حقيقية 100% ومرتبة تلقائياً بحسب عدد الإعجابات الحقيقية (الأكثر إعجاباً يظهر أولاً) 👑
              </p>
            </div>

            <div className="px-4 py-1.5 bg-black/60 rounded-2xl border border-amber-400/40 text-xs text-amber-300 font-mono font-black">
              رصيدك الحالي: {gameState.liras} ليرة 💰
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
              <span className="text-sm font-bold text-amber-200">جاري تحميل الألعاب المصنوعة...</span>
            </div>
          ) : sortedGames.length === 0 ? (
            /* Honest, real empty state: NO FAKE CONTENT */
            <div className="py-20 px-6 rounded-3xl bg-black/50 border-2 border-dashed border-amber-500/30 text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-black text-white">لا توجد ألعاب مصنوعة حتى الآن 🚀</h3>
                <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed font-medium">
                  حفاظاً على المصداقية، لا يوجد أي محتوى فيك (Fake) داخل هذا القسم. بمجرد أن يصنع أي شخص لعبة وينشرها مستوفياً للشروط ستظهر هنا فوراً لكل اللاعبين!
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    soundFx.playClickSound();
                    onClose();
                    onOpenJewelsUpgrade();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.7)] hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-current text-slate-950" />
                  <span>اصنع أول لعبة الآن (من قسم المجوهرات 💎)</span>
                </button>
              </div>
            </div>
          ) : (
            /* 
              Cards Grid - All real user-created games, strictly sorted by likes:
              - Game with most likes comes first (#1)
              - In the center: Image
              - Under image: Game Name
              - Under game name: THREE buttons (إعجاب, مشاركة, تعليق)
            */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedGames.map((game, index) => {
                const taxAmount = Number(game.tax) || 20;
                const likesCount = Number(game.likes) || 0;
                const commentsCount = game.comments?.length || 0;
                const isLiked = likedGameIds.has(game.id);
                const isRankOne = index === 0 && likesCount > 0;

                return (
                  <div
                    key={game.id || game.name}
                    onClick={() => handleCardClick(game)}
                    className={`w-full rounded-3xl p-5 bg-gradient-to-b from-amber-950/90 via-yellow-950/70 to-slate-950 border-2 ${
                      isRankOne
                        ? 'border-yellow-300 shadow-[0_0_40px_rgba(234,179,8,0.7)]'
                        : 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                    } flex flex-col justify-between group cursor-pointer hover:scale-[1.02] active:scale-98 transition-all relative overflow-hidden text-center`}
                  >
                    {/* Hover light sweep */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                    {/* Top Creator Tag & Entry fee & Rank badge */}
                    <div className="flex items-center justify-between mb-3 text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-black/80 border border-amber-400/40 text-[11px] text-amber-300 font-bold">
                          بواسطة: {game.creatorName || 'مستخدم'}
                        </span>
                        {isRankOne && (
                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black shadow-[0_0_15px_rgba(234,179,8,0.8)] flex items-center gap-1">
                            <span>👑 #1 الأكثر إعجاباً</span>
                          </span>
                        )}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-xl bg-amber-950/80 border border-amber-400 text-yellow-300 text-[11px] font-black">
                        الضريبة: {taxAmount} ليرة 💰
                      </span>
                    </div>

                    {/* 
                      CENTER: الصورة التي وضعها
                      "اول كارت في المنتصف يكون الصوره الذي وضعها"
                    */}
                    <div className="my-2 flex flex-col items-center">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.55)] bg-black/80 flex items-center justify-center relative">
                        <img
                          src={game.imageUrl}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80';
                          }}
                        />
                        {/* Rank Badge overlay on image */}
                        <div className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-amber-400/60 text-[10px] font-black font-mono text-yellow-300">
                          #{index + 1}
                        </div>
                      </div>

                      {/* 
                        تحتها اسم اللعبة:
                        "تحتها اسم اللعبه وحين يضغط عليها تبدا اللعبه"
                      */}
                      <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 group-hover:text-yellow-300 transition-colors mt-3 mb-2 font-mono">
                        {game.name}
                      </h3>

                      {/* 
                        الكبسات الثلاث تحت اسم اللعبة في الكرت:
                        1. إعجاب (Like) - شعار يتحول من أبيض إلى أحمر مع العداد الحقيقي
                        2. مشاركة (Share) - تفتح نصف صفحة مربع صغير في المنتصف لنسخ الرابط
                        3. تعليق (Comment) - فتح التعليقات الحقيقية
                      */}
                      <div className="grid grid-cols-3 gap-2 w-full max-w-sm mt-1">
                        {/* 1. إعجاب (Heart turns white -> red + real count) */}
                        <button
                          type="button"
                          onClick={(e) => handleLikeGame(e, game)}
                          className={`py-2 px-2 rounded-2xl font-black text-xs flex items-center justify-center gap-1 border transition-all cursor-pointer active:scale-95 ${
                            isLiked
                              ? 'bg-red-950/90 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.6)]'
                              : 'bg-black/70 border-white/30 text-white hover:border-red-400 hover:text-red-300'
                          }`}
                          title="إعجاب باللعبة"
                        >
                          <Heart
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isLiked ? 'text-red-500 fill-red-500 animate-pulse' : 'text-white fill-transparent'
                            }`}
                          />
                          <span className="truncate">إعجاب</span>
                          <span
                            className={`font-mono text-[11px] px-1.5 py-0.2 rounded-full ${
                              isLiked ? 'bg-red-900/60 text-white' : 'bg-white/20 text-white'
                            }`}
                          >
                            {likesCount}
                          </span>
                        </button>

                        {/* 2. مشاركة (Opens centered small modal) */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenShareModal(e, game)}
                          className="py-2 px-2 rounded-2xl font-black text-xs flex items-center justify-center gap-1 border bg-black/70 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-400 shadow transition-all cursor-pointer active:scale-95"
                          title="مشاركة اللعبة"
                        >
                          <Share2 className="w-4 h-4 shrink-0 text-cyan-300" />
                          <span className="truncate">مشاركة</span>
                        </button>

                        {/* 3. تعليق (Opens comments modal) */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenCommentsModal(e, game)}
                          className="py-2 px-2 rounded-2xl font-black text-xs flex items-center justify-center gap-1 border bg-black/70 border-amber-500/40 text-amber-300 hover:bg-amber-950/60 hover:border-amber-400 shadow transition-all cursor-pointer active:scale-95"
                          title="تعليقات اللعبة"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0 text-amber-300" />
                          <span className="truncate">تعليق</span>
                          <span className="font-mono text-[11px] bg-white/10 px-1.5 py-0.2 rounded-full text-amber-200">
                            {commentsCount}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Play Game Button indicator */}
                    <div className="mt-3 pt-3 border-t border-amber-500/30 flex items-center justify-between text-xs font-black">
                      <span className="text-amber-200/80">اضغط في أي مكان للدخول</span>
                      <span className="text-yellow-300 group-hover:translate-x-[-3px] transition-transform flex items-center gap-1">
                        <span>بدء اللعبة</span>
                        <span>🚀</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SHARE GAME MODAL (نصف صفحة مربع صغير في المنتصف)               */}
      {/* "حين يبحث على كبسه المشاركه تفتح نصف صفحه مربع صغير في المنتصف              */}
      {/* في وسطه في حدها كبست هذا الرابط هذا الرابط ليس اي رابط هناك عليه اي شخص     */}
      {/* وهو يفتحه من اي هاتف اخر او اي شيء يتم فتح اللعبه تلقائيا داخل Shtime-2"   */}
      {/* ========================================================================= */}
      {activeShareGame && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none"
          dir="rtl"
        >
          <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#181102] via-[#0c0901] to-slate-950 border-2 border-cyan-400 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.6)] text-center space-y-4">
            {/* Close Button */}
            <button
              onClick={() => {
                soundFx.playClickSound();
                setActiveShareGame(null);
              }}
              className="absolute top-4 left-4 p-2 text-cyan-300 hover:text-white bg-slate-900 rounded-full border border-cyan-500/30 cursor-pointer transition-all active:scale-95"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Share Icon */}
            <div className="w-14 h-14 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.7)]">
              <Share2 className="w-7 h-7" />
            </div>

            {/* Game Preview */}
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-white">
                مشاركة لعبة «{activeShareGame.name}»
              </h3>
              <p className="text-xs text-cyan-200/90 leading-relaxed font-medium">
                هذا الرابط خاص بهذه اللعبة، وعندما يفتحه أي شخص من أي هاتف آخر سيتم فتح وتشغيل اللعبة تلقائياً داخل تطبيق <strong>Shtime-2</strong>!
              </p>
            </div>

            {/* Game Card snippet */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/60 border border-cyan-500/30 text-right">
              <img
                src={activeShareGame.imageUrl}
                alt={activeShareGame.name}
                className="w-12 h-12 rounded-xl object-cover border border-cyan-400/50 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-white truncate">{activeShareGame.name}</div>
                <div className="text-[11px] text-cyan-300 font-mono">
                  صنعها: {activeShareGame.creatorName || 'مستخدم'} • ضريبة: {activeShareGame.tax} ليرة
                </div>
              </div>
            </div>

            {/* Link Container with Copy Button */}
            <div className="space-y-2 text-right">
              <label className="text-xs text-cyan-300 font-bold block">رابط اللعبة المباشر في Shtime-2:</label>
              <div className="flex items-center gap-2 bg-black/90 p-2 rounded-2xl border-2 border-cyan-400/60 shadow-inner">
                <input
                  type="text"
                  readOnly
                  value={getGameDeepLink(activeShareGame)}
                  className="flex-1 bg-transparent text-cyan-200 text-xs font-mono px-2 py-1 outline-none truncate select-all"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
                    copiedShareLink
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.7)]'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                  }`}
                >
                  {copiedShareLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share on Apps */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow border border-cyan-400 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة عبر واتساب والتطبيقات الأخرى</span>
              </button>
            )}
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* MODAL 3: LIRAS EARNINGS MODAL (قائمة الليرات 💰)                           */}
      {/* ========================================================================= */}
      <LirasEarningsModal
        isOpen={showEarningsModal}
        onClose={() => setShowEarningsModal(false)}
        gameState={gameState}
        myGames={myCreatedGames}
        onAddLiras={(amount, reason) => {
          if (onAddLiras) onAddLiras(amount, reason);
        }}
        onDeleteGame={handleDeleteCustomGame}
        onRefreshGames={fetchGames}
        onUpdateGameSettings={handleUpdateGameSettings}
      />

      {/* MODAL: REAL CASH EARNINGS (أرباح مالية حقيقية) */}
      <RealCashEarningsModal
        isOpen={showRealCashModal}
        onClose={() => setShowRealCashModal(false)}
        gameName={myCreatedGames[0]?.name || gameState.customGames?.[0]?.name || 'shtime-2.'}
      />
    </div>
  );
};
