/**
 * OP17-039 Rocks.D.Xebec (Leader, Blue, 5000, 5 Life, type Rocks Pirates).
 *
 * Card text (cards/data, no override text patch):
 *   "[When Attacking] You may trash 1 card from your hand: Reveal 1 card from the top of your deck.
 *    If the revealed card's type includes "Rocks Pirates", draw 2 cards."
 *
 * Rulings: RL-44 (QA-OP17 OP17-039): the revealed card stays on top; a hit draws it as one of the 2;
 * a miss leaves it on top. "Type includes" is a substring match (CR 2-4-3-1). The trash is an
 * optional cost: without it nothing is revealed (CR 8-3-1-4).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { attack, decision, fill, result } from '../helpers.ts';
import {
  abilities,
  accept,
  BLUE,
  count,
  decider,
  decline,
  hasEvent,
  LEAD,
  myTurn,
  offered,
  payWith,
  RED,
  ROCKS,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from './kit.ts';

function game(p1: Partial<PlayerSpec>, p2: Partial<PlayerSpec> = {}) {
  return myTurn(side(LEAD.rocks, BLUE, p1), side(LEAD.luffy, RED, p2));
}

describe('OP17-039 Rocks.D.Xebec: [When Attacking] trash 1, reveal, draw 2 on Rocks Pirates', () => {
  it('happy path: a Rocks Pirates card on top → the trash is paid and 2 cards are drawn, the revealed one first', () => {
    const g = game({
      hand: [VAN.mohji],
      deck: [ROCKS.kyo, ROCKS.streusen, ...fill(BLUE, 10)],
    });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.mohji]);
    expect(hasEvent(g, 'CardRevealed', { card: ROCKS.kyo })).toBe(true);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([ROCKS.kyo, ROCKS.streusen].sort());
    expect(count(g, 'p1', 'deck')).toBe(10);
    // The battle goes on: the defender's Block Step decision comes next.
    expect(decider(g)).toBe('p2');
  });

  it('RL-44: a miss leaves the revealed card on top of the deck and draws nothing', () => {
    const g = game({ hand: [VAN.mohji], deck: [VAN.marco, ...fill(BLUE, 10)] });
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    expect(hasEvent(g, 'CardRevealed', { card: VAN.marco })).toBe(true);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(VAN.marco);
    expect(count(g, 'p1', 'deck')).toBe(11);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.mohji]);
  });

  it('RL-44 / CR 2-4-3-1: "type includes" matches "Former Rocks Pirates" (OP08-051 Buckin) → hit', () => {
    const g = game({ hand: [VAN.mohji], deck: [ROCKS.buckin, VAN.marco, ...fill(BLUE, 10)] });
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([ROCKS.buckin, VAN.marco].sort());
  });

  it('CR 2-4-2: a card with several types hits if one of them includes "Rocks Pirates" (OP17-046 Gloriosa)', () => {
    const g = game({ hand: [VAN.mohji], deck: [ROCKS.gloriosa, VAN.marco, ...fill(BLUE, 10)] });
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([ROCKS.gloriosa, VAN.marco].sort());
  });

  it('a hit draws exactly 2, even when the second card is also Rocks Pirates', () => {
    const g = game({
      hand: [VAN.mohji],
      deck: [ROCKS.kyo, ROCKS.shiki, ROCKS.newgate, ...fill(BLUE, 5)],
    });
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([ROCKS.kyo, ROCKS.shiki].sort());
    expect(g.zone('p1', 'deck')[0]!.card).toBe(ROCKS.newgate);
  });

  it('CR 8-3-1-4: declining the optional trash reveals nothing and draws nothing', () => {
    const g = game({ hand: [VAN.mohji], deck: [ROCKS.kyo, ...fill(BLUE, 10)] });
    attack(g, g.leader('p1'), g.leader('p2'));
    decline(g);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.mohji]);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    expect(count(g, 'p1', 'deck')).toBe(11);
    expect(hasEvent(g, 'CardRevealed', { card: ROCKS.kyo })).toBe(false);
    expect(decider(g)).toBe('p2');
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid, so nothing is offered', () => {
    const g = game({ hand: [], deck: [ROCKS.kyo, ...fill(BLUE, 10)] });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(offered(g, 'p1')).toBe(false);
    expect(decider(g)).toBe('p2');
    expect(count(g, 'p1', 'deck')).toBe(11);
  });

  it('[When Attacking] only: being attacked on the opponent’s turn offers nothing', () => {
    const g = theirTurn(
      side(LEAD.rocks, BLUE, { hand: [VAN.mohji], deck: [ROCKS.kyo, ...fill(BLUE, 10)] }),
      side(LEAD.luffy, RED),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(false);
    expect(decision(g)?.kind).toMatch(/block|counter/);
  });

  it('it is not an [Activate: Main]: no activate action is offered on the Leader', () => {
    const g = game({ hand: [VAN.mohji] });
    expect(abilities(g, g.leader('p1'))).toEqual([]);
  });

  it('RL-44 / RL-26: with 1 card in deck, a hit draws it, the deck reaches 0 and p1 loses', () => {
    const g = game({ hand: [VAN.mohji], deck: [ROCKS.kyo] });
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });
});
