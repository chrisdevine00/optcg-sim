/**
 * OP13-030 Tony Tony.Chopper (Character, Green, cost 5, 6000, Counter +1000, {Animal}/{FILM}/
 * {Straw Hat Crew}, Strike).
 *
 * Card text: "[On Play] Set up to 2 of your DON!! cards as active."
 *
 * Rules: only rested DON!! in the cost area can be set (a given DON!! is neither active nor rested,
 * CR 4-4-2); "up to 2" acts on as many as possible without a count prompt (DECISIONS E-D4,
 * OPEN-QUESTIONS E-Q11), so the tests take the most if a count were asked.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  canPlayCard,
  don,
  kind,
  L13,
  mine,
  need,
  pickCount,
  playRaw,
  V13,
} from './kit-op13a.ts';

const CHOPPER = 'OP13-030';

function start(costArea: { active: number; rested: number }, extra: string[] = []) {
  const g = mine(L13.luffy, { hand: [CHOPPER, ...extra], costArea });
  playRaw(g, CHOPPER);
  if (kind(g) === 'choose') pickCount(g, 2);
  return g;
}

describe('OP13-030 Tony Tony.Chopper: [On Play] set up to 2 DON!! active', () => {
  it('printed values: cost 5, 6000, Counter +1000', () => {
    const g = mine(L13.luffy, { hand: [CHOPPER] });
    const c = g.card(at(g, 'p1', 'hand', CHOPPER));
    expect(c.cost).toBe(5);
    expect(c.counter).toBe(1000);
    playRaw(g, CHOPPER);
    expect(g.power(at(g, 'p1', 'characters', CHOPPER))).toBe(6000);
  });

  it('5 DON!! paid, 2 set back: active 1 + 2, rested 5 - 2', () => {
    const g = start({ active: 6, rested: 0 });
    need(g, 'main', 'p1');
    expect(don(g)).toMatchObject({ active: 3, rested: 3 });
  });

  it('exactly 2 are set, never more, however many are rested', () => {
    const g = start({ active: 5, rested: 5 });
    expect(don(g)).toMatchObject({ active: 2, rested: 8 });
  });

  it('with the whole 10 DON!! active before the play: 5 paid, 2 set, 7 active and 3 rested', () => {
    const g = start({ active: 10, rested: 0 });
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });

  it("the opponent's DON!! is not touched", () => {
    const before = don(mine(L13.luffy, { hand: [CHOPPER] }), 'p2');
    const g = start({ active: 6, rested: 0 });
    expect(don(g, 'p2')).toEqual(before);
  });

  it('the DON!! set active are spendable at once: a 2-cost Character can be played, a 3-cost one cannot', () => {
    const g = start({ active: 5, rested: 0 }, [V13.sai, V13.marco]);
    expect(don(g).active).toBe(2);
    expect(canPlayCard(g, at(g, 'p1', 'hand', V13.sai))).toBe(true);
    expect(canPlayCard(g, at(g, 'p1', 'hand', V13.marco))).toBe(false);
  });

  it('it changes no other state: Chopper stays active and no DON!! is given', () => {
    const g = start({ active: 6, rested: 0 });
    expect(g.card(at(g, 'p1', 'characters', CHOPPER)).rested).toBe(false);
    expect(don(g).given).toBe(0);
  });

  it('a DON!! given to a card is not set: it stays given', () => {
    const g = mine(L13.luffy, { hand: [CHOPPER], costArea: { active: 6, rested: 0 } });
    act(g, { type: 'giveDon', target: g.leader('p1') });
    playRaw(g, CHOPPER);
    if (kind(g) === 'choose') pickCount(g, 2);
    expect(don(g).given).toBe(1);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('the effect asks nothing else: the Main Phase continues at once', () => {
    const g = start({ active: 6, rested: 0 });
    expect(kind(g)).toBe('main');
  });
});
