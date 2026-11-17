/** OP17-119 Loki. QA-OP17 OP17-089 via RL-43: the +12 cost applies only on the field. */
import { describe, expect, it } from 'vitest';
import {
  expectDecision,
  game,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  trash,
  V,
} from './helpers.ts';

const LOKI = 'OP17-119';

describe('OP17-119 Loki', () => {
  it('has +12 cost on the field (18), its printed cost 6 in hand', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [LOKI], hand: [LOKI] },
      { leader: PLAIN_BLUE },
    );
    expect(g.card(g.find('p1', 'characters', LOKI)).cost).toBe(18);
    expect(g.card(g.find('p1', 'hand', LOKI)).cost).toBe(6);
  });

  it("during your opponent's turn it gains +3000 power (11000), on your own turn it has 8000", () => {
    const mine = game({ leader: PLAIN_PURPLE, characters: [LOKI] }, { leader: PLAIN_BLUE });
    expect(mine.power(mine.find('p1', 'characters', LOKI))).toBe(8000);
    const theirs = game(
      { leader: PLAIN_PURPLE, characters: [LOKI] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(theirs.power(theirs.find('p1', 'characters', LOKI))).toBe(11000);
  });

  const setup = (opp: string[]) =>
    game(
      { leader: PLAIN_PURPLE, hand: [LOKI], costArea: { active: 6, rested: 0 } },
      { leader: PLAIN_BLUE, characters: opp },
    );

  it("[On Play]: K.O. the opponent's Characters with a total cost of 4 or less (several allowed)", () => {
    const g = setup([V.c1, V.c3, V.c2, V.c1]);
    play(g, LOKI);
    // Pick the cost 3 and a cost 1: 4 in total. Nothing else fits afterwards.
    pick(g, [g.find('p2', 'characters', V.c3), g.find('p2', 'characters', V.c1, 0)]);
    expect(trash(g, 'p2').sort()).toEqual([V.c1, V.c3].sort());
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('[On Play]: the total is a budget: after a cost 3 pick only cost 1 Characters remain candidates', () => {
    const g = setup([V.c3, V.c2, V.c1]);
    play(g, LOKI);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c3), player: 'p1' });
    const left = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(left).toEqual([g.find('p2', 'characters', V.c1)]);
  });

  it('[On Play]: a cost 5 Character cannot be chosen', () => {
    const g = setup([V.c5, V.c1]);
    play(g, LOKI);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c5]);
  });

  it('[On Play]: the player may choose none of them', () => {
    const g = setup([V.c1]);
    play(g, LOKI);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('[On Play]: with no Character to K.O. nothing happens', () => {
    const g = setup([]);
    play(g, LOKI);
    expectDecision(g, 'main', 'p1');
  });

  it("[On Play]: reads an opponent Character's current cost (a permanent +12 puts it out of reach)", () => {
    // Saul (cost 4, +12 on the field = 16) is not a legal choice although its printed cost is 4.
    const g = setup(['OP17-089', V.c1]);
    play(g, LOKI);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
  });
});
