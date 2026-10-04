export interface Riddle {
  id: number;
  question: string;
  answer: string; // primary answer
  acceptedAnswers: string[]; // alternative spelling variants
  hint: string;
  categoryIndex: number; // 0: مبتدئ, 1: الصعود, 2: تقدم, 3: متقدم, 4: الرفع, 5: صعب
  questionEn?: string; // English question text
  answerEn?: string; // English answer
  acceptedAnswersEn?: string[]; // English accepted answers
  hintEn?: string; // English hint
  isAiGenerated?: boolean; // Flag if created via Gemini AI
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

export interface GameCommentReply {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  replyToCommentId?: string;
  replyToAuthor?: string;
}

export interface GameComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  likes?: number;
  tipLiras?: number;
  tipJewels?: number;
  replies?: GameCommentReply[];
  replyToCommentId?: string;
  replyToAuthor?: string;
}

export interface UserCustomGame {
  id: string;
  name: string;
  description: string;
  tax: number;
  imageUrl: string;
  url: string;
  creatorName: string;
  createdAt?: string | number;
  likes?: number;
  shares?: number;
  comments?: GameComment[];
  playsCount?: number;
  earningsTotal?: number;
  claimedEarnings?: number;
  directTips?: number;
  allowComments?: boolean; // Default true. When false, only gift comments allowed
}

export interface UserGameState {
  liras: number; // المال (الليرات)
  jewels: number; // المجوهرات الجديدة (ذهبي ولامع)
  mentalMathBonusSeconds: number; // وقت إضافي دائم للحساب الذهني
  currentStage: number; // 1 to 205
  completedStages: number; // total completed riddles count
  claimedLevelRewards: number[]; // indices of level rewards claimed
  bonusTimeSeconds: number; // permanent time boost from upgrades
  usedCodes: string[]; // redeeming code history to prevent reuse
  notifiedMilestones?: string[]; // IDs of milestones already notified
  stageRetryCount?: Record<number, number>; // consecutive paid retries at specific stage
  customGames?: UserCustomGame[]; // user-published custom AI games
  playerName?: string; // Player username or ID for online and promo codes
  language?: 'ar' | 'en'; // Active application language ('ar' default, 'en' English)
  aiRiddles?: Riddle[]; // Dynamic AI-generated riddles from Gemini API
}
