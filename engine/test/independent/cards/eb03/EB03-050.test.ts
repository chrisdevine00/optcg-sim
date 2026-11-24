/**
 * EB03-050 Conis (Character, Yellow, cost 2, 0 power, Counter +1000, {Sky Island}).
 *
 * Card text: "[On Play] Up to 1 of your {Sky Island} type Characters gains [Double Attack] during
 * this turn. (This card deals 2 damage.)"
 *
 * Rules: CR 4-8-1 ("up to"), CR 10-1-3 ([Double Attack]: 2 damage to Life), CR 2-4-3 (exact type),
 * "during this turn" ends with the turn. The candidates are my Characters only (not my Leader).
 * Scenery: OP06-105 Genbo (Yellow, cost 3, 5000, {Sky Island}/{Shandian Warrior}, vanilla),
 * OP05-110 Holly (Yellow, cost 3, 5000, {Animal}/{Sky Island}, vanilla), OP05-098 Enel (a
 * {Sky Island} Leader).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, noDefence } from '../../helpers.ts';
import {
  atMain,
  C14,
  canFinish,
  kw,
  LB,
  mine,
  need,
  offeredIds,
  pickCards,
  put,
  none,
} from './kit-eb03b.ts';

const ID = 'EB03-050';
const GENBO = 'OP06-105';
const HOLLY = 'OP05-110';
const MARCO = C14.marco; // not {Sky Island}
const ENEL = 'OP05-098'; // {Sky Island} Leader

function start(o: { mine?: string[]; p2?: string[]; leader?: string }) {
  return mine(
    o.leader ?? LB.luffy,
    { hand: [ID], characters: o.mine ?? [], costArea: { active: 10, rested: 0 } },
    { characters: o.p2 ?? [] },
  );
}

const hasDA = (g: ReturnType<typeof start>, card: string, who: 'p1' | 'p2' = 'p1') =>
  kw(g, g.find(who, 'characters', card)).includes('Double Attack');

describe('EB03-050 Conis: [On Play] up to 1 of my {Sky Island} Characters gains [Double Attack] this turn', () => {
  it('gives [Double Attack] to a chosen {Sky Island} Character', () => {
    const g = start({ mine: [GENBO, HOLLY] });
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [GENBO]);
    expect(atMain(g)).toBe(true);
    expect(hasDA(g, GENBO)).toBe(true);
    expect(hasDA(g, HOLLY)).toBe(false);
  });

  it("the candidates are {Sky Island} Characters only: Conis herself yes; a non-{Sky Island} Character, the opponent's Characters and my Leader no", () => {
    const g = start({ leader: ENEL, mine: [GENBO, MARCO], p2: [HOLLY] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([GENBO, ID].sort());
  });

  it('Conis may give it to herself when she is the only candidate (the engine may or may not ask)', () => {
    const g = start({ mine: [MARCO] });
    put(g, ID);
    if (!atMain(g)) pickCards(g, [ID]);
    expect(atMain(g)).toBe(true);
    expect(hasDA(g, ID)).toBe(true);
  });

  it('"up to 1": choosing nobody gives no [Double Attack]', () => {
    const g = start({ mine: [GENBO] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(hasDA(g, GENBO)).toBe(false);
    expect(hasDA(g, ID)).toBe(false);
  });

  it('only one Character receives it', () => {
    const g = start({ mine: [GENBO, HOLLY] });
    put(g, ID);
    pickCards(g, [HOLLY]);
    expect([GENBO, HOLLY, ID].filter((c) => hasDA(g, c))).toEqual([HOLLY]);
  });

  it("it is real: the chosen Character deals 2 damage to the opponent's Leader; the others deal 1", () => {
    const withDA = start({ mine: [GENBO] });
    put(withDA, ID);
    pickCards(withDA, [GENBO]);
    attack(withDA, withDA.find('p1', 'characters', GENBO), withDA.leader('p2'));
    noDefence(withDA);
    expect(withDA.life('p2')).toBe(2);

    const without = start({ mine: [GENBO] });
    put(without, ID);
    none(without);
    attack(without, without.find('p1', 'characters', GENBO), without.leader('p2'));
    noDefence(without);
    expect(without.life('p2')).toBe(3);
  });

  it('"during this turn": the keyword is gone on the opponent\'s turn and on my next turn', () => {
    const g = start({ mine: [GENBO] });
    put(g, ID);
    pickCards(g, [GENBO]);
    expect(hasDA(g, GENBO)).toBe(true);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(hasDA(g, GENBO)).toBe(false);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(hasDA(g, GENBO)).toBe(false);
  });

  it('Conis herself does not get it when another Character is chosen', () => {
    const g = start({ mine: [GENBO] });
    put(g, ID);
    pickCards(g, [GENBO]);
    // Conis herself was not chosen, so she has no [Double Attack].
    expect(hasDA(g, ID)).toBe(false);
  });

  it('the card has no effect beyond [On Play]: Conis alone with nobody else in play still has 0 power and no keyword', () => {
    const g = start({ mine: [MARCO] });
    put(g, ID);
    if (!atMain(g)) none(g);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(0);
    expect(hasDA(g, MARCO)).toBe(false);
  });
});
