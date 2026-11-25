/**
 * Helpers for the OP-09 group-A independent card tests (OP09-001 .. OP09-042). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and
 * fails on anything else (see kit-op17b.ts), so a missing or extra "up to" / "you may" prompt is
 * caught. Scenery stats are noted next to each constant; tests repeat the ones they rely on.
 */
import type { CardId, InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { canFinish, choices, kind } from '../kit.ts';

export * from '../op16/kit-op16a.ts';

/** One placed Character: a card id or `{ card, rested, don, playedThisTurn }`. */
export type Place = NonNullable<PlayerSpec['characters']>[number];

/** Leaders used as scenery. None has an effect that fires unless a test makes it. */
export const L9 = {
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. */
  rhp: 'ST05-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Vanilla; no Red-Haired / Kid / ODYSSEY type. */
  luffy: 'ST01-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Supernovas}/{Kid Pirates}. [Activate: Main] only. */
  kid: 'ST02-001',
  /** OP09-022 Lim: Green/Purple, 5000, 5 Life, {ODYSSEY}. "Your Character cards are played rested." [Activate: Main] only. */
  lim: 'OP09-022',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life. [Activate: Main] only. */
  croc: 'ST03-001',
  /** OP03-021 Kuro: Green, 5000, 5 Life, {East Blue}/{Black Cat Pirates}. [Activate: Main] only. */
  kuro: 'OP03-021',
} as const;

/** Scenery cards of this group. Stats are the printed ones. */
export const S9 = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. Vanilla. */
  c1: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. Vanilla. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. Vanilla. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. Vanilla. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. Vanilla. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. Vanilla. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. Vanilla. */
  c7: 'OP02-020',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0 power, Counter +1000. Inert alone. */
  cobra: 'OP04-012',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000. Vanilla (deck filler). */
  mohji: 'OP02-060',
  /** OP09-006 Howling Gab: Red, cost 5, 7000, Counter +1000, {Red-Haired Pirates}. Vanilla. */
  gab: 'OP09-006',
  /** OP09-016 Rockstar: Red, cost 4, 6000, Counter +1000, {Red-Haired Pirates}. Vanilla. */
  rockstar: 'OP09-016',
  /** P-023 Yasopp: Red, cost 6, 8000, Counter +1000, {FILM}/{Red-Haired Pirates}. Vanilla. */
  yasoppP: 'P-023',
  /** OP09-055 Mr.1(Daz.Bonez): Blue, cost 5, 7000, Counter +1000, {Former Baroque Works}/{Cross Guild}. Vanilla. */
  mr1: 'OP09-055',
  /** OP12-049 Buggy: Blue, cost 6, 7000, Counter +2000, {The Four Emperors}/{Cross Guild}. Vanilla. */
  buggy6: 'OP12-049',
  /** OP12-055 Mohji & Cabaji: Blue, cost 5, 6000, Counter +2000, {Cross Guild}. Vanilla. */
  mohjiCabaji: 'OP12-055',
  /** OP09-038 Rob Lucci: Green, cost 4, 6000, Counter +1000, {CP9}/{ODYSSEY}. Vanilla. */
  lucci: 'OP09-038',
  /** OP03-015 Lim: Red, cost 3, 2000, no Counter, {ODYSSEY}. Its printed [Blocker] has no keyword data: use only as a 2000-power body. */
  limBlocker: 'OP03-015',
  /** OP09-091 Vasco Shot: Black, cost 2, 2000, Counter +1000, [Blocker] (keyword data present). */
  vasco: 'OP09-091',
  /** OP09-007 Heat: Red, cost 3, 4000, Counter +1000, [Blocker] (keyword data); [On Play] only otherwise, inert on the board. */
  heat: 'OP09-007',
  /** OP09-015 Lucky.Roux: Red, cost 4, 5000, Counter +1000, [Blocker] (keyword data); [On K.O.] only otherwise. */
  roux: 'OP09-015',
  /** OP12-106 Trafalgar Law: Yellow, cost 6, 7000, Counter +1000, [Blocker] only (keyword data present). */
  law7: 'OP12-106',
  /** ST01-010 Franky: Red, cost 4, 6000, Counter +1000, {Straw Hat Crew}. Vanilla (not ODYSSEY). */
  frankyR4: 'ST01-010',
  /** OP02-039 Franky: Green, cost 5, 7000, Counter +1000, {FILM}/{Straw Hat Crew}. Vanilla. */
  frankyG5: 'OP02-039',
  /** OP10-029 Dracule Mihawk: Green, cost 5, 6000, {ODYSSEY}. [On Play] with 2+ rested Characters, set up to 1 of my rested {ODYSSEY} Characters (cost 5 or less) active. */
  mihawkOdy: 'OP10-029',
  /** OP05-021 Revolutionary Army HQ: Red Stage, cost 1 (only an [Activate: Main]). */
  stage: 'OP05-021',
} as const;

/** The effect found no candidate: the pending "up to" `choose` (if the engine asks one) has nothing to pick. */
export function settleEmpty(g: TestGame): void {
  if (kind(g) === 'choose' && choices(g).length === 0 && canFinish(g)) act(g, { type: 'done' });
}

/** The pending decision's kind and owner, for failure messages. */
export function pending(g: TestGame): string {
  const d = decision(g);
  return d ? `${d.kind}/${d.player}: ${d.prompt}` : 'none';
}

/** p1 attacks p2's Leader with the Character `card` (nth copy). */
export function swing(g: TestGame, card: CardId, nth = 0): void {
  act(g, {
    type: 'attack',
    attacker: g.find('p1', 'characters', card, nth),
    target: g.leader('p2'),
  });
}

/** Instances of `card` in `who`'s characters, in zone order. */
export function allOf(g: TestGame, who: PlayerId, card: CardId): InstanceId[] {
  return g
    .zone(who, 'characters')
    .filter((c) => c.card === card)
    .map((c) => c.instance);
}
