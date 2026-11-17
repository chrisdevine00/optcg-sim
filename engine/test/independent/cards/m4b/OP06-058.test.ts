/**
 * OP06-058 Gravity Blade Raging Tiger (Event, Blue, cost 7; Navy).
 *
 * Card text:
 *   "[Main] Place up to 2 Characters with a cost of 6 or less at the bottom of the owner's deck in
 *    any order.
 *    [Trigger] Place up to 1 Character with a cost of 5 or less at the bottom of the owner's deck."
 *
 * Rules: "Characters" is either side's (no "your"/"opponent's"); each card goes to ITS OWNER's deck
 * (CR 3-1-4 areas are per player); "up to" may be zero (CR 8-4-4-1); [Trigger] costs nothing to
 * activate (rules digest Q8: the printed cost is not paid).
 * Scenery: OP01-018 Hajrudin (cost 4), OP01-107 Babanuki is not used; OP04-087 Law (cost 5),
 * OP02-007 Thatch (cost 6), OP02-006 Kingdew (cost 5), OP02-020 LittleOars Jr. (cost 7).
 */
import { describe, expect, it } from 'vitest';
import { act, isLegal } from '../../helpers.ts';
import {
  activateTrigger,
  answerOrders,
  BLUE,
  canFinish,
  choiceCards,
  choices,
  choose,
  chooseNone,
  decider,
  deckBottom,
  hitLeader,
  kind,
  LD,
  LEAD,
  myTurn,
  rep,
  RED,
  side,
  sortedIds,
  theirTurn,
  V,
  VAN,
  sorted,
} from './kit-d.ts';

const GRAVITY = 'OP06-058';

function mainGame(p1Chars: string[], p2Chars: string[], active = 7) {
  return myTurn(
    side(LD.navy, BLUE, {
      hand: [GRAVITY],
      characters: p1Chars,
      costArea: { active, rested: 0 },
      deck: rep(BLUE, 10),
    }),
    side(LEAD.luffy, RED, { characters: p2Chars, deck: rep(RED, 10) }),
  );
}

function cast(g: ReturnType<typeof mainGame>) {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', GRAVITY) });
  // Pay the 7 DON!! from the active cost area if the engine asks.
  for (let i = 0; i < 10 && kind(g) === 'choose' && !choiceCards(g).length; i++) {
    const pay = g.legal().find((a) => a.type === 'pick');
    if (pay) g.act(pay);
    else break;
  }
}

describe('OP06-058 [Main]: place up to 2 Characters with cost 6 or less at the bottom of their owners’ decks', () => {
  it('candidates are Characters of either side with cost 6 or less; a cost-7 Character is not offered', () => {
    const g = mainGame([VAN.hajrudin], [VAN.thatch, VAN.littleOars]);
    cast(g);
    expect(choiceCards(g)).toEqual([VAN.hajrudin, VAN.thatch].sort());
  });

  it('choosing one of each side: each goes to the bottom of its own owner’s deck', () => {
    const g = mainGame([VAN.hajrudin], [VAN.thatch]);
    cast(g);
    choose(g, [g.find('p1', 'characters', VAN.hajrudin), g.find('p2', 'characters', VAN.thatch)]);
    answerOrders(g, 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(deckBottom(g, 'p1', 1)).toEqual([VAN.hajrudin]);
    expect(deckBottom(g, 'p2', 1)).toEqual([VAN.thatch]);
    expect(g.zone('p1', 'deck')).toHaveLength(11);
    expect(g.zone('p2', 'deck')).toHaveLength(11);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([GRAVITY]);
  });

  it('two Characters of one owner both reach the bottom of that deck, in either order', () => {
    const g = mainGame([], [VAN.thatch, VAN.kingdew]);
    cast(g);
    choose(g, [g.find('p2', 'characters', VAN.thatch), g.find('p2', 'characters', VAN.kingdew)]);
    answerOrders(g, 'p1');
    answerOrders(g, 'p2');
    expect(sorted(deckBottom(g, 'p2', 2))).toEqual([VAN.kingdew, VAN.thatch].sort());
    expect(g.zone('p2', 'deck')).toHaveLength(12);
  });

  it('at most 2: after two picks a third Character is not offered', () => {
    const g = mainGame([VAN.hajrudin, V.law5], [VAN.thatch]);
    cast(g);
    choose(g, [g.find('p1', 'characters', VAN.hajrudin), g.find('p2', 'characters', VAN.thatch)]);
    answerOrders(g, 'p1');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.law5]);
    expect(choices(g)).toEqual([]);
  });

  it('CR 8-4-4-1: up to 2 allows exactly 1', () => {
    const g = mainGame([VAN.hajrudin], [VAN.thatch]);
    cast(g);
    choose(g, [g.find('p2', 'characters', VAN.thatch)]);
    answerOrders(g, 'p1');
    expect(sortedIds(g, 'p2', 'characters')).toEqual([]);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([VAN.hajrudin]);
  });

  it('CR 8-4-4-1: up to 2 allows 0; the Event is still played', () => {
    const g = mainGame([VAN.hajrudin], [VAN.thatch]);
    cast(g);
    expect(canFinish(g)).toBe(true);
    chooseNone(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([VAN.hajrudin]);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.thatch]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([GRAVITY]);
  });

  it('with 6 DON!! the cost-7 Event cannot be played', () => {
    const g = mainGame([], [VAN.thatch], 6);
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', GRAVITY) })).toBe(false);
  });
});

describe('OP06-058 [Trigger]: place up to 1 Character with cost 5 or less at the bottom of its owner’s deck', () => {
  function triggered(p1Chars: string[], p2Chars: string[]) {
    const g = theirTurn(
      side(LD.navy, BLUE, {
        life: [GRAVITY, ...rep(BLUE, 3)],
        characters: p1Chars,
        deck: rep(BLUE, 10),
      }),
      side(LEAD.luffy, RED, { characters: p2Chars, deck: rep(RED, 10) }),
    );
    hitLeader(g);
    activateTrigger(g);
    return g;
  }

  it('no DON!! is paid; candidates are cost 5 or less on both sides (cost 6 is not offered)', () => {
    const g = triggered([VAN.hajrudin, V.law5], [VAN.thatch]);
    expect(choiceCards(g)).toEqual([VAN.hajrudin, V.law5].sort());
  });

  it('choosing the opponent’s Character puts it at the bottom of ITS owner’s deck', () => {
    const g = triggered([], [VAN.kingdew]);
    choose(g, [g.find('p2', 'characters', VAN.kingdew)]);
    expect(deckBottom(g, 'p2', 1)).toEqual([VAN.kingdew]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([GRAVITY]);
    expect(decider(g)).toBe('p2');
  });

  it('at most 1: after one pick no other Character is offered', () => {
    const g = triggered([VAN.hajrudin, V.law5], []);
    choose(g, [g.find('p1', 'characters', VAN.hajrudin)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.law5]);
  });

  it('CR 8-4-4-1: up to 1 may be nothing', () => {
    const g = triggered([VAN.hajrudin], [VAN.kingdew]);
    chooseNone(g);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
