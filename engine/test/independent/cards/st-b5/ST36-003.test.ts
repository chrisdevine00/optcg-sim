/**
 * ST36-003 Scratchmen Apoo (Yellow Character, cost 4, 4000, Counter +2000, Ranged, {On-Air Pirates}/{Supernovas}).
 *
 * Card text: no effect text. "[Trigger] Draw 1 card and your {Supernovas} type Leader's base power
 * becomes 7000 during this turn."
 *
 * Rules: [Trigger] (CR 10-1-5, RL-25), RL-09 ("during this turn"), base power setting: the Leader's
 * base power is 7000 (a Leader without the {Supernovas} type is not changed; the draw is separate).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  attack,
  BLUE,
  cardIds,
  declineTrigger,
  deck,
  endTurn,
  fill,
  hand,
  kind,
  LDB,
  mine,
  need,
  noDefenceUntilTrigger,
  passBlock,
  passCounter,
  playRaw,
  SB,
  T,
  theirs,
  trash,
} from './kit-stb5b.ts';

const APOO = T.apoo;

/** p2's Leader hits p1's Leader; Apoo is the top Life card of p1; stops at p1's [Trigger] decision. */
function hit(leader: string, p2spec: Parameters<typeof theirs>[2] = {}) {
  const g = theirs(
    leader,
    { life: [APOO, ...fill(BLUE, 3)], deck: [SB.c3p5, ...fill(BLUE, 14)] },
    p2spec,
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  noDefenceUntilTrigger(g);
  return g;
}

describe('ST36-003 Apoo: no effect text; [Trigger] draw 1 and a Supernovas Leader base power becomes 7000 this turn', () => {
  it('Supernovas Leader: draws 1 and the Leader base power becomes 7000', () => {
    const g = hit(LDB.strike);
    expect(kind(g)).toBe('trigger');
    expect(g.power(g.leader('p1'))).toBe(5000);
    activateTrigger(g);
    expect(hand(g)).toEqual([SB.c3p5]);
    expect(deck(g)).toHaveLength(14);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a second Supernovas Leader (Kid Pirates) works too', () => {
    const g = hit(LDB.kid);
    activateTrigger(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a Leader without the {Supernovas} type is not changed, but the card is still drawn', () => {
    const g = hit(LDB.slash);
    activateTrigger(g);
    expect(hand(g)).toEqual([SB.c3p5]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('RL-09: the 7000 lasts for the rest of this turn and is gone on the next turn', () => {
    const g = hit(LDB.strike);
    activateTrigger(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it matters in the same turn: a 6000 Character attacking the 7000 Leader deals no damage', () => {
    const g = hit(LDB.strike, { characters: [SB.c4p6] });
    activateTrigger(g);
    const lifeBefore = g.life('p1');
    attack(g, g.find('p2', 'characters', SB.c4p6), g.leader('p1'));
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(lifeBefore);
  });

  it('control for the test above: with the Leader at 5000 the same attack deals damage', () => {
    const g = hit(LDB.strike, { characters: [SB.c4p6] });
    declineTrigger(g);
    const lifeBefore = g.life('p1');
    attack(g, g.find('p2', 'characters', SB.c4p6), g.leader('p1'));
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(lifeBefore - 1);
  });

  it('not activating the [Trigger]: Apoo goes to the hand, nothing is drawn, power unchanged', () => {
    const g = hit(LDB.strike);
    declineTrigger(g);
    expect(hand(g)).toEqual([APOO]);
    expect(deck(g)).toHaveLength(15);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('after the [Trigger] resolves Apoo is in the trash, not on the field', () => {
    const g = hit(LDB.strike);
    activateTrigger(g);
    expect(trash(g, 'p1')).toEqual([APOO]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('exactly 1 card is drawn', () => {
    const g = hit(LDB.strike);
    activateTrigger(g);
    expect(hand(g)).toHaveLength(1);
  });

  it('played from the hand there is no effect: nothing is asked and the Leader is unchanged', () => {
    const g = mine(LDB.strike, { hand: [APOO], deck: fill(BLUE, 15) });
    playRaw(g, APOO);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([APOO]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(deck(g)).toHaveLength(15);
  });
});
