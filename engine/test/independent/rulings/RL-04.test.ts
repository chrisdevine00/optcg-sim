/**
 * RL-04 Playing a Character from hand into a full Character area: order of cost and trash.
 * rulings.md RL-04 (official by inference from QA-GR "Can I play another Stage card…?").
 * The digest lists this as open question Q1; the test follows its best answer.
 *
 * Cards: five vanilla red Characters A–E (OP01-010, OP01-012, OP01-023, OP01-018, OP02-006) and
 * a 3-cost vanilla X (ST01-008 Nico Robin, cost 3, 5000) in hand; 3 active DON!!.
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { decision, don, FILL, fill, L, pickOne, play, V } from '../helpers.ts';

const X = 'ST01-008'; // Nico Robin: Red, cost 3, 5000, vanilla

function full() {
  return scenario({
    p1: {
      leader: L.redLuffy,
      characters: [V.komachiyo, V.sai, V.marco, V.hajrudin, V.kingdew],
      hand: [X],
      costArea: { active: 3, rested: 0 },
      life: fill(FILL.red, 5),
      deck: fill(FILL.red, 10),
    },
    p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
  });
}

describe('RL-04: playing into a full Character area', () => {
  it('RL-04 [open-question Q1]: reveal → pay the cost → trash 1 Character → place the new one', () => {
    const g = full();
    play(g, g.find('p1', 'hand', X));
    // Cost already paid when the trash choice is asked.
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    expect(decision(g)).toMatchObject({ kind: 'choose', player: 'p1' });
    expect(g.zone('p1', 'characters')).toHaveLength(5);

    pickOne(g, g.find('p1', 'characters', V.komachiyo));
    const board = g.zone('p1', 'characters').map((c) => c.card);
    expect(board).toHaveLength(5);
    expect(board).toContain(X);
    expect(board).not.toContain(V.komachiyo);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([V.komachiyo]);
    expect(g.card(g.find('p1', 'characters', X)).rested).toBe(false);
  });

  it('RL-04: the Character area never holds 6, at any decision point', () => {
    const g = full();
    play(g, g.find('p1', 'hand', X));
    expect(g.zone('p1', 'characters').length).toBeLessThanOrEqual(5);
    pickOne(g, g.find('p1', 'characters', V.kingdew));
    expect(g.zone('p1', 'characters').length).toBe(5);
  });
});
