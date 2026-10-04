import confetti from 'canvas-confetti';

/**
 * Celebratory Confetti Utilities for Game Wins and Accomplishments
 */

// Custom vibrant color palettes
const CELEBRATION_COLORS = [
  '#f59e0b', // Amber / Gold
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#f97316', // Orange
];

const GOLD_ROYAL_COLORS = [
  '#ffd700', // Gold
  '#ffae00', // Deep Gold
  '#ffffff', // Diamond White
  '#f59e0b', // Amber
  '#fef08a', // Light Gold
];

/**
 * Triggers a spectacular celebratory confetti blast when a player wins a stage!
 * Includes twin corner cannons followed by a center star shower.
 */
export const triggerStageWinConfetti = () => {
  try {
    // 1. Initial burst from center
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6, x: 0.5 },
      colors: CELEBRATION_COLORS,
      ticks: 250,
      gravity: 1,
      scalar: 1.1,
      disableForReducedMotion: true,
    });

    // 2. Left cannon blast
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 60,
        origin: { x: 0.05, y: 0.75 },
        colors: CELEBRATION_COLORS,
        ticks: 280,
        gravity: 0.9,
        scalar: 1.2,
      });
    }, 150);

    // 3. Right cannon blast
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 60,
        origin: { x: 0.95, y: 0.75 },
        colors: CELEBRATION_COLORS,
        ticks: 280,
        gravity: 0.9,
        scalar: 1.2,
      });
    }, 300);

    // 4. Star sparkles and golden flakes
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 100,
        origin: { x: 0.5, y: 0.4 },
        colors: GOLD_ROYAL_COLORS,
        shapes: ['circle'],
        scalar: 0.9,
        ticks: 200,
        gravity: 0.8,
      });
    }, 450);
  } catch (err) {
    console.warn('Confetti effect could not be rendered:', err);
  }
};

/**
 * Triggered on major milestones (e.g. completing all stages or big categories)
 * Produces prolonged fireworks effect lasting 2.5 seconds
 */
export const triggerSuperWinConfetti = () => {
  try {
    const end = Date.now() + 2500;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: CELEBRATION_COLORS,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: CELEBRATION_COLORS,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  } catch (err) {
    console.warn('Super confetti effect error:', err);
  }
};

/**
 * Quick mini burst for small tasks, single answers, or quick achievements
 */
export const triggerMiniConfetti = () => {
  try {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.65 },
      colors: CELEBRATION_COLORS,
      ticks: 180,
      gravity: 1.1,
      scalar: 0.95,
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.warn('Mini confetti effect error:', err);
  }
};
