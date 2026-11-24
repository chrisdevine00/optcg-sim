/**
 * OP15-052 Leo (Character, Blue, cost 1, 2000, Counter +2000, {Dressrosa}/{The Tontattas}).
 *
 * Card text: "If your Character with 7000 base power or less would be removed from the field by your
 * opponent's effect, you may place 1 of your Characters at the bottom of the owner's deck instead."
 *
 * Rules: CR 8-1-3-4 (a replacement effect replaces the whole indicated part; "may" means it can be
 * declined), CR 8-1-3-4-1 (declining means the original event happens), CR 4-9-2 (base power is the
 * printed value), RD 109 (battle K.O. is not "by an effect").
 * Opposing removal used as scenery: OP09-077 Gum-Gum Lightning (K.O. up to 1 Character with 6000 power or
 * less, DON!! -2) and EB01-059 Kingdom Come (cost 6, K.O. up to 1 Character).
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import {
  accept,
  BLUE,
  choices,
  deck,
  hand,
  inst,
  kind,
  LD15,
  mine,
  need,
  offeredIds,
  opponentKOs,
  payDon,
  payHand,
  pickInst,
  playCard,
  RED,
  SCN,
  side,
  theirTurn,
  yes,
  no,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const LEO = 'OP15-052';
const LIGHTNING = 'OP09-077';
const KINGDOM_COME = 'EB01-059';

function board(own: string[], p2hand: string[] = [LIGHTNING]): TestGame {
  return theirTurn(
    side(LD15.dressrosa, BLUE, {
      characters: own,
      deck: [SCN.c1, SCN.c2, ...Array.from({ length: 12 }, () => BLUE)],
    }),
    side(LD15.neutral, RED, {
      costArea: { active: 10, rested: 0 },
      hand: p2hand,
      deck: Array.from({ length: 12 }, () => SCN.c1),
      life: Array.from({ length: 4 }, () => SCN.c1),
    }),
  );
}

/** p2 casts Kingdom Come on `target` (no choice of DON!! needed). Leaves the first prompt after the choice. */
function kingdomCome(g: TestGame, target: string): void {
  playCard(g, KINGDOM_COME);
  need(g, 'choose', 'p2');
  pickInst(g, [target]);
}

describe('OP15-052 Leo: replacement for my Character (7000 base or less) removed by an opposing effect', () => {
  it('K.O. by an opposing effect: I am asked, accept, place another Character at my deck bottom; the target stays', () => {
    const g = board([LEO, SCN.c3, SCN.c4]);
    opponentKOs(g, inst(g, 'p1', 'characters', SCN.c3));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', SCN.c4)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([LEO, SCN.c3].sort());
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([]);
    const d = deck(g, 'p1');
    expect(d[d.length - 1]).toBe(SCN.c4);
    expect(d).toHaveLength(15);
  });

  it('"may": declining lets the K.O. happen as usual and nothing is placed', () => {
    const g = board([LEO, SCN.c3, SCN.c4]);
    opponentKOs(g, inst(g, 'p1', 'characters', SCN.c3));
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([LEO, SCN.c4].sort());
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([SCN.c3]);
    expect(deck(g, 'p1')).toHaveLength(14);
  });

  it('the Character placed may be any of my Characters, and only mine', () => {
    const g = board([LEO, SCN.c3, SCN.c4]);
    g.zone('p2', 'characters');
    opponentKOs(g, inst(g, 'p1', 'characters', SCN.c3));
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    const offered = offeredIds(g);
    expect(offered).toContain(SCN.c4);
    expect(offered).toContain(LEO);
    expect(choices(g).every((c) => g.card(c).owner === 'p1')).toBe(true);
  });

  it('boundary: a Character with exactly 7000 base power is protected', () => {
    const g = board([LEO, SCN.c5, SCN.c1], [KINGDOM_COME]);
    kingdomCome(g, inst(g, 'p1', 'characters', SCN.c5));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', SCN.c1)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(SCN.c5);
    expect(g.zone('p1', 'trash').map((c) => c.card)).not.toContain(SCN.c5);
  });

  it('boundary: a Character with 8000 base power is not protected (no question, K.O.’d)', () => {
    const g = board([LEO, SCN.c6, SCN.c1], [KINGDOM_COME]);
    kingdomCome(g, inst(g, 'p1', 'characters', SCN.c6));
    expect(kind(g)).not.toBe('optional');
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([SCN.c6]);
  });

  it('Leo himself (2000) is covered too: a K.O. on Leo is replaceable and Leo can stay', () => {
    const g = board([LEO, SCN.c4]);
    opponentKOs(g, inst(g, 'p1', 'characters', LEO));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', SCN.c4)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([LEO]);
  });

  it('returning to hand by an opposing effect (OP17-105 Chiffon [On Play]) is replaceable too', () => {
    const g = board([LEO, 'OP01-104', SCN.c4], ['OP17-105', 'OP01-104']);
    playCard(g, 'OP17-105');
    need(g, 'optional', 'p2');
    yes(g, 'p2');
    payHand(g, ['OP01-104']);
    need(g, 'choose', 'p2');
    pickInst(g, [inst(g, 'p1', 'characters', 'OP01-104')]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', SCN.c4)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain('OP01-104');
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('must not: a battle K.O. is not removal by an effect, so no replacement is offered', () => {
    const g = theirTurn(
      side(LD15.dressrosa, BLUE, { characters: [LEO, { card: SCN.c3, rested: true }] }),
      side(LD15.neutral, RED, { characters: [SCN.c4] }),
    );
    attack(g, inst(g, 'p2', 'characters', SCN.c4), inst(g, 'p1', 'characters', SCN.c3));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([SCN.c3]);
  });

  it('must not: my Leo does not protect the opponent\u2019s Characters from my own removal', () => {
    const g = mine(
      LD15.dressrosa,
      { characters: [LEO, SCN.c4], hand: [LIGHTNING] },
      { characters: [SCN.c3] },
    );
    playCard(g, LIGHTNING);
    accept(g);
    payDon(g, 2);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c3)]);
    expect(kind(g)).toBe('main');
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([SCN.c3]);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
  });

  it('with Leo gone no replacement is offered: the same K.O. just happens', () => {
    const g = board([SCN.c3, SCN.c4]);
    opponentKOs(g, inst(g, 'p1', 'characters', SCN.c3));
    expect(kind(g)).toBe('main');
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([SCN.c3]);
  });

  it('it is not once per turn: a second removal in the same turn is replaceable again', () => {
    const g = board([LEO, SCN.c3, SCN.c4, SCN.c1], [LIGHTNING, LIGHTNING]);
    opponentKOs(g, inst(g, 'p1', 'characters', SCN.c3));
    yes(g, 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', SCN.c1)]);
    need(g, 'main', 'p2');
    opponentKOs(g, inst(g, 'p1', 'characters', SCN.c4));
    need(g, 'optional', 'p1');
  });
});
