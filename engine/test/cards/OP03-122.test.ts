/** OP03-122 Sogeking. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { idsOf, NAVY_LEADER, offers } from './helpers-stg2.ts';
import { OP03_122 } from '../../../cards/effects/OP-03/OP03-122.ts';

const ID = 'OP03-122';
const start = (mine: string[], opp: string[]) =>
  game(
    {
      leader: NAVY_LEADER,
      hand: [ID, BLUE, PURPLE],
      deck: [V.c1, V.c2, V.c3],
      characters: mine,
      costArea: { active: 7, rested: 0 },
    },
    { leader: PLAIN_BLUE, characters: opp },
  );

describe('OP03-122 Sogeking', () => {
  it("[On Play] returns an opposing Character with cost 6 to its owner's hand, then draws 2 and trashes 2", () => {
    const g = start([], [V.c6, V.c7]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(hand(g, 'p2')).toEqual([V.c6]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c7]);
    // Hand: BLUE, PURPLE + 2 drawn; trash 2 of the 4.
    expect(g.zone('p1', 'hand')).toHaveLength(4);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', BLUE), g.find('p1', 'hand', PURPLE)]);
    expect(trash(g, 'p1').sort()).toEqual([BLUE, PURPLE].sort());
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    expectDecision(g, 'main', 'p1');
  });

  it('a Character with cost 7 is not a candidate (cost 6 is), whoever controls it; Sogeking itself (cost 7) is not either', () => {
    const g = start([V.c6], [V.c7, V.c6]);
    play(g, ID);
    expect(new Set(offers(g))).toEqual(
      new Set([g.find('p1', 'characters', V.c6), g.find('p2', 'characters', V.c6)]),
    );
  });

  it('may return your own Character to your hand', () => {
    const g = start([V.c4], []);
    play(g, ID);
    pick(g, [g.find('p1', 'characters', V.c4)]);
    expect(hand(g, 'p1')).toContain(V.c4);
    expect(g.zone('p1', 'hand')).toHaveLength(5);
  });

  it('"up to 1": returning nobody still draws 2 and trashes 2', () => {
    const g = start([], [V.c6]);
    play(g, ID);
    g.act({ type: 'done' });
    expect(g.zone('p1', 'hand')).toHaveLength(4);
    pick(g, [g.find('p1', 'hand', BLUE), g.find('p1', 'hand', PURPLE)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c6]);
    expect(trash(g, 'p1')).toHaveLength(2);
  });

  it('is also named [Usopp] (rules.alsoNamed)', () => {
    expect(OP03_122.rules).toEqual([{ alsoNamed: ['Usopp'] }]);
  });
});
