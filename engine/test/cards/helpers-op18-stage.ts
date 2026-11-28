/** The four OP-18 Thousand Sunny–style Stages share an [On Play]: draw 1, then add up to 1 rested DON!!. */
import { expect } from 'vitest';
import { addMost, BLUE, don, game, hand, play, PLAIN_BLUE } from './helpers.ts';
import { PLAIN_PURPLE } from './helpers-op18.ts';

export function stageOnPlay(id: string): void {
  const g = game(
    { leader: PLAIN_PURPLE, hand: [id], deck: [BLUE, BLUE], costArea: { active: 5, rested: 0 } },
    { leader: PLAIN_BLUE },
  );
  play(g, id);
  addMost(g);
  expect(hand(g, 'p1')).toEqual([BLUE]);
  expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([id]);
  expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 6, deck: 4 });
}
