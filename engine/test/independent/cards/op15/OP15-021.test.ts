/**
 * OP15-021 Just Watch Me, Ace!!! (Event, Red, cost 4, {Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "If you have 4 or more Events in your trash, give this card in your hand -3 cost.
 * [Main]/[Counter] Give up to 1 of your opponent's Characters -3000 power during this turn."
 *
 * Rules: CR 8-1-3-3 (permanent effect in hand), CR 7-1-3-2 (Event [Counter] in the Counter Step),
 * CR 8-4-4-1 ("up to"), CR 8-4-2 (this turn).
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, noDefence, passBlock } from './kit-op15a.ts';
import {
  at,
  canCounterWith,
  chr,
  chooseIfAsked,
  costOf,
  don,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S15,
  SCN,
  theirs,
  useCounter,
  VAN,
} from './kit-op15a.ts';

const JWM = 'OP15-021';
const events = (n: number) => Array.from({ length: n }, () => S15.event);

function board(trash: string[], p2trash: string[] = [], hand: string[] = []) {
  return mine(
    LD15.luffy,
    { hand: [JWM, ...hand], trash },
    { characters: [SCN.c3, SCN.c5], trash: p2trash },
  );
}
const cost = (g: ReturnType<typeof board>) => costOf(g, at(g, 'p1', 'hand', JWM));

describe('OP15-021 Just Watch Me, Ace!!!: -3 cost in hand with 4 or more Events in my trash', () => {
  it('printed cost 4 with fewer than 4 Events in the trash', () => {
    expect(cost(board([]))).toBe(4);
    expect(cost(board(events(3)))).toBe(4);
  });

  it('boundary: exactly 4 Events make it cost 1', () => {
    expect(cost(board(events(4)))).toBe(1);
  });

  it('more Events do not reduce it further (still 1, never below)', () => {
    expect(cost(board(events(7)))).toBe(1);
  });

  it('only Events count: 3 Events and 5 Characters give nothing', () => {
    expect(cost(board([...events(3), ...Array.from({ length: 5 }, () => VAN.sunny)]))).toBe(4);
  });

  it('only my trash counts, and Events in my hand do not count', () => {
    expect(cost(board(events(0), events(4)))).toBe(4);
    expect(cost(board(events(3), [], events(3)))).toBe(4);
  });

  it('with 4 Events it can be played for exactly 1 DON!!; with 3 Events 1 DON!! is not enough', () => {
    const ok = mine(
      LD15.luffy,
      { hand: [JWM], trash: events(4), costArea: { active: 1, rested: 0 } },
      { characters: [SCN.c3] },
    );
    playRaw(ok, JWM);
    pickInst(ok, [chr(ok, 'p2', SCN.c3)]);
    expect(don(ok, 'p1')).toMatchObject({ active: 0, rested: 1 });
    const short = mine(
      LD15.luffy,
      { hand: [JWM], trash: events(3), costArea: { active: 1, rested: 0 } },
      { characters: [SCN.c3] },
    );
    expect(short.legal().some((a) => a.type === 'playCard')).toBe(false);
  });

  it('[Main]: gives up to 1 opposing Character -3000 power this turn, and only that one', () => {
    const g = board(events(4));
    playRaw(g, JWM);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c5].sort());
    pickInst(g, [chr(g, 'p2', SCN.c5)]);
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p2', SCN.c5))).toBe(4000);
    expect(g.power(chr(g, 'p2', SCN.c3))).toBe(5000);
  });

  it('[Main]: "up to": choosing nothing changes nothing', () => {
    const g = board(events(4));
    playRaw(g, JWM);
    none(g);
    expect(g.power(chr(g, 'p2', SCN.c5))).toBe(7000);
  });

  it('the -3000 ends with the turn', () => {
    const g = board(events(4));
    playRaw(g, JWM);
    pickInst(g, [chr(g, 'p2', SCN.c5)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p2', SCN.c5))).toBe(7000);
  });
});

/** p2 attacks my Leader (5000) with a 5000 Character; I hold Just Watch Me with `active` DON!! . */
function defend(trash: string[], active: number) {
  const g = theirs(
    LD15.luffy,
    { hand: [JWM], trash, costArea: { active, rested: 0 } },
    { characters: [SCN.c3] },
  );
  attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
  passBlock(g);
  return g;
}

describe('OP15-021 Just Watch Me, Ace!!!: [Counter]', () => {
  it('with 4 Events in the trash it can be used as a Counter with 1 DON!!, and -3000 on the attacker beats the attack', () => {
    const g = defend(events(4), 1);
    const card = at(g, 'p1', 'hand', JWM);
    expect(canCounterWith(g, card)).toBe(true);
    useCounter(g, card, g.leader('p1'));
    chooseIfAsked(g, [chr(g, 'p2', SCN.c3)]);
    expect(g.power(chr(g, 'p2', SCN.c3))).toBe(2000);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('with only 3 Events in the trash and 1 active DON!! it cannot be used (cost 4)', () => {
    const g = defend(events(3), 1);
    expect(canCounterWith(g, at(g, 'p1', 'hand', JWM))).toBe(false);
  });

  it('with 4 active DON!! and 3 Events it can be used at its printed cost 4', () => {
    const g = defend(events(3), 4);
    const card = at(g, 'p1', 'hand', JWM);
    expect(canCounterWith(g, card)).toBe(true);
    useCounter(g, card, g.leader('p1'));
    chooseIfAsked(g, [chr(g, 'p2', SCN.c3)]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4 });
    expect(g.power(chr(g, 'p2', SCN.c3))).toBe(2000);
  });

  it('without the Counter the same attack connects (5000 vs 5000)', () => {
    const g = defend(events(4), 1);
    noDefence(g);
    expect(g.life('p1')).toBe(3);
  });
});
