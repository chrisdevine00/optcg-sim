/** OP18-057 Atomic Dicer. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, endCounter, hand, pick, play, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { mine } from './helpers-op18-g3.ts';

const ID = 'OP18-057';
const start = (active = 5) =>
  mine(
    { hand: [ID], characters: [V.c3], costArea: { active, rested: 0 } },
    { characters: [V.c5, V.c6, V.c2] },
  );

describe('OP18-057 Atomic Dicer', () => {
  it("[Main] you may rest 3 DON!!: return up to 1 Character with a cost of 5 or less to the owner's hand", () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(candidates(g).sort()).toEqual(
      [
        g.find('p1', 'characters', V.c3),
        g.find('p2', 'characters', V.c5),
        g.find('p2', 'characters', V.c2),
      ].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(hand(g, 'p2')).toEqual([V.c5]);
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c2, V.c6].sort());
    expect(don(g, 'p1').active).toBe(1); // 1 for the Event, 3 rested
    expect(don(g, 'p1').rested).toBe(4);
  });

  it('may return your own Character', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(hand(g, 'p1')).toEqual([V.c3]);
  });

  it('a Character with a cost of 6 cannot be chosen', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(candidates(g)).not.toContain(g.find('p2', 'characters', V.c6));
  });

  it('declining the cost returns nothing and keeps the DON!!', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expect(don(g, 'p1').active).toBe(4);
  });

  it('with fewer than 3 DON!! left after the Event the cost cannot be paid', () => {
    const g = start(3);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it('[Counter] your Leader gains +3000 power during this battle', () => {
    const g = counterStep(
      { leader: 'ST04-001', hand: [ID], costArea: { active: 1, rested: 0 } },
      {},
      V.c5,
    );
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
  });
});
