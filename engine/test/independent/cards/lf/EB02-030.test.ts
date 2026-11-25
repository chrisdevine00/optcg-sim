/**
 * EB02-030 And That's When Somebody Makes Fun of Their Friend's Dream!!!! (Event, Blue, cost 2,
 * {Alabasta}/{Straw Hat Crew}).
 *
 * Card text: "[Counter] If any of your Characters would be K.O.'d in battle during this turn, you may
 * trash 1 card from your hand instead. [Trigger] Draw 1 card."
 *
 * Rules: an Event's [Counter] is activated in the Counter Step and creates a replacement effect
 * for the rest of the turn (CR 8-1-3-4); "may ... instead" is optional (RL-31); the replacement
 * covers a K.O. in battle only (CR 10-2-1: effect K.O.s are not "in battle"); an impossible
 * replacement (nothing to trash) cannot be applied (CR 8-1-3-4-5); [Trigger] activates when the
 * card is the Life card taken by damage.
 * OPEN-QUESTIONS M6b-Q54 (whether the replacement is offered again for a second K.O. of the same
 * turn) is not asserted: only the first K.O. of the turn and later K.O.s in other battles are used
 * where every reading agrees (a later battle after an attack on the Leader).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  act,
  activateTrigger,
  at,
  attack,
  atMain,
  block,
  blockers,
  endTurn,
  hand,
  mine,
  K,
  kind,
  KINGDOM_COME,
  need,
  no,
  noDefence,
  passBlock,
  passCounter,
  payHand,
  theirs,
  trash,
  unusable,
  VAN_LF,
  yes,
  canCounterNow,
  activateCounter,
  chars,
  opponentKingdomCome,
} from './kit-lfa.ts';

const EVENT = 'EB02-030';
const { marco, sai, thatch, mohji } = VAN_LF; // Marco 5000, Sai 4000 (fodder), Thatch 8000 (attacker), Mohji 3000

/** p2 (turn 4) will attack. p1 holds the Event and `extra` hand cards, 5 active DON!!, a rested Marco. */
function board(
  opts: { hand?: string[]; mine?: (string | { card: string; rested: boolean })[] } = {},
) {
  return theirs(
    'ST01-001',
    {
      hand: opts.hand ?? [EVENT, sai, mohji],
      characters: opts.mine ?? [{ card: marco, rested: true }],
      costArea: { active: 5, rested: 0 },
    },
    { characters: [thatch, thatch], hand: [KINGDOM_COME] },
  );
}

/** p2's first Thatch attacks p1's Marco; p1 passes the Block Step and uses the Event in the Counter Step. */
function attackMarcoAndCounter(g: TestGame) {
  const m = at(g, 'p1', 'characters', marco);
  attack(g, at(g, 'p2', 'characters', thatch, 0), m);
  passBlock(g);
  need(g, 'counter', 'p1');
  expect(canCounterNow(g, at(g, 'p1', 'hand', EVENT))).toBe(true);
  activateCounter(g, at(g, 'p1', 'hand', EVENT));
  return m;
}

describe("EB02-030 And That's When Somebody Makes Fun of Their Friend's Dream!!!!", () => {
  it('printed values: Event, cost 2; it is not playable in the Main Phase (only a [Counter])', () => {
    const g = mine('ST01-001', { hand: [EVENT] });
    const e = at(g, 'p1', 'hand', EVENT);
    expect(g.card(e).cost).toBe(2);
    expect(g.legal().some((a) => a.type === 'playCard' && a.card === e)).toBe(false);
    expect(g.legal().some((a) => a.type === 'activate' && a.card === e)).toBe(false);
  });

  it('accepting: the K.O. in battle is replaced; the Character stays, 1 chosen card is trashed from hand', () => {
    const g = board();
    const m = attackMarcoAndCounter(g);
    passCounter(g);
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
    yes(g, 'p1');
    payHand(g, [sai]);
    expect(chars(g)).toEqual([marco]);
    expect(g.card(m).rested).toBe(true);
    expect(hand(g)).toEqual([mohji]);
    expect(trash(g).sort()).toEqual([EVENT, sai].sort());
  });

  it('the cost pick may be any card left in hand', () => {
    const g = board({ hand: [EVENT, sai, mohji] });
    attackMarcoAndCounter(g);
    passCounter(g);
    yes(g, 'p1');
    const d = need(g, 'choose', 'p1');
    expect(d.max ?? 1).toBe(1);
    payHand(g, [mohji]);
    expect(hand(g)).toEqual([sai]);
    expect(chars(g)).toEqual([marco]);
  });

  it('"may": declining lets the Character be K.O.\'d and keeps the hand', () => {
    const g = board();
    attackMarcoAndCounter(g);
    passCounter(g);
    no(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g).sort()).toEqual([EVENT, marco].sort());
    expect(hand(g)).toEqual([mohji, sai].sort());
  });

  it("with no card left in hand the replacement cannot be applied: the Character is K.O.'d", () => {
    const g = board({ hand: [EVENT] });
    attackMarcoAndCounter(g);
    passCounter(g);
    unusable(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g).sort()).toEqual([EVENT, marco].sort());
  });

  it("without the Event used, the same attack K.O.'s the Character with no offer", () => {
    const g = board();
    attack(g, at(g, 'p2', 'characters', thatch, 0), at(g, 'p1', 'characters', marco));
    noDefence(g);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([EVENT, mohji, sai].sort());
  });

  it("a Character that blocks and would be K.O.'d in battle is covered too", () => {
    const g = board({ mine: [K.blockerFranky] });
    attack(g, at(g, 'p2', 'characters', thatch, 0), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', K.blockerFranky)]);
    block(g, at(g, 'p1', 'characters', K.blockerFranky));
    need(g, 'counter', 'p1');
    activateCounter(g, at(g, 'p1', 'hand', EVENT));
    passCounter(g);
    yes(g, 'p1');
    payHand(g, [sai]);
    expect(chars(g)).toEqual([K.blockerFranky]);
    expect(trash(g).sort()).toEqual([EVENT, sai].sort());
  });

  it('"during this turn": a later battle of the same turn is covered (after a first attack on the Leader)', () => {
    const g = board();
    // First attack: on my Leader. I use the Event here.
    attack(g, at(g, 'p2', 'characters', thatch, 0), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    activateCounter(g, at(g, 'p1', 'hand', EVENT));
    passCounter(g); // the Leader takes the hit; Life cards go to hand
    expect(atMain(g, 'p2')).toBe(true);
    // Second attack: on the rested Marco. The replacement is offered although the Event was used earlier.
    attack(g, at(g, 'p2', 'characters', thatch, 1), at(g, 'p1', 'characters', marco));
    noDefence(g);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payHand(g, [mohji]);
    expect(chars(g)).toEqual([marco]);
  });

  it('only K.O.s in battle: a K.O. by an effect later in the same turn is not replaced', () => {
    const g = board();
    attack(g, at(g, 'p2', 'characters', thatch, 0), g.leader('p1'));
    passBlock(g);
    activateCounter(g, at(g, 'p1', 'hand', EVENT));
    passCounter(g);
    expect(atMain(g, 'p2')).toBe(true);
    opponentKingdomCome(g, at(g, 'p1', 'characters', marco));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toContain(marco);
  });

  it("the effect ends with the turn: on the opponent's next turn a battle K.O. is not replaced", () => {
    const g = board();
    attack(g, at(g, 'p2', 'characters', thatch, 0), g.leader('p1'));
    passBlock(g);
    activateCounter(g, at(g, 'p1', 'hand', EVENT));
    passCounter(g);
    endTurn(g); // p2 turn 4 over -> p1 turn 5
    need(g, 'main', 'p1');
    // Marco attacks so that he is rested during p2's next turn.
    attack(g, at(g, 'p1', 'characters', marco), g.leader('p2'));
    noDefence(g);
    endTurn(g); // -> p2 turn 6
    need(g, 'main', 'p2');
    attack(g, at(g, 'p2', 'characters', thatch, 0), at(g, 'p1', 'characters', marco));
    noDefence(g);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([]);
  });

  it('[Trigger] Draw 1 card: taken as a Life card, activating it draws 1 and the Event goes to the trash', () => {
    const g = theirs(
      'ST01-001',
      { life: [EVENT, mohji, mohji, mohji], deck: [sai, sai, sai, sai, sai, sai] },
      { characters: [thatch] },
    );
    attack(g, at(g, 'p2', 'characters', thatch), g.leader('p1'));
    noDefence(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(hand(g)).toEqual([sai]);
    expect(trash(g)).toEqual([EVENT]);
    expect(g.life('p1')).toBe(3);
  });

  it('[Trigger] declined: the Event goes to hand and nothing is drawn', () => {
    const g = theirs(
      'ST01-001',
      { life: [EVENT, mohji, mohji, mohji], deck: [sai, sai, sai, sai, sai, sai] },
      { characters: [thatch] },
    );
    attack(g, at(g, 'p2', 'characters', thatch), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([EVENT]);
  });
});
