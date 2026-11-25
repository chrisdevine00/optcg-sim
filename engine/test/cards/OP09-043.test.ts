/** OP09-043 Alvida. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, V, BLUE } from './helpers.ts';
import { koByBattle } from './helpers-st2627.ts';
import { canPick, CG_LEADER, ids, koByEffect, mk, OTHER_LEADER } from './helpers-a09g2.ts';

const ID = 'OP09-043';
const H = [V.c5, V.c6, V.c3, ID];

describe('OP09-043 Alvida', () => {
  it('[On K.O.] with a {Cross Guild} Leader: plays a Character with cost 5 or less from hand', () => {
    const g = mk({ leader: CG_LEADER, characters: [ID], hand: H });
    koByEffect(g, 'p1', ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', V.c5))).toBe(true); // boundary: cost 5
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c6))).toBe(false); // cost 6
    expect(canPick(g, g.find('p1', 'hand', ID))).toBe(false); // another [Alvida]
    pick(g, [g.find('p1', 'hand', V.c5)]);
    expect(ids(g, 'p1', 'characters')).toEqual([V.c5]);
    expect(g.card(g.find('p1', 'characters', V.c5)).rested).toBe(false);
    expect(hand(g, 'p1')).toEqual([V.c6, V.c3, ID]);
  });

  it("also triggers when K.O.'d in battle", () => {
    const g = koByBattle({ leader: CG_LEADER, hand: H }, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(ids(g, 'p1', 'characters')).toEqual([V.c3]);
  });

  it('without a {Cross Guild} Leader nothing is played and nothing is asked', () => {
    const g = mk({ leader: OTHER_LEADER, characters: [ID], hand: H });
    koByEffect(g, 'p1', ID);
    expect(dec(g)?.kind).toBe('main');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toHaveLength(4);
  });

  it('"up to 1": may play nothing', () => {
    const g = mk({ leader: CG_LEADER, characters: [ID], hand: H });
    koByEffect(g, 'p1', ID);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toHaveLength(4);
  });

  it('only a Character can be played: an Event in hand is not a candidate', () => {
    const g = mk({ leader: CG_LEADER, characters: [ID], hand: ['OP03-056', BLUE] });
    koByEffect(g, 'p1', ID);
    expect(canPick(g, g.find('p1', 'hand', 'OP03-056'))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', BLUE))).toBe(true);
  });
});
