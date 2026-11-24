/**
 * OP11-038 Gum-Gum Elephant Gatling (Green Event, cost 1, {Straw Hat Crew}/{Supernovas}/{Fish-Man
 * Island}).
 *
 * Card text: "[Main] You may rest 1 of your DON!! cards: Rest up to 1 of your opponent's Characters with
 * a cost of 5 or less. [Counter] Up to 1 of your Leader gains +3000 power during this battle."
 *
 * Rules: the DON!! cost is optional and can only use an active DON!! (CR 2-7-?). Cost 5 is inside the
 * limit, 6 outside. "Up to 1" may be none (the cost stays paid). The Counter boosts the Leader only,
 * and only for this battle.
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  at,
  attack,
  BLUE,
  C11,
  canCounterNow,
  chooseIfAsked,
  donOf,
  fill,
  hand,
  isRested,
  kind,
  L11,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickInst,
  playCard,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op11b.ts';

const GATLING = 'OP11-038';

function main(active: number, p2chars: (string | { card: string; rested?: boolean })[]) {
  const g = mine(
    L11.mono,
    { hand: [GATLING], costArea: { active, rested: 0 } },
    { characters: p2chars },
  );
  playCard(g, GATLING);
  return g;
}

function defend(p1chars: string[] = []) {
  const g = theirs(
    L11.mono,
    {
      hand: [GATLING, ...fill(BLUE, 1)],
      costArea: { active: 1, rested: 0 },
      characters: p1chars,
    },
    { characters: [C11.c5] },
  );
  attack(g, at(g, 'p2', 'characters', C11.c5), g.leader('p1'));
  passBlock(g);
  return g;
}

describe('OP11-038 Gum-Gum Elephant Gatling: [Main] rest 1 DON!!: rest an opposing Character, cost 5 or less', () => {
  it('paying the DON!! cost offers exactly the opposing Characters with cost 5 or less, and rests the chosen one', () => {
    const g = main(3, [C11.c5, C11.c6, C11.c2]);
    need(g, 'optional', 'p1');
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.c2, C11.c5].sort());
    pickInst(g, [at(g, 'p2', 'characters', C11.c5)]);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c5))).toBe(true);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c6))).toBe(false);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c2))).toBe(false);
  });

  it('the cost is 1 rested DON!! on top of the 1 DON!! the Event costs', () => {
    const g = main(3, [C11.c5]);
    yes(g);
    pickInst(g, [at(g, 'p2', 'characters', C11.c5)]);
    expect(donOf(g, 'p1').rested).toBe(2);
    expect(donOf(g, 'p1').active).toBe(1);
    expect(trash(g)).toEqual([GATLING]);
  });

  it('declining the cost: nothing is rested, only the Event cost is paid', () => {
    const g = main(3, [C11.c5]);
    no(g);
    expect(donOf(g, 'p1').rested).toBe(1);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c5))).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('"up to 1": may rest nothing after paying; the DON!! stays rested', () => {
    const g = main(3, [C11.c5]);
    yes(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c5))).toBe(false);
    expect(donOf(g, 'p1').rested).toBe(2);
  });

  it('only one Character is rested even when two qualify', () => {
    const g = main(3, [C11.c4, C11.c5]);
    yes(g);
    pickInst(g, [at(g, 'p2', 'characters', C11.c4)]);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c5))).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('with no active DON!! left after paying the Event, the cost cannot be paid', () => {
    const g = main(1, [C11.c5]);
    unusable(g, 'p1');
    expect(isRested(g, at(g, 'p2', 'characters', C11.c5))).toBe(false);
    expect(donOf(g, 'p1').rested).toBe(1);
  });

  it('a Character with cost 6 is never offered', () => {
    const g = main(3, [C11.c6]);
    yes(g);
    if (kind(g) === 'choose') expect(offeredIds(g)).toEqual([]);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c6))).toBe(false);
  });
});

describe('OP11-038 Gum-Gum Elephant Gatling: [Counter] Leader +3000 during this battle', () => {
  it('gives my Leader +3000 so a 7000 attack on a 5000 Leader fails', () => {
    const g = defend();
    const ev = at(g, 'p1', 'hand', GATLING);
    expect(canCounterNow(g, ev)).toBe(true);
    activateCounter(g, ev);
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('without it the same attack takes a Life card', () => {
    const g = defend();
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('boosts the Leader only: a Character on my side is not boosted', () => {
    const g = defend([C11.c3]);
    activateCounter(g, at(g, 'p1', 'hand', GATLING));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(at(g, 'p1', 'characters', C11.c3))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('the boost ends with the battle', () => {
    const g = defend();
    activateCounter(g, at(g, 'p1', 'hand', GATLING));
    chooseIfAsked(g, [g.leader('p1')]);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('uses the Event from hand (cost 1) and it goes to the trash', () => {
    const g = defend();
    activateCounter(g, at(g, 'p1', 'hand', GATLING));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(hand(g)).toEqual([BLUE]);
    expect(trash(g)).toContain(GATLING);
    expect(donOf(g, 'p1').rested).toBe(1);
  });
});
