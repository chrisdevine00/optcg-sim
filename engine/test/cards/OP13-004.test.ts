/** OP13-004 Sabo (Leader). RL-51: no per-card Q&A in QA-OP13; two permanent effects. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { BLUE, game, PLAIN_BLUE, PURPLE, times, V } from './helpers.ts';
import { COST8, SABO, setCostMod } from './helpers-sabo.ts';

/** P2's turn (so DON!! power does not count, RL-13); P1 owns the Leader. */
const opp = { turn: 4, activePlayer: 'p2' } as const;

describe('OP13-004 Sabo', () => {
  it('RL-51: with 4 Life the Leader gives itself -1000; with 3 it does not', () => {
    const g = game({ leader: SABO, life: times(4, BLUE) }, { leader: PLAIN_BLUE }, opp);
    expect(g.power(g.leader('p1'))).toBe(4000);
    const three = game({ leader: SABO, life: times(3, BLUE) }, { leader: PLAIN_BLUE }, opp);
    expect(three.power(three.leader('p1'))).toBe(5000);
  });

  it('RL-51: the Life check is re-read at once when Life drops from 4 to 3 (mid-turn)', () => {
    const g = game({ leader: SABO, life: times(4, BLUE) }, { leader: PLAIN_BLUE }, opp);
    expect(g.power(g.leader('p1'))).toBe(4000);
    g.state = applyOp(g.state, { op: 'lifeToHand', player: 'p1', n: 1 }).state;
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  const withDon = (extra: { don: number; cost8: boolean; life?: number }) =>
    game(
      {
        leader: { card: SABO, don: extra.don },
        life: times(extra.life ?? 3, BLUE),
        characters: extra.cost8 ? [COST8, V.c3] : [V.c3],
      },
      { leader: PLAIN_BLUE },
      opp,
    );

  it("RL-51: [DON!! x1] with a cost 8 Character: Leader and all Characters gain +1000 on the opponent's turn", () => {
    const g = withDon({ don: 1, cost8: true });
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', COST8))).toBe(9000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(6000);
  });

  it('RL-51: both effects at once (4 Life, 1 DON!!, cost 8 Character): Leader 5000, Characters +1000', () => {
    const g = withDon({ don: 1, cost8: true, life: 4 });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(6000);
  });

  it('RL-51: without a given DON!! there is no bonus', () => {
    const g = withDon({ don: 0, cost8: true });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });

  it('without a Character of cost 8 or more there is no bonus (cost 7 is not enough)', () => {
    const g = withDon({ don: 1, cost8: false });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });

  it('only your own Characters count for "if you have a Character with a cost of 8 or more"', () => {
    const g = game(
      { leader: { card: SABO, don: 1 }, life: times(3, BLUE), characters: [V.c3] },
      { leader: PLAIN_BLUE, characters: [COST8] },
      opp,
    );
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('RL-51: lowering the cost 8 Character to 7 switches the +1000 off', () => {
    const g = withDon({ don: 1, cost8: true });
    expect(g.power(g.leader('p1'))).toBe(6000);
    setCostMod(g, g.find('p1', 'characters', COST8), -1, 'p2', 4);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });

  it('opponent Characters do not get the bonus', () => {
    const g = game(
      { leader: { card: SABO, don: 1 }, life: times(3, BLUE), characters: [COST8] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
      opp,
    );
    expect(g.power(g.find('p2', 'characters', PURPLE))).toBe(3000);
  });
});
