/**
 * Helpers for the per-card tests (PLAN §5 "one test per scripted card"). Public API and the frozen
 * fixtures only. Each test sets up a minimal board, drives the real decisions, and checks state and
 * events.
 */
import { expect } from 'vitest';
import {
  queries,
  type Action,
  type CardId,
  type Decision,
  type InstanceId,
  type PlayerId,
  type PlayerSpec,
} from '@optcg/engine';
import { scenario, type ScenarioInput, type TestGame } from '../fixtures/index.ts';

export const times = (n: number, card: CardId): CardId[] => Array.from({ length: n }, () => card);

/** Rocks.D.Xebec Leader (Blue, "Rocks Pirates"). */
export const ROCKS = 'OP17-039';
/** Kaido Leader (Purple, {Animal Kingdom Pirates}). */
export const KAIDO = 'OP17-058';
/** ST04-001 Kaido: Purple Leader whose only text is an [Activate: Main] (no automatic effects). */
export const PLAIN_PURPLE = 'ST04-001';
/** ST03-001 Crocodile: Blue Leader, not "Rocks Pirates". */
export const PLAIN_BLUE = 'ST03-001';
/** Blue vanilla, cost 1, 3000 power, Counter +1000, type not "Rocks Pirates". */
export const BLUE = 'OP02-060';
/** Purple vanilla, cost 1, 3000 power, Counter +1000. */
export const PURPLE = 'ST05-007';
/** Purple vanillas by cost: 1/3000, 2/4000, 3/5000, 4/6000, 5/7000, 6/8000, 7/9000. */
export const V = {
  c1: 'OP02-084',
  c2: 'OP02-080',
  c3: 'OP02-077',
  c4: 'OP01-103',
  c5: 'OP01-107',
  c6: 'OP01-110',
  c7: 'OP01-092',
} as const;

/** A position with sensible defaults: decks, 3 Life each, p1's turn 3, Main Phase. */
export function game(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  extra: Partial<ScenarioInput> = {},
): TestGame {
  return scenario({
    ...extra,
    p1: { deck: times(10, BLUE), life: times(3, BLUE), ...p1 },
    p2: { deck: times(10, PURPLE), life: times(3, PURPLE), ...p2 },
  });
}

export const dec = (g: TestGame): Decision | null => queries.decision(g.state);

export function expectDecision(g: TestGame, kind: Decision['kind'], player?: PlayerId): Decision {
  const d = dec(g);
  expect(d?.kind, `decision: ${JSON.stringify(d)}`).toBe(kind);
  if (player) expect(d!.player).toBe(player);
  return d!;
}

export function play(g: TestGame, card: CardId, nth = 0): InstanceId {
  const p = g.decider;
  const id = g.find(p, 'hand', card, nth);
  g.act({ type: 'playCard', card: id });
  return id;
}

export const accept = (g: TestGame): void => {
  expectDecision(g, 'optional');
  g.act({ type: 'optional', accept: true });
};
export const decline = (g: TestGame): void => {
  expectDecision(g, 'optional');
  g.act({ type: 'optional', accept: false });
};

/** Pick these cards (in whatever order the canonical-order rule allows), then `done` if open. */
export function pick(g: TestGame, ids: InstanceId[]): void {
  const first = expectDecision(g, 'choose');
  const left = new Set(ids);
  while (left.size) {
    // Canonical order: take the earliest legal candidate among those wanted.
    const next = g
      .legal()
      .find((a) => a.type === 'pick' && typeof a.choice === 'string' && left.has(a.choice));
    if (!next || next.type !== 'pick')
      throw new Error(`None of ${[...left].join(', ')} can be picked now`);
    left.delete(next.choice as InstanceId);
    g.act(next);
  }
  // Still the same choice (not yet full): finish it.
  const now = dec(g);
  if (
    now?.kind === 'choose' &&
    now.prompt === first.prompt &&
    (now.max ?? 0) > 0 &&
    ids.length < (first.max ?? 0)
  )
    g.act({ type: 'done' });
}

/** Choose nothing ("up to"). */
export function none(g: TestGame): void {
  expectDecision(g, 'choose');
  g.act({ type: 'done' });
}

/** Pick a named option (a mode, top or bottom). */
export function option(g: TestGame, id: string): void {
  expectDecision(g, 'choose');
  g.act({ type: 'pick', choice: { option: id } });
}

/** Answer a DON!! choice by taking cost-area DON!! (active first). */
export function payDon(g: TestGame): void {
  while (
    dec(g)?.kind === 'choose' &&
    g.legal().some((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice)
  ) {
    const a = g
      .legal()
      .find(
        (x): x is Extract<Action, { type: 'pick' }> =>
          x.type === 'pick' && typeof x.choice === 'object' && 'from' in x.choice,
      )!;
    g.act({ type: 'pick', choice: a.choice });
  }
}

export const passBlock = (g: TestGame): void => {
  expectDecision(g, 'block');
  g.act({ type: 'block', blocker: null });
};
export const endCounter = (g: TestGame): void => {
  expectDecision(g, 'counter');
  g.act({ type: 'endCounter' });
};
/** Answer every damage decision by adding the card to hand. */
export function takeDamage(g: TestGame): void {
  while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
}

export const hand = (g: TestGame, p: PlayerId): CardId[] => g.zone(p, 'hand').map((c) => c.card);
export const trash = (g: TestGame, p: PlayerId): CardId[] => g.zone(p, 'trash').map((c) => c.card);
export const don = (g: TestGame, p: PlayerId) => queries.don(g.state, p);
export const types = (g: TestGame): string[] => g.events.map((e) => e.type);
