/**
 * Helpers for the ST-block-5 group-A independent card tests (EB04-061, OP01-120, OP02-013,
 * OP03-122, OP04-083, ST30-002 .. ST30-017, ST31-002, ST31-003). Public API, frozen fixtures and
 * the earlier kits only. Every answer helper accepts ONE named kind of prompt and fails on anything
 * else (see kit-op17b.ts).
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { choose, choices, donChoices, kind } from '../kit.ts';
import { need, payHand } from '../op16/kit-op16a.ts';

export * from '../op16/kit-op16a.ts';

/** Leaders used as scenery (none has an effect that fires unless a test makes it). */
export const SL = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}. Vanilla; not a Whitebeard Leader. */
  luffy: 'ST01-001',
  /** OP02-001 Edward.Newgate: Red, 6000, 6 Life, {The Four Emperors}/{Whitebeard Pirates}. */
  newgate: 'OP02-001',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. */
  shanks: 'ST05-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life. [Activate: Main] only. */
  croc: 'ST03-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life. [Activate: Main] only. */
  kid: 'ST02-001',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. */
  yamato: 'ST09-001',
} as const;

/**
 * Play a hand card with raw actions: the cost is paid from active DON!! (only the pending
 * DON!! cost pick is answered, never a target choice), then the game stops at the first other
 * decision (see docs/reviews/m6b-OP-16.md R6).
 */
export function playRaw(g: TestGame, card: InstanceId): void {
  const player: PlayerId = g.decider;
  act(g, { type: 'playCard', card });
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose' || d.player !== player || d.purpose !== 'cost') return;
    const pay = donChoices(g).find((o) => o.from === 'costActive');
    if (!pay || choices(g).length > 0) return;
    act(g, { type: 'pick', choice: pay });
  }
}

/** Play the first copy of `card` in the deciding player's hand, raw (see `playRaw`). */
export function playCardRaw(g: TestGame, card: CardId): void {
  playRaw(g, g.find(g.decider, 'hand', card));
}

/**
 * Pay an exact-N hand cost with these cards when the engine asks (a `choose` with purpose cost).
 * A forced pick (exactly N candidates) may be resolved by the engine itself: then nothing is asked.
 */
export function payHandIfAsked(g: TestGame, cards: CardId[]): void {
  const d = decision(g);
  if (d?.kind === 'choose' && d.purpose === 'cost') payHand(g, cards);
}

/**
 * An opposing K.O. by effect. OP16-008 Squard (Red, cost 5, 7000): "[On Play] You may trash 1 of
 * your Characters with 10000 base power: K.O. up to 1 of your opponent's Characters with 8000 power
 * or less." The acting player needs `squard` in hand and `accino` (EB02-004 Don Accino, cost 8,
 * 10000) on the field, plus 5 active DON!!.
 */
export const KO_SRC = { squard: 'OP16-008', accino: 'EB02-004' } as const;

/** The acting player plays Squard, trashes Accino and K.O.s `target` (8000 power or less). */
export function squardKo(g: TestGame, target: InstanceId): void {
  const who = g.decider;
  playCardRaw(g, KO_SRC.squard);
  need(g, 'optional', who);
  act(g, { type: 'optional', accept: true });
  const d = decision(g);
  if (d?.kind === 'choose' && d.purpose === 'cost') {
    // Only one Character with 10000 base power exists: the engine may still ask.
    choose(g, [g.find(who, 'characters', KO_SRC.accino)]);
  }
  need(g, 'choose', who);
  choose(g, [target]);
}

/**
 * A bounce by effect. OP17-056 Rocks Pirates (Blue Event, cost 0): "[Main] You may rest 5 of your
 * DON!! cards: Return up to 1 Character with a cost of 6 or less to the owner's hand." The acting
 * player needs it in hand and 5 active DON!!. The Character may belong to either player.
 */
export const BOUNCE = 'OP17-056';

/** The acting player plays Rocks Pirates, pays 5 DON!! and returns `target` to its owner's hand. */
export function bounce(g: TestGame, target: InstanceId): void {
  const who = g.decider;
  playCardRaw(g, BOUNCE);
  need(g, 'optional', who);
  act(g, { type: 'optional', accept: true });
  // The DON!! come from one class only, so the engine pays the cost itself; answer if it asks.
  for (let i = 0; i < 5 && decision(g)?.purpose === 'cost'; i++) {
    const pay = donChoices(g).find((o) => o.from === 'costActive');
    if (!pay) throw new Error('no active DON!! to rest');
    act(g, { type: 'pick', choice: pay });
  }
  need(g, 'choose', who);
  choose(g, [target]);
}

/** A decision of kind `k` is pending (never throws). */
export function pending(g: TestGame, k: string): boolean {
  return kind(g) === k;
}

/** Expect the game to be waiting on a plain Main Phase action of `who`. */
export function expectMain(g: TestGame, who: PlayerId = 'p1'): void {
  const d = decision(g);
  expect(d?.kind).toBe('main');
  expect(d?.player).toBe(who);
}
