/**
 * Constants and helpers for the OP-11 group 1 card tests (OP11-001 to OP11-036). Every card named
 * below is a vanilla, a [Blocker]-only card, or an unscripted card whose text is inert where the
 * test puts it.
 */
import type { InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import {
  dec,
  endCounter,
  expectDecision,
  game,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';

export { mk, mk5, RED_LEADER, EB, EVENT } from './helpers-op14g1.ts';
export { activate, offeredAb, canPick, koBy, pickable } from './helpers-w3s.ts';
export { koByEffect, settle, ids } from './helpers-op14g4.ts';
export { canHit, finishBattle, p2Attacks, NAVY_LEADER, NAVY3 } from './helpers-w4sb.ts';
export { counterGame } from './helpers-op14g4.ts';
export { damageWith } from './triggers.ts';

/** {Navy} vanillas by cost: 1 / 3000, 2 / 4000, 5 / 7000, 6 / 8000, 8 / 10000. */
export const NAVY = {
  c1: 'OP02-097',
  c2: 'OP02-107',
  c5: 'ST08-010',
  c6: 'EB02-042',
  c8: 'OP05-044',
} as const;
/** [X.Drake] {Navy}{SWORD}, cost 6 / 7000 (unscripted: no text). */
export const SWORD6 = 'OP11-017';
/** A vanilla with 0 power (Red, cost 1) and a Red 2000-power vanilla (cost 2). */
export const ZERO = 'OP13-014';
export const SN2 = 'OP01-019';
/** {Fish-Man} vanillas: cost 2 / 4000 (Green), cost 3 / 5000 (Red), cost 7 / 9000 (Purple). */
export const FISH = { c2: 'OP02-033', c3: 'OP03-007', c4: 'OP03-033', c7: 'OP09-067' } as const;
/** {Merfolk} vanillas: cost 1 / 3000, cost 3 / 5000, cost 5 / 6000, cost 6 / 7000. */
export const MERFOLK = { c1: 'OP03-101', c3: 'OP03-111', c5: 'OP15-030', c6: 'OP11-111' } as const;
/** {Neptunian} vanilla, cost 6 / 7000; {Fish-Man Island} vanilla, cost 5 / 6000 (not Neptunian). */
export const NEPT6 = 'OP11-033';
export const FMI5 = 'OP11-032';
/** [Megalo] (cost 3, 2000, [Blocker]; its +4000 needs a [Shirahoshi] Leader). */
export const MEGALO = 'OP11-112';
/** [Hody Jones] {Fish-Man} Leader; its Activate is not used. */
export const FISH_LEADER = 'OP06-020';
/** [Shirahoshi] Leader (the script of OP11-022). */
export const SHIRAHOSHI_LEADER = 'OP11-022';
/** Scripted [Blocker]-only Characters: 2000 (cost 2, two cards) and 7000 (cost 6). */
export const BLK2 = 'OP04-077';
export const BLK2B = 'OP16-044';
export const BLK7 = 'EB03-019';

/** Give `target` `n` power (negative lowers) for this turn, as an effect of `controller`. */
export function buff(
  g: TestGame,
  target: InstanceId,
  n: number,
  controller: PlayerId = 'p1',
  turn = 3,
): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: { kind: 'power', target, amount: n, duration: { kind: 'thisTurn', turn }, controller },
  }).state;
}

/** Answer any pending choice by taking the first offered pick (or done), until it is `kind`. */
export function drain(g: TestGame, player: PlayerId = 'p1'): void {
  while (dec(g)?.kind === 'choose' && dec(g)!.player === player) {
    const a = g.legal().find((x) => x.type === 'pick');
    if (a) g.act(a);
    else g.act({ type: 'done' });
  }
}

/**
 * p2 (turn 4) attacks p1's Leader with `attacker` (beside `p2chars`) and p1's Life card `top` is
 * revealed: stops at the [Trigger] decision.
 */
export function trigGame(
  top: string,
  p1: Partial<PlayerSpec> = {},
  p2chars: NonNullable<PlayerSpec['characters']> = [],
  attacker: string = V.c7,
): TestGame {
  const g = game(
    { leader: PLAIN_PURPLE, life: [top, PURPLE], ...p1 },
    { leader: PLAIN_BLUE, characters: [attacker, ...p2chars] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', attacker), target: g.leader('p1') });
  if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false });
  passBlock(g);
  endCounter(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}

/** Power of the nth `card` of `p`'s Characters. */
export const pw = (g: TestGame, p: PlayerId, card: string, nth = 0): number | null =>
  g.power(g.find(p, 'characters', card, nth));

export { dec };
