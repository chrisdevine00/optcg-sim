/** OP17-054 Miss Buckingham Stussy: cannot attack until the end of the opponent's next End Phase. */
import { describe, expect, it } from 'vitest';
import { game, pick, play, PLAIN_PURPLE, ROCKS, V } from './helpers.ts';

describe('OP17-054 Miss Buckingham Stussy', () => {
  it("[On Play]: a base cost 6 or less Character cannot attack through the opponent's next turn", () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-054'], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [V.c6, V.c7] },
    );
    play(g, 'OP17-054');
    expect(
      g.isLegal({ type: 'pick', choice: g.find('p2', 'characters', V.c7), player: 'p1' }),
    ).toBe(false);
    const six = g.find('p2', 'characters', V.c6);
    pick(g, [six]);
    expect(g.card(six).cannotAttack).toBe(true);
    g.act({ type: 'endTurn' });
    // p2's turn: the Character cannot attack; the other one can.
    expect(g.legal().some((a) => a.type === 'attack' && a.attacker === six)).toBe(false);
    expect(
      g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p2', 'characters', V.c7)),
    ).toBe(true);
    g.act({ type: 'endTurn' });
    expect(g.card(six).cannotAttack).toBeFalsy();
  });

  it('[Activate: Main]: rest 3 DON!! and this Character', () => {
    const g = game(
      { leader: ROCKS, characters: ['OP17-054'], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [V.c7] },
    );
    const s = g.find('p1', 'characters', 'OP17-054');
    g.act({ type: 'activate', card: s, ability: 'no-attack' });
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.card(s).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c7)).cannotAttack).toBe(true);
  });

  it('[Activate: Main] is not offered with fewer than 3 active DON!!', () => {
    const g = game(
      { leader: ROCKS, characters: ['OP17-054'], costArea: { active: 2, rested: 1 } },
      { leader: PLAIN_PURPLE },
    );
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
  });
});
