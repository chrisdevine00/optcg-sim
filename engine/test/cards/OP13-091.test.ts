/** OP13-091 St. Marcus Mars. */
import { describe, expect, it } from 'vitest';
import { PLAIN_PURPLE, accept, decline, dec, expectDecision, pick, play } from './helpers.ts';
import {
  canBlockWith,
  canPick,
  mine,
  names,
  plantOpponentEffect,
  rep,
  theirs,
  V,
} from './helpers-op13g4.ts';

const ID = 'OP13-091';

describe('OP13-091 St. Marcus Mars', () => {
  const start = (p2chars: string[], hand: string[] = [ID, V.c1]) =>
    mine({ leader: PLAIN_PURPLE, hand }, { characters: p2chars }, 6);

  it('[On Play] trash 1 card from hand: K.O. a base cost 5 Character', () => {
    const g = start([V.c5, V.c6]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(names(g, 'p1', 'trash')).toEqual([V.c1]);
    expect(names(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it('base cost 6 is not a candidate (5 or less); with no candidate nothing is K.O.d', () => {
    const g = start([V.c6]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    if (dec(g)?.kind === 'choose') expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    if (dec(g)?.kind === 'choose') g.act({ type: 'done' });
    expect(names(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it('declining the optional trash skips the K.O.', () => {
    const g = start([V.c5]);
    play(g, ID);
    decline(g);
    expect(names(g, 'p2', 'characters')).toEqual([V.c5]);
    expect(names(g, 'p1', 'trash')).toEqual([]);
  });

  it('the trash threshold: with 7 cards an opponent effect cannot K.O. it and it blocks; with 6 neither', () => {
    for (const [n, safe] of [
      [7, true],
      [6, false],
    ] as const) {
      const g = theirs({ leader: PLAIN_PURPLE, characters: [ID], trash: rep(n, V.c1) });
      plantOpponentEffect(g, {
        ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
      });
      expect(names(g, 'p1', 'characters')).toEqual(safe ? [ID] : []);
    }
    const g = theirs(
      { leader: PLAIN_PURPLE, characters: [ID], trash: rep(7, V.c1) },
      { characters: [V.c7] },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });
});
