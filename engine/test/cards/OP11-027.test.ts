/** OP11-027 Bulge-Eyed Neptunian. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { canHit, FISH_LEADER, mk, RED_LEADER, SHIRAHOSHI_LEADER } from './helpers-op11g1.ts';

const ID = 'OP11-027';
const p2 = { characters: [{ card: V.c1, rested: true }, V.c2] };

describe('OP11-027 Bulge-Eyed Neptunian', () => {
  it('with [Shirahoshi] as Leader, it can attack Characters on the turn it is played', () => {
    const g = mk(
      { leader: SHIRAHOSHI_LEADER, characters: [{ card: ID, playedThisTurn: true }] },
      p2,
    );
    expect(canHit(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', V.c1))).toBe(true);
  });

  it('it is [Rush: Character]: not the Leader, and not an active Character', () => {
    const g = mk(
      { leader: SHIRAHOSHI_LEADER, characters: [{ card: ID, playedThisTurn: true }] },
      p2,
    );
    expect(canHit(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(false);
    expect(canHit(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', V.c2))).toBe(false);
  });

  it('without a [Shirahoshi] Leader it cannot attack the turn it is played', () => {
    const g = mk({ leader: RED_LEADER, characters: [{ card: ID, playedThisTurn: true }] }, p2);
    expect(canHit(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', V.c1))).toBe(false);
  });

  it('another Fish-Man Island style Leader does not count (the exact name [Shirahoshi])', () => {
    const g = mk({ leader: FISH_LEADER, characters: [{ card: ID, playedThisTurn: true }] }, p2);
    expect(canHit(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', V.c1))).toBe(false);
  });

  it('on later turns it attacks normally (not played this turn)', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID] }, p2);
    expect(canHit(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });
});
