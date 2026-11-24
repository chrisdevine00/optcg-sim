/**
 * Helpers for the OP-15 group-A independent card tests (OP15-004 .. OP15-045). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and
 * fails on anything else (see kit-op17b.ts). Scenery stats are noted next to each constant; tests
 * repeat the ones they rely on.
 */
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { choices, donChoices } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../op16/kit-op16a.ts';

/** Leaders used as scenery. */
export const LD15 = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}. Vanilla. */
  luffy: 'ST01-001',
  /** OP03-021 Kuro: Green, 5000, 5 Life, {East Blue}/{Black Cat Pirates}. Only an [Activate: Main]. */
  eastBlue: 'OP03-021',
  /** OP06-020 Hody Jones: Green, 5000, 5 Life, {Fish-Man}/{New Fish-Man Pirates}. Only an [Activate: Main]. */
  fishMan: 'OP06-020',
  /** OP04-039 Rebecca: Blue/Black, 5000, 5 Life, {Dressrosa}. Cannot attack; [Activate: Main] once per turn. */
  rebeccaOld: 'OP04-039',
  /** OP15-039 Rebecca: Blue, 5000, 5 Life, {Dressrosa}. The card under test elsewhere. */
  rebecca: 'OP15-039',
  /** OP15-022 Brook: Green/Black, 4 Life, {Straw Hat Crew}, named [Brook]. */
  brook: 'OP15-022',
  /** EB01-040 Kyros: Black/Yellow, 5000, 4 Life, {Dressrosa}. Only an [Activate: Main]. */
  dressrosa: 'EB01-040',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}. Only an [Activate: Main]. */
  croc: 'ST03-001',
} as const;

/** Scenery Characters, Events and effect cards. */
export const S15 = {
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0 power, Counter +1000. Inert alone. */
  cobra0: 'OP04-012',
  /** ST01-014 Guard Point: Red Event, cost 1 ([Counter] only). A plain Event card. */
  event: 'ST01-014',
  /** OP09-072 Franky: Purple, cost 4, 5000, [Blocker]. [On Play] only. */
  franky: 'OP09-072',
  /** ST14-010 Brook: Black, cost 5, 7000, {Straw Hat Crew}. Vanilla, named [Brook]. */
  brook: 'ST14-010',
  /** OP01-076 Bellamy: Blue, cost 2, 4000, {Dressrosa}. Vanilla. */
  bellamy: 'OP01-076',
  /** OP10-054 Blue Gilly: Blue, cost 3, 5000, {Dressrosa}. Vanilla. */
  gilly: 'OP10-054',
  /** OP15-049 Hajrudin: Blue, cost 5, 6000, Counter +2000, {Giant}/{Dressrosa}. Vanilla. */
  hajrudinD: 'OP15-049',
  /** EB05-041 Koala: Black, cost 2, 4000, {Revolutionary Army}/{Dressrosa}. Vanilla. */
  koalaVan: 'EB05-041',
  /** EB03-030 Viola: Purple, cost 5, 6000, Counter +2000, {Dressrosa}. Vanilla. */
  violaVan: 'EB03-030',
  /** OP03-023 Alvida: Green, cost 1, 3000, {East Blue}/{Alvida Pirates}. Vanilla. */
  alvida: 'OP03-023',
  /** OP03-046 Genzo: Blue, cost 2, 4000, {East Blue}. Vanilla. */
  genzo: 'OP03-046',
  /** OP12-067 Carmen: Purple, cost 3, 5000, {East Blue}. Vanilla. */
  carmen: 'OP12-067',
  /** EB05-015 Tashigi: Green, cost 5, 7000, {Navy}/{East Blue}. Vanilla. */
  tashigi: 'EB05-015',
  /** OP04-023 Kuro: Green, cost 6, 8000, {East Blue}/{Black Cat Pirates}. Vanilla. */
  kuro6: 'OP04-023',
} as const;

/**
 * Play `card` (from the deciding player's hand) with a raw action, paying the cost from active
 * DON!! only while the engine asks for the play cost. Any other prompt (a target, a "you may")
 * is left pending for the test (docs/reviews/m6b-OP-16.md R6).
 */
export function playRaw(g: TestGame, card: CardId): void {
  const player: PlayerId = g.decider;
  act(g, { type: 'playCard', card: g.find(player, 'hand', card) });
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose' || d.player !== player || d.purpose !== 'cost') return;
    const pay = donChoices(g).find((o) => o.from === 'costActive');
    if (!pay) return;
    act(g, { type: 'pick', choice: pay });
  }
}

/** Leader power of `who`. */
export function leaderPower(g: TestGame, who: PlayerId): number | null {
  return g.power(g.leader(who));
}

/** Instance of the Character card `card` of `who` (nth copy). */
export function chr(g: TestGame, who: PlayerId, card: CardId, nth = 0): InstanceId {
  return g.find(who, 'characters', card, nth);
}

/** True when the pending `choose` offers this instance. */
export function offersInst(g: TestGame, i: InstanceId): boolean {
  return choices(g).includes(i);
}

/** EB01-059 Kingdom Come: Yellow Event, cost 6. [Main] K.O. up to 1 of your opponent's Characters (then your Life is trashed down to 1). */
export const KINGDOM_COME = 'EB01-059';

/**
 * p2 (turn player in a `theirs` game, Kingdom Come in hand, 6+ active DON!!) plays EB01-059
 * Kingdom Come and K.O.s `target` (a p1 Character). Stops at the first decision that K.O. causes
 * (a replacement offer, an [On K.O.], or the end of the effect).
 */
export function opponentKingdomCome(g: TestGame, target: InstanceId): void {
  playRaw(g, KINGDOM_COME);
  need(g, 'choose', 'p2');
  act(g, { type: 'pick', choice: target });
}
