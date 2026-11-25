/**
 * The tutorial's two decks (lead decision, DECISIONS 2026-11-25 "M7 plan"): Starter Deck ST-21
 * (Monkey.D.Luffy, red) for the player and ST-22 (Ace & Newgate, blue) for the opponent. Every card
 * is scripted or has no effect to script (cards/data/coverage-report.json, checked in
 * `app/test/tutorial.test.ts`).
 *
 * The 50-card counts are an approximation of each product's list (three of each non-Leader card and
 * a fourth of two): the complete product decklists are an owner check (OPEN-QUESTIONS M7-V1). The
 * eight scenarios never draw from these lists; they name their cards exactly. The first game after
 * the tutorial does.
 */
import type { DeckSpec } from '@optcg/engine';

const range = (prefix: string, from: number, to: number): string[] =>
  Array.from({ length: to - from + 1 }, (_, i) => `${prefix}-${String(from + i).padStart(3, '0')}`);

const threeEach = (ids: string[], fourth: string[]): string[] => [
  ...ids.flatMap((id) => [id, id, id]),
  ...fourth,
];

export const ST21_LEADER = 'ST21-001';
export const ST22_LEADER = 'ST22-001';

export const ST21_MAIN: string[] = threeEach(range('ST21', 2, 17), ['ST21-014', 'ST21-015']);
export const ST22_MAIN: string[] = threeEach(range('ST22', 2, 17), ['ST22-003', 'ST22-010']);

export const TUTORIAL_DECK_ST21: DeckSpec = { leader: ST21_LEADER, main: ST21_MAIN };
export const TUTORIAL_DECK_ST22: DeckSpec = { leader: ST22_LEADER, main: ST22_MAIN };

/** The deck ids Setup and the first-game preset use. */
export const TUTORIAL_DECK_IDS = { mine: 'tutorial:st21', theirs: 'tutorial:st22' } as const;
