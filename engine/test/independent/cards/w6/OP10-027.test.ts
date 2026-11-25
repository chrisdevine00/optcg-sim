/**
 * OP10-027 Kin'emon (Character, Green, cost 2, 0 power, Counter +2000, {Land of Wano}/{The Akazaya
 * Nine}/{Punk Hazard}).
 *
 * Card text: "[Activate: Main] You may place this Character and 1 [Kin'emon] with 1000 power from your
 * trash at the bottom of your deck in any order: Play up to 1 [Kin'emon] with a cost of 6 from your
 * hand."
 *
 * Rules: a cost after "you may" is chosen by activating (CR 8-3-1); the cost needs this Character on
 * the field and a [Kin'emon] with exactly 1000 power in the trash (public zone: an unpayable cost is
 * not offered); "up to" lets me choose none (CR 8-4-4-1); an "up to" pick over the hand with a filter
 * is asked even when nothing matches; the cost is paid first, so this Character has left the Character
 * area when the play happens (CR 3-7-6-1 only trashes when the area is full at play). M6b-Q73: the
 * order of the two cards at the bottom is not asserted.
 */
import { describe, expect, it } from 'vitest';
import { act, decision } from '../../helpers.ts';
import {
  at,
  atMain,
  deck,
  don,
  hand,
  kind,
  LW,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickCards,
  sorted,
  theirs,
  trash,
  W6,
  chars,
  mayChooseNone,
  useAbility,
  snap,
} from './kit-w6b.ts';

const K0 = W6.kin0;

/** Identical 1000-power candidates in the trash: the engine may ask which one pays the cost; take the first. */
function payTrashCost(g: ReturnType<typeof game>) {
  if (decision(g)?.purpose === 'cost') {
    const first = g.legal().find((a) => a.type === 'pick');
    if (first) g.act(first);
  }
  need(g, 'choose', 'p1');
}
const DECK = ['OP02-060', 'OP02-060', 'OP02-060', 'OP02-060', 'OP02-060'];

/** p1: Kin'emon on the field, the given hand and trash, a short known deck. */
function game(o: { hand?: string[]; trash?: string[]; chars?: string[]; deck?: string[] } = {}) {
  return mine(LW.luffy, {
    characters: o.chars ?? [K0],
    hand: o.hand ?? [W6.kin6],
    trash: o.trash ?? [W6.kin1000],
    deck: o.deck ?? DECK,
  });
}

describe("OP10-027 Kin'emon: place this and a 1000-power [Kin'emon] from the trash at the bottom: play a cost-6 [Kin'emon]", () => {
  it('printed values: cost 2, 0 power, Counter +2000', () => {
    const g = game();
    const c = g.card(at(g, 'p1', 'characters', K0));
    expect(c.cost).toBe(2);
    expect(g.power(c.instance)).toBe(0);
    expect(c.counter).toBe(2000);
  });

  it("activating pays both cards to the bottom of the deck and plays the cost-6 [Kin'emon] from hand", () => {
    const g = game();
    useAbility(g, at(g, 'p1', 'characters', K0));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W6.kin6]);
    pickCards(g, [W6.kin6]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([W6.kin6]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(DECK.length + 2);
    expect(deck(g).slice(0, DECK.length)).toEqual(DECK);
    // Both Kin'emon are the last two cards of the deck (their order is M6b-Q73).
    expect(deck(g).slice(-2).sort()).toEqual([W6.kin0, W6.kin1000].sort());
  });

  it("only a [Kin'emon] with cost exactly 6 is offered: cost 4, another name with cost 6 are not", () => {
    const g = game({ hand: [W6.kin6, W6.kin6b, W6.kin4, W6.thatch, W6.shiki8] });
    useAbility(g, at(g, 'p1', 'characters', K0));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W6.kin6, W6.kin6b].sort());
  });

  it('"up to 1": the cost is still paid when I choose nothing, and nothing is played', () => {
    const g = game();
    useAbility(g, at(g, 'p1', 'characters', K0));
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([W6.kin6]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(DECK.length + 2);
  });

  it("with no cost-6 [Kin'emon] in hand the cost can still be paid and the play prompt is asked empty", () => {
    // The pick over the hand is asked even when nothing matches (the hand is hidden).
    const g = game({ hand: [W6.thatch, W6.kin4] });
    const k = at(g, 'p1', 'characters', K0);
    expect(offeredAbilities(g, k)).toHaveLength(1);
    act(g, { type: 'activate', card: k, ability: offeredAbilities(g, k)[0]! });
    const d = decision(g);
    expect(d?.kind).toBe('choose');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(deck(g)).toHaveLength(DECK.length + 2);
    expect(hand(g)).toEqual([W6.kin4, W6.thatch].sort());
  });

  it("the trash card must have exactly 1000 power: 0 power, 2000 power and a non-Kin'emon are not enough", () => {
    for (const t of [[W6.kin0], [W6.kin2000], [W6.kin2000, W6.kin0, W6.thatch, 'OP02-060'], []]) {
      const g = game({ trash: t });
      const k = at(g, 'p1', 'characters', K0);
      expect(kind(g)).toBe('main');
      expect(offeredAbilities(g, k), snap(g)).toEqual([]);
      expect(sorted(g, 'p1', 'trash')).toEqual([...t].sort());
    }
  });

  it("with two 1000-power [Kin'emon] in the trash only one is placed; the other stays", () => {
    const g = game({ trash: [W6.kin1000, W6.kin1000, W6.kin0] });
    useAbility(g, at(g, 'p1', 'characters', K0));
    payTrashCost(g);
    pickCards(g, [W6.kin6]);
    expect(trash(g)).toEqual([W6.kin0, W6.kin1000].sort());
    expect(deck(g).slice(-2).sort()).toEqual([W6.kin0, W6.kin1000].sort());
  });

  it("this Character leaves first: with 5 Characters the played [Kin'emon] needs no Character trashed", () => {
    const fillers = ['OP01-010', 'OP01-012', W6.atmos, W6.kingdew];
    const g = game({ chars: [K0, ...fillers] });
    useAbility(g, at(g, 'p1', 'characters', K0));
    need(g, 'choose', 'p1');
    pickCards(g, [W6.kin6]);
    expect(atMain(g), snap(g)).toBe(true);
    expect(chars(g)).toEqual([...fillers, W6.kin6].sort());
    expect(trash(g)).toEqual([]);
  });

  it("is not a DON!! cost and has no Once Per Turn: two copies each use a 1000-power [Kin'emon]", () => {
    const g = game({
      chars: [K0, K0],
      hand: [W6.kin6, W6.kin6b],
      trash: [W6.kin1000, W6.kin1000],
    });
    const before = don(g, 'p1');
    useAbility(g, at(g, 'p1', 'characters', K0, 0));
    payTrashCost(g);
    pickCards(g, [W6.kin6]);
    expect(don(g, 'p1')).toEqual(before);
    useAbility(g, at(g, 'p1', 'characters', K0, 0));
    payTrashCost(g);
    pickCards(g, [W6.kin6b]);
    expect(chars(g)).toEqual([W6.kin6, W6.kin6b].sort());
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(DECK.length + 4);
  });

  it("[Activate: Main] is only for my own Main Phase: not offered on the opponent's turn", () => {
    const g = theirs(LW.luffy, {
      characters: [K0],
      hand: [W6.kin6],
      trash: [W6.kin1000],
    });
    expect(kind(g)).toBe('main');
    expect(g.decider).toBe('p2');
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
  });
});
