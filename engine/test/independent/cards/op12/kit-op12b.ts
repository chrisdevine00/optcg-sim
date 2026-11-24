/**
 * Helpers for the OP-12 group-B independent card tests (OP12-040 .. OP12-077). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and
 * fails on anything else (see kit-op17b.ts). Scenery stats are noted next to each constant; tests
 * repeat the ones they rely on. Where a test asserts whether a prompt appears it uses raw `g.act`.
 */
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { choices, cardOf, kind } from '../kit.ts';

export * from '../op14/kit-op14a.ts';
export { asksDonCount, donCountOptions, takeDon } from '../op16/kit-op16b.ts';

/** Leaders used as scenery. */
export const LB = {
  /** P-076 Sakazuki: Blue/Black, 5000, 5 Life, {Navy}. Only an [Activate: Main] (needs a [Navy] card in hand). */
  navy: 'P-076',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. Not Navy. */
  luffy: 'ST01-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. */
  croc: 'ST03-001',
  /** OP12-040 Kuzan: Blue, 5000, 5 Life, {Navy}. The card under test in OP12-040 only. */
  kuzan: 'OP12-040',
  /** OP12-041 Sanji: Blue/Purple, 5000, 5 Life, named [Sanji]. [Activate: Main] [Once Per Turn] DON!! -1 ... ; [When Attacking]. */
  sanjiDon: 'OP12-041',
  /** PRB01-001 Sanji: Red, 5000, 5 Life, named [Sanji], {Straw Hat Crew}. Only an [Activate: Main] (Rush for a Character). */
  sanji: 'PRB01-001',
  /** OP12-061 Donquixote Rosinante: Purple/Yellow, 5000, {Donquixote Pirates}/{Navy}. Not named [Sanji]. */
  rosiLeader: 'OP12-061',
  /** OP04-058 Crocodile: Purple/Yellow, 5000, {Baroque Works}/{The Seven Warlords of the Sea}. */
  crocPurple: 'OP04-058',
  /** OP12-001 .. not used. */
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. */
  shanks: 'ST05-001',
} as const;

/** Scenery cards. */
export const SB = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. Vanilla. */
  mohji: 'OP02-060',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. Vanilla. */
  komachiyo: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. Vanilla. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. Vanilla. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. Vanilla. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. Vanilla. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. Vanilla. */
  thatch: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. Vanilla. */
  oars: 'OP02-020',
  /** EB03-002 Ain: Red, cost 5, 6000, Counter +2000. Vanilla. */
  ain: 'EB03-002',
  /** OP04-077 Ideo: Black, cost 2, 2000, Counter +1000, [Blocker]. Vanilla otherwise. */
  ideo: 'OP04-077',
  /** OP09-072 Franky: Purple, cost 4, 5000, Counter +1000, [Blocker]. [On Play] only. */
  franky4: 'OP09-072',
  /** OP11-054 Nami: Blue, cost 5, 6000, Counter +1000, [Blocker]. [On Play] only. */
  nami5: 'OP11-054',
  /** EB03-019 Wanda: Green, cost 6, 7000, Counter +1000, [Blocker]. Vanilla otherwise. */
  wanda6: 'EB03-019',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. Vanilla. */
  shiki: 'OP12-005',
  /** OP06-049 Sengoku: Blue, cost 5, 7000, Counter +1000, {Navy}. Vanilla. */
  navyBlue5: 'OP06-049',
  /** OP12-052 Fullbody: Blue, cost 4, 6000, Counter +1000, {Navy}. Vanilla. */
  navyBlue4: 'OP12-052',
  /** EB05-026 Hina: Blue, cost 7, 8000, Counter +2000, {Navy}. Vanilla. */
  navyBlue7: 'EB05-026',
  /** OP12-045 Jango: Blue, cost 6, 8000, Counter +1000, {Navy}. Vanilla. */
  navyBlue6: 'OP12-045',
  /** OP05-044 John Giant: Blue, cost 8, 10000, Counter +1000, {Giant}/{Navy}. Vanilla. */
  navyBlue8: 'OP05-044',
  /** OP02-097 Komille: Black, cost 1, 3000, Counter +1000, {Navy}. Vanilla. */
  navyBlack1: 'OP02-097',
  /** OP02-116 Yamakaji: Black, cost 3, 5000, Counter +1000, {Navy}. Vanilla. */
  navyBlack3: 'OP02-116',
  /** OP02-109 Jaguar.D.Saul: Black, cost 4, 6000, Counter +1000, {Giant}/{Navy}. Vanilla. */
  navyBlack4: 'OP02-109',
  /** ST33-001 Koby: Blue, cost 2, 1000, {Navy}, [Blocker]. [On Play] You may trash 1 card from your hand: Draw 1 card. */
  kobyDraw: 'ST33-001',
  /** OP11-086 Coribou: Black, cost 3, 5000, {Caribou Pirates}. [On Play] Trash 1 card from your hand. */
  coribou: 'OP11-086',
  /** EB05-027 Hibari: Blue, cost 5, 6000, {Navy}/{SWORD}. [On Play] Draw 3, trash 2 from hand; then place up to 1 cost-2-or-less Character at the bottom. */
  hibari: 'EB05-027',
  /** ST01-014 Guard Point: Red Event, cost 1, [Counter] only. A plain Event card. */
  event: 'ST01-014',
  /** OP12-005 .. */
  /** OP03-023 Alvida: Green, cost 1, 3000, Counter +1000. Vanilla. */
  alvida: 'OP03-023',
  /** OP10-054 Blue Gilly: Blue, cost 3, 5000, {Dressrosa}. Vanilla. */
  gilly: 'OP10-054',
} as const;

/** All four filler Characters in a hand, to give a hand of a chosen size. */
export function junk(n: number, card: CardId = SB.mohji): CardId[] {
  return Array.from({ length: n }, () => card);
}

/** Instance of the `nth` card `card` in `who`'s zone. */
export function inst(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId {
  return g.find(who, zone, card, nth);
}

/**
 * Play `card` from the deciding player's hand with a raw action, paying from active DON!! while
 * the engine asks for the cost; any other prompt is left pending for the test.
 */
export function cast(g: TestGame, card: CardId): void {
  const player: PlayerId = g.decider;
  act(g, { type: 'playCard', card: g.find(player, 'hand', card) });
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose' || d.player !== player || d.purpose !== 'cost') return;
    const pay = g
      .legal()
      .find(
        (a) =>
          a.type === 'pick' &&
          typeof a.choice === 'object' &&
          'from' in a.choice &&
          a.choice.from === 'costActive',
      );
    if (!pay) return;
    g.act(pay);
  }
}

/**
 * Close the "up to" picks that trail an effect the test is not about (a target pick that may be
 * left empty). Only `choose` decisions that allow `done` are ended; any other prompt stops the
 * loop. Never use it where the test asserts whether such a prompt appears.
 */
export function endTail(g: TestGame, who: PlayerId = 'p1'): void {
  for (let i = 0; i < 5; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose' || d.player !== who) return;
    if (!g.legal().some((a) => a.type === 'done')) return;
    act(g, { type: 'done' });
  }
}

/** Raw pick of the first offered copy of `card` in the pending `choose` (no confirmation). */
export function pickOne2(g: TestGame, card: CardId, nth = 0): void {
  const hit = choices(g).filter((i) => cardOf(g, i) === card)[nth];
  if (!hit) throw new Error(`${card} not offered (${kind(g)})`);
  act(g, { type: 'pick', choice: hit });
}
