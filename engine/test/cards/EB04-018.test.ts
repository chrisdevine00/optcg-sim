/** EB04-018 Megalo. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, none, pick, play } from './helpers.ts';
import { COST8 } from './helpers-luffyace.ts';
import { boost } from './helpers-op15g1.ts';
import { at, canPick, isRested, mk, RED_LEADER, V } from './helpers-eb04g1.ts';

const ID = 'EB04-018';
const rested = (card: string) => ({ card, rested: true });

describe('EB04-018 Megalo', () => {
  const start = () =>
    mk(
      { leader: RED_LEADER, hand: [ID] },
      { characters: [rested(V.c5), rested(V.c6), rested(V.c7), rested(COST8), V.c3] },
    );

  it('[On Play] you may rest this Character: K.O. a rested opposing Character with 8000 power or less', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, at(g, 'p2', 'characters', V.c5))).toBe(true); // 7000
    expect(canPick(g, at(g, 'p2', 'characters', V.c6))).toBe(true); // 8000: boundary
    expect(canPick(g, at(g, 'p2', 'characters', V.c7))).toBe(false); // 9000
    expect(canPick(g, at(g, 'p2', 'characters', COST8))).toBe(false); // 10000
    expect(canPick(g, at(g, 'p2', 'characters', V.c3))).toBe(false); // active
    pick(g, [at(g, 'p2', 'characters', V.c6)]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c6]);
    expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(true);
  });

  it('"You may": declining keeps Megalo active and K.O.s nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(false);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
    expect(dec(g)?.kind).toBe('main');
  });

  it('"up to 1": after resting, the K.O. may be skipped', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(true);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it('it is the current power: a rested 8000 raised to 9000 is out of reach', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID] }, { characters: [rested(V.c6)] });
    boost(g, at(g, 'p2', 'characters', V.c6), 1000);
    play(g, ID);
    accept(g);
    // No candidate is left in a public zone, so no prompt is shown.
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it("only your opponent's rested Characters, never your own", () => {
    const g = mk({ leader: RED_LEADER, hand: [ID], characters: [rested(V.c5)] }, {});
    play(g, ID);
    accept(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    expect(isRested(g, at(g, 'p1', 'characters', V.c5))).toBe(true);
  });
});
