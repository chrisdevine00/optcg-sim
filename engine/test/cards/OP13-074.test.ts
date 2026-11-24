/** OP13-074 Hera. */
import { describe, expect, it } from 'vitest';
import type { GameState } from '@optcg/engine';
import { internals } from '../../src/testing.ts';
import { don, none, play, V } from './helpers.ts';
import { HOMIES3, HOMIES5, idsOf, mine, pickableCards, pickCard } from './helpers-op13g3.ts';

const ID = 'OP13-074';

describe('OP13-074 Hera', () => {
  const start = (hand: string[]) => mine({ hand: [ID, ...hand] }, {}, 8);

  it('[On Play] play up to 1 [Homies] type Character card with 3000 power or less from your hand', () => {
    const g = start([HOMIES3, HOMIES5, V.c1]);
    play(g, ID);
    // The 3000 Homies only: 5000 power is too strong, the other 3000 is not a Homies.
    expect(pickableCards(g)).toEqual([HOMIES3]);
    pickCard(g, HOMIES3);
    expect(idsOf(g, 'p1', 'characters').sort()).toEqual([HOMIES3, ID].sort());
    expect(idsOf(g, 'p1', 'hand').sort()).toEqual([HOMIES5, V.c1].sort());
  });

  it('boundary: only a 5000-power Homies in hand gives no candidate', () => {
    const g = start([HOMIES5]);
    play(g, ID);
    expect(pickableCards(g)).toEqual([]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  // No real {Homies} Character has 3001 to 4000 power, so the pool cannot show the "3000 or less"
  // boundary (OP13-R8); the printed power of the 3000 Homies is raised in a copy of the game's defs.
  it('boundary: a {Homies} with 3001 power is not offered, with 3000 it is (power 3000 or less)', () => {
    const power = (n: number) => {
      const g = start([HOMIES3]);
      const s = internals(g.state);
      g.state = {
        ...s,
        defs: { ...s.defs, [HOMIES3]: { ...s.defs[HOMIES3]!, power: n } },
      } as unknown as GameState;
      play(g, ID);
      return pickableCards(g);
    };
    expect(power(3000)).toEqual([HOMIES3]);
    expect(power(3001)).toEqual([]);
    expect(power(4000)).toEqual([]);
  });

  it('the Character is played for free (no DON!! spent on it) and enters active', () => {
    const g = start([HOMIES3]);
    play(g, ID);
    const before = don(g, 'p1');
    pickCard(g, HOMIES3);
    expect(don(g, 'p1')).toMatchObject({ active: before.active, rested: before.rested });
    expect(g.card(g.find('p1', 'characters', HOMIES3)).rested).toBe(false);
  });

  it('"up to 1": may play nothing', () => {
    const g = start([HOMIES3]);
    play(g, ID);
    none(g);
    expect(idsOf(g, 'p1', 'hand')).toEqual([HOMIES3]);
  });

  it('an Event or Stage in hand is never a candidate (Characters only)', () => {
    const g = start(['OP04-096', HOMIES3]);
    play(g, ID);
    expect(pickableCards(g)).toEqual([HOMIES3]);
  });
});
