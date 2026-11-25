/**
 * Helpers for the leftovers group C independent card tests (ST24-001 .. ST24-005, ST25-001 ..
 * ST25-005, ST28-001 .. ST28-005). Public API, frozen fixtures and the earlier kits only. Answer
 * helpers accept ONE named kind of prompt and fail on anything else.
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, decision } from '../../helpers.ts';
import { choices, kind } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../op14/kit-op14b.ts';
export { playRaw, chr, leaderPower } from '../op15/kit-op15a.ts';

/** Leaders used as scenery. */
export const LC = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. */
  nova: 'ST01-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. No relevant type or name. */
  plain: 'ST03-001',
  /** OP09-042 Buggy: Blue, 5000, 5 Life, {The Four Emperors}/{Cross Guild}, named [Buggy]. [Activate: Main] only. */
  buggy: 'OP09-042',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. [DON!! x1][Opponent's Turn] +1000 with 2 or less Life. */
  wano: 'ST09-001',
} as const;

/** Scenery Characters with the stats the tests rely on. */
export const SCL = {
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000, {Happosui Army}. Vanilla. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. Vanilla. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000, {Giant}/{New Giant Pirates}. Vanilla. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, {Whitebeard Pirates}. Vanilla. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. Vanilla. */
  c6: 'OP02-007',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000, {FILM}/{Golden Lion Pirates}. Vanilla. */
  c8: 'OP12-005',
  /** OP09-055 Mr.1(Daz.Bonez): Blue, cost 5, 7000, {Former Baroque Works}/{Cross Guild}. Vanilla. */
  cg5: 'OP09-055',
  /** OP12-055 Mohji & Cabaji: Blue, cost 5, 6000, {Cross Guild}. Vanilla. */
  cg5b: 'OP12-055',
  /** OP12-049 Buggy: Blue, cost 6, 7000, {The Four Emperors}/{Cross Guild}. Vanilla. */
  cg6: 'OP12-049',
  /** P-084 Buggy: Blue, cost 7, 8000, {The Four Emperors}/{Cross Guild}. Cannot attack text; used only as a cost-7 candidate. */
  cg7: 'P-084',
  /** OP01-033 Izo: Green, cost 3, 3000, {Land of Wano}. Used as a Wano card in a deck (no effect fires from a deck). */
  wano3: 'OP01-033',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, {Animal}/{Land of Wano}. Vanilla. */
  wano1: 'OP01-010',
  /** ST09-015 Thunder Bagua: Yellow Event, cost 2, {Land of Wano}. */
  wanoEvent2: 'ST09-015',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, {FILM}/{Straw Hat Crew}/{Supernovas}. Used in decks. */
  nova4: 'OP02-043',
  /** OP14-008 Scratchmen Apoo: Red, cost 3, 5000, {On-Air Pirates}/{Supernovas}. Used in decks. */
  nova3: 'OP14-008',
  /** ST02-015 Scalpel: Green Event, cost 1, {Heart Pirates}/{Supernovas}. Used in decks. */
  novaEvent: 'ST02-015',
} as const;

/** OP09-077 Gum-Gum Lightning: Purple Event, cost 2. [Main] DON!! -2: K.O. up to 1 of the opponent's Characters with 6000 power or less. */
export const ZAP = 'OP09-077';

/** Answer a pending "how many DON!! (up to N)" count question with `n`, if one is pending for `who`. Returns whether it was asked. */
export function countIfAsked(g: TestGame, n: number, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  if (d?.kind !== 'choose' || d.player !== who || d.purpose !== 'mode') return false;
  const ids = (d.options ?? []).map((o) => o.id);
  if (!ids.includes(String(n))) throw new Error(`Count ${n} not offered; offered ${ids}`);
  act(g, { type: 'pick', choice: { option: String(n) } });
  return true;
}

/** Pick `which` (an instance) in the pending `choose` of purpose `purpose` (strict). */
export function pickStrict(g: TestGame, which: InstanceId, purpose?: string): void {
  const d = need(g, 'choose');
  if (purpose) expect(d.purpose).toBe(purpose);
  if (!choices(g).includes(which)) throw new Error(`${which} not offered (${kind(g)})`);
  act(g, { type: 'pick', choice: which });
}

/** The instances in `who`'s hand now, as a set of ids. */
export function handInstances(g: TestGame, who: PlayerId = 'p1'): InstanceId[] {
  return g.zone(who, 'hand').map((c) => c.instance);
}

/** p2 (turn player in a `theirs` game) attacks `target` with `attacker` (their Leader by default). Stops at the first decision after. */
export function opponentAttacks(
  g: TestGame,
  target: InstanceId,
  attacker: InstanceId = g.leader('p2'),
): void {
  attack(g, attacker, target);
}

/** Card ids an effect has revealed so far. */
export function revealed(g: TestGame): (CardId | undefined)[] {
  return g.events.filter((e) => e.type === 'CardRevealed').map((e) => e['card'] as CardId);
}
