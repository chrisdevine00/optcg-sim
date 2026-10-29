/**
 * RL-07 Replacing a Stage.
 * rulings.md RL-07 (QA-GR "Can I play another Stage card…?"; CR 3-8-4, 3-8-5, 3-8-5-1, 3-1-6).
 *
 * Cards: OP05-021 Revolutionary Army HQ (Red Stage, cost 1) in play, rested; OP03-020 Striker
 * (Red Stage, cost 1) and EB02-009 Thousand Sunny (Red Stage, cost 2) in hand. Both Stages have
 * only [Activate: Main] text.
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { don, FILL, fill, isLegal, L, play, S, why } from '../helpers.ts';

describe('RL-07: replacing a Stage', () => {
  const g0 = () =>
    scenario({
      p1: {
        leader: L.redLuffy,
        stage: { card: S.armyHq, rested: true },
        hand: [S.striker, S.sunny],
        costArea: { active: 1, rested: 0 },
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
    });

  it('RL-07: pay the cost, trash the old Stage, place the new one active; 1 Stage only', () => {
    const g = g0();
    play(g, g.find('p1', 'hand', S.striker));
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([S.armyHq]);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([S.striker]);
    expect(g.card(g.find('p1', 'stage', S.striker)).rested).toBe(false);
  });

  it('RL-07: with no active DON!! left, the next Stage cannot be played, and whyNot explains it', () => {
    const g = g0();
    play(g, g.find('p1', 'hand', S.striker));
    const sunny = g.find('p1', 'hand', S.sunny);
    expect(isLegal(g, { type: 'playCard', card: sunny })).toBe(false);
    expect(why(g, 'p1', { type: 'playCard', card: sunny })).not.toBeNull();
  });
});
