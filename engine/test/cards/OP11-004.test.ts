/** OP11-004 Kujyaku. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import { activate, canPick, mk, NAVY, offeredAb, pw, settle } from './helpers-op11g1.ts';

const ID = 'OP11-004';
const deck5 = [NAVY.c1, V.c1, ID, NAVY.c2, V.c2];

describe('OP11-004 Kujyaku', () => {
  it('[On Play]: reveals a {Navy} card other than [Kujyaku] to hand; the other 4 go to the bottom in any order', () => {
    const g = mk({ hand: [ID], deck: [...deck5, V.c3, V.c4] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', NAVY.c2)]);
    expect(hand(g, 'p1')).toEqual([NAVY.c2]);
    settle(g);
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([
      V.c3,
      V.c4,
      ...g
        .zone('p1', 'deck')
        .slice(2)
        .map((c) => c.card),
    ]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
    expect(
      g
        .zone('p1', 'deck')
        .slice(2)
        .map((c) => c.card)
        .sort(),
    ).toEqual([NAVY.c1, V.c1, ID, V.c2].sort());
  });

  it('only {Navy} cards other than [Kujyaku] are selectable', () => {
    const g = mk({ hand: [ID], deck: deck5 });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', NAVY.c1))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', NAVY.c2))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false);
  });

  it('"up to 1": two {Navy} cards among the top 5 cannot both be taken', () => {
    const g = mk({ hand: [ID], deck: deck5 });
    play(g, ID);
    expect(() => pick(g, [g.find('p1', 'deck', NAVY.c1), g.find('p1', 'deck', NAVY.c2)])).toThrow(
      /can be picked now/,
    );
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('"up to 1": may take nothing', () => {
    const g = mk({ hand: [ID], deck: [...deck5, V.c3] });
    play(g, ID);
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
  });

  it('looks only at the top 5: a {Navy} card in 6th place is not offered', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, NAVY.c1] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(dec(g)?.kind === 'choose' ? 'choose' : 'none').toBeDefined();
  });

  it('[Activate: Main]: trash this Character; another Character gains +1000 power this turn', () => {
    const g = mk({ characters: [ID, V.c1] });
    activate(g, g.find('p1', 'characters', ID), 'trash-boost');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([ID]);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(pw(g, 'p1', V.c1)).toBe(4000);
    g.act({ type: 'endTurn' });
    expect(pw(g, 'p1', V.c1)).toBe(3000);
  });

  it('the +1000 cannot target Kujyaku itself (it is trashed as the cost)', () => {
    const g = mk({ characters: [ID] });
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'trash-boost')).toBe(true);
    activate(g, g.find('p1', 'characters', ID), 'trash-boost');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(dec(g)?.kind).toBe('main');
  });
});
