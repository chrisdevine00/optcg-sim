/** ST16-002 Gordon. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  dec,
  expectDecision,
  game,
  hand,
  none,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  trash,
  V,
} from './helpers.ts';
import { MUSIC, NOT_MUSIC, offeredPicks } from './helpers-w6c2.ts';

const ID = 'ST16-002';
/** p2's Character attacks p1's Leader; p1 holds `hand`, Gordon on the field. Stops at Gordon's trigger. */
const mk = (p1: Partial<PlayerSpec> = {}) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [ID], hand: [MUSIC, MUSIC, NOT_MUSIC, V.c3], ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c5] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
  return g;
};

describe('ST16-002 Gordon', () => {
  it('has [Blocker]', () => {
    const g = mk({ hand: [] });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });

  it('[On Your Opponent\'s Attack]: trash any number of "Music" cards; your Leader gets +1000 for each during this battle', () => {
    const g = mk();
    expectDecision(g, 'choose', 'p1');
    // Only the {Music} cards are offered, not the other Event or the Character.
    expect(offeredPicks(g)).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', MUSIC, 0), g.find('p1', 'hand', MUSIC, 1)]);
    expect(trash(g, 'p1')).toEqual([MUSIC, MUSIC]);
    expect(hand(g, 'p1')).toEqual([NOT_MUSIC, V.c3]);
    // Leader or 1 of your Characters: the Leader and Gordon are the candidates.
    expect(offeredPicks(g).sort()).toEqual([g.leader('p1'), g.find('p1', 'characters', ID)].sort());
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(5000 + 2000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(0);
  });

  it('the bonus can go to a Character instead, and scales with the number trashed', () => {
    const g = mk();
    pick(g, [g.find('p1', 'hand', MUSIC, 0)]);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(1000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"You may": trashing none asks nothing more and gives nothing', () => {
    const g = mk();
    none(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toHaveLength(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
    // The attack goes on: the next decision is the block step.
    expect(dec(g)?.kind).toBe('block');
  });

  it('the bonus lasts for the battle only', () => {
    const g = mk();
    pick(g, [g.find('p1', 'hand', MUSIC, 0)]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('hidden hand: with no card of the type the pick is still asked, at max 0; an empty hand is not asked at all', () => {
    const noMusic = mk({ hand: [NOT_MUSIC, V.c3] });
    expect(dec(noMusic)?.kind).toBe('choose');
    expect(offeredPicks(noMusic)).toEqual([]);
    none(noMusic);
    expect(dec(noMusic)?.kind).toBe('block');

    const empty = mk({ hand: [] });
    expect(dec(empty)?.kind).toBe('block');
  });
});
