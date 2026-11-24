/** OP14-089 Ryuma. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, trash, V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import { COST8, ids, koByEffect, OTHER_LEADER, start, TBP4, TBP5, TBP8 } from './helpers-op14g4.ts';

const ID = 'OP14-089';

describe('OP14-089 Ryuma', () => {
  it('[On K.O.] draws 2 then trashes exactly 2 cards from the hand', () => {
    const g = start({
      leader: OTHER_LEADER,
      characters: [ID],
      hand: [V.c1],
      deck: [BLUE, V.c2, V.c3],
    });
    koByEffect(g, 'p1', ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(trash(g, 'p1').sort()).toEqual([ID, V.c1, BLUE].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });

  it('with an empty hand the 2 drawn cards are the 2 trashed (the player still confirms them)', () => {
    const g = start({ leader: OTHER_LEADER, characters: [ID], deck: [BLUE, V.c2, V.c3] });
    koByEffect(g, 'p1', ID);
    pick(g, [g.find('p1', 'hand', BLUE), g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1').sort()).toEqual([ID, BLUE, V.c2].sort());
  });

  it('[Trigger] plays up to 1 {Thriller Bark Pirates} Character with cost 4 or less from the trash, rested', () => {
    const g = damageWith(ID, { trash: [TBP4, TBP8, TBP5, V.c4] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    // Only the cost 4 {Thriller Bark Pirates} card qualifies (not cost 8, not cost 5, not another type).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'trash', TBP4)]);
    const c = g.zone('p1', 'characters');
    expect(c.map((x) => x.card)).toEqual([TBP4]);
    expect(c[0]!.rested).toBe(true);
  });

  it('[Trigger] "up to 1": may play nothing', () => {
    const g = damageWith(ID, { trash: [TBP4, COST8] });
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });
});
