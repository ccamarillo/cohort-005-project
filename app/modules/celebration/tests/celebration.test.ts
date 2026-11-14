import { describe, it, expect } from "vitest";
import { celebration, CONFETTI_COLORS } from "../index";

const BASE = "http://localhost:5173";

/** A `random` that returns `values` in turn, then repeats them. */
function sequence(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("welcomeUrl", () => {
  it("is the plain welcome page by default", () => {
    expect(celebration.welcomeUrl("typescript")).toBe(
      "/courses/typescript/welcome"
    );
  });

  it("is the plain welcome page when not celebrating", () => {
    expect(celebration.welcomeUrl("typescript", { celebrate: false })).toBe(
      "/courses/typescript/welcome"
    );
  });

  it("marks the welcome page to celebrate", () => {
    expect(celebration.welcomeUrl("typescript", { celebrate: true })).toBe(
      "/courses/typescript/welcome?celebrate=1"
    );
  });
});

describe("shouldCelebrate", () => {
  it("celebrates on the URL welcomeUrl marks", () => {
    const path = celebration.welcomeUrl("typescript", { celebrate: true });
    expect(celebration.shouldCelebrate(`${BASE}${path}`)).toBe(true);
  });

  it("stays calm on a plain visit", () => {
    const path = celebration.welcomeUrl("typescript");
    expect(celebration.shouldCelebrate(`${BASE}${path}`)).toBe(false);
  });

  it("accepts a URL object", () => {
    const url = new URL(`${BASE}/courses/typescript/welcome?celebrate=1`);
    expect(celebration.shouldCelebrate(url)).toBe(true);
  });

  it.each(["0", "", "true", "yes", "11"])(
    "stays calm when celebrate is %j",
    (value) => {
      const url = `${BASE}/courses/typescript/welcome?celebrate=${value}`;
      expect(celebration.shouldCelebrate(url)).toBe(false);
    }
  );

  it("celebrates alongside other search params", () => {
    const url = `${BASE}/courses/typescript/welcome?ref=email&celebrate=1`;
    expect(celebration.shouldCelebrate(url)).toBe(true);
  });
});

describe("withoutCelebration", () => {
  it("drops the mark and keeps the path", () => {
    const url = `${BASE}/courses/typescript/welcome?celebrate=1`;
    expect(celebration.withoutCelebration(url)).toBe(
      "/courses/typescript/welcome"
    );
  });

  it("keeps other search params and the hash", () => {
    const url = `${BASE}/courses/typescript/welcome?ref=email&celebrate=1#top`;
    expect(celebration.withoutCelebration(url)).toBe(
      "/courses/typescript/welcome?ref=email#top"
    );
  });

  it("leaves an unmarked URL as it was", () => {
    const url = new URL(`${BASE}/courses/typescript/welcome?ref=email`);
    expect(celebration.withoutCelebration(url)).toBe(
      "/courses/typescript/welcome?ref=email"
    );
    expect(
      celebration.shouldCelebrate(
        `${BASE}${celebration.withoutCelebration(url)}`
      )
    ).toBe(false);
  });
});

describe("onlyDropsMark", () => {
  const marked = `${BASE}/courses/typescript/welcome?ref=email&celebrate=1#top`;

  it("is true when the next URL is the marked one without its mark", () => {
    const next = `${BASE}${celebration.withoutCelebration(marked)}`;
    expect(celebration.onlyDropsMark(marked, next)).toBe(true);
  });

  it("accepts URL objects", () => {
    const next = new URL(`${BASE}/courses/typescript/welcome?ref=email#top`);
    expect(celebration.onlyDropsMark(new URL(marked), next)).toBe(true);
  });

  it("is false when the current URL carries no mark", () => {
    const plain = `${BASE}/courses/typescript/welcome`;
    expect(celebration.onlyDropsMark(plain, plain)).toBe(false);
  });

  it("is false when the next URL goes somewhere else", () => {
    const next = `${BASE}/courses/typescript/welcome?ref=email`;
    expect(celebration.onlyDropsMark(marked, next)).toBe(false);
    expect(
      celebration.onlyDropsMark(marked, `${BASE}/courses/typescript`)
    ).toBe(false);
  });

  it("is false when the next URL keeps the mark", () => {
    expect(celebration.onlyDropsMark(marked, marked)).toBe(false);
  });
});

describe("confetti", () => {
  it("makes as many pieces as asked, each with its own id", () => {
    const { pieces } = celebration.confetti(5, Math.random);
    expect(pieces.map((p) => p.id)).toEqual([0, 1, 2, 3, 4]);
  });

  it("makes nothing for a count of zero, and takes no time", () => {
    expect(celebration.confetti(0, Math.random)).toEqual({
      pieces: [],
      totalMs: 0,
    });
  });

  it("lays a piece out at the low end of every range when random is 0", () => {
    const { pieces } = celebration.confetti(1, sequence(0));
    expect(pieces[0]).toEqual({
      id: 0,
      leftPercent: 0,
      delayMs: 0,
      durationMs: 2200,
      spinDeg: -720,
      driftPercent: -15,
      color: CONFETTI_COLORS[0],
    });
  });

  it("lays a piece out in the middle of every range when random is 0.5", () => {
    const { pieces } = celebration.confetti(1, sequence(0.5));
    expect(pieces[0]).toEqual({
      id: 0,
      leftPercent: 50,
      delayMs: 400,
      durationMs: 2900,
      spinDeg: 0,
      driftPercent: 0,
      color: CONFETTI_COLORS[3],
    });
  });

  it("stays inside every range when random is just under 1", () => {
    const { pieces } = celebration.confetti(1, sequence(0.999999));
    const [piece] = pieces;
    expect(piece.leftPercent).toBeLessThan(100);
    expect(piece.delayMs).toBeLessThan(800);
    expect(piece.durationMs).toBeLessThan(3600);
    expect(piece.spinDeg).toBeLessThan(720);
    expect(piece.driftPercent).toBeLessThan(15);
    expect(piece.color).toBe(CONFETTI_COLORS[CONFETTI_COLORS.length - 1]);
  });

  it("draws each property from its own random value", () => {
    const { pieces } = celebration.confetti(
      1,
      sequence(0.1, 0.2, 0.3, 0.4, 0.6, 0.7)
    );
    expect(pieces[0]).toEqual({
      id: 0,
      leftPercent: 10,
      delayMs: 160,
      durationMs: 2200 + 0.3 * 1400,
      spinDeg: expect.closeTo(-0.2 * 720, 6),
      driftPercent: expect.closeTo(0.2 * 15, 6),
      color: CONFETTI_COLORS[4],
    });
  });

  it("takes as long as the last piece to land", () => {
    // Piece 0 waits 0ms and falls for 2200ms; piece 1 waits 400ms and
    // falls for 2900ms.
    const { totalMs } = celebration.confetti(
      2,
      sequence(0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5)
    );
    expect(totalMs).toBe(3300);
  });
});
