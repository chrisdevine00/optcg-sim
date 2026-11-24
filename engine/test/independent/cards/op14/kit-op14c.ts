/**
 * Helpers for the OP-14 group-C independent card tests (OP14-062 .. OP14-086). Public API, frozen
 * fixtures and the earlier kits only. Answer helpers accept ONE named kind of prompt and fail on
 * anything else, so a missing or extra "up to" / "you may" prompt is caught.
 */
import {
  queries,
  type CardId,
  type InstanceId,
  type PlayerId,
  type PlayerSpec,
} from '@optcg/engine';
import { expect } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, passBlock } from '../../helpers.ts';
import { kind, outcomes } from '../kit.ts';
import { theirs } from '../m4b/kit-a.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../op15/kit-op15a.ts';
export { result, turn, ids } from '../../helpers.ts';

/** Leaders used as scenery. None has an effect that fires unless a test makes it. */
export const LD14 = {
  /** OP01-060 Donquixote Doflamingo: Blue, 5000, 5 Life, {Donquixote Pirates}. Only a [DON!! x2][When Attacking]. */
  dp: 'OP01-060',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}. Vanilla: no {Donquixote Pirates}. */
  plain: 'ST01-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. */
  bw: 'ST03-001',
  /** OP06-021 Perona: Green/Black, 5000, 4 Life, {Thriller Bark Pirates}. [Activate: Main] only. */
  tbp: 'OP06-021',
} as const;

/** Scenery Characters. Stats are repeated where a test relies on them. */
export const SC14 = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000. */
  c1: 'OP01-010',
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
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000 (no Counter). [On Play] only. */
  c9: 'OP01-070',
  /** OP01-006 Otama: Red, cost 1, base power 0. [On Play] only: inert on the field. */
  zero1: 'OP01-006',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, base power 0. Inert on the field. */
  zero2: 'OP04-012',
  /** OP10-073 Buffalo: Purple, cost 4, 6000, {Donquixote Pirates}. Vanilla. */
  dp4: 'OP10-073',
  /** OP05-035 Bellamy: Green, cost 3, 5000, {Donquixote Pirates}. Vanilla. */
  dp3: 'OP05-035',
  /** OP12-111 Baby 5: Yellow, cost 2, 4000, {Donquixote Pirates}. Vanilla. */
  dp2: 'OP12-111',
  /** OP10-068 Diamante: Purple, cost 5, 7000, {Donquixote Pirates}. Vanilla. */
  dp5: 'OP10-068',
  /** OP14-066 Diamante: Purple, cost 6, 8000, {Donquixote Pirates}. Vanilla. */
  dp6: 'OP14-066',
  /** OP06-094 Lola: Black, cost 4, 6000, {Thriller Bark Pirates}. Vanilla. */
  tbp4: 'OP06-094',
  /** OP02-054 Gecko Moria: Blue, cost 4, 6000, {The Seven Warlords of the Sea}/{Thriller Bark Pirates}. Vanilla. */
  tbp4b: 'OP02-054',
  /** OP14-101 Oars: Yellow, cost 8, 10000, {Giant}/{Thriller Bark Pirates}. Vanilla. */
  tbp8: 'OP14-101',
  /** OP14-095 Mr.9: Black, cost 5, 6000, {Baroque Works}. Vanilla. */
  bw5: 'OP14-095',
  /** OP02-097 Komille: Black, cost 1, 3000, {Navy}. Vanilla. */
  navy1: 'OP02-097',
} as const;

/** EB05-012 Camie: Green Character, cost 3, 0 power. [On Play] Rest up to 1 of your opponent's Characters with cost 6 or less. */
export const CAMIE = 'EB05-012';
/** OP09-077 Gum-Gum Lightning: Purple Event, cost 2. [Main] DON!! -2: K.O. up to 1 opposing Character with 6000 power or less. */
export const LIGHTNING = 'OP09-077';

/** The DON!! counts of a player. */
export function donOf14(g: TestGame, who: PlayerId = 'p1') {
  return queries.don(g.state, who);
}

/** DON!! on the field: cost area (active + rested) plus given. */
export function onField(g: TestGame, who: PlayerId = 'p1'): number {
  const d = donOf14(g, who);
  return d.active + d.rested + d.given;
}

/** p2's Leader (5000) attacks `target`; p1 neither blocks nor counters. Stops at the first decision after. */
export function koBattle(
  g: TestGame,
  target: InstanceId,
  attacker: InstanceId = g.leader('p2'),
): void {
  attack(g, attacker, target);
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
}

/** p2's Character `card` (a 7000 Kingdew by default) attacks p1's rested `target`. */
export function koByChar(g: TestGame, target: InstanceId, attackerCard: CardId = SC14.c5): void {
  koBattle(g, target, g.find('p2', 'characters', attackerCard));
}

/** A fingerprint of every Character of `who`: card, zone and rested state, sorted. */
export function charState(g: TestGame, who: PlayerId): string {
  return [
    ...g.zone(who, 'characters').map((c) => `${c.card}:${c.rested ? 'R' : 'A'}`),
    ...g.zone(who, 'trash').map((c) => `${c.card}:T`),
  ]
    .sort()
    .join(',');
}

/** Every `charState` of `who` the decisions of `player` can reach from here. */
export function reach(g: TestGame, player: PlayerId, who: PlayerId): string[] {
  return [...outcomes(g, player, (x) => charState(x, who))].sort();
}

/** The pending "how many DON!! will you add (up to N)" question: its count ids (ids are the numbers). */
export function countOptions(g: TestGame): string[] {
  const d = need(g, 'choose');
  expect(d.purpose).toBe('mode');
  return (d.options ?? []).map((o) => o.id);
}

/** Answer the pending "add up to N DON!!" count question with `n` (strict: it must be asked). */
export function addDon(g: TestGame, n: number): void {
  expect(countOptions(g)).toContain(String(n));
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/** True when the pending decision is the "add up to N DON!!" count question. */
export function asksCount(g: TestGame): boolean {
  if (kind(g) !== 'choose') return false;
  const d = need(g, 'choose');
  return d.purpose === 'mode' && /how many/i.test(d.prompt);
}

/** Expect the pending decision to be the plain Main Phase of `who`. */
export function backToMain(g: TestGame, who: PlayerId): void {
  need(g, 'main', who);
  expect(kind(g)).toBe('main');
}

type Placed = CardId | { card: CardId; rested?: boolean; don?: number };

/**
 * p1 defends with the card `id` rested at the front of the Character area (plus `p1.characters`)
 * and is K.O.'d in battle by p2's Leader (5000), or by p2's Character `attacker` (7000 Kingdew by
 * default, put first in p2's Character area) when `strong` is set. Stops at the first decision
 * after the K.O. (the [On K.O.] prompts, or p2's Main Phase).
 */
export function koGame(
  id: CardId,
  o: {
    leader?: string;
    p1?: Partial<PlayerSpec>;
    p2?: Partial<PlayerSpec>;
    strong?: boolean;
    p1chars?: Placed[];
    p2chars?: Placed[];
  } = {},
): TestGame {
  const p2chars: Placed[] = [...(o.strong ? [SC14.c5] : []), ...(o.p2chars ?? [])];
  const g = theirs(
    o.leader ?? LD14.dp,
    {
      characters: [{ card: id, rested: true }, ...(o.p1chars ?? [])],
      costArea: { active: 3, rested: 0 },
      ...o.p1,
    },
    { characters: p2chars, costArea: { active: 9, rested: 0 }, ...o.p2 },
  );
  if (o.strong) koByChar(g, g.find('p1', 'characters', id));
  else koBattle(g, g.find('p1', 'characters', id));
  return g;
}
