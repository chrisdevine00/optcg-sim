/** ST35-004 Koala. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { idsOf, NAVY, offers, RA_4000, RA_6000, WB_LEADER } from './helpers-stg2.ts';

const ID = 'ST35-004';
const start = (handCards: string[], trash: string[] = []) =>
  game(
    { leader: WB_LEADER, hand: [ID, ...handCards], trash, costArea: { active: 7, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('ST35-004 Koala', () => {
  it('on the field it gains [Blocker] and +1 cost; in hand it is a plain cost 7', () => {
    const g = start([]);
    const inHand = g.find('p1', 'hand', ID);
    expect(g.card(inHand).cost).toBe(7);
    expect(g.card(inHand).keywords).not.toContain('Blocker');
    play(g, ID);
    pick(g, [g.leader('p1')]);
    const c = g.find('p1', 'characters', ID);
    expect(g.card(c).cost).toBe(8);
    expect(g.card(c).keywords).toContain('Blocker');
  });

  it('[On Play] gives 1 rested DON!! to the Leader, then plays a {Revolutionary Army} Character with 4000 power (boundary) from hand', () => {
    const g = start([RA_4000]);
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    pick(g, [g.find('p1', 'hand', RA_4000)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID, RA_4000]);
  });

  it('may play it from the trash instead; the hand and the trash are offered together', () => {
    const g = start([RA_4000], [RA_4000]);
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(offers(g)).toHaveLength(2);
    pick(g, [g.find('p1', 'trash', RA_4000)]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
    expect(idsOf(g, 'p1', 'hand')).toEqual([RA_4000]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID, RA_4000]);
  });

  it('6000 power and non-{Revolutionary Army} Characters are not candidates', () => {
    const g = start([RA_6000, NAVY.doberman, V.c1], [RA_6000]);
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(offers(g)).toEqual([]);
    g.act({ type: 'done' });
    expectDecision(g, 'main', 'p1');
  });

  it('"up to 1": the play may be skipped, the DON!! is still given', () => {
    const g = start([RA_4000]);
    play(g, ID);
    pick(g, [g.leader('p1')]);
    g.act({ type: 'done' });
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'hand')).toEqual([RA_4000]);
  });
});
