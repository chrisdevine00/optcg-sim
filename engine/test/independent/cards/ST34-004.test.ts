/**
 * ST34-004 Charlotte Linlin (Character, Purple, cost 10, 12000, no Counter, types The Four Emperors /
 * Big Mom Pirates).
 *
 * Card text (cards/data; the normalizer restored the sign of "DON!! −4", textFixes):
 *   "[On Play] DON!! −4, you may trash 1 card from your hand: Add up to 1 card from the top of your
 *    deck to the top of your Life cards. Then, up to 1 of your opponent's Characters' base power
 *    becomes 0 during this turn."
 *
 * Rules: CR 8-3-1-1 / 8-3-1-3 (both cost parts, in text order, all or nothing); CR 8-3-1-6 / RL-23
 * (DON!! −X may return the rested DON!! that paid for Linlin); CR 4-9-2 / RL-33 (setting base power:
 * later modifiers apply on top); CR 1-3-6-1 / 1-3-6-1-1 (power may go negative, the card stays);
 * CR 6-6-1-3 ("during this turn" ends in the End Phase); QA-GR ([On Play] with a cost may be
 * declined).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, endTurn, noDefence } from '../helpers.ts';
import {
  accept,
  AKP,
  choiceCards,
  choose,
  chooseNone,
  count,
  decline,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  payWith,
  PURPLE,
  RED,
  side,
  sortedIds,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LEAD.kaido, PURPLE, {
      hand: [AKP.linlin10, VAN.gordon],
      costArea: { active: 10, rested: 0 },
      deck: [VAN.marco, ...Array.from({ length: 10 }, () => PURPLE)],
      ...p1,
    }),
    side(LEAD.luffy, RED, { characters: [VAN.thatch], ...p2 }),
  );
}

function playAndPay(g: TestGame): void {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.linlin10) });
  accept(g);
  payDon(g, 4, 'costRested');
  payWith(g, [g.find('p1', 'hand', VAN.gordon)]);
  if (offered(g, 'p1')) accept(g); // "add up to 1" asked as a yes/no
}

describe('ST34-004 Charlotte Linlin: [On Play] DON!! −4 and trash 1 → deck top to Life, then base power 0', () => {
  it('happy path: Life +1 from the deck top, and Thatch’s base power becomes 0', () => {
    const g = game();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.linlin10) });
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 4, 'costRested');
    payWith(g, [g.find('p1', 'hand', VAN.gordon)]);
    if (offered(g, 'p1')) accept(g);
    expect(donOf(g, 'p1').deck).toBe(4);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.gordon]);
    expect(g.life('p1')).toBe(5);
    expect(g.zone('p1', 'life')[0]!.card).toBe(VAN.marco);
    const thatch = g.find('p2', 'characters', VAN.thatch);
    choose(g, [thatch]);
    expect(g.power(thatch)).toBe(0);
    expect(kind(g)).toBe('main');
  });

  it('target restriction: only the opponent’s Characters (not Leaders, not p1’s own)', () => {
    const g = game({ characters: [VAN.komachiyo] }, { characters: [VAN.thatch, VAN.marco] });
    playAndPay(g);
    expect(choiceCards(g)).toEqual([VAN.marco, VAN.thatch].sort());
  });

  it('CR 6-6-1-3: the base power returns on the next turn', () => {
    const g = game();
    playAndPay(g);
    const thatch = g.find('p2', 'characters', VAN.thatch);
    choose(g, [thatch]);
    endTurn(g);
    expect(g.power(thatch)).toBe(8000);
  });

  it('RL-33 / CR 1-3-6-1: a later −2000 (OP17-058 Kaido) applies on top of base 0 → −2000, and Thatch stays', () => {
    const g = game();
    playAndPay(g);
    const thatch = g.find('p2', 'characters', VAN.thatch);
    choose(g, [thatch]);
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payDon(g, 1, 'costRested');
    choose(g, [thatch]);
    expect(g.power(thatch)).toBe(-2000);
    noDefence(g);
    expect(g.card(thatch).zone).toBe('characters');
  });

  it('CR 8-3-1-3: with no card left in hand to trash, the cost cannot be paid and nothing is offered', () => {
    const g = game({ hand: [AKP.linlin10] });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.linlin10) });
    expect(offered(g, 'p1')).toBe(false);
    expect(g.life('p1')).toBe(4);
    expect(donOf(g, 'p1').deck).toBe(0);
  });

  it('QA-GR: declining keeps the DON!!, the hand card and the Life count', () => {
    const g = game();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.linlin10) });
    decline(g);
    expect(donOf(g, 'p1').deck).toBe(0);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.gordon]);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.find('p2', 'characters', VAN.thatch))).toBe(8000);
  });

  it('CR 8-4-4-1: "up to 1" may choose no Character; the Life card is still added', () => {
    const g = game();
    playAndPay(g);
    chooseNone(g);
    expect(g.power(g.find('p2', 'characters', VAN.thatch))).toBe(8000);
    expect(g.life('p1')).toBe(5);
    expect(count(g, 'p1', 'deck')).toBe(10);
  });
});
