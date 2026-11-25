/**
 * EB04-023 Chaka & Pell (Character, Blue, cost 8, 9000, {Alabasta}, Slash, [Double Attack]).
 *
 * Card text: "[Double Attack] (This card deals 2 damage.)
 * [On Play] You may give your active Leader −5000 power during this turn: Draw 2 cards."
 *
 * Rules: CR 8-3-1 (optional cost), "active Leader" = not rested, rules-digest 95 ([Double
 * Attack]: 2 damage to a Leader; against 1 Life it takes the last card and the game goes on),
 * rules-digest 112 (an [On Play] with a cost may be declined; the card is still played), battle
 * (the attacker needs at least the defender's power to deal damage), CR 6-6-1-3 ("during this
 * turn" ends at the End Phase). Printed keyword verified by override.
 * Scenery (printed): ST01-001 Luffy and ST03-001 Crocodile (5000 Leaders, [Activate: Main] only),
 * OP01-010 / OP01-012 / OP01-023 (vanilla Red Characters), OP01-104 Speed ([Trigger] Play this card).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { decision, noDefence, passBlock, passCounter } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  anomalies,
  BLUE,
  handOf,
  kw,
  L7,
  need,
  no,
  put,
  RED,
  S7,
  toMyNextMain,
  unusable,
  yes,
} from './kit-w7a.ts';

const ID = 'EB04-023';

function hand(o: Partial<PlayerSpec> = {}, leader: PlayerSpec['leader'] = L7.luffy) {
  return myTurn(
    side(L7.luffy, BLUE, { leader, hand: [ID], costArea: { active: 8, rested: 0 }, ...o }),
    side(L7.crocodile, RED, {}),
  );
}

function field(o: Partial<PlayerSpec> = {}, opp: Partial<PlayerSpec> = {}) {
  return myTurn(side(L7.luffy, BLUE, { characters: [ID], ...o }), side(L7.crocodile, RED, opp));
}

describe('EB04-023 Chaka & Pell: [On Play] you may give your active Leader -5000 power: draw 2', () => {
  it('printed effect: the Leader drops to 0 for the turn and I draw 2 cards', () => {
    const g = hand();
    const deck = g.zone('p1', 'deck').length;
    put(g, ID);
    yes(g, 'p1');
    expect(decision(g)?.kind).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(0);
    expect(g.zone('p1', 'hand')).toHaveLength(2);
    expect(g.zone('p1', 'deck')).toHaveLength(deck - 2);
    expect(anomalies(g)).toBe(0);
  });

  it('declining: no change to the Leader, nothing drawn; the Character is still played', () => {
    const g = hand();
    put(g, ID);
    no(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.find('p1', 'characters', ID)).toBeTruthy();
  });

  it('a rested Leader cannot pay: the effect cannot be used and nothing is drawn', () => {
    const g = hand({}, { card: L7.luffy, rested: true });
    put(g, ID);
    unusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('draws exactly 2 (not 1, not 3) from a deck that holds more', () => {
    const g = hand({ hand: [ID, S7.c1] as CardId[] });
    put(g, ID);
    yes(g, 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(3);
  });

  it('the -5000 is for this turn only', () => {
    const g = hand();
    put(g, ID);
    yes(g, 'p1');
    toMyNextMain(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Leader with DON!! given pays from its current power', () => {
    const g = hand({}, { card: L7.luffy, don: 1 } as unknown as PlayerSpec['leader']);
    expect(g.power(g.leader('p1'))).toBe(6000);
    put(g, ID);
    yes(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(1000);
  });

  it('a Leader at 0 power is still active: paying the cost does not rest it', () => {
    const g = hand();
    put(g, ID);
    yes(g, 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(g.power(g.leader('p1'))).toBe(0);
  });

  it('Characters are untouched; only my Leader is lowered', () => {
    const g = hand({ characters: [S7.c3] });
    put(g, ID);
    yes(g, 'p1');
    expect(g.power(g.find('p1', 'characters', S7.c3))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(9000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('a Leader at 0 power attacking a 5000-power Leader deals no damage', () => {
    const g = hand();
    put(g, ID);
    yes(g, 'p1');
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    noDefence(g);
    expect(g.life('p2')).toBe(4);
  });
});

describe('EB04-023 Chaka & Pell: [Double Attack]', () => {
  it('has the [Double Attack] keyword', () => {
    const g = field();
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Double Attack');
  });

  it("an unblocked attack on the Leader deals 2 damage: two Life cards go to the opponent's hand", () => {
    const g = field({}, { life: [S7.c1, S7.c2, S7.c3, S7.c4] });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    passBlock(g);
    passCounter(g);
    need(g, 'main', 'p1');
    expect(g.life('p2')).toBe(2);
    expect(g.zone('p2', 'hand')).toHaveLength(2);
  });

  it('against a Leader with 1 Life it takes that card and the game goes on (rules-digest 95)', () => {
    const g = field({}, { life: [S7.c1] });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    passBlock(g);
    passCounter(g);
    expect(g.life('p2')).toBe(0);
    expect(g.zone('p2', 'hand')).toHaveLength(1);
    expect(decision(g)?.kind).toBe('main');
  });

  it('against a Leader with 0 Life it wins the game', () => {
    const g = field({}, { life: [] });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    passBlock(g);
    passCounter(g);
    expect(decision(g)).toBeNull();
  });

  it('an attack on a Character is one K.O. and no Life damage', () => {
    const g = field(
      {},
      { life: [S7.c1, S7.c2, S7.c3], characters: [{ card: S7.c4, rested: true }] },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', ID),
      target: g.find('p2', 'characters', S7.c4),
    });
    passBlock(g);
    passCounter(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.life('p2')).toBe(3);
    expect(handOf(g, 'p2')).toEqual([]);
  });
});
