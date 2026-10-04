import { UserCustomGame } from '../types';

export interface GameEarningsBreakdown {
  gameId: string;
  gameName: string;
  likes: number;
  likesEarnings: number;
  commentsCount: number;
  commentsEarnings: number;
  sharesCount: number;
  sharesEarnings: number;
  directTips: number;
  playsCount: number;
  playsEarnings: number;
  totalEarnings: number;
  claimedEarnings: number;
  unclaimedEarnings: number;
}

export interface CreatorOverallEarnings {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalGames: number;
  totalEarnings: number;
  totalClaimed: number;
  totalUnclaimed: number;
  breakdowns: GameEarningsBreakdown[];
}

/**
 * Calculates earnings for an individual custom game according to the creator economy rules:
 * - 50 Liras per 1,000 Likes (0.05 Liras per Like)
 * - 10 Liras per Comment
 * - 150 Liras per Share
 * - 100% of direct tips / money sent to this game (e.g. 500 Liras sent directly or in comments)
 * - 50% of game play tax
 */
export function calculateGameEarnings(game: UserCustomGame): GameEarningsBreakdown {
  const likes = Math.max(0, Number(game.likes) || 0);
  const likesEarnings = Math.floor(likes * 0.05); // 50 Liras per 1000 likes

  const commentsCount = Array.isArray(game.comments) ? game.comments.length : 0;
  const commentsEarnings = commentsCount * 10; // 10 Liras per comment

  const sharesCount = Math.max(0, Number(game.shares) || 0);
  const sharesEarnings = sharesCount * 150; // 150 Liras per share

  // Tips from comment tips + directTips (e.g. 100 liras sent with comment)
  const tipsFromComments = Array.isArray(game.comments)
    ? game.comments.reduce((sum, c) => sum + (Number(c.tipLiras) || 0), 0)
    : 0;
  const directTips = Math.max(Number(game.directTips) || 0, tipsFromComments);

  // Plays earnings = plays cut from server (earningsTotal minus directTips)
  const serverRecordedTotal = Math.max(0, Number(game.earningsTotal) || 0);
  const playsEarnings = Math.max(0, serverRecordedTotal - (Number(game.directTips) || 0));

  const playsCount = Math.max(0, Number(game.playsCount) || 0);
  const totalEarnings = likesEarnings + commentsEarnings + sharesEarnings + directTips + playsEarnings;
  const claimedEarnings = Math.max(0, Number(game.claimedEarnings) || 0);
  const unclaimedEarnings = Math.max(0, totalEarnings - claimedEarnings);

  return {
    gameId: game.id,
    gameName: game.name,
    likes,
    likesEarnings,
    commentsCount,
    commentsEarnings,
    sharesCount,
    sharesEarnings,
    directTips,
    playsCount,
    playsEarnings,
    totalEarnings,
    claimedEarnings,
    unclaimedEarnings,
  };
}

/**
 * Calculates overall earnings across all games created by this user
 */
export function calculateCreatorOverall(games: UserCustomGame[]): CreatorOverallEarnings {
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalEarnings = 0;
  let totalClaimed = 0;
  let totalUnclaimed = 0;

  const breakdowns = games.map((game) => {
    const b = calculateGameEarnings(game);
    totalLikes += b.likes;
    totalComments += b.commentsCount;
    totalShares += b.sharesCount;
    totalEarnings += b.totalEarnings;
    totalClaimed += b.claimedEarnings;
    totalUnclaimed += b.unclaimedEarnings;
    return b;
  });

  return {
    totalLikes,
    totalComments,
    totalShares,
    totalGames: games.length,
    totalEarnings,
    totalClaimed,
    totalUnclaimed,
    breakdowns,
  };
}
