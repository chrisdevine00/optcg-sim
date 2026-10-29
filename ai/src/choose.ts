/**
 * `chooseAction(view, …)`: the AI's entry point for one decision, shared by the worker and tests.
 * Only Rookie exists in M3; the other tiers fall back to it until M5.
 */
import type { Card } from '@optcg/cards';
import type { PlayerView } from '@optcg/engine';
import { rookie, type Decided } from './rookie.ts';
import type { AiTier } from './tiers.ts';

export function chooseAction(
  view: PlayerView,
  opts: { tier: AiTier; seed: number; cards: ReadonlyMap<string, Card> },
): Decided {
  const counterOf = (id: string) => opts.cards.get(id)?.counter ?? null;
  return rookie(view, { seed: opts.seed, counterOf });
}
