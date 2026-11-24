/** EB03-004 Carina. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';
import { boost, P0, STRIKE_L, VIVI_L } from './helpers-eb03g1.ts';

const ID = 'EB03-004';
/** p1 owns Carina; it is p2's turn (turn 4) unless `own`. */
const start = (leader: string, characters: string[] = [], own = false) =>
  game(
    { leader, characters: [ID, ...characters] },
    { leader: PLAIN_BLUE, characters: [V.c7] },
    own ? {} : { turn: 4, activePlayer: 'p2' },
  );
const power = (g: ReturnType<typeof start>) => g.power(g.find('p1', 'characters', ID));

describe('EB03-004 Carina', () => {
  it("on the opponent's turn with a multicolored Leader and no 6000-base Character: +4000", () => {
    expect(power(start(VIVI_L))).toBe(6000);
  });

  it('does not apply on your own turn', () => {
    expect(power(start(VIVI_L, [], true))).toBe(2000);
  });

  it('does not apply with a Leader that is not multicolored', () => {
    expect(power(start(STRIKE_L))).toBe(2000);
  });

  it('boundary: a Character with 6000 base power turns it off, 5000 does not; the opponent Characters do not count', () => {
    expect(power(start(VIVI_L, [V.c4]))).toBe(2000); // 6000 base
    expect(power(start(VIVI_L, [V.c3]))).toBe(6000); // 5000 base
    expect(power(start(VIVI_L, [V.c7]))).toBe(2000); // 9000 base
    expect(power(start(VIVI_L, [P0]))).toBe(6000); // 0 base
  });

  it('reads BASE power: a Character boosted to 6000 or more does not turn it off', () => {
    const g = start(VIVI_L, [V.c3]);
    boost(g, g.find('p1', 'characters', V.c3), 3000, 4); // 8000 current, 5000 base
    expect(power(g)).toBe(6000);
  });

  it('[Blocker]: can block the opponent attack', () => {
    const g = start(VIVI_L);
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.leader('p1'),
    });
    expectDecision(g, 'block', 'p1');
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
    passBlock(g);
  });
});
