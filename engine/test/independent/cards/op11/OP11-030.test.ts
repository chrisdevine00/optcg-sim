/**
 * OP11-030 Shirahoshi (Character, Green, cost 1, 0 power, Counter +1000, {Merfolk}/{Fish-Man
 * Island}).
 *
 * Card text: "[Activate: Main] You may rest 1 of your DON!! cards and this Character: Look at 5 cards
 * from the top of your deck; reveal up to 1 "Neptunian" or "Fish-Man Island" type card and add it to
 * your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: the costs are an ACTIVE DON!! and this Character (which must be active). Revealing is
 * public (CR 11-2-1). "Up to 1" may add nothing. The rest go to the bottom in any order. An
 * [Activate: Main] has no summoning restriction.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  chr,
  deck,
  donOf,
  fill,
  hand,
  hasEvent,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  offeredAbilities,
  offeredIds,
  payCosts,
  pickCards,
  settleOrders,
  tail,
  useAbility,
} from './kit-op11a.ts';

const SHIRA = 'OP11-030';
/** EB04-018 Megalo: {Animal}/{Fish-Man Island}. */
const MEGALO4 = 'EB04-018';

function board(top: string[], opts: { active?: number; rested?: boolean; played?: boolean } = {}) {
  return mine(L11.luffy, {
    characters: [{ card: SHIRA, rested: opts.rested, playedThisTurn: opts.played }],
    costArea: { active: opts.active ?? 3, rested: 0 },
    deck: [...top, ...fill(BLUE, 10)],
  });
}

function activate(g: ReturnType<typeof board>) {
  useAbility(g, chr(g, 'p1', SHIRA));
  payCosts(g);
}

const FIVE = [N11.nept6, N11.merfolk5, N11.fish3, N11.marco, MEGALO4];

describe('OP11-030 Shirahoshi: [Activate: Main] rest 1 DON!! and this: look at 5, add a Neptunian or Fish-Man Island card', () => {
  it('printed values: cost 1, 0 power, Counter +1000', () => {
    const g = board(FIVE);
    const s = chr(g, 'p1', SHIRA);
    expect(g.card(s).cost).toBe(1);
    expect(g.power(s)).toBe(0);
    expect(g.card(s).counter).toBe(1000);
  });

  it('offers the Neptunian and Fish-Man Island cards among the top 5 only', () => {
    const g = board(FIVE);
    activate(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.nept6, N11.merfolk5, MEGALO4].sort());
  });

  it('adds the chosen card (revealed) to hand and puts the other four at the bottom of the deck', () => {
    const g = board(FIVE);
    activate(g);
    pickCards(g, [N11.merfolk5]);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([N11.merfolk5]);
    expect(deck(g)).toHaveLength(14);
    expect(tail(deck(g), 4)).toEqual([N11.nept6, N11.fish3, N11.marco, MEGALO4].sort());
    expect(hasEvent(g, 'CardRevealed', { card: N11.merfolk5 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: N11.fish3 })).toBe(false);
  });

  it('pays both costs: 1 DON!! rested and Shirahoshi rested', () => {
    const g = board(FIVE);
    activate(g);
    expect(g.card(chr(g, 'p1', SHIRA)).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('"up to 1": may add nothing; all five go to the bottom', () => {
    const g = board(FIVE);
    activate(g);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(tail(deck(g), 5)).toEqual([...FIVE].sort());
  });

  it('adds at most one card even though three qualify', () => {
    const g = board(FIVE);
    activate(g);
    pickCards(g, [N11.nept6]);
    if (kind(g) === 'choose') expect(offeredIds(g)).not.toContain(MEGALO4);
    settleOrders(g, 'p1');
    expect(hand(g)).toHaveLength(1);
  });

  it('a matching card in position 6 is not looked at', () => {
    const g = board([N11.marco, N11.marco, N11.marco, N11.marco, N11.marco, N11.nept6]);
    activate(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(N11.nept6);
  });

  it('a rested Shirahoshi cannot use it', () => {
    const g = board(FIVE, { rested: true });
    expect(offeredAbilities(g, chr(g, 'p1', SHIRA))).toEqual([]);
  });

  it('with no active DON!! it cannot be used', () => {
    const g = board(FIVE, { active: 0 });
    expect(offeredAbilities(g, chr(g, 'p1', SHIRA))).toEqual([]);
  });

  it('can be used the turn she is played', () => {
    const g = board(FIVE, { played: true });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', SHIRA))).toHaveLength(1);
  });
});
