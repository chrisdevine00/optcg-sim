/**
 * Helpers for the OP-12 group-A independent card tests (OP12-001 .. OP12-039). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and
 * fails on anything else; none sends `done` after a last pick, so a missing or extra prompt shows
 * up as a failure. Scenery stats are noted next to each constant; tests repeat the ones they use.
 */
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { choices, donChoices } from '../kit.ts';
import { need, none, offer, offeredAbilities, pickInst, settleOrders } from '../op17/kit-op17b.ts';
import { playRaw } from '../op15/kit-op15a.ts';

export * from '../op14/kit-op14a.ts';

/** Leaders used as scenery. */
export const LD12 = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}. Only an [Activate: Main]. */
  luffy: 'ST01-001',
  /** OP12-001 Silvers Rayleigh: Red, 5000, 5 Life, {Former Roger Pirates}. The card under test elsewhere. */
  rayleigh: 'OP12-001',
  /** OP12-020 Roronoa Zoro: Green, 5000, 5 Life. Only a [DON!! x3] [Activate: Main] (not used here). */
  zoro: 'OP12-020',
  /** OP01-001 Roronoa Zoro: Red, 5000, 5 Life. [DON!! x1][Your Turn] all Characters +1000. */
  zoroRed: 'OP01-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life. Only an [Activate: Main]. */
  croc: 'ST03-001',
  /** ST06-001 Sakazuki: Black, 5000, 5 Life. Only an [Activate: Main] (needs 3 DON!!): lets p1 play black Events. */
  sakazuki: 'ST06-001',
  /** ST14-001 Monkey.D.Luffy: Black, 5000, 5 Life. [DON!! x1] all your Characters gain +1 cost. */
  luffyCost: 'ST14-001',
} as const;

/** Scenery cards of this group. Stats are the printed ones. */
export const S12 = {
  /** ST01-014 Guard Point: Red Event, cost 1; [Counter] +3000; [Trigger] +1000. */
  event: 'ST01-014',
  /** OP02-117 Ice Age: Black Event, cost 1 (used only as a plain Event card in hand). */
  iceAge: 'OP02-117',
  /** EB04-046 Doll: Black, cost 2, 1000, {Navy}, [Blocker]; [Opponent's Turn] all your {Navy} Characters gain +2 cost. */
  doll: 'EB04-046',
  /** OP02-097 Komille: Black, cost 1, 3000, {Navy}. Vanilla. */
  komille: 'OP02-097',
  /** OP02-104 Sentomaru: Black, cost 2, 3000, {Navy}. Vanilla. */
  sentomaru: 'OP02-104',
  /** OP02-116 Yamakaji: Black, cost 3, 5000, {Navy}. Vanilla. */
  yamakaji: 'OP02-116',
  /** ST02-006 Koby: Green, cost 4, 6000, {Navy}. Vanilla. */
  koby: 'ST02-006',
  /** EB05-015 Tashigi: Green, cost 5, 7000, {Navy}{East Blue}. Vanilla. */
  tashigiG: 'EB05-015',
  /** OP17-097: Black Event, cost 1; [Main] all of the opponent's Characters get -1 cost this turn. */
  cutAll: 'OP17-097',
  /** P-015 Sunny-Kun: Red Character, cost 1, 3000, Counter +1000. Vanilla. */
  sunny: 'P-015',
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
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. Vanilla. */
  shiki: 'OP12-005',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000. Vanilla. */
  mohji: 'OP02-060',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000 (a Character, not a Leader). Vanilla. */
  zoroChar: 'OP02-043',
  /** OP01-039 Killer: Green, cost 2, 2000, [Blocker]. */
  killer: 'OP01-039',
  /** OP12-010 Douglas Bullet: Red, cost 6, 7000, Counter +2000, {Former Roger Pirates}. Vanilla. */
  bullet: 'OP12-010',
  /** EB01-041 Crocus: Black, cost 6, 8000, Counter +1000, {Former Roger Pirates}. Vanilla. */
  crocusBlack: 'EB01-041',
  /** OP13-065 Shanks: Purple, cost 1, 2000, {Roger Pirates}. [On Play] only (inert on the board). */
  shanksPurple: 'OP13-065',
  /** OP13-072 Buggy: Purple, cost 2, 2000, {Roger Pirates}. [On Play] only (inert on the board). */
  buggyPurple: 'OP13-072',
  /** OP09-005 Silvers Rayleigh: Red, cost 5, 6000, [Blocker], {Roger Pirates}. */
  rayleighChar: 'OP09-005',
  /** P-022 Monkey.D.Luffy: Red Character, cost 4, 6000, Counter +1000. Vanilla. */
  luffyRed: 'P-022',
  /** P-061 Monkey.D.Luffy: Green Character, cost 8, 10000, Counter +1000. Vanilla. */
  luffyGreen: 'P-061',
  /** EB01-059 Kingdom Come: Yellow Event, cost 6. [Main] K.O. up to 1 Character. */
  kingdomCome: 'EB01-059',
} as const;

/** The [Activate: Main] ability ids offered on `card` now (empty when it is not the deciding Main Phase). */
export function offeredOn(g: TestGame, card: InstanceId): string[] {
  return offeredAbilities(g, card);
}

/** Start the single [Activate: Main] of `card` with a raw action; nothing else is answered. */
export function startActivate(g: TestGame, card: InstanceId): void {
  const [ability, ...more] = offeredAbilities(g, card);
  if (!ability || more.length) {
    throw new Error(`Expected exactly one ability on ${card}: ${[ability, ...more]}`);
  }
  act(g, { type: 'activate', card, ability });
}

/**
 * Reveal `n` cards from the hand for a pending reveal cost (a `choose` with purpose `cost`),
 * taking the first listed card each time. No `done` is sent: an exact-N cost ends by itself.
 * Returns nothing; the test reads the state afterwards.
 */
export function revealCost(g: TestGame, n: number): void {
  const d = need(g, 'choose');
  if (d.purpose !== 'cost') throw new Error(`Expected a cost pick, got ${d.purpose}: ${d.prompt}`);
  for (let i = 0; i < n; i++) {
    const p = g.legal().find((a) => a.type === 'pick' && typeof a.choice === 'string');
    if (!p) throw new Error(`No hand card to reveal at pick ${i + 1}`);
    g.act(p);
  }
}

/** Activate `card` and pay its "reveal 2 Events" cost (the first two offered). */
export function activateReveal2(g: TestGame, card: InstanceId): void {
  startActivate(g, card);
  revealCost(g, 2);
}

/** The pending decision, if it is a cost pick (a hand reveal or trash). */
export function pendingCost(g: TestGame): boolean {
  const d = decision(g);
  return !!d && d.kind === 'choose' && d.purpose === 'cost';
}

/** Pick one instance in the pending non-cost `choose`, strictly. */
export function pickOne12(g: TestGame, i: InstanceId): void {
  need(g, 'choose');
  pickInst(g, [i]);
}

/** Instance ids a pending `choose` offers, as card ids, sorted; empty when none is pending. */
export function offeredCardIds(g: TestGame): (CardId | null)[] {
  return choices(g)
    .map((i) => {
      try {
        return g.card(i).card;
      } catch {
        return null;
      }
    })
    .sort();
}

/** True when `decision` is an optional that can be accepted. */
export function canAcceptOptional(g: TestGame): boolean {
  const d = decision(g);
  return d?.kind === 'optional' && g.legal().some((a) => a.type === 'optional' && a.accept);
}

/** Pick the DON!! class `from` once, strictly. */
export function pickDonFrom(g: TestGame, from: 'costActive' | 'costRested'): void {
  need(g, 'choose');
  const want = donChoices(g).find((o) => o.from === from);
  if (!want) throw new Error(`No ${from} DON!! offered`);
  act(g, { type: 'pick', choice: want });
}

/** Keywords of a card instance. */
export function keywordsOf(g: TestGame, i: InstanceId): string[] {
  return g.card(i).keywords;
}

/** p2 attacks p1's Leader with its Leader (turn-4 `theirs` positions). */
export function p2HitsLeader(g: TestGame): void {
  act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
}

/**
 * p1 plays OP17-097 (black Event, cost 1, played from hand with a raw action): all of the
 * opponent's Characters get -1 cost during this turn. Leaves the game at the next decision.
 */
export function cutAll(g: TestGame): void {
  playRaw(g, S12.cutAll);
}

/**
 * End a "look at N; reveal up to 1 ...; place the rest at the bottom in any order" effect whose
 * candidate pick is pending: pick `pick` (or nothing when null), then answer only `order`
 * decisions. Anything else pending fails.
 */
export function finishLook(g: TestGame, pick: CardId | null): void {
  need(g, 'choose', 'p1');
  if (pick) pickInst(g, [offer(g, pick)]);
  else none(g);
  settleOrders(g);
}

/** Card ids of a deck from the top. */
export function deckTop(g: TestGame, who: PlayerId = 'p1'): CardId[] {
  return g.zone(who, 'deck').map((c) => c.card);
}
