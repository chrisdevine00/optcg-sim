/**
 * W57-R5 (waves 5-7 review): "This effect can be activated when ..." autos are optional, so the use
 * is asked. These helpers answer that one question for the card named, and nothing else.
 */
import { expect } from 'vitest';
import type { TestGame } from '../fixtures/index.ts';
import { dec } from './helpers.ts';

/** Is the open decision the "use this effect?" question of `cardId` (an optional auto)? */
export const asksUse = (g: TestGame, cardId: string): boolean => {
  const d = dec(g);
  return d?.kind === 'optional' && d.source?.card === cardId;
};

/** Answer yes to the "use this effect?" question of `cardId`, when it is open; returns whether it was. */
export function acceptUse(g: TestGame, cardId: string): boolean {
  if (!asksUse(g, cardId)) return false;
  g.act({ type: 'optional', accept: true });
  return true;
}

/** Answer no to the "use this effect?" question of `cardId`, which must be open. */
export function declineUse(g: TestGame, cardId: string): void {
  expect(asksUse(g, cardId), `decision: ${JSON.stringify(dec(g))}`).toBe(true);
  g.act({ type: 'optional', accept: false });
}
