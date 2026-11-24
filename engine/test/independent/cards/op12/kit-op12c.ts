/**
 * Helpers for the OP-12 group-C independent card tests. Public API, frozen fixtures and the earlier
 * kits only. Every answer helper here accepts ONE named kind of prompt and fails on anything else,
 * so a missing or extra "up to" / "you may" prompt is caught. None of them sends `done` on its own.
 */
import { expect } from 'vitest';
import type { CardId, Decision, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { canFinish, cardOf, choices } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../op17/kit-op17b.ts';

/** Leaders used as scenery (stats and relevant text noted; none fires unless a test makes it). */
export const LDR = {
  /** OP07-001 Monkey.D.Dragon: Red, 5000, 5 Life, {Revolutionary Army}. [Activate: Main] only. */
  ra: 'OP07-001',
  /** OP12-081 Koala: Black/Yellow, 5000, 4 Life, {Revolutionary Army}/{Dressrosa}. Named [Koala]. Attack-only text. */
  koala: 'OP12-081',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Named [Monkey.D.Luffy]. Vanilla. */
  luffy: 'ST01-001',
  /** PRB01-001 Sanji: Red, 5000, 5 Life, {Straw Hat Crew}. Named [Sanji]. [Activate: Main] only. */
  sanji: 'PRB01-001',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. No relevant name or type. */
  neutral: 'ST09-001',
  /** OP15-098 Monkey.D.Luffy is NOT used. OP11-022 Shirahoshi: Green/Yellow, {Merfolk}: not used either. */
} as const;

/** Scenery cards with the stats the tests rely on (vanilla unless noted). */
export const SC3 = {
  /** OP01-107 Babanuki: Purple, cost 5, 7000, {Animal Kingdom Pirates}/{SMILE}, vanilla. */
  smile5: 'OP01-107',
  /** OP02-077 Solitaire: Purple, cost 3, 5000, {Animal Kingdom Pirates}/{SMILE}, vanilla. */
  smile3: 'OP02-077',
  /** OP02-080 Dobon: Purple, cost 2, 4000, {Animal Kingdom Pirates}/{SMILE}, vanilla. */
  smile2: 'OP02-080',
  /** OP11-026 Scaled Neptunian: Green, cost 6, 8000, {Neptunian}, vanilla. */
  nept6: 'OP11-026',
  /** OP11-033 Bird Neptunian: Green, cost 6, 7000, {Neptunian}, vanilla. */
  nept6b: 'OP11-033',
  /** OP12-103 Seto: Yellow, cost 5, 6000, {Sky Island}/{Shandian Warrior}/{Jaya}, vanilla. */
  shan5: 'OP12-103',
  /** OP06-105 Genbo: Yellow, cost 3, 5000, {Sky Island}/{Shandian Warrior}, vanilla. */
  shan3: 'OP06-105',
  /** OP12-114 Wyper: Yellow, cost 6, 7000, {Sky Island}/{Shandian Warrior}, vanilla. */
  shan6: 'OP12-114',
  /** OP08-109 Mont Blanc Noland: Yellow, cost 5, 6000, {Jaya}/{Botanist}. [On Play] only. */
  noland: 'OP08-109',
  /** OP04-087 Trafalgar Law: Black, cost 5, 7000, {Heart Pirates}/{Dressrosa}, vanilla. Named [Trafalgar Law]. */
  law5: 'OP04-087',
  /** OP10-089 Nico Robin: Black, cost 6, 8000, {Straw Hat Crew}/{Dressrosa}, vanilla. Named [Nico Robin]. */
  robin6: 'OP10-089',
  /** EB05-041 Koala: Black, cost 2, 4000, {Revolutionary Army}/{Dressrosa}, vanilla. Named [Koala]. */
  koala2: 'EB05-041',
  /** OP05-012 Hack: Red, cost 3, 5000, {Fish-Man}/{Revolutionary Army}, vanilla. */
  ra3: 'OP05-012',
  /** OP12-083 Inazuma: Black, cost 5, 6000, Counter +2000, {Revolutionary Army}, vanilla. */
  ra5: 'OP12-083',
  /** OP13-090 Hack: Black, cost 6, 7000, Counter +2000, {Fish-Man}/{Revolutionary Army}/{Dressrosa}, vanilla. */
  ra6: 'OP13-090',
  /** OP02-051 Emporio.Ivankov: Blue, cost 7, 7000, no Counter, {Revolutionary Army}/{Impel Down}. [On Play] only. */
  ra7: 'OP02-051',
  /** OP07-118 Sabo: Black, cost 8, 9000, no Counter, {Revolutionary Army}. [On Play] only. */
  ra8: 'OP07-118',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000, no relevant type. Vanilla. */
  big8: 'OP12-005',
  /** OP12-096 Ursa Shock / OP12-097 Captains Assembled: Revolutionary Army Events in the deck. */
  raEvent: 'OP05-020',
  /** OP12-087 Nico Robin etc. are never scenery. */
} as const;

/** A deck, top first: `top` then `rest` copies of a filler that no test looks for. */
export function topDeck(top: CardId[], filler: CardId = 'OP02-060', rest = 10): CardId[] {
  return [...top, ...Array.from({ length: rest }, () => filler)];
}

/** The pending decision's prompt text, for failure messages and exploration. */
export function describeDecision(g: TestGame): string {
  const d = decision(g);
  if (!d) return 'none';
  const names = choices(g)
    .map((i) => cardOf(g, i))
    .join(',');
  return `${d.kind}/${d.player}/${d.purpose ?? '-'} max=${d.max} min=${d.min} "${d.prompt}" [${names}]${canFinish(g) ? ' +done' : ''}`;
}

/** Play a card from p1's hand with a raw action (DON!! cost paid automatically when only one class can pay). */
export function playRaw(g: TestGame, card: CardId, nth = 0): void {
  g.act({ type: 'playCard', card: g.find(g.decider, 'hand', card, nth) });
}

/** Pick one card instance in the pending `choose`. No `done`. */
export function pk(g: TestGame, instance: InstanceId): void {
  need(g, 'choose');
  act(g, { type: 'pick', choice: instance });
}

/** Pick the first offered instance of `card` (nth copy among the offered ones) in the pending `choose`. */
export function pkCard(g: TestGame, card: CardId, nth = 0): InstanceId {
  need(g, 'choose');
  const hit = choices(g).filter((i) => cardOf(g, i) === card)[nth];
  if (!hit) {
    throw new Error(`${card} not offered; pending ${describeDecision(g)}`);
  }
  act(g, { type: 'pick', choice: hit });
  return hit;
}

/** Send `done` at the pending `choose` (which must allow it). */
export function fin(g: TestGame): void {
  need(g, 'choose');
  if (!canFinish(g)) throw new Error(`done not legal: ${describeDecision(g)}`);
  act(g, { type: 'done' });
}

/** Named options (`{ option: id }` picks) offered by the pending `choose`. */
export function optionChoicesOf(g: TestGame): string[] {
  return g
    .legal()
    .flatMap((a) =>
      a.type === 'pick' && typeof a.choice === 'object' && 'option' in a.choice
        ? [a.choice.option]
        : [],
    );
}

/** The pending decision, or throw. */
export function pending(g: TestGame): Decision {
  const d = decision(g);
  if (!d) throw new Error('no decision');
  return d;
}

/** True when the game waits for `who`'s plain Main Phase action. */
export function isMain(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return !!d && d.kind === 'main' && d.player === who;
}

/** Fail with the pending decision's text unless the game is at `who`'s Main Phase. */
export function expectMainNow(g: TestGame, who: PlayerId = 'p1'): void {
  expect(isMain(g, who), describeDecision(g)).toBe(true);
}
