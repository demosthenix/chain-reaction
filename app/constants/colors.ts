// constants/colors.ts
export const PLAYER_COLORS = [
  "red",
  "green",
  "blue",
  "yellow",
  "cyan",
  "magenta",
] as const;

export type PlayerColor = (typeof PLAYER_COLORS)[number];
