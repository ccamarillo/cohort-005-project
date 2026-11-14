import {
  isCelebrating,
  isDroppingMark,
  stripCelebration,
  welcomePath,
} from "./lib/welcome-url";
import { longestFallMs, makeConfetti } from "./lib/confetti";

export type { ConfettiPiece } from "./lib/confetti";
export { CONFETTI_COLORS } from "./lib/confetti";

/**
 * Confetti on the welcome page, for a Student who has just enrolled.
 *
 * The enrolling action redirects to `welcomeUrl(slug, { celebrate: true })`.
 * The welcome page asks `shouldCelebrate` whether to throw confetti, and
 * once it has, replaces the URL with `withoutCelebration` so a refresh or a
 * later visit stays calm.
 */
export const celebration = {
  /** The welcome page's path, marked to celebrate when `celebrate` is set. */
  welcomeUrl(slug: string, { celebrate = false } = {}) {
    return welcomePath(slug, celebrate);
  },

  /** Whether this request to the welcome page should throw confetti. */
  shouldCelebrate(url: string | URL) {
    return isCelebrating(new URL(url));
  },

  /** The same location, path-relative, with the celebration mark removed. */
  withoutCelebration(url: string | URL) {
    return stripCelebration(new URL(url));
  },

  /**
   * Whether moving from `from` to `to` only drops the celebration mark, so
   * the welcome page need not load again.
   */
  onlyDropsMark(from: string | URL, to: string | URL) {
    return isDroppingMark(new URL(from), new URL(to));
  },

  /**
   * `count` pieces of confetti, laid out with `random` (values in [0, 1)),
   * and how long the last one takes to land.
   */
  confetti(count: number, random: () => number) {
    const pieces = makeConfetti(count, random);
    return { pieces, totalMs: longestFallMs(pieces) };
  },
};
