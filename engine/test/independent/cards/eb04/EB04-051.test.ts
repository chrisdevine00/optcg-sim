/**
 * EB04-051 Emet (Character, Yellow, cost 8, 7000, no Counter, {Egghead}).
 *
 * Card text: "This Character cannot attack unless there is a Character with 12000 base power or more."
 * "[Trigger] Give all of your opponent's Characters −3000 power during this turn. Then, if you have
 * 0 Life cards, play this card."
 *
 * Rules: "there is a Character" counts a Character of either side. "Base power" is the printed power
 * and ignores DON!! and effects. The [Trigger] resolves after the Life card has left the Life area,
 * so "0 Life cards" is true when that card was the last one. "Then" after a failed "If" does not
 * resolve; here the "Then" is an unconditional step followed by its own "if".
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  canAttackAnything,
  chars,
  endTurn,
  fill,
  kind,
  LB,
  mine,
  need,
  passBlock,
  theirs,
  trash,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-051';
/** P-041 Monkey.D.Luffy: Purple, cost 10, 12000 base power, vanilla. */
const BIG = 'P-041';
/** OP02-020 LittleOars Jr.: Red, cost 7, 9000, vanilla. */
const OARS = 'OP02-020';
const KINGDEW = 'OP02-006'; // Red, cost 5, 7000
const SAI = 'OP01-012'; // Red, cost 2, 4000
const HAJ = 'OP01-018'; // Red, cost 4, 6000

function board(
  own: (string | { card: string; don: number })[],
  foes: string[],
  active = 10,
): TestGame {
  return mine(
    LB.egghead,
    { characters: [ID, ...own], deck: fill(BLUE, 10), costArea: { active, rested: 0 } },
    { characters: foes },
  );
}

describe('EB04-051 Emet: cannot attack unless there is a Character with 12000 base power or more', () => {
  it('cannot attack when no Character has 12000 base power', () => {
    const g = board([], []);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', ID))).toBe(false);
  });

  it('can attack when a Character of yours has 12000 base power', () => {
    const g = board([BIG], []);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', ID))).toBe(true);
  });

  it('can attack when a Character of the opponent has 12000 base power (either side counts)', () => {
    const g = board([], [BIG]);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', ID))).toBe(true);
  });

  it('base power only: a 9000 Character with 3 DON!! (12000 current) does not enable the attack', () => {
    const g = board([{ card: OARS, don: 3 }], [], 7);
    expect(g.power(at(g, 'p1', 'characters', OARS))).toBe(12000);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', ID))).toBe(false);
  });

  it('a 10000-base Character does not enable the attack (boundary below 12000)', () => {
    const g = board(['OP12-005'], []);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', ID))).toBe(false);
  });

  it('the restriction ends when the 12000 Character leaves: the opposing one is gone on its removal', () => {
    const g = board([], [BIG]);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', ID))).toBe(true);
    const h = board([], [SAI]);
    expect(canAttackAnything(h, at(h, 'p1', 'characters', ID))).toBe(false);
  });

  it('other Characters of yours are not restricted', () => {
    const g = board([KINGDEW], []);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', KINGDEW))).toBe(true);
  });
});

describe('EB04-051 Emet [Trigger]: all opposing Characters -3000 this turn; then with 0 Life, play this card', () => {
  /** p2 attacks p1 with Kingdew; p1's Life is `life` (top first) and the top card is Emet. */
  function hit(life: string[]): TestGame {
    const g = theirs(
      LB.egghead,
      { life, deck: fill(BLUE, 10) },
      { characters: [KINGDEW, SAI, { card: HAJ, rested: true } as unknown as string] },
    );
    attack(g, at(g, 'p2', 'characters', KINGDEW), g.leader('p1'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    return g;
  }

  it('gives every opposing Character -3000 power, rested ones included', () => {
    const g = hit([ID, BLUE]);
    expect(kind(g)).toBe('trigger');
    g.act({ type: 'trigger', activate: true });
    expect(g.power(at(g, 'p2', 'characters', KINGDEW))).toBe(4000);
    expect(g.power(at(g, 'p2', 'characters', SAI))).toBe(1000);
    expect(g.power(at(g, 'p2', 'characters', HAJ))).toBe(3000);
  });

  it('with Life cards left, Emet is not played and goes to the trash', () => {
    const g = hit([ID, BLUE]);
    g.act({ type: 'trigger', activate: true });
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(g.life('p1')).toBe(1);
  });

  it('boundary: when the Emet card was the last Life card (0 Life left), it is played', () => {
    const g = hit([ID]);
    g.act({ type: 'trigger', activate: true });
    expect(g.life('p1')).toBe(0);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([]);
    expect(g.power(at(g, 'p2', 'characters', KINGDEW))).toBe(4000);
  });

  it('declining the Trigger: the card goes to the hand, no power change, not played', () => {
    const g = hit([ID]);
    g.act({ type: 'trigger', activate: false });
    expect(g.power(at(g, 'p2', 'characters', KINGDEW))).toBe(7000);
    expect(chars(g)).toEqual([]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([ID]);
  });

  it('the -3000 lasts only for the turn', () => {
    const g = hit([ID, BLUE]);
    g.act({ type: 'trigger', activate: true });
    expect(g.power(at(g, 'p2', 'characters', SAI))).toBe(1000);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(at(g, 'p2', 'characters', SAI))).toBe(4000);
  });

  it('your own Characters are not affected', () => {
    const g = theirs(
      LB.egghead,
      { life: [ID, BLUE], characters: [KINGDEW], deck: fill(BLUE, 10) },
      { characters: [KINGDEW] },
    );
    attack(g, at(g, 'p2', 'characters', KINGDEW), g.leader('p1'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    expect(g.power(at(g, 'p1', 'characters', KINGDEW))).toBe(7000);
  });
});
