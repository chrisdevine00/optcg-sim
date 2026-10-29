/**
 * RL-13 DON!! power is your turn only; [DON!! xX] is a state check on both turns.
 * rulings.md RL-13 (CR 6-5-5-2, 6-2-3, 8-3-2-3; QA-ST01–04 ST01-013).
 *
 * The DON!! power part uses vanilla OP01-023 Marco (5000). The [DON!! x1] part needs ST01-013
 * Roronoa Zoro's scripted effect, so it is a todo.
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { act, endTurn, FILL, fill, L, V } from '../helpers.ts';

describe('RL-13: DON!! power and [DON!! xX]', () => {
  it('RL-13: +1000 on your turn, +0 on the opponent’s turn, DON!! gone after your next Refresh', () => {
    const g = scenario({
      p1: {
        leader: L.redLuffy,
        characters: [V.marco],
        costArea: { active: 1, rested: 0 },
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
    });
    const marco = g.find('p1', 'characters', V.marco);
    act(g, { type: 'giveDon', target: marco });
    expect(g.power(marco)).toBe(6000);
    endTurn(g);
    expect(g.card(marco).don).toBe(1);
    expect(g.power(marco)).toBe(5000);
    endTurn(g);
    expect(g.card(marco).don).toBe(0);
    expect(g.power(marco)).toBe(5000);
  });

  it.todo(
    'RL-13: ST01-013 Zoro ([DON!! x1] +1000) with 1 DON!! is 5000 on its turn, 4000 on the opponent’s turn, 3000 after Refresh (needs M4 effects)',
  );
  it.todo(
    'RL-13 (QA-OP01 OP01-061): a [DON!! x1] auto effect does not activate if the DON!! left at the same time (needs M4 effects)',
  );
});
