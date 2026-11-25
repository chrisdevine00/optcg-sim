/**
 * OP10-065 Sugar (Character, Purple, cost 1, 1000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[Activate: Main] You may rest 1 of your DON!! cards and this Character: Look at 5 cards from
 * the top of your deck; reveal up to 1 "Donquixote Pirates" type card and add it to your hand. Then,
 * place the rest at the bottom of your deck in any order."
 *
 * Rules: [Activate: Main] is used in my Main Phase (CR 10-2-...), the cost rests 1 active DON!! and this
 * Character (a rested card cannot be rested again), CR 8-1-2 ("up to"), CR 11-2-1 (revealed cards), a
 * type in quotation marks matches by inclusion (CR 2-4-3-1), "card" includes Events. No Leader condition.
 * Scenery: OP05-035 Bellamy and OP10-073 Buffalo ({Donquixote Pirates}), OP04-036 Donquixote Family
 * ({Donquixote Pirates} Event), OP09-031 Donquixote Doflamingo ({Donquixote Pirates}/{...}), OP01-023 Marco.
 */
import { describe, expect, it } from 'vitest';
import { act, endTurn } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  C10,
  deck,
  describeLook,
  donSum,
  hand,
  inst,
  L10,
  mine,
  need,
  offeredAbilities,
  offeredNow,
  pickCards,
  settleOrders,
  theirs,
  useAbility,
} from './kit-op10b.ts';
import type { CardId } from '@optcg/engine';

const SUGAR = 'OP10-065';
const DP_EVENT = 'OP04-036';
const DP_ALT = 'OP09-031';

const field = (deckTop: CardId[], leader: string = L10.dp, costArea = { active: 5, rested: 0 }) =>
  mine(leader, { characters: [SUGAR], deck: deckTop, costArea });
const start = (deckTop: CardId[]) => {
  const g = field(deckTop);
  useAbility(g, inst(g, 'p1', 'characters', SUGAR));
  return g;
};

describeLook({
  id: SUGAR,
  n: 5,
  start,
  match: [C10.bellamyDp, C10.buffalo4],
  substr: DP_ALT,
  miss: C10.marco,
});

describe('OP10-065 Sugar: [Activate: Main] rest 1 DON!! and this Character: look at 5 for a {Donquixote Pirates} card', () => {
  const rest = Array.from({ length: 9 }, () => BLUE);
  const sugar = (g: ReturnType<typeof field>) => inst(g, 'p1', 'characters', SUGAR);

  it('the cost rests exactly 1 DON!! and Sugar herself', () => {
    const g = start([C10.bellamyDp, C10.marco, C10.marco, C10.marco, C10.marco, ...rest]);
    expect(donSum(g)).toMatchObject({ active: 4, rested: 1 });
    expect(g.card(sugar(g)).rested).toBe(true);
  });

  it('a {Donquixote Pirates} Event qualifies ("card")', () => {
    const g = start([DP_EVENT, C10.marco, C10.marco, C10.marco, C10.marco, ...rest]);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([DP_EVENT]);
    pickCards(g, [DP_EVENT]);
    settleOrders(g);
    expect(hand(g)).toEqual([DP_EVENT]);
  });

  it('there is no Leader condition: with a Leader that is not {Donquixote Pirates} it still works', () => {
    const g = field(
      [C10.bellamyDp, C10.marco, C10.marco, C10.marco, C10.marco, ...rest],
      L10.luffy,
    );
    useAbility(g, sugar(g));
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.bellamyDp]);
  });

  it('a rested Sugar cannot be activated again (her rest is part of the cost)', () => {
    const g = start([C10.bellamyDp, C10.marco, C10.marco, C10.marco, C10.marco, ...rest]);
    pickCards(g, [C10.bellamyDp]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(offeredAbilities(g, sugar(g))).toEqual([]);
  });

  it('with no active DON!! the ability is not offered', () => {
    const g = field([C10.bellamyDp, ...rest], L10.dp, { active: 0, rested: 3 });
    expect(offeredAbilities(g, sugar(g))).toEqual([]);
  });

  it('a Sugar that is already rested has no ability to activate', () => {
    const g = mine(L10.dp, {
      characters: [{ card: SUGAR, rested: true }],
      deck: [C10.bellamyDp, ...rest],
    });
    expect(offeredAbilities(g, sugar(g))).toEqual([]);
  });

  it('it is a Main Phase ability: the opponent cannot use it on their turn and I cannot in their turn', () => {
    const g = theirs(L10.dp, { characters: [SUGAR] }, {});
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', SUGAR))).toEqual([]);
  });

  it('it can be used again on my next turn (she is active again after the Refresh Phase)', () => {
    const g = start([C10.bellamyDp, C10.marco, C10.marco, C10.marco, C10.marco, ...rest]);
    pickCards(g, [C10.bellamyDp]);
    settleOrders(g);
    endTurn(g);
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, sugar(g))).toHaveLength(1);
    expect(deck(g).length).toBeGreaterThan(0);
  });
});
