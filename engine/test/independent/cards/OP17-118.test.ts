/**
 * OP17-118 Rocks.D.Xebec (Character, Blue, cost 10, 12000, no printed Counter, type Rocks Pirates).
 *
 * Card text (cards/data):
 *   "If you only have Characters without a Counter, this card in your hand has a +2000 Counter.
 *    [On Play] Draw 1 card and play up to 2 {Rocks Pirates} type cards with different card names
 *    and a total cost of 9 or less from your hand."
 *
 * Reading: the first sentence is a permanent effect that works from the hand (the text says "in
 * your hand", CR 2-8-2 "unless otherwise specified"). It is true when every Character p1 has in
 * play has no Counter value. With zero Characters the condition is vacuous; that case is not
 * tested (see the report). {Rocks Pirates} is an exact type (CR 2-4-3), so "Former Rocks Pirates"
 * does not qualify. Played cards are played without paying their cost (CR 4-7-1 by effect), and
 * their [On Play] activates (CR 3-7-3). Choices are made at resolution, after the draw (CR 8-4-4).
 * The total-cost and different-name limits are enforced by completability lookahead
 * (effect-dsl §4.11, which names this card).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { attack, fill, passBlock, play } from '../helpers.ts';
import {
  BLUE,
  canCounterWith,
  choiceCards,
  choose,
  chooseIfAsked,
  chooseNone,
  donOf,
  LEAD,
  myTurn,
  RED,
  reachablePickSets,
  ROCKS,
  settleYes,
  side,
  sortedIds,
  theirTurn,
  useCounter,
  VAN,
} from './kit.ts';

function onPlay(hand: string[], p1: Partial<PlayerSpec> = {}) {
  const g = myTurn(
    side(LEAD.rocks, BLUE, {
      hand: [ROCKS.xebec, ...hand],
      deck: [VAN.marco, ...fill(BLUE, 10)],
      costArea: { active: 10, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
  play(g, g.find('p1', 'hand', ROCKS.xebec));
  return g;
}

function defending(characters: string[]) {
  return theirTurn(
    side(LEAD.rocks, BLUE, { hand: [ROCKS.xebec], characters }),
    side(LEAD.luffy, RED),
  );
}

describe('OP17-118 Rocks.D.Xebec: +2000 Counter in hand while all your Characters lack a Counter', () => {
  it('happy path: with only OP17-040 Newgate (no Counter) in play, it counters for +2000', () => {
    const g = defending([ROCKS.newgate]);
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    const xebec = g.find('p1', 'hand', ROCKS.xebec);
    expect(canCounterWith(g, xebec)).toBe(true);
    useCounter(g, xebec, g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([ROCKS.xebec]);
  });

  it('condition fails: a Character with a Counter in play (OP02-060 Mohji, +1000) → no Counter', () => {
    const g = defending([VAN.mohji]);
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    expect(canCounterWith(g, g.find('p1', 'hand', ROCKS.xebec))).toBe(false);
  });

  it('condition fails with a mix: Newgate plus OP08-051 Buckin (Counter +1000) → no Counter', () => {
    const g = defending([ROCKS.newgate, ROCKS.buckin]);
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    expect(canCounterWith(g, g.find('p1', 'hand', ROCKS.xebec))).toBe(false);
  });
});

describe('OP17-118 Rocks.D.Xebec: [On Play] draw 1, then play up to 2 Rocks Pirates (different names, total cost 9 or less)', () => {
  it('CR 8-4-4: the draw happens first, then the choice', () => {
    const g = onPlay([ROCKS.shiki]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([ROCKS.shiki, VAN.marco].sort());
    expect(choiceCards(g)).toEqual([ROCKS.shiki]);
  });

  it('total cost 9 or less: Shiki (7) + Kyo (2) or John (4) + Kyo, but never Shiki + John (11)', () => {
    const g = onPlay([ROCKS.shiki, ROCKS.kyo, ROCKS.john, VAN.mohji]);
    expect(reachablePickSets(g)).toEqual(
      new Set([
        '',
        ROCKS.shiki,
        ROCKS.kyo,
        ROCKS.john,
        [ROCKS.kyo, ROCKS.shiki].sort().join('+'),
        [ROCKS.john, ROCKS.kyo].sort().join('+'),
      ]),
    );
  });

  it('different card names: two OP17-045 Kyo cannot both be played', () => {
    const g = onPlay([ROCKS.kyo, ROCKS.kyo]);
    expect(reachablePickSets(g)).toEqual(new Set(['', ROCKS.kyo]));
  });

  it('CR 2-4-3: {Rocks Pirates} is exact: Buckin (Former Rocks Pirates) is not offered; Gloriosa (Amazon Lily / Rocks Pirates) is', () => {
    const g = onPlay([ROCKS.buckin, ROCKS.gloriosa]);
    expect(choiceCards(g)).toEqual([ROCKS.gloriosa]);
  });

  it('the card drawn by this effect may be one of the two played', () => {
    const g = onPlay([ROCKS.shiki], { deck: [ROCKS.kyo, ...fill(BLUE, 10)] });
    expect(reachablePickSets(g)).toContain([ROCKS.kyo, ROCKS.shiki].sort().join('+'));
  });

  it('happy path: Shiki and Kyo enter play for free; Kyo’s own [On Play] then draws 1', () => {
    const g = onPlay([ROCKS.shiki, ROCKS.kyo, ROCKS.john, VAN.mohji]);
    choose(g, [g.find('p1', 'hand', ROCKS.shiki), g.find('p1', 'hand', ROCKS.kyo)]);
    settleYes(g, 'p1');
    expect(sortedIds(g, 'p1', 'characters')).toEqual([ROCKS.kyo, ROCKS.shiki, ROCKS.xebec].sort());
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 10 });
    // Hand: John, Mohji, Marco (Xebec's draw) + 1 from Kyo's draw. Deck: 11 − 2.
    expect(g.zone('p1', 'hand')).toHaveLength(4);
    expect(g.zone('p1', 'deck')).toHaveLength(9);
  });

  it('CR 8-4-4-1: "up to 2" allows playing none (the draw still happened)', () => {
    const g = onPlay([ROCKS.shiki, ROCKS.kyo]);
    chooseNone(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([ROCKS.xebec]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([ROCKS.kyo, ROCKS.shiki, VAN.marco].sort());
  });

  it('CR 3-7-4 / 10-1-6-1: a Shiki played this way has [Rush: Character], other played cards cannot attack', () => {
    const g = onPlay([ROCKS.shiki, ROCKS.kyo], {});
    choose(g, [g.find('p1', 'hand', ROCKS.shiki), g.find('p1', 'hand', ROCKS.kyo)]);
    settleYes(g, 'p1');
    const kyo = g.find('p1', 'characters', ROCKS.kyo);
    const shiki = g.find('p1', 'characters', ROCKS.shiki);
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === kyo)).toBe(false);
    expect(sortedIds(g, 'p1', 'characters')).toContain(ROCKS.shiki);
    expect(
      g
        .legal()
        .some((a) => a.type === 'attack' && a.attacker === shiki && a.target === g.leader('p2')),
    ).toBe(false);
  });
});
