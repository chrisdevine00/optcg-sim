/**
 * Helpers for the PRB-02 / ST-15 / ST-16 / ST-17 group-A independent card tests. Public API,
 * frozen fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt
 * and fails on anything else (see kit-op17b.ts). Scenery stats are noted next to each constant;
 * tests repeat the ones they rely on.
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { choices, don, kind, need, offeredIds } from '../op14/kit-op14a.ts';

export * from '../op14/kit-op14a.ts';

/** Leaders used as scenery. None has an effect that fires unless a test makes it. */
export const LDP = {
  /** OP02-093 Smoker: Black, 5000, 5 Life, {Navy}. [DON!! x1][Activate: Main] only. */
  navy: 'OP02-093',
  /** OP09-081 Marshall.D.Teach: Black, 5000, 5 Life, {Blackbeard Pirates}/{The Four Emperors}. Negates its owner's [On Play]; [Activate: Main] only. */
  bbp: 'OP09-081',
  /** OP06-021 Perona: Green/Black, 5000, 4 Life, {Thriller Bark Pirates}. [Activate: Main] only. */
  tbp: 'OP06-021',
  /** OP03-099 Charlotte Katakuri: Yellow, 5000, 5 Life, {Big Mom Pirates}. [DON!! x1][When Attacking] only. */
  bmp: 'OP03-099',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. */
  film: 'ST05-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. */
  warlord: 'ST03-001',
  /** OP16-001 Portgas.D.Ace: Red, 5000, 5 Life, {Whitebeard Pirates}. [Activate: Main] only. */
  wb: 'OP16-001',
  /** OP01-002 Trafalgar Law: Green/Red (multicoloured), 5000, 4 Life. */
  multi: 'OP01-002',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only; no type any card here asks for. */
  neutral: 'ST01-001',
} as const;

/** Scenery cards. Stats are the printed ones. */
export const SP = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. Vanilla. */
  c1p3: 'OP01-010',
  /** OP13-009 Curly.Dadan: Red, cost 1, 2000, Counter +1000, {Mountain Bandits}. Inert alone. */
  c1p2: 'OP13-009',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. Vanilla. */
  c2p4: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. Vanilla. */
  c3p5: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. Vanilla. */
  c4p6: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, {Whitebeard Pirates}. Vanilla. */
  c5p7: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. Vanilla. */
  c6p8: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. Vanilla. */
  c7p9: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. Vanilla. */
  c8p10: 'OP12-005',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0 power, Counter +1000. Inert alone. */
  c2p0: 'OP04-012',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000. Vanilla. */
  mohji: 'OP02-060',
  /** ST01-014 Guard Point: Red Event, cost 1 ([Counter] only). */
  event: 'ST01-014',
  /** OP05-021 Revolutionary Army HQ: Red Stage, cost 1 (only an [Activate: Main]). */
  stage: 'OP05-021',
  /** OP09-077 Gum-Gum Lightning: Purple Event, cost 2, [Main] DON!! -2: K.O. up to 1 Character with 6000 power or less; add up to 1 DON!!. */
  lightning: 'OP09-077',
  /** EB01-059 Kingdom Come: Yellow Event, cost 6, [Main] K.O. up to 1 Character; then trash own Life down to 1. */
  kingdomCome: 'EB01-059',
  /** OP05-077 Gamma Knife: Purple Event, cost 2, [Main] DON!! -1: opposing Character -5000 this turn. */
  gammaKnife: 'OP05-077',
  /** ST27-005 Marshall.D.Teach: Black, cost 7, 8000, no Counter. [Activate: Main] rest this: K.O. up to 1 Character (any side) with cost 3 or less. */
  teachKo: 'ST27-005',
  /** EB03-027 Marguerite: Blue, cost 6, 7000, {Amazon Lily}. [On Play] Return up to 1 Character (any side) with 7000 base power to its owner's hand. */
  bounce7: 'EB03-027',
  /** OP17-024 Howling Gab: Green, cost 8, 8000, [Banish]. [On Play] Rest up to 1 of the opponent's Characters (a Character's effect). */
  gab: 'OP17-024',
  /** OP13-038 Gum-Gum Elephant Gun: Green Event, cost 2, [Main] rest up to 1 opposing Character with cost 5 or less. */
  elephantGun: 'OP13-038',
  /** OP03-106 Charlotte Opera: Yellow, cost 4, 6000, {Big Mom Pirates}. Vanilla. */
  bmp6: 'OP03-106',
  /** OP04-107 Charlotte Perospero: Yellow, cost 6, 8000, {Big Mom Pirates}. Vanilla. */
  bmp8: 'OP04-107',
  /** OP08-065 Charlotte Smoothie: Purple, cost 7, 9000, {Big Mom Pirates}. Vanilla. */
  bmp9: 'OP08-065',
  /** EB05-054 Charlotte Brulee: Yellow, cost 3, 4000, {Big Mom Pirates}. Vanilla. */
  bmp4: 'EB05-054',
  /** OP03-100 Kingbaum: Yellow, cost 3, 5000, {Big Mom Pirates}/{Homies}. Vanilla (no Counter). */
  bmp5: 'OP03-100',
  /** OP04-114 Randolph: Yellow, cost 5, 7000, Counter +1000, {Big Mom Pirates}/{Homies}. Vanilla. */
  bmp7: 'OP04-114',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000, {FILM}/{Straw Hat Crew}/{Supernovas}. Vanilla. */
  filmChar: 'OP02-043',
  /** P-015 Sunny-Kun: Red, cost 1, 3000, Counter +1000, {FILM}/{Straw Hat Crew}. Vanilla. */
  filmCheap: 'P-015',
} as const;

/** The deciding player owes a plain Main Phase decision (nothing else pending). */
export function atMainOf(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return !!d && d.kind === 'main' && d.player === who;
}

/** DON!! summary of `who` as a compact string, for equality checks: active/rested/given. */
export function donStr(g: TestGame, who: PlayerId = 'p1'): string {
  const d = don(g, who);
  return `${d.active}/${d.rested}/${d.given}`;
}

/** Power of the Leader of `who`. */
export function leadPow(g: TestGame, who: PlayerId = 'p1'): number | null {
  return g.power(g.leader(who));
}

/**
 * Answer an "up to 1 target" pick of a "give rested DON!!" effect with `target`, using the first
 * pending `choose` of the deciding player. Anything else pending fails.
 */
export function giveTo(g: TestGame, target: InstanceId): void {
  need(g, 'choose');
  expect(choices(g)).toContain(target);
  act(g, { type: 'pick', choice: target });
}

/** Instance ids the pending target pick offers, as card ids, sorted. */
export function offeredNow(g: TestGame): (CardId | null)[] {
  return offeredIds(g);
}

/** True if no decision is pending beyond a plain Main Phase of `who`. */
export function settled(g: TestGame, who: PlayerId = 'p1'): boolean {
  return kind(g) === 'main' && decision(g)?.player === who;
}

/**
 * p2 attacks p1's Leader with p2's Leader, p1 neither blocks nor counters; Life cards taken have no
 * [Trigger] decision unless the card has one (then the decision is left pending).
 */
export function p2AttacksLeader(g: TestGame): void {
  act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
}
