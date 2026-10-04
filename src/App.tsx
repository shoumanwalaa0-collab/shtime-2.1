import React, { useState, useEffect } from 'react';
import { UserGameState } from './types';
import { IntroScreen } from './components/IntroScreen';
import { MainScreen } from './components/MainScreen';
import { AdminLoginModal } from './components/AdminLoginModal';
import { OfflineNotificationModal } from './components/OfflineNotificationModal';
import { YouTubeMusicPlayer } from './components/YouTubeMusicPlayer';
import { loadPersistedGameState, savePersistedGameState, clearPersistedGameState, getInitialGameState } from './utils/storage';

export default function App() {
  const [gameState, setGameState] = useState<UserGameState>(() => loadPersistedGameState());
  const [initialDeepLinkGameId] = useState<string | null>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const param = urlParams.get('gameId');
      if (param) return param;
      if (window.location.hash.startsWith('#game=')) {
        return window.location.hash.replace('#game=', '');
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [screen, setScreen] = useState<'intro' | 'main'>(() => (initialDeepLinkGameId ? 'main' : 'intro'));
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // Automatically persist game state synchronously whenever it changes
  useEffect(() => {
    savePersistedGameState(gameState);
  }, [gameState]);

  // Logout handler:
  // "اذا الشخص صنع لعبه وبعد قليل سجل خروجه من اللعبه يتم حذف اللعبه الذي صنعها معها كليا
  // والشيء الوحيد الذي لا يتم حذفه ابدا هو الباسورد الذي استخدمته والاسم"
  const handleLogout = async () => {
    const gamesToDelete = gameState.customGames || [];
    const gameIds = gamesToDelete.map((g) => g.id).filter(Boolean);
    const creatorNames = Array.from(
      new Set(gamesToDelete.map((g) => g.creatorName).filter(Boolean) as string[])
    );

    // Wipe games from local storage
    try {
      localStorage.removeItem('shtime2_user_custom_games');
    } catch {
      // ignore
    }

    // Call server to delete games created by this user
    try {
      await fetch('/api/custom-games/delete-user-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameIds, creatorNames }),
      });
    } catch {
      // fallback
    }

    // Clear persisted game state while keeping permanent used codes & names intact
    clearPersistedGameState();
    setGameState(getInitialGameState());
    setScreen('intro');
    setActiveModal(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#020617] text-white selection:bg-amber-500 selection:text-slate-950 relative">
      {screen === 'intro' ? (
        <IntroScreen
          onStart={() => setScreen('main')}
          gameState={gameState}
          onOpenAdmin={() => setShowAdminModal(true)}
        />
      ) : (
        <MainScreen
          gameState={gameState}
          setGameState={setGameState}
          onLogout={handleLogout}
          onActiveModalChange={setActiveModal}
          initialDeepLinkGameId={initialDeepLinkGameId}
        />
      )}

      {/* Admin Login Modal (can open from IntroScreen or MainScreen) */}
      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        gameState={gameState}
        setGameState={setGameState}
      />

      {/* Offline and Game Update Notification Modals */}
      <OfflineNotificationModal />

      {/* Continuous Background Music from YouTube: cannot be stopped manually, only on exiting game */}
      <YouTubeMusicPlayer />
    </div>
  );
}
