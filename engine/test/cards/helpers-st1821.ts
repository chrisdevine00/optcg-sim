/**
 * Constants and helpers for the ST-18 to ST-21 card tests. Every card named below is a vanilla, a
 * keyword-only card, or a card whose own text is inert in these positions (a hand card has no
 * effect, a scripted card is only ever placed on the field or hand).
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { applyOp } from '../../src/testing.ts';
import { dec, expectDecision, game, passBlock, endCounter, PLAIN_BLUE } from './helpers.ts';

/** ST01-001 Monkey.D.Luffy: Red Leader, {Straw Hat Crew}; only a [DON!! x1] [When Attacking] power. */
export const SHC_LEADER = 'ST01-001';
/** ST06-001 Sakazuki: Black Leader, {Navy}; [Activate: Main] only. */
export const NAVY_LEADER = 'ST06-001';
/** OP02-093 Smoker: Black Leader named [Smoker], {Navy}; its text is unscripted. */
export const SMOKER_LEADER = 'OP02-093';
/** ST21-001 Monkey.D.Luffy: the script under test in ST21-001. */
export const ST21_LEADER = 'ST21-001';
export { PLAIN_BLUE };

/** Purple {Straw Hat Crew}: vanilla cost 4 / 6000, vanilla cost 6 / 8000, ST18-003 (cost 5), a purple Event. */
export const PSHC4 = 'OP09-063';
export const PSHC6 = 'OP05-065';
export const PSHC5 = 'ST18-003';
export const PSHC_EVENT = 'OP09-079';
/** Red {Straw Hat Crew} vanilla Characters: cost 5 / 6000 power ... (OP11-003 Usopp, 6000, counter 2000). */
export const RSHC_5 = 'OP11-003';
/** Red {Straw Hat Crew}: 4000 base (ST21-005 Jinbe) and 5000 base (ST01-008 Nico Robin). */
export const SHC_4000 = 'ST21-005';
export const SHC_5000 = 'ST01-008';
/** Black {Navy} vanilla Characters: cost 1 / 3000, cost 2 / 4000, cost 6 / 8000. */
export const BN1 = 'OP02-097';
export const BN2 = 'OP02-107';
export const BN6 = 'EB02-042';
/** A black {Navy} Event (cost 1) with no script. */
export const BN_EVENT = 'OP02-117';
/** A red {Navy} vanilla (cost 5): the {Navy} type without black. */
export const RN5 = 'OP15-016';
/** A black vanilla without the {Navy} type, and a Purple vanilla. */
export const BLACK_NONNAVY = 'ST08-011';
/** Red vanillas: 6000 (OP07-007, cost 4), 7000 (OP10-013 is {Straw Hat Crew}, cost 5), a red Event. */
export const RED6000 = 'OP07-007';
export const RED7000 = 'OP10-013';
/** Red [Roronoa Zoro] Characters other than ST21-015 (unscripted ST01-013), the name must not matter by id. */
export const ZORO_OTHER = 'ST01-013';
/** {Big Mom Pirates} vanillas: cost 2 / 4000, cost 3 / 5000, cost 4 / 6000. */
export const BMP2 = 'ST07-006';
export const BMP3 = 'ST07-014';
export const BMP4 = 'ST07-012';
/** Yellow Blockers (keyword only): 4000 and 5000 power. */
export const BLOCK4000 = 'OP09-100';
export const BLOCK5000 = 'OP09-109';
/** [On Play] "K.O. up to 1 of your opponent's Characters with a cost of 4 or less" Event (yellow, cost 2). */
export const KO_EVENT = 'OP15-115';

const TEN = { active: 10, rested: 0 };

/** p1's turn 3 with ten active DON!! and the Red {Straw Hat Crew} Leader unless given. */
export function mk(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game({ leader: SHC_LEADER, costArea: TEN, ...p1 }, { leader: PLAIN_BLUE, ...p2 }, extra);
}

/** p2's turn (turn 4), the position every "[Opponent's Turn]" test uses. */
export const oppTurn = { turn: 4, activePlayer: 'p2' } as const;

export const canActivate = (g: TestGame, card: InstanceId, ability: string): boolean =>
  g.legal().some((a) => a.type === 'activate' && a.card === card && a.ability === ability);
export const activateAb = (g: TestGame, card: InstanceId, ability: string): void => {
  g.act({ type: 'activate', card, ability });
};
export const isRested = (g: TestGame, id: InstanceId): boolean => g.card(id).rested === true;

/** Card instances a pending `choose` offers (single picks). */
export const offered = (g: TestGame): InstanceId[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

/** p1 attacks p2's Leader with `attacker`. Stops at the first decision. */
export function attack(g: TestGame, attacker: InstanceId): void {
  g.act({ type: 'attack', attacker, target: g.leader('p2') });
}

/** Pass the block and counter steps if they are open, and decline any [Trigger]. */
export function finishBattle(g: TestGame): void {
  if (dec(g)?.kind === 'block') passBlock(g);
  if (dec(g)?.kind === 'counter') endCounter(g);
  while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
}

/** Give `target` `n` power for turn `turn` (a stand-in for an effect that did it). */
export function boost(g: TestGame, target: InstanceId, n: number, turn = 3): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'power',
      target,
      amount: n,
      duration: { kind: 'thisTurn', turn },
      controller: 'p1',
    },
  }).state;
}

/** Lower `target`'s cost by `n` for turn `turn` (a stand-in for an effect that did it). */
export function cheapen(g: TestGame, target: InstanceId, n: number, turn = 3): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'cost',
      target,
      amount: -n,
      duration: { kind: 'thisTurn', turn },
      controller: 'p1',
    },
  }).state;
}

export { expectDecision };
