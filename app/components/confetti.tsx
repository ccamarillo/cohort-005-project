import { useEffect, useState, type CSSProperties } from "react";
import {
  celebration,
  type ConfettiBurst,
  type ConfettiPiece,
} from "~/modules/celebration";

const PIECE_COUNT = 120;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pieceStyle(piece: ConfettiPiece): CSSProperties {
  return {
    left: `${piece.leftPercent}%`,
    backgroundColor: piece.color,
    animationDelay: `${piece.delayMs}ms`,
    animationDuration: `${piece.durationMs}ms`,
    ["--confetti-spin" as string]: `${piece.spinDeg}deg`,
    ["--confetti-drift" as string]: `${piece.driftVw}vw`,
  };
}

/**
 * Throws one burst of confetti over the page when `fire` turns true, and
 * clears it once the last piece has landed. Honours
 * `prefers-reduced-motion`: see docs/adr/0014.
 */
export function Confetti({ fire }: { fire: boolean }) {
  const [burst, setBurst] = useState<ConfettiBurst | null>(null);

  useEffect(() => {
    if (!fire || prefersReducedMotion()) return;
    setBurst(celebration.confetti(PIECE_COUNT, Math.random));
  }, [fire]);

  useEffect(() => {
    if (!burst) return;
    const timer = window.setTimeout(() => setBurst(null), burst.totalMs);
    return () => window.clearTimeout(timer);
  }, [burst]);

  if (!burst) return null;

  return (
    <div
      aria-hidden="true"
      data-testid="confetti"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {burst.pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece"
          style={pieceStyle(piece)}
        />
      ))}
    </div>
  );
}
