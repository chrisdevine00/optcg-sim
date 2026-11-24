/** OP15-106 Octoballoon. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, V } from './helpers.ts';
import {
  names,
  offers,
  OTHER_LEADER,
  trig,
  YELLOW_C2,
  YELLOW_C3,
  YELLOW_STAGE,
} from './helpers-op15g3.ts';

const ID = 'OP15-106';

describe('OP15-106 Octoballoon', () => {
  const start = (handCards: string[], deck: string[] = [V.c4, V.c5]) =>
    trig(ID, { leader: OTHER_LEADER, hand: handCards, deck });

  it('[Trigger] draws 1 card, then plays up to 1 yellow Character with cost 2 or less from the hand', () => {
    const g = start([YELLOW_C2]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', YELLOW_C2)]);
    expect(names(g, 'p1', 'characters')).toEqual([YELLOW_C2]);
    expect(hand(g, 'p1')).toEqual([V.c4]);
  });

  it('a yellow Stage with cost 2 or less can be played too', () => {
    const g = start([YELLOW_STAGE]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', YELLOW_STAGE)]);
    expect(names(g, 'p1', 'stage')).toEqual([YELLOW_STAGE]);
  });

  it('the drawn card is a candidate', () => {
    const g = start([], [YELLOW_C2, V.c5]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'hand', YELLOW_C2)]);
    expect(names(g, 'p1', 'characters')).toEqual([YELLOW_C2]);
  });

  it('a cost 3 yellow Character and a non-yellow cost 2 Character are not candidates', () => {
    const g = start([YELLOW_C3, V.c2]);
    g.act({ type: 'trigger', activate: true });
    // No candidate: the prompt (asked so the hand stays hidden) has max 0.
    expect(expectDecision(g, 'choose', 'p1').max).toBe(0);
    none(g);
    expect(names(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([YELLOW_C3, V.c2, V.c4]);
  });

  it('"up to 1": the player may play none', () => {
    const g = start([YELLOW_C2]);
    g.act({ type: 'trigger', activate: true });
    expect(offers(g, g.find('p1', 'hand', YELLOW_C2))).toBe(true);
    none(g);
    expect(names(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toContain(YELLOW_C2);
  });
});
