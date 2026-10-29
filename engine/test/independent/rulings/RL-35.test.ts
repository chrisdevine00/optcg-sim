/**
 * RL-35 Giving DON!!: "cost area" in CR 6-5-5-1 is a typo for the Character area.
 * rulings.md RL-35 (CR 2-2-4-1, 6-2-3, 6-5-5-1; Rule Manual p.11). Digest open question Q10.
 *
 * Cards: p1 Leader ST01-001; OP01-023 Marco (vanilla) in the Character area; Stage OP05-021
 * ([Activate: Main] only); OP01-012 Sai (vanilla) in hand; 1 active DON!!.
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../fixtures/index.ts';
import { FILL, fill, L, S, V } from '../helpers.ts';

describe('RL-35: giving DON!!', () => {
  it('RL-35 [open-question Q10]: give targets are exactly your Leader and your Characters in play', () => {
    const g = scenario({
      p1: {
        leader: L.redLuffy,
        characters: [V.marco],
        stage: S.armyHq,
        hand: [V.sai],
        costArea: { active: 1, rested: 0 },
        life: fill(FILL.red, 5),
        deck: fill(FILL.red, 10),
      },
      p2: { leader: L.purpleKaido, life: fill(FILL.purple, 5), deck: fill(FILL.purple, 10) },
    });
    const targets = g
      .legal()
      .flatMap((a) => (a.type === 'giveDon' ? [a.target] : []))
      .sort();
    expect(targets).toEqual([g.leader('p1'), g.find('p1', 'characters', V.marco)].sort());
  });
});
