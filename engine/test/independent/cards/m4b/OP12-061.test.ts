/**
 * OP12-061 Donquixote Rosinante (Leader, Purple/Yellow, 5000, 4 Life; Donquixote Pirates / Navy).
 *
 * Card text:
 *   "[Once Per Turn] If your [Trafalgar Law] would be K.O.'d, you may add 1 card from the top of your
 *    Life cards to your hand instead.
 *    [Activate: Main] [Once Per Turn] DON!! −1: The next time you play [Trafalgar Law] with a cost of 4
 *    or more from your hand during this turn, the cost will be reduced by 2."
 *
 * Rulings: RL-41 (QA-OP12 OP12-061, four rows) and RL-31: the replacement is optional ("may"), once per
 * turn (CR 8-1-3-4-1, 10-2-13), covers K.O. by battle and by effect (CR 10-2-1-1), cannot be used with 0
 * Life, takes the Life card to hand with no [Trigger]; the name must be exactly [Trafalgar Law]
 * (CR 2-1-2). Cost: playing a non-Law Character, a Law of cost 3 or less, or a Law not from hand does
 * not use the reduction up.
 * Scenery: OP04-087 Trafalgar Law (cost 5, 7000), OP09-069 Trafalgar Law (cost 1, 2000), OP05-069
 * Trafalgar Law (cost 3, 5000), EB04-038 Rosinante & Law (cost 6; "also treat this card's name as
 * [Trafalgar Law]"), OP02-020 LittleOars Jr. (9000), OP02-007 Thatch (8000), OP17-090 Franky
 * (K.O. effect with a cost-12 Character on the field: OP17-089 Saul).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  accept,
  activate,
  attack,
  BLUE,
  canActivate,
  choose,
  decider,
  decline,
  donOf,
  isLegal,
  kind,
  LD,
  LEAD,
  myTurn,
  noDefence,
  offered,
  payDon,
  playFromHand,
  RED,
  rep,
  side,
  sortedIds,
  theirTurn,
  V,
  VAN,
  zoneCards,
} from './kit-d.ts';

const LAW5 = V.law5; // OP04-087
const LAW1 = 'OP09-069';
const LAW3 = 'OP05-069';
const ROSILAW = 'EB04-038';

/** p2's turn; p1's rested Characters `chars` are attacked by p2's LittleOars (and Thatch). */
function defending(
  chars: PlayerSpec['characters'],
  life: number = 3,
  p2: Partial<PlayerSpec> = {},
) {
  return theirTurn(
    side(LD.rosinante, BLUE, {
      life: [VAN.kingdew, ...rep(BLUE, Math.max(life - 1, 0))].slice(0, life),
      characters: chars,
    }),
    side(LEAD.luffy, RED, { characters: [VAN.littleOars, VAN.thatch], ...p2 }),
  );
}

describe('OP12-061 [Once Per Turn] replacement: [Trafalgar Law] would be K.O.’d', () => {
  it('RL-41: K.O. by battle: the offer comes, accepting keeps Law and takes the top Life card into hand', () => {
    const g = defending([{ card: LAW5, rested: true }]);
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', LAW5));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([LAW5]);
    expect(g.life('p1')).toBe(2);
    expect(zoneCards(g, 'p1', 'hand')).toEqual([VAN.kingdew]);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    // The Life card goes to hand without a [Trigger] decision, and play returns to p2.
    expect(kind(g)).toBe('main');
    expect(decider(g)).toBe('p2');
  });

  it('"you may": declining lets Law be K.O.’d and keeps the Life card', () => {
    const g = defending([{ card: LAW5, rested: true }]);
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', LAW5));
    noDefence(g);
    decline(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([LAW5]);
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('RL-41 / CR 8-1-3-4-5: with 0 Life it cannot be used: no offer, Law is K.O.’d', () => {
    const g = defending([{ card: LAW5, rested: true }], 0);
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', LAW5));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([LAW5]);
    expect(kind(g)).toBe('main');
  });

  it('CR 10-2-13 [Once Per Turn]: the second Law K.O.’d in the same turn is not offered the replacement', () => {
    const g = defending([
      { card: LAW5, rested: true },
      { card: LAW1, rested: true },
    ]);
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', LAW5));
    noDefence(g);
    accept(g);
    attack(g, g.find('p2', 'characters', VAN.thatch), g.find('p1', 'characters', LAW1));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([LAW5]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([LAW1]);
    expect(g.life('p1')).toBe(2);
  });

  it('CR 10-2-13: declining does not use it up: a later Law K.O. in the same turn is offered again', () => {
    const g = defending([
      { card: LAW5, rested: true },
      { card: LAW1, rested: true },
    ]);
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', LAW5));
    noDefence(g);
    decline(g);
    attack(g, g.find('p2', 'characters', VAN.thatch), g.find('p1', 'characters', LAW1));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(true);
  });

  it('CR 2-1-2: only [Trafalgar Law] qualifies: another Character K.O.’d gets no offer', () => {
    const g = defending([{ card: VAN.hajrudin, rested: true }]);
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', VAN.hajrudin));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.hajrudin]);
  });

  it('a K.O. by an EFFECT is covered too (CR 10-2-1-1): p2’s Franky K.O.s a cost-1 Law', () => {
    const g = theirTurn(
      side(LD.rosinante, BLUE, { life: rep(BLUE, 3), characters: [LAW1] }),
      side(LEAD.luffy, RED, {
        hand: ['OP17-090'],
        characters: ['OP17-089'],
        costArea: { active: 2, rested: 0 },
      }),
    );
    playFromHand(g, 'OP17-090', 'p2');
    choose(g, [g.find('p1', 'characters', LAW1)]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([LAW1]);
    expect(g.life('p1')).toBe(2);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
  });

  it('a card that is also treated as [Trafalgar Law] (EB04-038) is covered', () => {
    const g = defending([{ card: ROSILAW, rested: true }]);
    attack(g, g.find('p2', 'characters', VAN.littleOars), g.find('p1', 'characters', ROSILAW));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(true);
  });
});

describe('OP12-061 [Activate: Main] [Once Per Turn] DON!! −1: the next Law (cost 4+) played from hand costs 2 less', () => {
  function turn(hand: string[], active = 8, p1: Partial<PlayerSpec> = {}) {
    return myTurn(
      side(LD.rosinante, BLUE, { hand, costArea: { active, rested: 0 }, ...p1 }),
      side(LEAD.luffy, RED),
    );
  }
  const start = (g: ReturnType<typeof turn>) => {
    activate(g, g.leader('p1'));
    payDon(g, 1);
  };

  it('RL-41: after DON!! −1, a cost-5 Law costs 3', () => {
    const g = turn([LAW5]);
    start(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 7, deck: 3 });
    playFromHand(g, LAW5);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 3 });
    expect(sortedIds(g, 'p1', 'characters')).toEqual([LAW5]);
  });

  it('RL-41 row 2: playing a non-Law Character first does not use it up', () => {
    const g = turn([V.doberman, LAW5]);
    start(g);
    playFromHand(g, V.doberman);
    expect(donOf(g, 'p1').active).toBe(5);
    playFromHand(g, LAW5);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 5 });
  });

  it('RL-41 row 3: a Law of cost 3 or less does not use it up (and is not discounted)', () => {
    const g = turn([LAW3, LAW5]);
    start(g);
    playFromHand(g, LAW3);
    expect(donOf(g, 'p1').active).toBe(4);
    playFromHand(g, LAW5);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 6 });
  });

  it('it applies only once: a second cost-5 Law costs the full 5', () => {
    const g = turn([LAW5, LAW5]);
    start(g);
    playFromHand(g, LAW5);
    expect(donOf(g, 'p1').active).toBe(4);
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', LAW5) })).toBe(false);
  });

  it('without activating, a Law costs its full price', () => {
    const g = turn([LAW5], 4);
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', LAW5) })).toBe(false);
  });

  it('CR 10-2-13 [Once Per Turn]: the activation is not offered a second time', () => {
    const g = turn([LAW5]);
    start(g);
    expect(kind(g)).toBe('main');
    expect(canActivate(g, g.leader('p1'))).toBe(false);
  });

  it('a card that is also treated as [Trafalgar Law] (EB04-038, cost 6) is discounted to 4', () => {
    const g = turn([ROSILAW]);
    start(g);
    playFromHand(g, ROSILAW);
    // [On Play] may add DON!!; compare only the DON!! spent: 7 active before, 4 paid.
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ROSILAW]);
    expect(donOf(g, 'p1').rested).toBe(4);
  });
});
