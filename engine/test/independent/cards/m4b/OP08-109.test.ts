/**
 * OP08-109 Mont Blanc Noland (Character, Yellow, cost 5, 6000, Counter +1000, {Jaya}/{Botanist}).
 *
 * Card text: "[On Play] If your Leader has the [Shandian Warrior] type and you have a [Kalgara] Character,
 * add up to 1 card from the top of your deck to the top of your Life cards."
 *
 * Reading: [Shandian Warrior] is the type (CR 2-4-3); [Kalgara] is the card name (CR 2-1-2), and
 * "you have a Character" means on your field.
 * Rules: CR 8-3-3 (a failed "if" resolves nothing), CR 8-4-4-1 ("up to" allows 0).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  BLUE,
  declineAny,
  deck,
  lifeCards,
  mine,
  playCard,
  RED,
  SC,
  settleYes,
  YL,
} from './kit-a.ts';

const KALGARA_CHAR = SC.kalgara6; // OP08-099, named Kalgara
const KALGARA_3 = 'OP15-101'; // also named Kalgara

function played(leader: string, characters: string[], handExtra: string[] = []) {
  const g = mine(leader, {
    hand: ['OP08-109', ...handExtra],
    characters,
    life: fill(RED, 3),
    deck: [SC.bobbin, ...fill(BLUE, 10)],
  });
  playCard(g, 'OP08-109');
  return g;
}

describe('OP08-109 Mont Blanc Noland: [On Play] with a Shandian Warrior Leader and a [Kalgara] Character, add to Life', () => {
  it('both conditions: the top card of the deck goes on top of Life', () => {
    const g = played(YL.shandian, [KALGARA_CHAR]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(lifeCards(g)[0]).toBe(SC.bobbin);
    expect(deck(g)).toHaveLength(10);
  });

  it('any Character named [Kalgara] counts, whatever its cost or other text', () => {
    const g = played(YL.shandian, [KALGARA_3]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(4);
  });

  it('CR 8-3-3: a Leader without {Shandian Warrior} ({Sky Island} only) does nothing', () => {
    const g = played(YL.sky, [KALGARA_CHAR]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(3);
    expect(deck(g)).toHaveLength(11);
  });

  it('CR 8-3-3: no [Kalgara] Character on the field does nothing, even with the Kalgara Leader', () => {
    const g = played(YL.shandian, []);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(3);
  });

  it('a [Kalgara] in hand (not on the field) does not count', () => {
    const g = played(YL.shandian, [], [KALGARA_CHAR]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(3);
  });

  it('another {Shandian Warrior} Character with a different name does not count', () => {
    const g = played(YL.shandian, [SC.seto, SC.genbo]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(3);
  });

  it('CR 8-4-4-1: "up to 1" may be declined', () => {
    const g = played(YL.shandian, [KALGARA_CHAR]);
    declineAny(g);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(3);
    expect(deck(g)).toHaveLength(11);
  });
});
