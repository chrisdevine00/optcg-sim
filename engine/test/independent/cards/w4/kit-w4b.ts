/**
 * Helpers for the engine-wave-4 group-B independent card tests (OP14-001/009/017/115, EB03-008/054/
 * 055/057, EB04-044/050). Public API, frozen fixtures and the earlier kits only. Every answer
 * helper accepts ONE named kind of prompt and fails on anything else; where the engine's
 * encoding of a prompt is open, the helper says which encodings it takes.
 */
import { expect } from 'vitest';
import { queries, type CardId, type InstanceId, type PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { choices, donChoices, kind } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../op14/kit-op14a.ts';

/** Scenery of this group. Stats are the printed ones; every card is vanilla unless noted. */
export const W = {
  /** OP04-087 Trafalgar Law: Black, cost 5, 7000, Counter +1000, {Heart Pirates}/{Dressrosa}. Named [Trafalgar Law]. */
  law7: 'OP04-087',
  /** OP01-045 Jean Bart: Green, cost 4, 6000, Counter +1000, {Heart Pirates}. */
  jeanBart: 'OP01-045',
  /** ST02-012 Bepo: Green, cost 1, 3000, Counter +1000, {Heart Pirates}/{Minks}. */
  bepo: 'ST02-012',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000, {FILM}/{Straw Hat Crew}/{Supernovas}. */
  zoro: 'OP02-043',
  /** OP07-028 Scratchmen Apoo: Green, cost 6, 8000, Counter +1000, {On-Air Pirates}/{Supernovas}. */
  apoo8: 'OP07-028',
  /** OP14-008 Scratchmen Apoo: Red, cost 3, 5000, Counter +1000, {On-Air Pirates}/{Supernovas}. */
  apoo5: 'OP14-008',
  /** OP10-101 Urouge: Yellow, cost 5, 7000, Counter +1000, {Fallen Monk Pirates}/{Supernovas}. */
  urouge: 'OP10-101',
  /** OP14-007 Jewelry Bonney: Red, cost 6, 7000, Counter +2000, {Bonney Pirates}/{Supernovas}. */
  bonney: 'OP14-007',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, {Animal}/{Land of Wano}. */
  komachiyo: 'OP01-010',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. No Heart Pirates / Supernovas. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  thatch: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  oars9: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. */
  shiki10: 'OP12-005',
  /** OP05-044 John Giant: Blue, cost 8, 10000, Counter +1000, {Giant}/{Navy}. */
  johnGiant10: 'OP05-044',
  /** OP11-017 X.Drake: Red, cost 6, 7000, Counter +2000, {Drake Pirates}/{Navy}/{SWORD}. Vanilla. The only vanilla {SWORD}. */
  drake: 'OP11-017',
  /** OP02-116 Yamakaji: Black, cost 3, 5000, Counter +1000, {Navy}. Vanilla (not SWORD). */
  yamakaji: 'OP02-116',
  /** OP02-097 Komille: Black, cost 1, 3000, Counter +1000, {Navy}. Vanilla. */
  komille: 'OP02-097',
  /** OP02-107 Doberman: Black, cost 2, 4000, Counter +1000, {Navy}. Vanilla. */
  doberman: 'OP02-107',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000. */
  mohji: 'OP02-060',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  sai: 'OP01-012',
  /** OP02-084 Blugori: Purple, cost 1, 3000, Counter +1000. */
  blugori: 'OP02-084',
  /** OP01-104 Speed: Purple Character, no effect, "[Trigger] Play this card." */
  speed: 'OP01-104',
  /** OP09-077 Gum-Gum Lightning: Purple Event, cost 2, [Main] DON!! -2: K.O. up to 1 Character with 6000 power or less. */
  lightning: 'OP09-077',
  /** EB01-059 Kingdom Come: Yellow Event, cost 6. [Main] K.O. up to 1 of your opponent's Characters; then trash Life down to 1. */
  kingdomCome: 'EB01-059',
  /** ST01-014 Guard Point: Red Event, cost 1, [Counter] only. */
  guard: 'ST01-014',
} as const;

/** Leaders used as scenery. */
export const LW = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. */
  luffy: 'ST01-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. */
  croc: 'ST03-001',
  /** OP07-038 Boa Hancock: Blue, 5000, 5 Life, {Kuja Pirates}/{The Seven Warlords of the Sea}. Only a [Your Turn] draw. */
  hancock: 'OP07-038',
  /** OP01-031 Kouzuki Oden: Green, 5000, 5 Life, {Land of Wano}/{Kouzuki Clan}. Only an [Activate: Main]. */
  oden: 'OP01-031',
  /** ST06-001 Sakazuki: Black, 5000, 5 Life, {Navy}. Only an [Activate: Main]. */
  sakazuki: 'ST06-001',
  /** OP05-041 Sakazuki: Blue/Black, 5000, 4 Life, {Navy}. Only an [Activate: Main]. */
  sakazuki2: 'OP05-041',
  /** OP11-001 Koby: Red/Black, 5000, 4 Life, {Navy}/{SWORD}. Its text: SWORD Characters can attack Characters on the turn they are played. */
  kobyLeader: 'OP11-001',
} as const;

/** One-line description of the pending decision, for scratch debugging. */
export function dbg(g: TestGame): string {
  const d = decision(g);
  if (!d) return 'no decision';
  const legal = g
    .legal()
    .map((a) => JSON.stringify(a))
    .slice(0, 14);
  return `${d.kind}/${d.purpose} for ${d.player} min=${d.min} max=${d.max}: ${d.prompt} | opts=${(d.options ?? []).map((o) => o.id + ':' + o.label)} | legal=${legal.join(' ')}`;
}

export function who(g: TestGame): PlayerId {
  return g.decider;
}

/** The DON!! summary of a player. */
export function donSum(g: TestGame, p: PlayerId = 'p1') {
  return queries.don(g.state, p);
}

/** Instances of p's Characters, in card-id order. */
export function charInsts(g: TestGame, p: PlayerId): InstanceId[] {
  return g.zone(p, 'characters').map((c) => c.instance);
}

/** Current power of the nth copy of `card` among p's Characters. */
export function powerOf(g: TestGame, p: PlayerId, card: CardId, nth = 0): number | null {
  return g.power(g.find(p, 'characters', card, nth));
}

/** True when this attacker may attack this target now. */
export function mayHit(g: TestGame, attacker: InstanceId, target: InstanceId): boolean {
  need(g, 'main');
  return g
    .legal()
    .some((a) => a.type === 'attack' && a.attacker === attacker && a.target === target);
}

/** Pick one candidate of a pending cost `choose` from hand, strictly. */
export function payHandCard(g: TestGame, card: InstanceId): void {
  const d = need(g, 'choose');
  expect(d.purpose).toBe('cost');
  if (!choices(g).includes(card)) throw new Error(`hand card ${card} not offered as a cost`);
  act(g, { type: 'pick', choice: card });
}

/** The DON!! count options of a pending count question (`choose`/`mode`), e.g. ['3','2','1','0']. */
export function countOptions(g: TestGame, p: PlayerId = 'p1'): string[] {
  const d = need(g, 'choose', p);
  expect(d.purpose).toBe('mode');
  return (d.options ?? []).map((o) => o.id);
}

/** Answer the pending count question with exactly n. */
export function pickCount(g: TestGame, n: number, p: PlayerId = 'p1'): void {
  const o = countOptions(g, p);
  if (!o.includes(String(n))) throw new Error(`Count ${n} not offered; offered ${o}`);
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/** True when the pending decision is a count question for p. */
export function asksCount(g: TestGame, p: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return d?.kind === 'choose' && d.player === p && d.purpose === 'mode';
}

/** Cards the DON!! pick offers by class. */
export function donPickClasses(g: TestGame): string[] {
  return donChoices(g).map((c) => c.from);
}

/** The kind of the pending decision, or 'none'. */
export function pend(g: TestGame): string {
  return kind(g) ?? 'none';
}
