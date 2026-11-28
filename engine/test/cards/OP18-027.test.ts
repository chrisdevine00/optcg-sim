/** OP18-027 Zoro & Sogeking. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { candidates } from './helpers-a10g1.ts';
import { don, game, none, pick, play, setMost, V } from './helpers.ts';
import { applyOp } from '../../src/testing.ts';
import { LUFFY_L, PLAIN_BLUE, PLAIN_PURPLE } from './helpers-op18.ts';

const ID = 'OP18-027';
const base = (g: ReturnType<typeof game>) => queries.card(g.state, g.leader('p1')).power;

/** p1's Luffy Leader with `given` DON!!, `rested` or not, on p2's turn (or p1's with `own`). */
function board(given: number, opts: { rested?: boolean; own?: boolean; leader?: string } = {}) {
  return game(
    {
      leader: { card: opts.leader ?? LUFFY_L, don: given, rested: opts.rested ?? false },
      characters: [ID],
    },
    { leader: PLAIN_BLUE },
    opts.own ? {} : { turn: 4, activePlayer: 'p2' },
  );
}

describe('OP18-027 Zoro & Sogeking', () => {
  // Given DON!! add power only on their owner's turn, so on p2's turn the power is the base power.
  it("on the opponent's turn an active [Monkey.D.Luffy] Leader with 3 DON!! given has base power 7000", () => {
    expect(base(board(3))).toBe(7000);
    expect(base(board(4))).toBe(7000);
  });

  it('not with 2 DON!! given, not when rested, not on your own turn', () => {
    expect(base(board(2))).toBe(5000);
    expect(base(board(3, { rested: true }))).toBe(5000);
    expect(base(board(3, { own: true }))).toBe(8000); // 5000 + 3 given
  });

  it('not for a Leader with another name', () => {
    expect(base(board(3, { leader: PLAIN_PURPLE }))).toBe(5000);
  });

  it('[On Play] sets up to 2 DON!! active, then stops a cost 6 or less Character being rested', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 5, rested: 2 } },
      { leader: PLAIN_BLUE, characters: [V.c6, V.c7] },
    );
    play(g, ID);
    setMost(g);
    expect(don(g, 'p1').active).toBe(2);
    expect(candidates(g)).toEqual([g.find('p2', 'characters', V.c6)]);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    const t = g.find('p2', 'characters', V.c6);
    g.state = applyOp(g.state, { op: 'rest', card: t }).state;
    expect(g.card(t).rested).toBe(false);
  });

  it('[On Play] with nothing to target still sets DON!! active', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7] },
    );
    play(g, ID);
    setMost(g);
    if (queries.decision(g.state)?.kind === 'choose') none(g);
    expect(don(g, 'p1').active).toBe(2);
  });
});
