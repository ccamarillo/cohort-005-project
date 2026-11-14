import { z } from "zod";

const CELEBRATE_PARAM = "celebrate";

const celebrateSchema = z.object({
  [CELEBRATE_PARAM]: z.literal("1").optional(),
});

export function welcomePath(slug: string) {
  return `/courses/${slug}/welcome?${CELEBRATE_PARAM}=1`;
}

export function isCelebrating(url: URL) {
  const parsed = celebrateSchema.safeParse(
    Object.fromEntries(url.searchParams)
  );
  return parsed.success && parsed.data[CELEBRATE_PARAM] === "1";
}

export function stripCelebration(url: URL) {
  const next = new URL(url);
  next.searchParams.delete(CELEBRATE_PARAM);
  return `${next.pathname}${next.search}${next.hash}`;
}

export function isDroppingMark(from: URL, to: URL) {
  return (
    isCelebrating(from) &&
    stripCelebration(from) === `${to.pathname}${to.search}${to.hash}`
  );
}
