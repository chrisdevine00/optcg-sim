/**
 * Helpers for the "leftovers group A" independent card tests. Public API, frozen fixtures and the
 * earlier kits only. Every answer helper accepts ONE named kind of prompt and fails on anything
 * else (see kit-op17b.ts). Scenery stats are noted next to each constant; tests repeat the ones
 * they rely on.
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act } from '../../helpers.ts';
import { need, restCost, yes } from '../op17/kit-op17b.ts';
import { playRaw } from '../op15/kit-op15a.ts';

export * from '../op17/kit-op17b.ts';
export { K } from '../../helpers.ts';
export { playRaw, chr, KINGDOM_COME, opponentKingdomCome, leaderPower } from '../op15/kit-op15a.ts';
export { describeLook13, pickCount, whatNow } from '../op13/kit-op13a.ts';

/** Leaders used as scenery. */
export const LD_LF = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, Strike, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. */
  luffy: 'ST01-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, Special, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. */
  croc: 'ST03-001',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, Slash, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. */
  shanks: 'ST05-001',
  /** OP01-031 Kouzuki Oden: Green, 5000, 5 Life, Slash, {Land of Wano}/{Kouzuki Clan}. [Activate: Main] only. */
  oden: 'OP01-031',
  /** OP06-020 Hody Jones: Green, 5000, 5 Life, Strike, {Fish-Man}/{New Fish-Man Pirates}. [Activate: Main] only. */
  hody: 'OP06-020',
  /** OP01-001 Roronoa Zoro: Red, 5000, 5 Life, Slash, {Straw Hat Crew}/{Supernovas}. [DON!! x1][Your Turn] Characters +1000. Name [Roronoa Zoro]. */
  zoro: 'OP01-001',
  /** OP16-080 Marshall.D.Teach: Black/Yellow, 5000, 5 Life, Special, {Blackbeard Pirates}. Its text is removed by the `mine`/`theirs` scenery. */
  teach: 'OP16-080',
} as const;

/** Vanilla Characters used as scenery. */
export const VAN_LF = {
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, Special, {Former Whitebeard Pirates}. */
  marco: 'OP01-023',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000, Slash, {Happosui Army}. */
  sai: 'OP01-012',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000, Strike, {Giant}/{New Giant Pirates}. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, Strike, {Whitebeard Pirates}. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. */
  thatch: 'OP02-007',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, Wisdom, {Buggy Pirates}. Named [Mohji]. */
  mohji: 'OP02-060',
  /** ST03-011 Buggy: Blue, cost 1, 3000, Counter +1000, Slash, {Buggy's Delivery}/{The Seven Warlords of the Sea}. Named [Buggy]. */
  buggy: 'ST03-011',
  /** OP12-055 Mohji & Cabaji: Blue, cost 5, 6000, Counter +2000, Slash/Wisdom, {Cross Guild}. Name is neither [Buggy] nor [Mohji]. */
  mohjiCabaji: 'OP12-055',
  /** OP01-043 Shinobu: Green, cost 3, 5000, Counter +1000, Special, {Land of Wano}. */
  shinobu: 'OP01-043',
  /** OP01-053 Wire: Green, cost 2, 4000, Counter +1000, Slash, {Kid Pirates}. */
  wire: 'OP01-053',
  /** EB05-015 Tashigi: Green, cost 5, 7000, Counter +1000, Slash, {Navy}/{East Blue}. */
  tashigi5: 'EB05-015',
  /** OP04-023 Kuro: Green, cost 6, 8000, Counter +1000, Slash, {East Blue}/{Black Cat Pirates}. */
  kuro6: 'OP04-023',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000, Slash, {FILM}/{Straw Hat Crew}/{Supernovas}. */
  zoroChar: 'OP02-043',
  /** OP02-039 Franky: Green, cost 5, 7000, Counter +1000, Special, {FILM}/{Straw Hat Crew}. */
  frankyShc: 'OP02-039',
  /** OP09-038 Rob Lucci: Green, cost 4, 6000, Counter +1000, Strike, {CP9}/{ODYSSEY}. */
  lucci: 'OP09-038',
  /** OP11-045 Vinsmoke Niji: Blue, cost 5, 6000, Counter +2000, Special, {The Vinsmoke Family}/{GERMA 66}. */
  niji: 'OP11-045',
  /** OP06-063 Vinsmoke Sora: Purple, cost 1, 0 power, Counter +2000, {The Vinsmoke Family}/{Kingdom of GERMA}. [On Play] only. */
  sora: 'OP06-063',
  /** OP09-082 Avalo Pizarro: Black, cost 4, 6000, Counter +1000, Special, {Blackbeard Pirates}. */
  pizarro: 'OP09-082',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0 power, Counter +1000, Wisdom, {Alabasta}. Inert alone. */
  cobra0: 'OP04-012',
  /** EB01-056 Charlotte Flampe: Yellow, cost 1, 1000, Counter +2000, {Big Mom Pirates}. [On Play] only. */
  flampe1000: 'EB01-056',
  /** OP14-005 Killer: Red, cost 1, 1000, Counter +1000, {Kid Pirates}/{Supernovas}. [Activate: Main] only. */
  killer1000: 'OP14-005',
  /** OP17-113 Streusen: Yellow, cost 1, 2000, Counter +2000, Slash, {Big Mom Pirates}. [On Play] only. */
  streusen2000: 'OP17-113',
} as const;

/** Events used as scenery. */
export const EV_LF = {
  /** ST01-014 Guard Point: Red Event, cost 1. [Counter] +3000. */
  guardPoint: 'ST01-014',
  /** OP17-038 I Think He's Seen an Ugly Future...: Green Event, cost 0. [Main] You may rest 4 of your cards: Rest up to 1 of your opponent's Characters. */
  restEvent: 'OP17-038',
} as const;

/** The defender blocks with `blocker` (the Block Step decision must be pending). */
export function block(g: TestGame, blocker: InstanceId): void {
  need(g, 'block');
  act(g, { type: 'block', blocker });
}

/** True when the card (an instance) is rested. */
export function isRested(g: TestGame, i: InstanceId): boolean {
  return g.card(i).rested;
}

/** Sorted card ids of the Characters of `who`. */
export function charIdsOf(g: TestGame, who: PlayerId): CardId[] {
  return g
    .zone(who, 'characters')
    .map((c) => c.card)
    .sort();
}

/**
 * The deciding player (p2 on their own turn) plays OP17-038 (rest 4 of their cards: rest up to 1
 * opposing Character) and rests `target`, one of p1's Characters. Returns true when the target
 * was offered. The effect is left finished.
 */
export function opponentRests(g: TestGame, target: InstanceId): boolean {
  const player = g.decider;
  playRaw(g, EV_LF.restEvent);
  yes(g, player);
  restCost(g, [], 4);
  need(g, 'choose', player);
  const offered = g.legal().some((a) => a.type === 'pick' && a.choice === target);
  if (offered) act(g, { type: 'pick', choice: target });
  else act(g, { type: 'done' });
  return offered;
}

/**
 * The deciding player plays EB01-059 Kingdom Come (6 DON!!) and picks `target` for its K.O.
 * Stops at the first decision the K.O. causes. Fails if `target` is not offered.
 */
export function koWithKingdomCome(g: TestGame, target: InstanceId): void {
  const player = g.decider;
  playRaw(g, 'EB01-059');
  need(g, 'choose', player);
  act(g, { type: 'pick', choice: target });
}

/** Expect the pending decision to be the plain Main Phase of `who`. */
export function expectMain(g: TestGame, who: PlayerId): void {
  need(g, 'main', who);
  expect(g.decider).toBe(who);
}
