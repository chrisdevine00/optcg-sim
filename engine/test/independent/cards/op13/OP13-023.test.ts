/**
 * OP13-023 Uta (Character, Green, cost 4, 5000, Counter +1000, {FILM}, Special).
 *
 * Card text: "[On Play] Set up to 2 of your DON!! cards as active. Then, you cannot play Character
 * cards with a base cost of 5 or more during this turn.
 * [On K.O.] Play up to 1 Character card with a cost of 5 or less from your hand rested."
 *
 * Rules: "up to 2" is a count the player picks (0 to 2); a "cannot play" lasts until the end of
 * the turn and covers base cost 5 or more; [On K.O.] fires on a K.O. by battle or by effect; a
 * card played "rested" arrives rested; an "up to" pick from the hand is asked even when no card
 * qualifies (a prompt never depends on hidden cards); CR 8-1-2.
 * Scenery: OP02-006 Kingdew (cost 5), OP02-007 Thatch (6), OP01-023 Marco (3), OP01-018 Hajrudin
 * (4), OP13-020 Meteor Fist (Event, cost 3); OP09-077 Gum-Gum Lightning for the opponent's K.O.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  canPlayCard,
  charsOfIds,
  decision,
  doneRaw,
  don,
  endTurn,
  hand,
  kind,
  L13,
  mine,
  need,
  noDefence,
  none,
  offeredIds,
  offeredInsts,
  opponentKOs,
  pickCount,
  pickInst,
  playRaw,
  SC2,
  theirs,
  toMyNextMain,
  trash,
  V13,
} from './kit-op13a.ts';

const UTA = 'OP13-023';
const METEOR = 'OP13-020';
const ACE_DISCOUNT = 'OP17-013'; // Red, printed cost 6, -2 cost in hand while the opponent has a 10000+ power Character

/**
 * Play Uta and take the most DON!! the effect can set active. DECISIONS (E-D4, OPEN-QUESTIONS
 * E-Q11): "set up to N DON!! active" acts on as many as possible without a count prompt; if a
 * prompt were asked, the most is taken, so the tests hold under both readings.
 */
function play(hand: string[], costArea = { active: 10, rested: 0 }) {
  const g = mine(L13.luffy, { hand: [UTA, ...hand], costArea });
  playRaw(g, UTA);
  if (kind(g) === 'choose') pickCount(g, 2);
  return g;
}

describe('OP13-023 Uta: [On Play] set up to 2 DON!! active, then no Character cards of base cost 5+', () => {
  it('printed values: cost 4, 5000, Counter +1000', () => {
    const g = mine(L13.luffy, { hand: [UTA] });
    const c = g.card(at(g, 'p1', 'hand', UTA));
    expect(c.cost).toBe(4);
    expect(c.counter).toBe(1000);
    playRaw(g, UTA);
    expect(g.power(at(g, 'p1', 'characters', UTA))).toBe(5000);
  });

  it('sets 2 rested DON!! active (4 paid for Uta, 2 set back): no other DON!! changes state', () => {
    const g = play([], { active: 4, rested: 6 });
    need(g, 'main', 'p1');
    expect(don(g)).toMatchObject({ active: 2, rested: 8, given: 0 });
  });

  it('never more than 2: with 10 rested after payment only 2 become active', () => {
    const g = play([], { active: 4, rested: 6 });
    expect(don(g).active).toBe(2);
  });

  it('only rested DON!! are set: with no rested DON!! before the play the active count is 6 + 2', () => {
    const g = play([], { active: 10, rested: 0 });
    // 10 active - 4 paid = 6 active, 4 rested; 2 of the rested are set active.
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it("the opponent's DON!! is not touched", () => {
    const before = don(mine(L13.luffy, { hand: [UTA] }), 'p2');
    const g = play([], { active: 4, rested: 6 });
    expect(don(g, 'p2')).toEqual(before);
  });

  it('after the effect, a Character with base cost 5 cannot be played; one with cost 4 can', () => {
    const g = play([V13.kingdew, V13.hajrudin]);
    need(g, 'main', 'p1');
    expect(canPlayCard(g, at(g, 'p1', 'hand', V13.kingdew))).toBe(false);
    expect(canPlayCard(g, at(g, 'p1', 'hand', V13.hajrudin))).toBe(true);
  });

  it('cost 6 is covered as well as cost 5; cost 3 is not', () => {
    const g = play([V13.thatch, V13.marco]);
    expect(canPlayCard(g, at(g, 'p1', 'hand', V13.thatch))).toBe(false);
    expect(canPlayCard(g, at(g, 'p1', 'hand', V13.marco))).toBe(true);
  });

  it('only Character cards are barred: an Event of cost 3 stays playable', () => {
    const g = play([METEOR]);
    expect(canPlayCard(g, at(g, 'p1', 'hand', METEOR))).toBe(true);
  });

  it('the bar reads BASE cost: OP17-013 Ace (printed 6, costing 4 in hand against a 10000-power Character) is still barred', () => {
    const g = mine(
      L13.luffy,
      { hand: [UTA, ACE_DISCOUNT], costArea: { active: 10, rested: 0 } },
      { characters: [V13.shiki10] },
    );
    expect(g.card(at(g, 'p1', 'hand', ACE_DISCOUNT)).cost).toBe(4);
    playRaw(g, UTA);
    if (kind(g) === 'choose') pickCount(g, 2);
    expect(g.card(at(g, 'p1', 'hand', ACE_DISCOUNT)).cost).toBe(4);
    expect(canPlayCard(g, at(g, 'p1', 'hand', ACE_DISCOUNT))).toBe(false);
  });

  it('the bar lasts this turn only: on my next turn the cost-5 Character can be played', () => {
    const g = play([V13.kingdew]);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(canPlayCard(g, at(g, 'p1', 'hand', V13.kingdew))).toBe(true);
  });
});

describe('OP13-023 Uta: [On K.O.] play up to 1 Character with cost 5 or less from my hand rested', () => {
  function koBoard(handCards: string[]) {
    return theirs(
      L13.luffy,
      { characters: [{ card: UTA, rested: true }] as never, hand: handCards },
      { characters: [V13.thatch], hand: [SC2.lightning] },
    );
  }
  const battleKo = (g: ReturnType<typeof koBoard>) => {
    attack(g, at(g, 'p2', 'characters', V13.thatch), at(g, 'p1', 'characters', UTA));
    noDefence(g);
  };

  it('K.O.d in battle: offers exactly the Characters with cost 5 or less (cost 5 yes, 6 no, no Event)', () => {
    const g = koBoard([V13.kingdew, V13.thatch, V13.marco, METEOR]);
    battleKo(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.kingdew, V13.marco].sort());
  });

  it('the chosen Character is played rested and no DON!! is paid', () => {
    const g = koBoard([V13.kingdew]);
    battleKo(g);
    pickInst(g, [at(g, 'p1', 'hand', V13.kingdew)]);
    expect(g.card(at(g, 'p1', 'characters', V13.kingdew)).rested).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([UTA]);
    expect(don(g)).toMatchObject({ active: 0, rested: 0 });
  });

  it('"up to 1": may play nothing; plays at most one when two qualify', () => {
    const none_ = koBoard([V13.kingdew, V13.marco]);
    battleKo(none_);
    need(none_, 'choose', 'p1');
    none(none_);
    expect(charsOfIds(none_, 'p1')).toEqual([]);
    expect(hand(none_)).toEqual([V13.kingdew, V13.marco].sort());
    const one = koBoard([V13.kingdew, V13.marco]);
    battleKo(one);
    pickInst(one, [at(one, 'p1', 'hand', V13.marco)]);
    expect(charsOfIds(one, 'p1')).toEqual([V13.marco]);
    expect(hand(one)).toEqual([V13.kingdew]);
  });

  it('with no qualifying card in hand the pick is still asked (it cannot depend on the hidden hand), with nothing to choose', () => {
    const g = koBoard([V13.thatch]);
    battleKo(g);
    expect(kind(g)).toBe('choose');
    expect(offeredInsts(g)).toEqual([]);
    doneRaw(g);
    expect(decision(g)?.kind).toBe('main');
    expect(hand(g)).toEqual([V13.thatch]);
  });

  it("also fires when K.O.d by the opponent's effect", () => {
    const g = koBoard([V13.kingdew]);
    opponentKOs(g, at(g, 'p1', 'characters', UTA));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.kingdew]);
    pickInst(g, [at(g, 'p1', 'hand', V13.kingdew)]);
    expect(charsOfIds(g, 'p1')).toEqual([V13.kingdew]);
  });

  it('[On K.O.] reads the current cost: a card printed at 6 that costs 4 in hand (OP17-013 Ace) is offered', () => {
    const g = theirs(
      L13.luffy,
      { characters: [{ card: UTA, rested: true }] as never, hand: [ACE_DISCOUNT, V13.thatch] },
      { characters: [V13.thatch, V13.shiki10] },
    );
    expect(g.card(at(g, 'p1', 'hand', ACE_DISCOUNT)).cost).toBe(4);
    attack(g, at(g, 'p2', 'characters', V13.thatch), at(g, 'p1', 'characters', UTA));
    noDefence(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ACE_DISCOUNT]);
  });

  it("the On Play bar is over by then: Uta played this turn and K.O.d on the opponent's turn can still play a cost-5 Character", () => {
    const g = mine(
      L13.luffy,
      {
        hand: [UTA, V13.kingdew],
        costArea: { active: 10, rested: 0 },
      },
      { hand: [SC2.lightning] },
    );
    playRaw(g, UTA);
    if (kind(g) === 'choose') pickCount(g, 2);
    endTurn(g);
    need(g, 'main', 'p2');
    opponentKOs(g, at(g, 'p1', 'characters', UTA));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V13.kingdew]);
  });
});
