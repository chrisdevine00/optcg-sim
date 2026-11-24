/** OP16-027 Jinbe. */
import { describe, expect, it } from 'vitest';
import { game, PLAIN_BLUE } from './helpers.ts';
import { RED_LEADER } from './helpers-op16g1.ts';

const ID = 'OP16-027';

describe('OP16-027 Jinbe', () => {
  const start = (don: number) =>
    game(
      { leader: RED_LEADER, characters: [{ card: ID, don }], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
  const power = (g: ReturnType<typeof start>) => g.power(g.find('p1', 'characters', ID));

  it('[DON!! x1]: with 1 DON!! given it gains +2000 power (on top of the +1000 the DON!! itself gives)', () => {
    expect(power(start(0))).toBe(2000);
    expect(power(start(1))).toBe(5000);
  });

  it('more DON!! given add only their own +1000 each', () => {
    expect(power(start(2))).toBe(6000);
  });

  it("on your opponent's turn the +2000 still applies, but the DON!! itself gives nothing", () => {
    const g = start(1);
    g.act({ type: 'endTurn' });
    expect(power(g)).toBe(4000);
  });

  it('with no DON!! given there is no bonus', () => {
    const g = start(0);
    g.act({ type: 'endTurn' });
    expect(power(g)).toBe(2000);
  });
});
