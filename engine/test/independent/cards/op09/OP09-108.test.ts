/**
 * OP09-108 Bartholomew Kuma (Character, Yellow, cost 4, 5000, Counter +2000, {Revolutionary
 * Army}/{The Seven Warlords of the Sea}, Strike).
 *
 * Card text: "[Trigger] If your Leader has the "Revolutionary Army" type and you and your opponent
 * have a total of 5 or less Life cards, play this card."
 *
 * Rules: see OP09-100 (same [Trigger]): the Life card being resolved is in no area (CR 10-1-5-3); a
 * failed condition sends the activated card to the trash; a [Trigger] play costs nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  chr,
  describeRaTrigger,
  LD9,
  mine,
  onField,
  triggerGame,
} from './kit-op09c.ts';

const KUMA = 'OP09-108';

describeRaTrigger({ id: KUMA, cost: 4, power: 5000, counter: 2000 });

describe('OP09-108 Bartholomew Kuma: no effect other than the [Trigger]', () => {
  it('has no keyword and no [Blocker]', () => {
    const g = mine(LD9.rev, { characters: [KUMA] }, {});
    expect(g.card(chr(g, 'p1', KUMA)).keywords).toEqual([]);
  });

  it('the Life total is read at resolution: a very small total (0 + 0) also plays it', () => {
    const g = triggerGame(KUMA, { before: 1, p2Life: 0 });
    activateTrigger(g);
    expect(onField(g, KUMA)).toBe(true);
  });

  it('a large board does not matter: only Life cards are counted', () => {
    const g = triggerGame(KUMA, {
      before: 3,
      p2Life: 3,
      characters: ['OP01-010', 'OP01-012', 'OP01-023', 'OP01-018'],
    });
    activateTrigger(g);
    expect(onField(g, KUMA)).toBe(true);
  });
});
