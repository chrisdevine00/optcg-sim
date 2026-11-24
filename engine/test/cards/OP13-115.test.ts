/** OP13-115 Paper Art Afterimage. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, none, pick, PLAIN_PURPLE, PURPLE, V } from './helpers.ts';
import { counterStep, rep, trig, useCounter } from './helpers-op13g4.ts';

const ID = 'OP13-115';

describe('OP13-115 Paper Art Afterimage', () => {
  const run = (oppLife: number) => {
    const g = counterStep(
      { leader: PLAIN_PURPLE, hand: [ID], characters: [V.c1], costArea: { active: 3, rested: 0 } },
      { life: rep(oppLife, PURPLE) },
    );
    useCounter(g, ID);
    return g;
  };

  it('[Counter] +3000 this battle; then with the opponent at 2 Life, +1000 this turn more', () => {
    const g = run(2);
    pick(g, [g.leader('p1')]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the second bonus may go to a different card', () => {
    const g = run(2);
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(4000);
  });

  it('with the opponent at 3 Life there is only the +3000', () => {
    const g = run(3);
    pick(g, [g.leader('p1')]);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('with 0 Life the second bonus applies; "up to 1": the first may be skipped and the second still asked', () => {
    const g = run(0);
    none(g);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('[Trigger] draws 1 card', () => {
    const g = trig(ID, { leader: PLAIN_PURPLE, deck: rep(5, BLUE) });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(BLUE);
  });
});
