/** Opponent and analysis. Runs inside a Web Worker; see worker.ts. Implemented in M5. */
export const AI_TIERS = ['rookie', 'pirate', 'warlord', 'emperor'] as const;
export type AiTier = (typeof AI_TIERS)[number];
