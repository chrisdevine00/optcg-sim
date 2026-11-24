/** OP13-023 Uta. */
import { applyOp } from '../../src/testing.ts';
import { describe, expect, it } from 'vitest';
import { don, expectDecision, none, option, pick, play, setMost, V } from './helpers.ts';
import { mk } from './helpers-op13g1.ts';

const ID = 'OP13-023';

describe('OP13-023 Uta', () => {
  const canPlay = (g: ReturnType<typeof mk>, card: string) =>
    g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', card), player: 'p1' });

  it('[On Play]: sets up to 2 DON!! as active', () => {
    const g = mk({ hand: [ID], costArea: { active: 4, rested: 4 } });
    play(g, ID);
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 6 });
  });

  it('[On Play] "up to 2": a count is asked; 0 sets none, 1 sets one (OP14-R2)', () => {
    const g = mk({ hand: [ID], costArea: { active: 4, rested: 4 } });
    play(g, ID);
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 7 });
    const h = mk({ hand: [ID], costArea: { active: 4, rested: 4 } });
    play(h, ID);
    option(h, '0');
    expect(don(h, 'p1')).toMatchObject({ active: 0, rested: 8 });
  });

  it('[On Play]: then you cannot play Characters with a base cost of 5 or more this turn (4 or less still can be played)', () => {
    const g = mk({ hand: [ID, V.c5, V.c6, V.c4], costArea: { active: 8, rested: 0 } });
    play(g, ID);
    setMost(g);
    expect(canPlay(g, V.c5)).toBe(false);
    expect(canPlay(g, V.c6)).toBe(false);
    expect(canPlay(g, V.c4)).toBe(true);
  });

  it('the restriction ends with the turn', () => {
    const g = mk({ hand: [ID, V.c5], costArea: { active: 8, rested: 0 } });
    play(g, ID);
    setMost(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(canPlay(g, V.c5)).toBe(true);
  });

  it('[On K.O.]: plays up to 1 Character with a cost of 5 or less from your hand rested', () => {
    const g = mk({ characters: [ID], hand: [V.c5, V.c6, V.c3] });
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    expectDecision(g, 'choose', 'p1');
    // Boundary: cost 5 and 3 are offered, cost 6 is not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', V.c5)]);
    const played = g.find('p1', 'characters', V.c5);
    expect(g.card(played).rested).toBe(true);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([V.c6, V.c3]);
  });

  it('[On K.O.]: "up to 1" may choose nothing; an empty-handed player plays nothing', () => {
    const g = mk({ characters: [ID], hand: [V.c3] });
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
  });

  it('[On K.O.]: is not blocked by the base-cost-5 restriction when the K.O. comes later with a cost 4 pick; a base cost 5 pick is blocked the same turn (reading)', () => {
    const g = mk({ hand: [ID, V.c5, V.c4], costArea: { active: 8, rested: 0 } });
    play(g, ID);
    setMost(g);
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered).toContain(g.find('p1', 'hand', V.c4));
    expect(offered).not.toContain(g.find('p1', 'hand', V.c5));
  });
});
