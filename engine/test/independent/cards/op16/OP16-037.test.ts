/**
 * OP16-037 Mr.3(Galdino) (Character, Green, cost 2, 3000, Counter +1000, {Impel Down}/{Former Baroque
 * Works}, Special).
 *
 * Card text: "[On Play] If your Leader has the {Impel Down} type, rest up to 1 of your opponent's
 * Characters with a cost of 5 or less."
 *
 * Rules: CR 8-3-2 (an "if" condition gates the effect), "up to 1" (CR 8-4-4-1), "a type including"
 * is satisfied by the {Impel Down} type among several.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  choices,
  mayChooseNone,
  mine,
  need,
  none,
  OL,
  OV,
  offeredIds,
  pickInst,
  playCard,
  restedChar,
} from './kit-op16a.ts';

const GALDINO = 'OP16-037';
const COST5 = OV.kingdew5; // cost 5, 7000
const COST6 = OV.thatch; // cost 6, 8000
const COST1 = OV.komachiyo3; // cost 1, 3000

function play(leader: string, p2chars: string[]) {
  const g = mine(leader, { hand: [GALDINO] }, { characters: p2chars });
  playCard(g, GALDINO);
  return g;
}

describe('OP16-037 Mr.3(Galdino): [On Play] with an {Impel Down} Leader, rest a cost 5 or less Character', () => {
  it('with an {Impel Down} Leader: offers the opposing Characters with cost 5 or less', () => {
    const g = play(OL.impel, [COST5, COST6, COST1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([COST1, COST5].sort());
  });

  it('boundary: cost 5 is offered, cost 6 is not', () => {
    const g = play(OL.impel, [COST5, COST6]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([COST5]);
  });

  it('rests the chosen Character only', () => {
    const g = play(OL.impel, [COST5, COST1]);
    pickInst(g, [at(g, 'p2', 'characters', COST5)]);
    expect(restedChar(g, 'p2', COST5)).toBe(true);
    expect(restedChar(g, 'p2', COST1)).toBe(false);
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": may rest nothing', () => {
    const g = play(OL.impel, [COST5]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(restedChar(g, 'p2', COST5)).toBe(false);
  });

  it('a Leader that does not have the {Impel Down} type: nothing is asked and nothing is rested', () => {
    const g = play(OL.kid, [COST5]);
    expect(atMain(g)).toBe(true);
    expect(restedChar(g, 'p2', COST5)).toBe(false);
  });

  it('a Leader with {Impel Down} among several types counts (Straw Hat Crew / Impel Down)', () => {
    const g = play(OL.impel, [COST1]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([COST1]);
  });

  it('only opposing Characters are candidates: not the Leader, not my own Characters', () => {
    const g = mine(OL.impel, { hand: [GALDINO], characters: [OV.sai4] }, { characters: [COST1] });
    playCard(g, GALDINO);
    need(g, 'choose');
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toEqual([COST1]);
  });

  it('with no opposing Character of cost 5 or less there is nothing to rest', () => {
    const g = play(OL.impel, [COST6]);
    expect(atMain(g)).toBe(true);
    expect(restedChar(g, 'p2', COST6)).toBe(false);
  });

  it('it is played for its cost of 2 regardless of the effect', () => {
    const g = play(OL.kid, []);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([GALDINO]);
  });
});
