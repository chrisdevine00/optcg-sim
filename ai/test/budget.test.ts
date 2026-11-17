/**
 * Every tier within its time budget by at most 20% (PROMPT.md "AI opponent"; PLAN M5b), measured
 * as decision time on the app's millisecond budgets (`BUDGETS[tier].ms`) over real positions: the
 * plan at the start of a Main Phase and every other decision. Timing is wall clock, so the check
 * is on the 95th percentile and skips nothing; it is not a benchmark of the machine.
 *
 * A plan is allowed its search budget plus, for the searching tiers, the lethal check's own cap
 * (the check runs first and short-circuits the search, so it is part of the plan's time).
 */
import { describe, expect, it, vi } from 'vitest';
import { projectForSearch } from '@optcg/engine';
import { AiSession, BUDGETS } from '../src/index.ts';
import { cardMap, metaDecks } from './support.ts';
import { playMatch, type DecisionRecord } from './support/match.ts';
import { quantile } from './support/stats.ts';

vi.setConfig({ testTimeout: 600_000 });

const all = metaDecks();
const rocks = all.find((d) => d.leader === 'OP17-039')!;
const kaido = all.find((d) => d.leader === 'OP17-058')!;

function positions(): { main: DecisionRecord[]; other: DecisionRecord[] } {
  const main: DecisionRecord[] = [];
  const other: DecisionRecord[] = [];
  for (const seed of [41, 42]) {
    playMatch({
      seed,
      decks: seed % 2 ? { p1: rocks, p2: kaido } : { p1: kaido, p2: rocks },
      tiers: { p1: 'pirate', p2: 'pirate' },
      onDecision: (d) => {
        if (d.view.actions.length < 2) return;
        if (d.view.decision?.kind === 'main') {
          if (d.view.turn.number >= 3 && main.length < 24) main.push(d);
        } else if (other.length < 24) other.push(d);
      },
    });
  }
  return { main, other };
}

describe.each([
  ['pirate', 12],
  ['warlord', 10],
  ['emperor', 4],
] as const)('%s decision time on millisecond budgets', (tier, planCount) => {
  it('stays within its budget by at most 20% (p95)', () => {
    const b = BUDGETS[tier].ms;
    const { main, other } = positions();
    expect(main.length).toBeGreaterThanOrEqual(planCount);
    const lethalMs = 'lethal' in b ? b.lethal.ms : 0;
    const plan: number[] = [];
    for (const d of main.slice(0, planCount)) {
      const view = projectForSearch(d.before, d.player);
      const opp = d.player === 'p1' ? 'p2' : 'p1';
      const s = new AiSession({
        tier,
        ownDeck: all.find((x) => x.leader === view.zones[d.player].leader[0]!.card)!.main,
        cards: cardMap(),
        leader: view.zones[d.player].leader[0]!.card!,
        opponentLeader: view.zones[opp].leader[0]!.card!,
        budgets: 'ms',
      });
      const t0 = performance.now();
      s.planTurn(view, 7);
      plan.push(performance.now() - t0);
    }
    // The plan's budget, the lethal check's cap, and a little for building the guesses.
    expect(quantile(plan, 0.95)).toBeLessThanOrEqual((b.turn.ms + lethalMs) * 1.2);

    const defence: number[] = [];
    for (const d of other.slice(0, 12)) {
      const view = projectForSearch(d.before, d.player);
      const opp = d.player === 'p1' ? 'p2' : 'p1';
      const s = new AiSession({
        tier,
        ownDeck: all.find((x) => x.leader === view.zones[d.player].leader[0]!.card)!.main,
        cards: cardMap(),
        leader: view.zones[d.player].leader[0]!.card!,
        opponentLeader: view.zones[opp].leader[0]!.card!,
        budgets: 'ms',
      });
      const t0 = performance.now();
      s.decide(view, 7);
      defence.push(performance.now() - t0);
    }
    expect(defence.length).toBeGreaterThan(3);
    expect(quantile(defence, 0.95)).toBeLessThanOrEqual(b.defence.ms * 1.2);
  });
});
