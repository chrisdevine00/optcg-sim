/**
 * Helpers for the leftovers group B independent card tests (ST22-001..017 subset, ST23-001..005).
 * Public API, frozen fixtures and the earlier kits only. Every answer helper accepts ONE named kind
 * of prompt and fails on anything else, so a missing or extra "up to" / "you may" prompt is caught.
 * Cards are played with raw actions (`playRaw`), never with a helper that could answer a target
 * choice.
 */
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { kind, canFinish, choices } from '../kit.ts';
import { need } from '../op17/kit-op17b.ts';

export * from '../op16/kit-op16b.ts';

/** Leaders used as scenery. */
export const LB = {
  /** OP02-001 Edward.Newgate: Red, 6000, {The Four Emperors}/{Whitebeard Pirates}. Only an [End of Your Turn]. */
  wbp: 'OP02-001',
  /** ST05-001 Shanks: Purple, 5000, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. */
  rhp: 'ST05-001',
  /** P-011 Uta: Red, 5000, {Special}. [Activate: Main] only. Named [Uta], no Red-Haired Pirates type. */
  uta: 'P-011',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, {Straw Hat Crew}. Vanilla. No relevant type. */
  luffy: 'ST01-001',
  /** ST09-001 Yamato: Yellow, 5000, {Land of Wano}. No relevant type. */
  neutral: 'ST09-001',
  /** ST22-001 Ace & Newgate: Blue, 5000, {The Four Emperors}/{Whitebeard Pirates}. [Activate: Main] only. */
  aceNewgate: 'ST22-001',
} as const;

/** Scenery Characters. Stats are repeated where a test relies on them. */
export const SL = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. Vanilla, no WBP. */
  miss: 'OP02-060',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000, {Happosui Army}. Vanilla. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. Vanilla. Type includes "Whitebeard Pirates". */
  former3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. Vanilla. */
  c4: 'OP01-018',
  /** OP02-003 Atmos: Red, cost 4, 6000, Counter +1000, {Whitebeard Pirates}. Vanilla. */
  wb4: 'OP02-003',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, {Whitebeard Pirates}. Vanilla. */
  wb5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. Vanilla. */
  wb6: 'OP02-007',
  /** OP16-016 Ramba: Red, cost 6, 8000, Counter +1000, "Whitebeard Pirates Allies". Vanilla. */
  allies6: 'OP16-016',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000, {Giant}/"Whitebeard Pirates Allies". Vanilla. */
  allies7: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000, {FILM}/{Golden Lion Pirates}. Vanilla. */
  big8: 'OP12-005',
  /** OP17-118 Rocks.D.Xebec: Blue, cost 10, 12000. Text only matters in hand/play: never played here. */
  xebec: 'OP17-118',
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000, no Counter. [On Play] only: never played here. */
  c9: 'OP01-070',
  /** OP09-016 Rockstar: Red, cost 4, 6000, Counter +1000, {Red-Haired Pirates}. Vanilla. */
  rhp4: 'OP09-016',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. Vanilla. */
  c1: 'OP01-010',
  /** OP01-070 etc. unused. */
} as const;

/** Play `card` from p1's hand with a raw action; the effect's first decision (if any) is left pending. */
export function playRaw(g: TestGame, card: CardId, who: PlayerId = 'p1'): InstanceId {
  const i = g.find(who, 'hand', card);
  playInst(g, i, who);
  return i;
}

/** Play the hand card `i` with a raw action, paying with active DON!!. */
export function playInst(g: TestGame, i: InstanceId, who: PlayerId = 'p1'): void {
  act(g, { type: 'playCard', card: i });
  // Pay the cost: the engine picks active DON!! on its own or asks; accept only costActive picks.
  for (let n = 0; n < 12; n++) {
    const d = decision(g);
    if (d?.kind !== 'choose' || d.player !== who || d.purpose !== 'cost') break;
    const pay = g
      .legal()
      .find(
        (a) =>
          a.type === 'pick' &&
          typeof a.choice === 'object' &&
          'from' in a.choice &&
          a.choice.from === 'costActive',
      );
    if (!pay) break;
    g.act(pay);
  }
}

/** The pending decision's kind, for assertions. */
export function pend(g: TestGame): string | null {
  return kind(g);
}

/** Give `choose` a "done" if it allows it and nothing is offered (an empty "up to" prompt). */
export function passEmpty(g: TestGame): void {
  need(g, 'choose');
  if (choices(g).length) throw new Error('Expected an empty pick');
  if (!canFinish(g)) throw new Error('empty pick without done');
  act(g, { type: 'done' });
}

/** p2 removal scenery. OP10-019 Divine Departure (Red Event, cost 1): [Main] may rest 5 DON!!: K.O. up to 1 opposing Character with 8000 power or less. */
export const KO8 = 'OP10-019';
/** OP14-048 Shiryu (Blue Character, cost 8): [On Play] return up to 1 of the opponent's Characters to its owner's hand, then trash all cards from your own hand. */
export const BOUNCE = 'OP14-048';

/** Take the first offered pick whose DON!! class is `from`. */
function payDonOnce(g: TestGame, from: 'costActive' | 'costRested'): boolean {
  const pick = g
    .legal()
    .find(
      (a) =>
        a.type === 'pick' &&
        typeof a.choice === 'object' &&
        'from' in a.choice &&
        a.choice.from === from,
    );
  if (!pick) return false;
  g.act(pick);
  return true;
}

/** p2 plays `card`, answers "may" questions with yes and pays DON!! costs, then picks `target`. */
export function oppRemove(g: TestGame, card: CardId, target: InstanceId): void {
  playRaw(g, card, 'p2');
  for (let i = 0; i < 12; i++) {
    const d = decision(g);
    if (d?.kind === 'optional' && d.player === 'p2') act(g, { type: 'optional', accept: true });
    else if (
      d?.kind === 'choose' &&
      d.purpose === 'cost' &&
      (payDonOnce(g, 'costActive') || payDonOnce(g, 'costRested'))
    )
      continue;
    else break;
  }
  need(g, 'choose', 'p2');
  g.act({ type: 'pick', choice: target });
  if (decision(g)?.kind === 'choose' && decision(g)?.player === 'p2' && canFinish(g)) {
    act(g, { type: 'done' });
  }
}

/** p2 (turn player) plays Divine Departure and K.O.s `target`. Stops at the first decision the K.O. causes. */
export function oppKo(g: TestGame, target: InstanceId): void {
  oppRemove(g, KO8, target);
}

/** p2 plays Shiryu and returns `target` to its owner's hand. */
export function oppBounce(g: TestGame, target: InstanceId): void {
  oppRemove(g, BOUNCE, target);
}
