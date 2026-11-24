/** ST31-002 Jinbe. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, none, pick, play, PLAIN_BLUE } from './helpers.ts';
import {
  donArea,
  EVENT,
  ids,
  NON_SHC1,
  offeredPicks,
  SHC1,
  SHC2,
  SHC_LEADER,
} from './helpers-stg1.ts';

const ID = 'ST31-002';

const start = (h: string[], deck: string[] = [BLUE, BLUE, BLUE]) =>
  game({ leader: SHC_LEADER, hand: [ID, ...h], deck, ...donArea(5) }, { leader: PLAIN_BLUE });

describe('ST31-002 Jinbe', () => {
  it('has [Blocker]', () => {
    const g = game({ leader: SHC_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play]: draw 1 card and play up to 1 {Straw Hat Crew} type card with a cost of 1 from your hand', () => {
    const g = start([SHC1]);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([SHC1, BLUE]); // drew first
    pick(g, [g.find('p1', 'hand', SHC1)]);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([ID, SHC1].sort());
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('the card just drawn is a candidate ("draw 1 card and play")', () => {
    const g = start([], [SHC1, BLUE, BLUE]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', SHC1)]);
    expect(ids(g, 'p1', 'characters')).toContain(SHC1);
  });

  it('cost 2 {Straw Hat Crew}, cost 1 of another type and a {Straw Hat Crew} Event (cannot be played) are not candidates', () => {
    const g = start([SHC2, NON_SHC1, EVENT]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(4);
  });

  it('"up to 1": may play none, and only 1 even with two candidates', () => {
    const a = start([SHC1]);
    play(a, ID);
    none(a);
    expect(ids(a, 'p1', 'characters')).toEqual([ID]);
    expect(hand(a, 'p1')).toEqual([SHC1, BLUE]);
    const b = start([SHC1, SHC1]);
    play(b, ID);
    expect(offeredPicks(b).length).toBeGreaterThan(0);
    pick(b, [b.find('p1', 'hand', SHC1)]);
    expect(ids(b, 'p1', 'characters').filter((c) => c === SHC1)).toHaveLength(1);
  });
});
