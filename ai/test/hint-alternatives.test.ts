/**
 * M7-R6: "Other lines" never offers a move that is already a step of the main line, and never
 * explains an alternative by "it ranked lower" alone: each has a specific reason, or is left out.
 */
import { describe, expect, it, vi } from 'vitest';
import { hint } from '../src/coach/hint.ts';
import { cardMap } from './support.ts';
import { gatherPositions } from './support/hint-positions.ts';

vi.setConfig({ testTimeout: 300_000 });
const cards = cardMap();

describe('hint alternatives (M7-R6)', () => {
  const positions = gatherPositions(
    { main: 20, defence: 17, choice: 13 },
    Array.from({ length: 40 }, (_, i) => i + 1),
  );

  it('no alternative repeats a step of the main line, and none is a bare "ranked lower"', () => {
    for (const p of positions) {
      const r = hint(p.view, {
        cards,
        budget: { iterations: 250 },
        game: { ownDeck: p.own, leader: p.leader, opponentLeader: p.opponentLeader },
      });
      const where = `seed ${p.seed} ${p.kind}`;
      const steps = new Set(r.line.map((m) => m.text));
      for (const a of r.alternatives) {
        expect(steps.has(a.move.text), `${where}: "${a.move.text}" is in the main line`).toBe(
          false,
        );
        expect(a.why, where).not.toMatch(/ranked lower in the games the search played out\.$/);
        expect(a.why.length, where).toBeGreaterThan(20);
      }
    }
    expect(positions.length).toBeGreaterThan(40);
  });
});
