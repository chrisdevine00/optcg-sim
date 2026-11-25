/**
 * Helpers for the OP-10 group-A independent card tests (OP10-001 .. OP10-035, OP10-042, OP10-099).
 * Public API, frozen fixtures and the earlier kits only. Every answer helper accepts ONE named kind
 * of prompt and fails on anything else (see kit-op17b.ts), so a missing or extra "up to" / "you
 * may" prompt is caught. Scenery stats are noted next to each constant; tests repeat the ones they
 * rely on.
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../op14/kit-op14a.ts';

/** The `characters` of a player spec (a card id or a placement with its rested / DON!! state). */
export type Chars = PlayerSpec['characters'];

/** Leaders used as scenery. None has an effect that fires unless a test makes it. */
export const L10 = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}. [Activate: Main] only. */
  luffy: 'ST01-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Supernovas}/{Kid Pirates}. [Activate: Main] only. */
  kid: 'ST02-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. */
  croc: 'ST03-001',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. */
  shanks: 'ST05-001',
  /** ST06-001 Sakazuki: Black, 5000, 5 Life, {Navy}. [Activate: Main] only. */
  navy: 'ST06-001',
  /** EB01-040 Kyros: Black/Yellow, 5000, 4 Life, {Dressrosa}. [Activate: Main] only. */
  dressrosa: 'EB01-040',
  /** OP01-060 Donquixote Doflamingo: Purple, 5000, 5 Life, {Donquixote Pirates}/{The Seven Warlords of the Sea}. [DON!! x2][When Attacking] only. */
  dp: 'OP01-060',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. No relevant type. */
  wano: 'ST09-001',
} as const;

/** Vanilla Characters with the printed stats tests rely on (type lists are exact). */
export const V10 = {
  /** OP10-013 Nami: Red, cost 5, 7000, Counter +1000, {Straw Hat Crew}/{Punk Hazard}. Vanilla. */
  namiPh: 'OP10-013',
  /** OP10-014 Franky: Red, cost 6, 8000, Counter +1000, {Animal}/{Straw Hat Crew}/{Punk Hazard}. Vanilla. */
  frankyPh: 'OP10-014',
  /** OP11-015 Mocha: Red, cost 4, 6000, Counter +1000, {Punk Hazard}. Vanilla. */
  mochaPh4: 'OP11-015',
  /** OP01-081 Mocha: Blue, cost 3, 5000, Counter +1000, {Punk Hazard}. Vanilla. */
  mochaPh3: 'OP01-081',
  /** OP01-065 Vergo: Blue, cost 5, 7000, Counter +1000, {Donquixote Pirates}/{Navy}/{Punk Hazard}. Vanilla. */
  vergoBlue: 'OP01-065',
  /** EB05-015 Tashigi: Green, cost 5, 7000, Counter +1000, {Navy}/{East Blue}. Vanilla. */
  tashigiNavy: 'EB05-015',
  /** OP10-031 Sengoku: Green, cost 5, 7000, Counter +1000, {Navy}/{Dressrosa}. Vanilla. */
  sengoku: 'OP10-031',
  /** OP02-107 Doberman: Black, cost 2, 4000, Counter +1000, {Navy}. Vanilla. */
  doberman: 'OP02-107',
  /** OP10-054 Blue Gilly: Blue, cost 3, 5000, Counter +1000, {Dressrosa}. Vanilla. */
  gilly3: 'OP10-054',
  /** OP01-076 Bellamy: Blue, cost 2, 4000, Counter +1000, {Dressrosa}. Vanilla. */
  bellamy2: 'OP01-076',
  /** EB05-041 Koala: Black, cost 2, 4000, Counter +1000, {Revolutionary Army}/{Dressrosa}. Vanilla. */
  koala2: 'EB05-041',
  /** OP10-050 Hajrudin: Blue, cost 7, 9000, Counter +1000, {Giant}/{Dressrosa}/{New Giant Pirates}. Vanilla. */
  hajrudin7: 'OP10-050',
  /** OP10-068 Diamante: Purple, cost 5, 7000, Counter +1000, {Donquixote Pirates}. Vanilla. */
  diamante5: 'OP10-068',
  /** OP10-073 Buffalo: Purple, cost 4, 6000, Counter +1000, {Donquixote Pirates}. Vanilla. */
  buffalo4: 'OP10-073',
  /** OP12-111 Baby 5: Yellow, cost 2, 4000, Counter +1000, {Donquixote Pirates}. Vanilla. */
  baby5: 'OP12-111',
  /** OP05-035 Bellamy: Green, cost 3, 5000, Counter +1000, {Donquixote Pirates}. Vanilla. */
  bellamyDp: 'OP05-035',
  /** OP10-101 Urouge: Yellow, cost 5, 7000, Counter +1000, {Fallen Monk Pirates}/{Supernovas}. Vanilla. */
  urouge5: 'OP10-101',
  /** OP10-105 Cavendish: Yellow, cost 6, 8000, Counter +1000, {Beautiful Pirates}/{Supernovas}/{Dressrosa}. Vanilla. */
  cavendish6: 'OP10-105',
  /** OP14-008 Scratchmen Apoo: Red, cost 3, 5000, Counter +1000, {On-Air Pirates}/{Supernovas}. Vanilla. */
  apoo3: 'OP14-008',
  /** OP09-038 Rob Lucci: Green, cost 4, 6000, Counter +1000, {CP9}/{ODYSSEY}. Vanilla. */
  lucciOdyssey: 'OP09-038',
} as const;

/** The count question of an "up to N" instruction: a `choose` with purpose `mode`, options "0".."N". */
export function countOptions(g: TestGame): string[] {
  const d = decision(g);
  if (!d || d.kind !== 'choose' || d.purpose !== 'mode') return [];
  return (d.options ?? []).map((o) => o.id);
}

/** Answer the pending count question with `n` (strict: it must be a count question offering `n`). */
export function pickCount(g: TestGame, n: number): void {
  need(g, 'choose');
  const opts = countOptions(g);
  expect(opts, 'a count question (purpose mode) is pending').not.toHaveLength(0);
  expect(opts).toContain(String(n));
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/** True if a count question (an "up to N" number) is pending. */
export function askedCount(g: TestGame): boolean {
  return countOptions(g).length > 0;
}

/**
 * Answer an effect's "give up to N DON!!" questions: the count question (purpose `mode`, option
 * `count`) and the target question (my `target` is among the offered picks), in whichever order the
 * engine asks them. Stops at the first other decision, so a following question of the same effect
 * stays pending. Returns the number of questions answered.
 */
export function giveDon10(g: TestGame, count: number, target: InstanceId): number {
  let answered = 0;
  for (let i = 0; i < 2; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose') break;
    if (d.purpose === 'mode') {
      act(g, { type: 'pick', choice: { option: String(count) } });
    } else if (choices(g).includes(target)) {
      act(g, { type: 'pick', choice: target });
    } else {
      break;
    }
    answered++;
  }
  return answered;
}

/** Take the pending instruction's "up to" pick as empty: it must be a `choose` that allows `done`. */
export function skipPick(g: TestGame): void {
  need(g, 'choose');
  if (!canFinish(g)) throw new Error('This choose does not allow choosing nothing');
  act(g, { type: 'done' });
}

/** Pick the one instance `i` in the pending target `choose`, strictly (it must be offered). */
export function pickOne10(g: TestGame, i: InstanceId): void {
  need(g, 'choose');
  expect(choices(g)).toContain(i);
  act(g, { type: 'pick', choice: i });
}

/** Instance of a card of `who` in `zone` (nth copy). */
export function inst(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId {
  return g.find(who, zone, card, nth);
}
