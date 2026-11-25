/**
 * M7-R1: "End your turn with N DON!! active" is the number the engine shows at the first state of
 * the next turn (end-of-turn effects resolved, no Refresh, no DON!! Phase, nothing of theirs run),
 * never the count after their whole turn. The oracle replays the line through the engine's reducer.
 */
import { describe, expect, it, vi } from 'vitest';
import { queries } from '@optcg/engine';
import { hint } from '../src/coach/hint.ts';
import { mainLineOf } from '../src/search/hint-line.ts';
import { cardMap, metaDecks } from './support.ts';
import { e15Line, e15State, KAIDO, LUFFY } from './support/hint-e15.ts';
import { gatherPositions } from './support/hint-positions.ts';
import { engineEndOfTurnDon } from './support/line-oracle.ts';

vi.setConfig({ testTimeout: 300_000 });
const cards = cardMap();
const printed = (lines: { kind: string; text: string }[]): number | null => {
  const m = /End your turn with (\d+) DON!! active/.exec(lines.at(-1)?.text ?? '');
  return m ? Number(m[1]) : null;
};

describe('the printed end-of-turn DON!! count is the engine count', () => {
  it('E15, searched: the printed N equals the engine at the first state of the next turn', () => {
    const state = e15State();
    const view = e15Line(state).view;
    const luffy = metaDecks().find((d) => d.leader === LUFFY)!.main;
    const opts = {
      cards,
      budget: { iterations: 3000 },
      game: { ownDeck: luffy, leader: LUFFY, opponentLeader: KAIDO },
    };
    const r = hint(view, opts);
    const n = printed(r.line);
    expect(n).not.toBeNull();
    const oracle = engineEndOfTurnDon(state, 'p1', mainLineOf(view, opts));
    expect(oracle).not.toBeNull();
    expect(n).toBe(oracle);
    // Six DON!! in total: never more than the player owns.
    const don = queries.don(state, 'p1');
    expect(n!).toBeLessThanOrEqual(don.active + don.rested + (don.given ?? 0));
  });

  const positions = gatherPositions(
    { main: 20, defence: 0, choice: 0 },
    Array.from({ length: 40 }, (_, i) => i + 1),
  ).filter((p) => p.kind === 'main');

  it('every "hint returns a line" Main position: printed N equals the engine count', () => {
    let checked = 0;
    for (const p of positions) {
      const opts = {
        cards,
        budget: { iterations: 250 },
        game: { ownDeck: p.own, leader: p.leader, opponentLeader: p.opponentLeader },
      };
      const r = hint(p.view, opts);
      const n = printed(r.line);
      const line = mainLineOf(p.view, opts);
      if (n === null || !line.some((a) => a.type === 'endTurn')) continue;
      const oracle = engineEndOfTurnDon(p.state, p.player, line);
      if (oracle === null) continue;
      expect(n, `seed ${p.seed}`).toBe(oracle);
      checked++;
    }
    expect(positions.length).toBeGreaterThanOrEqual(15);
    expect(checked).toBeGreaterThanOrEqual(8);
  });
});
