import React, { useState, useEffect } from 'react';
import { UserGameState } from './types';
import { IntroScreen } from './components/IntroScreen';
import { MainScreen } from './components/MainScreen';
import { getPermanentUsedCodes } from './utils/codeStorage';

const STORAGE_KEY = 'shtime2_game_state_v1';

const getInitialGameState = (): UserGameState => ({
  liras: 0, // Starts at 0 Lira as requested
  currentStage: 1,
  completedStages: 0,
  claimedLevelRewards: [],
  bonusTimeSeconds: 0,
  usedCodes: getPermanentUsedCodes(),
});

export default function App() {
  const [screen, setScreen] = useState<'intro' | 'main'>('intro');
  const [gameState, setGameState] = useState<UserGameState>(() => {
    const permanentCodes = getPermanentUsedCodes();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: UserGameState = JSON.parse(saved);
        // Merge usedCodes with permanent blacklist so redeemed codes are never lost
        const mergedUsedCodes = Array.from(new Set([...(parsed.usedCodes || []), ...permanentCodes]));
        return {
          ...parsed,
          usedCodes: mergedUsedCodes,
        };
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
    return getInitialGameState();
  });

  // Save game state to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [gameState]);

  // Logout handler: Resets progress (liras, stage) BUT keeps permanent used codes blacklisted forever
  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error removing state on logout:', e);
    }
    setGameState(getInitialGameState());
    setScreen('intro');
  };

  return (
    <div className="w-full min-h-screen bg-[#070b19] text-white selection:bg-amber-500 selection:text-slate-950">
      {screen === 'intro' ? (
        <IntroScreen onStart={() => setScreen('main')} />
      ) : (
        <MainScreen
          gameState={gameState}
          setGameState={setGameState}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
