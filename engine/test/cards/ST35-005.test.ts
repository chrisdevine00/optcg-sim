/** ST35-005 Bartholomew Kuma. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { idsOf, NAVY, offers, RA_4000, RA_6000, WB_LEADER } from './helpers-stg2.ts';

const ID = 'ST35-005';
const start = (handCards: string[], trash: string[] = []) =>
  game(
    { leader: WB_LEADER, hand: [ID, ...handCards], trash, costArea: { active: 5, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('ST35-005 Bartholomew Kuma', () => {
  it('on the field it has +3 cost (8) and no [Blocker]; in hand it is a plain cost 5', () => {
    const g = start([]);
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(5);
    play(g, ID);
    pick(g, [g.leader('p1')]);
    const c = g.find('p1', 'characters', ID);
    expect(g.card(c).cost).toBe(8);
    expect(g.card(c).keywords).not.toContain('Blocker');
  });

  it('[On Play] gives 1 rested DON!! to the Leader, then plays a {Revolutionary Army} Character with 4000 power from hand', () => {
    const g = start([RA_4000]);
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    pick(g, [g.find('p1', 'hand', RA_4000)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID, RA_4000]);
  });

  it('may play it from the trash', () => {
    const g = start([], [RA_4000]);
    play(g, ID);
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p1', 'trash', RA_4000)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID, RA_4000]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
  });

  it('6000 power and non-{Revolutionary Army} Characters are not candidates', () => {
    const g = start([RA_6000, NAVY.doberman, V.c1], [RA_6000]);
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(offers(g)).toEqual([]);
    g.act({ type: 'done' });
    expectDecision(g, 'main', 'p1');
  });

  it('"up to 1": the play may be skipped', () => {
    const g = start([RA_4000]);
    play(g, ID);
    pick(g, [g.leader('p1')]);
    g.act({ type: 'done' });
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });
});
