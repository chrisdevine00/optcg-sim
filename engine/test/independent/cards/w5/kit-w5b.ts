/**
 * Helpers for the wave 5 group B independent card tests (OP10-033 .. PRB02-018, OP12-081). Public
 * API, frozen fixtures and the earlier kits only. Every answer helper accepts ONE named kind of
 * prompt and fails on anything else. Scenery stats are noted next to each constant.
 */
import { expect } from 'vitest';
import type { CardId, CardPlacement, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { choices, kind } from '../kit.ts';
import { fill, need } from '../op13/kit-op13a.ts';

export * from '../op13/kit-op13a.ts';

/** A partial side of a scenario, and a card or a placed card. */
export type Spec = Partial<PlayerSpec>;
export type Place = CardId | CardPlacement;

/** Scenery by cost, used as the card on top of a deck (only its base cost matters there). */
export const COST = {
  /** OP17-055 There's No Authority…: blue Event, cost 0. */
  c0: 'OP17-055',
  /** OP02-060 Mohji: Blue, cost 1, 3000. */
  c1: 'OP02-060',
  /** OP01-012 Sai: Red, cost 2, 4000. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000. */
  c7: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000. */
  c8: 'OP12-005',
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000. */
  c9: 'OP01-070',
  /** P-041 Monkey.D.Luffy: Purple, cost 10, 12000. Vanilla. */
  c10: 'P-041',
} as const;

/** Leaders as scenery. */
export const LW = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Vanilla. */
  luffy: 'ST01-001',
  /** OP03-099 Charlotte Katakuri: Yellow, 5000, 5 Life, {Big Mom Pirates}. [DON!! x1][When Attacking] only. */
  bmp: 'OP03-099',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. */
  shanks: 'ST05-001',
} as const;

/** A 10-card deck: `top` first, then `rest` (Mohji, cost 1, by default). */
export function deckWith(top: CardId, rest: CardId = COST.c1): CardId[] {
  return [top, ...fill(rest, 9)];
}

/**
 * Answer the pending "Choose a cost" prompt: a `choose` of purpose `mode` offering the numbers 0 to
 * 10 as named options. Fails on any other prompt.
 */
export function chooseCost(g: TestGame, n: number, who: PlayerId = 'p1'): void {
  const d = need(g, 'choose', who);
  expect(d.purpose).toBe('mode');
  expect((d.options ?? []).map((o) => o.id)).toEqual(
    Array.from({ length: 11 }, (_, i) => String(i)),
  );
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/** True while a "Choose a cost" prompt is pending for `who`. */
export function askingCost(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return (
    d?.kind === 'choose' && d.player === who && d.purpose === 'mode' && d.options?.length === 11
  );
}

/** Debug string of the pending decision. */
export function trace(g: TestGame): string {
  const d = decision(g);
  if (!d) return 'none';
  const opts = d.options ? ` options=${d.options.map((o) => o.id).join(',')}` : '';
  const ch = kind(g) === 'choose' ? ` choices=${choices(g).length}` : '';
  return `${d.player}:${d.kind}/${d.purpose ?? ''} min=${d.min} max=${d.max}${opts}${ch} legal=${g
    .legal()
    .map((a) => a.type)
    .join(',')} :: ${d.prompt}`;
}
