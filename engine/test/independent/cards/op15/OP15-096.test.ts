/**
 * OP15-096 Swallow Bond en Avant (Event, Black, cost 0, {Straw Hat Crew}).
 *
 * Card text:
 *   "[Main] You may rest 1 of your DON!! cards: If your Leader has the {Straw Hat Crew} type, trash 5 cards
 *    from the top of your deck.
 *    [Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Character cards gains +3000
 *    power during this battle."
 *
 * Rules relied on: CR 8-3-1 / RD 120 (cost before the colon, "you may" optional, an unpayable cost makes
 * the effect unusable), RD 122 (the condition gates the effect, the cost is paid anyway), CR 9-2-1-2
 * (0 cards in the deck loses), "during this battle" duration, "up to" may choose nothing, the Event
 * leaves the hand when played so it cannot pay its own hand cost.
 */
import { describe, expect, it } from 'vitest';
import {
  anyOrder,
  at,
  atMain,
  attack,
  canCounterNow,
  chooseIfAsked,
  decision,
  deck,
  deckTop,
  don,
  hand,
  kind,
  LD15,
  mine,
  need,
  no,
  noDefence,
  passBlock,
  payDon,
  pickAny,
  playRaw,
  reachablePickSets,
  result,
  SC15,
  skipChoice,
  theirs,
  trash,
  unusable,
  useCounter,
  yes,
  mayChooseNone,
} from './kit-op15c.ts';

const SWALLOW = 'OP15-096';
const TOP5 = [SC15.red2, SC15.red3, SC15.red4, SC15.red5, SC15.red6];

function castMain(g: ReturnType<typeof mine>, rest = true) {
  playRaw(g, g.find('p1', 'hand', SWALLOW));
  if (kind(g) === 'optional') {
    if (rest) {
      yes(g, 'p1');
      if (decision(g)) payDon(g, 1, 'costActive');
    } else no(g, 'p1');
  }
  if (decision(g)) anyOrder(g);
}

describe('OP15-096 Swallow Bond en Avant [Main]', () => {
  const start = (leader: string, o: { deck?: string[]; active?: number } = {}) =>
    mine(leader, {
      hand: [SWALLOW],
      deck: o.deck ?? deckTop(TOP5),
      costArea: { active: o.active ?? 10, rested: 0 },
    });

  it('with a {Straw Hat Crew} Leader: rest 1 DON!!, then trash exactly the top 5 cards of the deck', () => {
    const g = start(LD15.shc);
    castMain(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([...TOP5, SWALLOW].sort());
    expect(deck(g)).toHaveLength(10);
    expect(don(g).rested).toBe(1);
  });

  it('without a {Straw Hat Crew} Leader the cost is paid and nothing is trashed', () => {
    const g = start(LD15.neutral);
    castMain(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SWALLOW]);
    expect(deck(g)).toHaveLength(15);
  });

  it('"you may": declining the cost trashes nothing and rests no DON!!', () => {
    const g = start(LD15.shc);
    castMain(g, false);
    expect(trash(g)).toEqual([SWALLOW]);
    expect(deck(g)).toHaveLength(15);
    expect(don(g).rested).toBe(0);
  });

  it('with no active DON!! the rest cost cannot be paid: the Event (cost 0) is playable but does nothing', () => {
    const g = start(LD15.shc, { active: 0 });
    playRaw(g, g.find('p1', 'hand', SWALLOW));
    unusable(g, 'p1');
    expect(trash(g)).toEqual([SWALLOW]);
    expect(deck(g)).toHaveLength(15);
  });

  it('trashes from the TOP: the deck below keeps its order', () => {
    const g = start(LD15.shc, { deck: [...TOP5, SC15.red7, SC15.shc1] });
    castMain(g);
    expect(deck(g)).toEqual([SC15.red7, SC15.shc1]);
  });

  it('with 6 cards in the deck 1 is left and the game goes on', () => {
    const g = start(LD15.shc, { deck: [...TOP5, SC15.red7] });
    castMain(g);
    expect(deck(g)).toEqual([SC15.red7]);
    expect(result(g)).toBeFalsy();
  });

  it('with exactly 5 cards in the deck all are trashed and p1 loses by deck-out (CR 9-2-1-2)', () => {
    const g = start(LD15.shc, { deck: [...TOP5] });
    castMain(g);
    expect(deck(g)).toEqual([]);
    expect(result(g)).toEqual({ winner: 'p2', reason: 'deck out' });
  });
});

describe('OP15-096 Swallow Bond en Avant [Counter]', () => {
  const FODDER = SC15.red3;
  const defend = (handCards: string[]) => {
    const g = theirs(
      LD15.neutral,
      { hand: handCards, characters: [SC15.red4], costArea: { active: 0, rested: 0 } },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  };
  const cast = (g: ReturnType<typeof defend>, fodder: string[], target: string) => {
    useCounter(g, g.find('p1', 'hand', SWALLOW), target);
    if (kind(g) === 'choose') {
      const d = need(g, 'choose');
      if (d.purpose === 'cost') pickAny(g, fodder);
    }
    chooseIfAsked(g, [target]);
  };

  it('trash 1 card from hand: my Leader gains +3000 during this battle and survives (8000 vs 5000)', () => {
    const g = defend([SWALLOW, FODDER]);
    expect(canCounterNow(g, g.find('p1', 'hand', SWALLOW))).toBe(true);
    cast(g, [FODDER], g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(trash(g).sort()).toEqual([FODDER, SWALLOW].sort());
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('a Character of mine may be boosted instead', () => {
    const g = defend([SWALLOW, FODDER]);
    const c = at(g, 'p1', 'characters', SC15.red4);
    cast(g, [FODDER], c);
    expect(g.power(c)).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the Event cannot pay its own cost: with no other card in hand the effect has no effect', () => {
    const g = defend([SWALLOW]);
    if (canCounterNow(g, g.find('p1', 'hand', SWALLOW))) {
      useCounter(g, g.find('p1', 'hand', SWALLOW), g.leader('p1'));
      unusable(g, 'p1');
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([]);
  });

  it('the boost ends with the battle', () => {
    const g = defend([SWALLOW, FODDER]);
    cast(g, [FODDER], g.leader('p1'));
    noDefence(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": after paying the cost I may choose no target; the card stays trashed', () => {
    const g = defend([SWALLOW, FODDER]);
    useCounter(g, g.find('p1', 'hand', SWALLOW), g.leader('p1'));
    if (kind(g) === 'choose' && need(g, 'choose').purpose === 'cost') pickAny(g, [FODDER]);
    if (kind(g) === 'choose') {
      expect(mayChooseNone(g)).toBe(true);
      skipChoice(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g)).toContain(FODDER);
  });

  it('I choose which card of my hand is trashed', () => {
    const g = defend([SWALLOW, FODDER, SC15.red5]);
    useCounter(g, g.find('p1', 'hand', SWALLOW), g.leader('p1'));
    expect(kind(g)).toBe('choose');
    pickAny(g, [SC15.red5]);
    chooseIfAsked(g, [g.leader('p1')]);
    expect(trash(g)).toContain(SC15.red5);
    expect(hand(g)).toEqual([FODDER]);
  });

  it('at most one target is boosted', () => {
    const g = defend([SWALLOW, FODDER]);
    useCounter(g, g.find('p1', 'hand', SWALLOW), g.leader('p1'));
    if (kind(g) === 'choose' && need(g, 'choose').purpose === 'cost') pickAny(g, [FODDER]);
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });
});
