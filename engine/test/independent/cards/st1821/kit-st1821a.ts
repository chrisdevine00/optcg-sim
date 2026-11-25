/**
 * Helpers for the ST-18 .. ST-21 independent card tests (group a). Public API, frozen fixtures and
 * the earlier kits only. Every answer helper accepts ONE named kind of prompt and fails on anything
 * else. Scenery stats are noted next to each constant; tests repeat the ones they rely on.
 */
import { expect } from 'vitest';
import type { CardId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices, kind } from '../kit.ts';

export * from '../op14/kit-op14d.ts';
export { opponentKingdomCome } from '../op15/kit-op15a.ts';

/** Leaders used as scenery. */
export const LD = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only (never used). */
  luffy: 'ST01-001',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. */
  shanks: 'ST05-001',
  /** ST06-001 Sakazuki: Black, 5000, 5 Life, {Navy}. [Activate: Main] only; NOT [Smoker]. */
  navy: 'ST06-001',
  /** OP02-093 Smoker: Black, 5000, 5 Life, {Navy}. [DON!! x1][Activate: Main] only. Named [Smoker]. */
  smoker: 'OP02-093',
  /** OP03-099 Charlotte Katakuri: Yellow, 5000, 5 Life, {Big Mom Pirates}. [DON!! x1][When Attacking] only. */
  katakuri: 'OP03-099',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. No relevant type. */
  yamato: 'ST09-001',
} as const;

/** Scenery Characters (vanilla: empty effect text, no [Trigger]). */
export const SC = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. */
  c1: 'OP02-060',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000, {Happosui Army}. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  c7: 'OP02-020',
  /** P-015 Sunny-Kun: Red, cost 1, 3000, Counter +1000, {FILM}/{Straw Hat Crew}. */
  shc1: 'P-015',
  /** ST21-005 Jinbe: Red, cost 2, 4000, Counter +1000, {Fish-Man}/{Straw Hat Crew}. */
  shc2: 'ST21-005',
  /** ST01-008 Nico Robin: Red, cost 3, 5000, Counter +1000, {Straw Hat Crew}. */
  shc3: 'ST01-008',
  /** ST01-010 Franky: Red, cost 4, 6000, Counter +1000, {Straw Hat Crew}. */
  shc4: 'ST01-010',
  /** OP10-013 Nami: Red, cost 5, 7000, Counter +1000, {Straw Hat Crew}/{Punk Hazard}. */
  shc5: 'OP10-013',
  /** OP05-065 San-Gorou: Purple, cost 6, 8000, Counter +1000, {Straw Hat Crew}. */
  pshc6: 'OP05-065',
  /** OP09-063 Usopp: Purple, cost 4, 6000, Counter +1000, {Straw Hat Crew}. */
  pshc4: 'OP09-063',
  /** ST05-007 Gordon: Purple, cost 1, 3000, Counter +1000, {FILM}. Purple but not {Straw Hat Crew}. */
  gordon: 'ST05-007',
  /** OP02-097 Komille: Black, cost 1, 3000, Counter +1000, {Navy}. */
  bnavy1: 'OP02-097',
  /** OP02-107 Doberman: Black, cost 2, 4000, Counter +1000, {Navy}. */
  bnavy2: 'OP02-107',
  /** OP02-116 Yamakaji: Black, cost 3, 5000, Counter +1000, {Navy}. */
  bnavy3: 'OP02-116',
  /** EB05-041 Koala: Black, cost 2, 4000, Counter +1000, {Revolutionary Army}/{Dressrosa}. Black, not {Navy}. */
  bplain2: 'EB05-041',
  /** OP06-049 Sengoku: Blue, cost 5, 7000, Counter +1000, {Navy}. {Navy} but not black. */
  navyBlue5: 'OP06-049',
  /** ST07-002 Charlotte Anana: Yellow, cost 1, 3000, Counter +1000, {Big Mom Pirates}. */
  bmp1: 'ST07-002',
  /** ST07-006 Charlotte Flampe: Yellow, cost 2, 4000, Counter +1000, {Big Mom Pirates}. */
  bmp2: 'ST07-006',
  /** ST07-014 Pekoms: Yellow, cost 3, 5000, Counter +1000, {Minks}/{Big Mom Pirates}. */
  bmp3: 'ST07-014',
  /** ST07-012 Baron Tamago: Yellow, cost 4, 6000, Counter +1000, {Big Mom Pirates}. */
  bmp4: 'ST07-012',
  /** OP03-101 Camie: Yellow, cost 1, 3000, Counter +1000, {Merfolk}. Yellow, not {Big Mom Pirates}. */
  yplain1: 'OP03-101',
} as const;

/** Fill an array. */
export function many(card: CardId, n: number): CardId[] {
  return Array.from({ length: n }, () => card);
}

/** Active, then rested DON!! of the cost area, for a scenario spec. */
export function cost(active: number, rested = 0) {
  return { costArea: { active, rested } };
}

/** A pending `choose` that may be left empty; answer it (also passes when it was not asked). */
export function settleEmptyChoose(g: TestGame): void {
  if (kind(g) === 'choose' && choices(g).length === 0 && canFinish(g)) act(g, { type: 'done' });
}

/** The legal-action check that does carry the player (a bare action would pass vacuously). */
export function legalFor(g: TestGame, player: PlayerId, a: Record<string, unknown>): boolean {
  return g.isLegal({ ...a, player } as never);
}

/** Nothing is pending except the Main Phase of `who`. */
export function mainFor(g: TestGame, who: PlayerId = 'p1'): void {
  const d = decision(g);
  expect(d?.kind).toBe('main');
  expect(d?.player).toBe(who);
}

/** The ids of the count options of the pending DON!! count question ("up to N", purpose `mode`). */
export function donCountOptions(g: TestGame, who: PlayerId = 'p1'): string[] {
  const d = decision(g);
  if (d?.kind !== 'choose' || d.player !== who || d.purpose !== 'mode') {
    throw new Error(`Expected a count question for ${who}, got ${d?.kind} (${d?.prompt})`);
  }
  return (d.options ?? []).map((o) => o.id);
}

/** Answer the pending DON!! count question with exactly `n`. */
export function takeDon(g: TestGame, n: number, who: PlayerId = 'p1'): void {
  if (!donCountOptions(g, who).includes(String(n))) throw new Error(`Count ${n} not offered`);
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/** True when a count question is pending for `who`. */
export function asksDonCount(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return d?.kind === 'choose' && d.player === who && d.purpose === 'mode';
}

/** Rested flag of the first Character `card` of `who`. */
export function restedChar(g: TestGame, who: PlayerId, card: CardId): boolean {
  return g.card(g.find(who, 'characters', card)).rested;
}
