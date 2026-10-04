import { UserGameState } from '../types';
import { getPermanentUsedCodes } from './codeStorage';

const PRIMARY_STORAGE_KEY = 'shtime2_game_state_v1';
const BACKUP_STORAGE_KEY = 'shtime2_game_state_backup';

export const getInitialGameState = (): UserGameState => ({
  liras: 50,
  jewels: 0, // 0 jewels initially as requested
  mentalMathBonusSeconds: 0,
  currentStage: 1,
  completedStages: 0,
  claimedLevelRewards: [],
  bonusTimeSeconds: 0,
  usedCodes: getPermanentUsedCodes(),
  notifiedMilestones: [],
  stageRetryCount: {},
  customGames: [],
  playerName: 'Player_' + Math.floor(1000 + Math.random() * 9000),
});

// Load persistent game state with multi-layer fallback
export function loadPersistedGameState(): UserGameState {
  const permanentCodes = getPermanentUsedCodes();
  let state: UserGameState | null = null;

  try {
    const raw = localStorage.getItem(PRIMARY_STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading primary storage, checking backup:', err);
  }

  if (!state) {
    try {
      const backupRaw = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (backupRaw) {
        state = JSON.parse(backupRaw);
      }
    } catch (err) {
      console.warn('Error reading backup storage:', err);
    }
  }

  if (state) {
    // Ensure all required fields exist and codes are preserved
    const mergedUsedCodes = Array.from(new Set([...(state.usedCodes || []), ...permanentCodes]));
    return {
      liras: typeof state.liras === 'number' ? state.liras : 0,
      jewels: typeof state.jewels === 'number' ? state.jewels : 0, // starts at 0 if not set
      mentalMathBonusSeconds: typeof state.mentalMathBonusSeconds === 'number' ? state.mentalMathBonusSeconds : 0,
      currentStage: typeof state.currentStage === 'number' && state.currentStage >= 1 ? state.currentStage : 1,
      completedStages: typeof state.completedStages === 'number' ? state.completedStages : 0,
      claimedLevelRewards: Array.isArray(state.claimedLevelRewards) ? state.claimedLevelRewards : [],
      bonusTimeSeconds: typeof state.bonusTimeSeconds === 'number' ? state.bonusTimeSeconds : 0,
      usedCodes: mergedUsedCodes,
      notifiedMilestones: Array.isArray(state.notifiedMilestones) ? state.notifiedMilestones : [],
      stageRetryCount: state.stageRetryCount || {},
      customGames: Array.isArray(state.customGames) ? state.customGames : [],
      playerName: typeof state.playerName === 'string' && state.playerName.trim() ? state.playerName : 'Player_' + Math.floor(1000 + Math.random() * 9000),
      language: state.language === 'en' ? 'en' : 'ar',
      aiRiddles: Array.isArray(state.aiRiddles) ? state.aiRiddles : [],
    };
  }

  return getInitialGameState();
}

// Save persistent game state immediately
export function savePersistedGameState(state: UserGameState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(PRIMARY_STORAGE_KEY, serialized);
    localStorage.setItem(BACKUP_STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

// Clear game progress on explicit logout (preserves permanent codes)
export function clearPersistedGameState(): void {
  try {
    localStorage.removeItem(PRIMARY_STORAGE_KEY);
    localStorage.removeItem(BACKUP_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear state on logout:', err);
  }
}
