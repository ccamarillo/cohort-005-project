export type ConfettiPiece = {
  id: number;
  leftPercent: number;
  delayMs: number;
  durationMs: number;
  spinDeg: number;
  driftPercent: number;
  color: string;
};

export const CONFETTI_COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
] as const;

const MAX_DELAY_MS = 800;
const MIN_DURATION_MS = 2200;
const DURATION_SPREAD_MS = 1400;
const MAX_SPIN_DEG = 720;
const MAX_DRIFT_PERCENT = 15;

/** Spreads `random()` (in [0, 1)) across `[-max, max)`. */
function signed(random: () => number, max: number) {
  return (random() * 2 - 1) * max;
}

export function makeConfetti(
  count: number,
  random: () => number
): ConfettiPiece[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    leftPercent: random() * 100,
    delayMs: random() * MAX_DELAY_MS,
    durationMs: MIN_DURATION_MS + random() * DURATION_SPREAD_MS,
    spinDeg: signed(random, MAX_SPIN_DEG),
    driftPercent: signed(random, MAX_DRIFT_PERCENT),
    color: CONFETTI_COLORS[Math.floor(random() * CONFETTI_COLORS.length)],
  }));
}

export function longestFallMs(pieces: ConfettiPiece[]) {
  return Math.max(0, ...pieces.map((p) => p.delayMs + p.durationMs));
}
