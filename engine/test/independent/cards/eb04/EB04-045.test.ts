/**
 * EB04-045 Ginny (Character, Black, cost 1, 2000, Counter +2000, {Revolutionary Army}).
 *
 * Card text: "[Activate: Main] You may rest this Character: If there are 2 or more Characters with a
 * cost of 8 or more, up to 1 of your {Revolutionary Army} type Leader or Character cards gains
 * +1000 power during this turn."
 *
 * Rules: "there are" counts Characters on both sides of the field (nothing says "your"). The cost is
 * resting this Character and is paid before the "If". Power "during this turn" ends at the turn end.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  endTurn,
  fill,
  isRestedInst,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredAbilities,
  offeredIds,
  pickRaw,
  useAbility,
  yes,
  atMain,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-045';
/** OP12-005 Shiki: Red, cost 8, 10000. */
const C8 = 'OP12-005';
/** OP02-020 LittleOars Jr.: Red, cost 7, 9000. */
const C7 = 'OP02-020';
/** EB05-041 Koala: Black, cost 2, 4000, {Revolutionary Army}/{Dressrosa}. Vanilla. */
const KOALA = 'EB05-041';
const SAI = 'OP01-012'; // Red, cost 2, not Revolutionary Army

function board(
  mineChars: (string | { card: string; rested: boolean })[],
  foes: string[],
): TestGame {
  return mine(
    LB.army,
    { characters: [ID, ...mineChars], deck: fill(BLUE, 10) },
    { characters: foes, deck: fill(BLUE, 10) },
  );
}

/** Activate, accept the "you may rest" cost if asked. */
function activate(g: TestGame): void {
  useAbility(g, at(g, 'p1', 'characters', ID));
  if (kind(g) === 'optional') yes(g);
}

describe('EB04-045 Ginny: [Activate: Main] rest this: with 2+ Characters of cost 8+, a {Revolutionary Army} card gets +1000', () => {
  it('with two cost-8 Characters of yours the Leader gets +1000 this turn and Ginny is rested', () => {
    const g = board([C8, C8], []);
    activate(g);
    need(g, 'choose', 'p1');
    pickRaw(g, g.leader('p1'));
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(isRestedInst(g, at(g, 'p1', 'characters', ID))).toBe(true);
  });

  it('Characters of both sides count: one of yours and one of the opponent is enough', () => {
    const g = board([C8], [C8]);
    activate(g);
    need(g, 'choose', 'p1');
    pickRaw(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('two cost-8 Characters on the opponent side alone are enough', () => {
    const g = board([], [C8, C8]);
    activate(g);
    need(g, 'choose', 'p1');
    pickRaw(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('boundary: only one Character with cost 8 or more gives no power', () => {
    const g = board([C8], [C7]);
    activate(g);
    if (kind(g) === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(atMain(g)).toBe(true);
  });

  it('boundary: cost 7 Characters do not count', () => {
    const g = board([C7, C7], [C7]);
    activate(g);
    if (kind(g) === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('offers only {Revolutionary Army} Leader or Characters, including Ginny herself', () => {
    const g = board([C8, C8, KOALA, SAI], []);
    activate(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ID, KOALA, LB.army].sort());
  });

  it('a Character can be the one boosted', () => {
    const g = board([C8, C8, KOALA], []);
    activate(g);
    pickRaw(g, at(g, 'p1', 'characters', KOALA));
    expect(g.power(at(g, 'p1', 'characters', KOALA))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may choose nobody; Ginny is still rested', () => {
    const g = board([C8, C8], []);
    activate(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(isRestedInst(g, at(g, 'p1', 'characters', ID))).toBe(true);
  });

  it('declining the cost keeps Ginny active and gives no power', () => {
    const g = board([C8, C8], []);
    useAbility(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'optional') {
      no(g);
      expect(isRestedInst(g, at(g, 'p1', 'characters', ID))).toBe(false);
      expect(g.power(g.leader('p1'))).toBe(5000);
    } else {
      none(g);
    }
  });

  it('cannot be activated while Ginny is rested', () => {
    const g = board([C8, C8, { card: 'OP01-012', rested: false }], []);
    const rested = mine(LB.army, { characters: [{ card: ID, rested: true }, C8, C8] }, {});
    expect(offeredAbilities(rested, at(rested, 'p1', 'characters', ID))).toEqual([]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toHaveLength(1);
  });

  it('the +1000 ends at the end of the turn', () => {
    const g = board([C8, C8], []);
    activate(g);
    pickRaw(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(6000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
