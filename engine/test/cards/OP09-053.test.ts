/** OP09-053 Mohji. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick, ids, mk, settle } from './helpers-a09g2.ts';
import { BLK2 } from './helpers-op11g1.ts';

const ID = 'OP09-053';
const RICHIE = 'OP09-054';

describe('OP09-053 Mohji', () => {
  it('[On Play]: adds [Richie] to your hand, the other 4 go to the bottom, then plays up to 1 [Richie] from hand', () => {
    const g = mk({ hand: [ID], deck: [V.c1, RICHIE, V.c2, V.c3, V.c4, V.c5, V.c6] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', RICHIE))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'deck', RICHIE)]);
    expect(hand(g, 'p1')).toEqual([RICHIE]);
    settle(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck.slice(0, 2)).toEqual([V.c5, V.c6]);
    expect(deck.slice(2).sort()).toEqual([V.c1, V.c2, V.c3, V.c4].sort());
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', RICHIE)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, RICHIE]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.card(g.find('p1', 'characters', RICHIE)).rested).toBe(false);
  });

  it('the play is not conditioned on the reveal: a [Richie] already in hand can be played after taking nothing', () => {
    const g = mk({ hand: [ID, RICHIE], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6] });
    play(g, ID);
    none(g);
    settle(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', RICHIE)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, RICHIE]);
  });

  it('only a card named [Richie] can be played (another [Blocker] Character is not offered)', () => {
    const g = mk({ hand: [ID, RICHIE, BLK2], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6] });
    play(g, ID);
    none(g);
    settle(g);
    expect(canPick(g, g.find('p1', 'hand', RICHIE))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', BLK2))).toBe(false);
  });

  it('"up to 1": the played [Richie] may be declined and stays in hand', () => {
    const g = mk({ hand: [ID], deck: [RICHIE, V.c1, V.c2, V.c3, V.c4, V.c5] });
    play(g, ID);
    pick(g, [g.find('p1', 'deck', RICHIE)]);
    settle(g);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([RICHIE]);
  });

  it('without a [Richie] anywhere nothing is played and no play prompt is asked', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    settle(g);
    if (dec(g)?.kind === 'choose') none(g);
    expect(dec(g)?.kind).toBe('main');
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('looks only at the top 5: a [Richie] in 6th place is not offered', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, RICHIE] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });
});
