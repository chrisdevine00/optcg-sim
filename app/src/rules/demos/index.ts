/** The "Show me" demos of the rules reference, in the order the reference lists them. */
import type { RuleDemo } from '../types.ts';
import { BATTLE_DEMOS } from './battle.ts';
import { BOARD_DEMOS } from './board.ts';
import { EFFECT_DEMOS } from './effects.ts';
import { KEYWORD_DEMOS } from './keywords.ts';
import { TURN_DEMOS } from './turns.ts';

export const DEMOS: RuleDemo[] = [
  ...TURN_DEMOS,
  ...BATTLE_DEMOS,
  ...KEYWORD_DEMOS,
  ...BOARD_DEMOS,
  ...EFFECT_DEMOS,
];

export const demoById = (id: string): RuleDemo | undefined => DEMOS.find((d) => d.id === id);
