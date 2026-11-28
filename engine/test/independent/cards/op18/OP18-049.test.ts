/**
 * OP18-049 Mr.2.Bon.Kurei(Bentham) (Character, Blue, cost 5, 6000, Counter +1000, {Baroque Works}).
 *
 * Card text (cards/data):
 *   "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 card with a type including
 *    "Baroque Works", add it to your hand and place the rest at the bottom of your deck in any
 *    order. Then, give up to 1 rested DON!! card to your Leader or 1 of your Characters."
 *
 * Rules: only the top 5 are looked at; "type including" is a substring match; "up to 1" may add
 * none; the revealed card is revealed (CR 11-2-1); the rest go to the bottom in an order I choose;
 * the DON!! step happens after the look whatever its result ("Then"), is "up to 1" and takes a
 * rested DON!! of the cost area (the 5 rested to pay for Bentham are there).
 *
 * Scenery: OP18-043 Accelegator (BW), OP14-095 Mr.9 (BW), OP09-055 Mr.1 ({Former Baroque Works}),
 * OP01-012 Sai / OP01-023 Marco / OP02-007 Thatch (no BW type), all vanilla.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  BW,
  cardIds,
  choiceCards,
  donOf,
  hasEvent,
  kind,
  mine,
  need,
  settleOrders,
  VAN,
} from './kit-d.ts';

const BENTHAM = 'OP18-049';
const CROC = 'ST03-001';
const PAD = VAN.thatch;

function game(top: CardId[], p1: Partial<PlayerSpec> = {}): TestGame {
  const g = mine(CROC, {
    hand: [BENTHAM],
    characters: [VAN.sai],
    deck: [...top, ...Array.from({ length: 10 }, () => PAD)],
    costArea: { active: 6, rested: 0 },
    ...p1,
  });
  play(g, g.find('p1', 'hand', BENTHAM));
  return g;
}

/** Finish the look (orders), then answer the DON!! target question with `target` or nothing. */
function finish(g: TestGame, target: string | null) {
  settleOrders(g);
  const d = need(g, 'choose', 'p1');
  expect(d.prompt).toContain('give DON!!');
  if (target) act(g, { type: 'pick', choice: target });
  else act(g, { type: 'done' });
  expect(kind(g)).toBe('main');
}

describe('OP18-049 Mr.2.Bon.Kurei(Bentham): [On Play] look at 5, add up to 1 Baroque Works card, rest to the bottom', () => {
  it('offers exactly the Baroque Works cards of the top 5 (a {Former Baroque Works} card included) and adds the pick', () => {
    const g = game([BW.accel4, VAN.sai, BW.formerBw5, VAN.marco, BW.mr9]);
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([BW.accel4, BW.formerBw5, BW.mr9].sort());
    act(g, { type: 'pick', choice: g.find('p1', 'deck', BW.formerBw5) });
    finish(g, null);
    expect(cardIds(g, 'p1', 'hand')).toEqual([BW.formerBw5]);
  });

  it('the added card is revealed; the four other looked-at cards go to the bottom, the 6th card is now on top', () => {
    const g = game([BW.accel4, VAN.sai, VAN.marco, VAN.marco, VAN.sai]);
    act(g, { type: 'pick', choice: g.find('p1', 'deck', BW.accel4) });
    finish(g, null);
    expect(hasEvent(g, 'CardRevealed', { card: BW.accel4 })).toBe(true);
    const deck = cardIds(g, 'p1', 'deck');
    expect(deck).toHaveLength(14);
    expect(deck.slice(0, 10)).toEqual(Array.from({ length: 10 }, () => PAD));
    expect(deck.slice(10).sort()).toEqual([VAN.marco, VAN.marco, VAN.sai, VAN.sai].sort());
  });

  it('only the top 5 are looked at: a Baroque Works card in 6th place is not offered', () => {
    const g = game([VAN.sai, VAN.sai, VAN.marco, VAN.marco, VAN.sai, BW.accel4]);
    if (kind(g) === 'choose' && need(g, 'choose').prompt.includes('looking at')) {
      expect(choiceCards(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    finish(g, null);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(BW.accel4);
  });

  it('"up to 1": adding none puts all 5 at the bottom and nothing joins the hand', () => {
    const g = game([BW.accel4, BW.mr9, VAN.sai, VAN.marco, VAN.sai]);
    act(g, { type: 'done' });
    finish(g, null);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'deck').slice(10).sort()).toEqual(
      [BW.accel4, BW.mr9, VAN.marco, VAN.sai, VAN.sai].sort(),
    );
  });

  it('adds at most 1 even when several qualify', () => {
    const g = game([BW.accel4, BW.mr9, BW.formerBw5, VAN.marco, VAN.sai]);
    act(g, { type: 'pick', choice: g.find('p1', 'deck', BW.accel4) });
    // The pick is at its maximum: the engine moves on to the order of the rest.
    expect(kind(g)).toBe('order');
    finish(g, null);
    expect(cardIds(g, 'p1', 'hand')).toEqual([BW.accel4]);
  });
});

describe('OP18-049 Mr.2.Bon.Kurei(Bentham): "Then, give up to 1 rested DON!! card to your Leader or 1 of your Characters"', () => {
  it('gives one rested DON!! to the Leader (+1000 on my turn)', () => {
    const g = game([BW.accel4, VAN.sai, VAN.marco, VAN.marco, VAN.sai]);
    act(g, { type: 'done' });
    finish(g, g.leader('p1'));
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 4, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('a Character is a legal target too, and the opponent’s cards are not offered', () => {
    const g = game([VAN.sai, VAN.sai, VAN.marco, VAN.marco, VAN.sai]);
    act(g, { type: 'done' });
    settleOrders(g);
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered).toContain(g.find('p1', 'characters', VAN.sai));
    expect(offered).toContain(g.leader('p1'));
    expect(offered).not.toContain(g.leader('p2'));
    act(g, { type: 'pick', choice: g.find('p1', 'characters', VAN.sai) });
    expect(g.card(g.find('p1', 'characters', VAN.sai)).don).toBe(1);
  });

  it('it happens even when nothing was added, and "up to 1" lets me give none', () => {
    const g = game([VAN.sai, VAN.sai, VAN.marco, VAN.marco, VAN.sai]);
    act(g, { type: 'done' });
    finish(g, null);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 5, given: 0 });
  });

  it('the pool is the rested DON!!: the 5 DON!! rested to pay for Bentham (all there are) supply the given one', () => {
    const g = game([VAN.sai, VAN.sai, VAN.marco, VAN.marco, VAN.sai], {
      costArea: { active: 5, rested: 0 },
    });
    act(g, { type: 'done' });
    settleOrders(g);
    act(g, { type: 'pick', choice: g.leader('p1') });
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 4, given: 1 });
  });
});
