export const AI_TIERS = ['rookie', 'pirate', 'warlord', 'emperor'] as const;
export type AiTier = (typeof AI_TIERS)[number];
