/** OP11-112 Megalo. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, PLAIN_BLUE, V } from './helpers.ts';
import { canBlockWith, SHIRAHOSHI } from './helpers-op11g3.ts';

const ID = 'OP11-112';

describe('OP11-112 Megalo', () => {
  const start = (leader: string, opponentsTurn: boolean) =>
    game(
      { leader, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
      opponentsTurn ? { turn: 4, activePlayer: 'p2' } : {},
    );

  it("[Opponent's Turn] with [Shirahoshi] as Leader, this Character gains +4000 power (2000 becomes 6000)", () => {
    const g = start(SHIRAHOSHI, true);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it('on your own turn the power stays 2000', () => {
    const g = start(SHIRAHOSHI, false);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(2000);
  });

  it("on the opponent's turn with another Leader the power stays 2000", () => {
    const g = start(PLAIN_BLUE, true);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(2000);
  });

  it('the bonus holds in battle: it blocks a 5000 attacker and survives', () => {
    const g = start(SHIRAHOSHI, true);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
    g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
    while (g.legal().some((a) => a.type === 'endCounter')) g.act({ type: 'endCounter' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('without the bonus a 5000 attacker would K.O. it when it blocks', () => {
    const g = start(PLAIN_BLUE, true);
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
    while (g.legal().some((a) => a.type === 'endCounter')) g.act({ type: 'endCounter' });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
