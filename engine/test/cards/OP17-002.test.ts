/** OP17-002 Atmos. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { battle } from './helpers-hancock-rosi.ts';
import { ATMOS } from './helpers-op17g1.ts';

const ID = 'OP17-002';

describe('OP17-002 Atmos', () => {
  const start = () =>
    game({ leader: PLAIN_PURPLE, characters: [ID, ATMOS] }, { leader: PLAIN_BLUE });

  it('has its printed 6000 power during your own turn', () => {
    const g = start();
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it("[Opponent's Turn] gains +3000 power during your opponent's turn", () => {
    const g = start();
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p2');
    expect(g.power(g.find('p1', 'characters', ID))).toBe(9000);
  });

  it('the bonus is gone again on your next turn', () => {
    const g = start();
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it('applies only to itself: another Character keeps its power on the opponent turn', () => {
    const g = start();
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', ATMOS))).toBe(6000);
  });

  it('counts in battle on the opponent turn: survives an 8000 attacker, is K.O.d by a 9000 one', () => {
    const run = (attacker: string) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [{ card: ID, rested: true }] },
        { leader: PLAIN_BLUE, characters: [attacker] },
        { turn: 4, activePlayer: 'p2' },
      );
      battle(g, g.find('p2', 'characters', attacker), g.find('p1', 'characters', ID));
      return g.zone('p1', 'characters').length;
    };
    expect(run(V.c6)).toBe(1); // 8000 < 9000
    expect(run(V.c7)).toBe(0); // 9000 ties: the attacker wins
  });
});
