/**
 * OP16-092 Nico Robin (Character, Black, cost 1, 2000, Counter +1000, {Land of Wano}/{Straw Hat Crew}).
 *
 * Card text: "[On Play] You may trash 1 Character card with a cost of 8 or more from your hand: Draw 2
 * cards."
 *
 * Rules: CR 8-3-1-3 (a cost that cannot be paid cannot be paid).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  deckOf,
  describeTrash8Draw2,
  don,
  kind,
  LD16,
  p1main,
  playIt,
  SC16,
  no,
} from './kit-op16c.ts';

const ID = 'OP16-092';

describeTrash8Draw2(ID);

describe('OP16-092 Nico Robin: stats', () => {
  it('costs 1 to play and has no [Blocker]', () => {
    const g = p1main(LD16.wano, { hand: [ID, SC16.wano8], deck: deckOf([]) });
    playIt(g, ID);
    expect(kind(g)).toBe('optional');
    no(g, 'p1');
    expect(don(g).active).toBe(9);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).not.toContain('Blocker');
  });
});
