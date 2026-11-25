/** OP09-005 Silvers Rayleigh. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { boost, canBlockWith, mk, p2Attacks, shrink } from './helpers-a09g1.ts';

const ID = 'OP09-005';
const deck = [V.c1, V.c2, V.c3, V.c4, V.c5];

describe('OP09-005 Silvers Rayleigh', () => {
  it('[On Play]: with 2 opponent Characters of base power 5000 or more, draws 2 cards and trashes 1 card from your hand', () => {
    const g = mk({ hand: [ID, V.c7], deck }, { characters: [V.c3, V.c4] });
    play(g, ID);
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2, V.c7].sort());
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c7)]);
    expect(trash(g, 'p1')).toEqual([V.c7]);
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('exactly 1 is trashed and a drawn card may be the one', () => {
    const g = mk({ hand: [ID], deck }, { characters: [V.c3, V.c4] });
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('boundary: base power 5000 counts, 4000 does not (one of each: nothing happens)', () => {
    const g = mk({ hand: [ID, V.c7], deck }, { characters: [V.c3, V.c2] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c7]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('reads BASE power: a 4000 Character buffed to 6000 does not count, a 5000 one lowered to 1000 does', () => {
    const a = mk({ hand: [ID, V.c7], deck }, { characters: [V.c3, V.c2] });
    boost(a, a.find('p2', 'characters', V.c2), 2000);
    play(a, ID);
    expectDecision(a, 'main', 'p1');
    expect(hand(a, 'p1')).toEqual([V.c7]);

    const b = mk({ hand: [ID, V.c7], deck }, { characters: [V.c3, V.c4] });
    shrink(b, b.find('p2', 'characters', V.c3), 4000);
    play(b, ID);
    expectDecision(b, 'choose', 'p1');
  });

  it("only the opponent's Characters count (not their Leader, not your own)", () => {
    const g = mk({ hand: [ID, V.c7], deck, characters: [V.c4, V.c5] }, { characters: [V.c4] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c7]);
  });

  it('has [Blocker]: it may be declared as the blocker of an attack', () => {
    const g = p2Attacks({ leader: 'ST01-001', characters: [ID] }, V.c4, [V.c4]);
    expectDecision(g, 'block', 'p1');
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });
});
