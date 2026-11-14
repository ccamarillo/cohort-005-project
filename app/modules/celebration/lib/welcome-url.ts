import { z } from "zod";

const CELEBRATE_PARAM = "celebrate";

const celebrateSchema = z.object({
  [CELEBRATE_PARAM]: z.literal("1").optional(),
});

export function welcomePath(slug: string, celebrate: boolean) {
  const path = `/courses/${slug}/welcome`;
  return celebrate ? `${path}?${CELEBRATE_PARAM}=1` : path;
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
