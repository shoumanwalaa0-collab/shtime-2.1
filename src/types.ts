export interface Riddle {
  id: number;
  question: string;
  answer: string; // primary answer
  acceptedAnswers: string[]; // alternative spelling variants
  hint: string;
  categoryIndex: number; // 0: مبتدئ, 1: الصعود, 2: تقدم, 3: متقدم, 4: الرفع, 5: صعب
}

export interface StageCategory {
  id: number;
  name: string;
  stagesCount: number;
  startLevel: number;
  endLevel: number;
  badge: string;
  color: string;
}

export interface UserGameState {
  liras: number; // المال (الليرات)
  currentStage: number; // 1 to 205
  completedStages: number; // total completed riddles count
  claimedLevelRewards: number[]; // indices of level rewards claimed
  bonusTimeSeconds: number; // permanent time boost from upgrades
  usedCodes: string[]; // redeeming code history to prevent reuse
}
