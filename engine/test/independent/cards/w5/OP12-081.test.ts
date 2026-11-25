/**
 * OP12-081 Koala (Leader, Black/Yellow, 5000, 4 Life, {Revolutionary Army}/{Dressrosa}, Strike).
 *
 * Card text: "When this Leader attacks your opponent's Leader, if you have 2 or more Characters with a
 * cost of 8 or more, draw 1 card."
 * "[Once Per Turn] This effect can be activated when your opponent plays a Character with a base
 * cost of 8 or more, or when your opponent plays a Character using a Character's effect. Your
 * opponent adds 1 card from the top of their Life cards to their hand."
 *
 * Rules: the draw is an effect-level "if" (colon-less): the ability fires on every attack on a
 * Leader and the draw happens only when the count is met; an attack on a Character does not match
 * "attacks your opponent's Leader" (DECISIONS 2026-11-25); the second effect is mandatory, goes by
 * BASE cost for the first trigger and by any cost for a Character played by a Character's effect;
 * only the opponent's plays count; "Once Per Turn" is per turn, not per play.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  at,
  atMain,
  attack,
  chars,
  COST,
  hand,
  kind,
  lifeCards,
  mine,
  need,
  noDefence,
  pickCards,
  playRaw,
  theirs,
  trash,
  V13,
  type Spec,
  type Place,
} from './kit-w5b.ts';

const KOALA = 'OP12-081';
/** OP12-005 Shiki: Red, cost 8, 10000, vanilla. */
const C8 = COST.c8;
/** OP02-020 LittleOars Jr.: Red, cost 7, 9000, vanilla. */
const C7 = COST.c7;
/** P-041 Monkey.D.Luffy: Purple, cost 10, 12000, vanilla. */
const C10 = COST.c10;
/** EB02-038 Magellan: Purple, cost 3, 4000, [On Play] Play up to 1 "Impel Down" type Character with cost 2 or less from hand. */
const MAGELLAN = 'EB02-038';
/** OP02-084 Blugori: Purple, cost 1, 3000, {Animal}/{Impel Down}, vanilla. */
const BLUGORI = 'OP02-084';

/** p1's turn: Koala with `own` Characters; p2 holds `p2chars`; both draw from known decks. */
function attackBoard(own: string[], p2chars: Place[] = []) {
  return mine(
    KOALA,
    { characters: own, hand: [V13.sai], deck: [V13.hajrudin, V13.kingdew, V13.thatch, V13.mohji] },
    { characters: p2chars, life: [V13.marco, V13.mohji, V13.mohji, V13.mohji] },
  );
}

/** p2's turn: Koala defends; p2 holds `hand` and 10 active DON!!. */
function defend(hand: string[], p2: Spec = {}) {
  return theirs(
    KOALA,
    { characters: [] },
    {
      hand,
      costArea: { active: 10, rested: 0 },
      life: [V13.marco, V13.hajrudin, V13.mohji, V13.mohji],
      ...p2,
    },
  );
}

describe('OP12-081 Koala: draw on a Leader attack with two cost 8+ Characters; their big or effect-played Character costs them a Life card', () => {
  it('printed values: Leader 5000 power, 4 Life', () => {
    const g = attackBoard([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p1')).toBe(4);
  });

  it('attacking their Leader with two cost 8+ Characters draws 1 card', () => {
    const g = attackBoard([C8, C8]);
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(hand(g)).toEqual([V13.sai, V13.hajrudin].sort());
  });

  it('a cost 10 Character counts as "8 or more"', () => {
    const g = attackBoard([C8, C10]);
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(hand(g)).toHaveLength(2);
  });

  it('boundary: only one cost 8+ Character (the other has cost 7) draws nothing', () => {
    const g = attackBoard([C8, C7]);
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(hand(g)).toEqual([V13.sai]);
  });

  it('boundary: a single cost 8+ Character draws nothing, but the attack still goes through', () => {
    const g = attackBoard([C8]);
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefence(g);
    expect(hand(g)).toEqual([V13.sai]);
    expect(lifeCards(g, 'p2')).toHaveLength(3);
  });

  it('attacking one of their Characters instead does not draw, even with two cost 8+ Characters', () => {
    const g = attackBoard([C8, C8], [{ card: V13.marco, rested: true }]);
    attack(g, g.leader('p1'), at(g, 'p2', 'characters', V13.marco));
    noDefence(g);
    expect(hand(g)).toEqual([V13.sai]);
    // The rested 5000 Character lost to my 5000 Leader (a tie is a win for the attacker).
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('their Character with a base cost of 8 or more makes them add their top Life card to their hand', () => {
    const g = defend([C8]);
    playRaw(g, C8);
    expect(atMain(g, 'p2')).toBe(true);
    expect(lifeCards(g, 'p2')).toHaveLength(3);
    expect(hand(g, 'p2')).toEqual([V13.marco]);
    expect(chars(g, 'p2')).toEqual([C8]);
  });

  it('boundary: a base cost of 7 does nothing', () => {
    const g = defend([C7]);
    playRaw(g, C7);
    expect(lifeCards(g, 'p2')).toHaveLength(4);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it("a Character of any cost played by a Character's effect also triggers it (Magellan plays a cost 1 Blugori)", () => {
    const g = defend([MAGELLAN, BLUGORI]);
    playRaw(g, MAGELLAN);
    need(g, 'choose', 'p2');
    pickCards(g, [BLUGORI]);
    expect(chars(g, 'p2').sort()).toEqual([BLUGORI, MAGELLAN].sort());
    expect(lifeCards(g, 'p2')).toHaveLength(3);
    expect(hand(g, 'p2')).toEqual([V13.marco]);
  });

  it('playing Magellan (cost 3, from hand) is not enough: when his effect plays nothing, no Life card moves', () => {
    const g = defend([MAGELLAN, BLUGORI]);
    playRaw(g, MAGELLAN);
    need(g, 'choose', 'p2');
    act(g, { type: 'done' });
    expect(chars(g, 'p2')).toEqual([MAGELLAN]);
    expect(lifeCards(g, 'p2')).toHaveLength(4);
    expect(hand(g, 'p2')).toEqual([BLUGORI]);
  });

  it('[Once Per Turn]: a second Character played by an effect in the same turn costs them nothing more', () => {
    const g = defend([MAGELLAN, MAGELLAN, BLUGORI, BLUGORI]);
    playRaw(g, MAGELLAN);
    pickCards(g, [BLUGORI]);
    playRaw(g, MAGELLAN);
    pickCards(g, [BLUGORI]);
    expect(chars(g, 'p2')).toHaveLength(4);
    expect(lifeCards(g, 'p2')).toHaveLength(3);
    expect(hand(g, 'p2')).toEqual([V13.marco]);
  });

  it('must not: my own plays of cost 8+ Characters never cost the opponent a Life card', () => {
    const g = mine(KOALA, { hand: [C8], costArea: { active: 10, rested: 0 } }, {});
    playRaw(g, C8);
    expect(kind(g)).toBe('main');
    expect(lifeCards(g, 'p2')).toHaveLength(4);
    expect(hand(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([]);
  });
});
