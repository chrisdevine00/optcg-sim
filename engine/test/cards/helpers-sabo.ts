/**
 * Helpers for the Sabo and Black Luffy per-card tests (M4b wave 2). A separate file so that
 * helpers.ts is untouched by the parallel archetype agents.
 */
import { expect } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import { applyOp } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { game, PLAIN_BLUE, PLAIN_PURPLE } from './helpers.ts';

/** OP13-004 Sabo Leader (Red/Black, {Revolutionary Army}). */
export const SABO = 'OP13-004';
/** OP17-079 Monkey.D.Luffy Leader (Black, {Elbaph}): the only Elbaph Leader. */
export const ELBAPH_LEADER = 'OP17-079';
/** OP17-089 Jaguar.D.Saul: cost 4, +12 on the field = 16. The "Character with a cost of 12 or more". */
export const GIANT = 'OP17-089';
/** OP17-094 Rodo: an {Elbaph} Character (cost 1, 2000 power, Counter +2000). */
export const ELBAPH = 'OP17-094';
/** OP17-093 Monkey.D.Luffy: cost 8, 8000 power, no effect that matters on the board. */
export const COST8 = 'OP17-093';

/** Lower a Character's cost this turn, as a card effect would. */
export function setCostMod(
  g: TestGame,
  target: InstanceId,
  amount: number,
  by: PlayerId,
  turn = 3,
): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: {
      kind: 'cost',
      target,
      amount,
      duration: { kind: 'thisTurn', turn },
      controller: by,
    },
  }).state;
}

/** Negate the effects of a card for this turn (CR 8-2). */
export function negate(g: TestGame, target: InstanceId, by: PlayerId, turn = 3): void {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: { kind: 'negate', target, duration: { kind: 'thisTurn', turn }, controller: by },
  }).state;
}

export const cardsIn = (
  g: TestGame,
  p: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): CardId[] => g.zone(p, zone).map((c) => c.card);

/** P-041 Monkey.D.Luffy: vanilla, cost 10 (a big Character that is not big enough). */
export const COST10 = 'P-041';

/**
 * The permanent shared by the OP17 Elbaph cards: "If there is a Character with a cost of 12 or
 * more, this Character gains <what>". `read` reads the value that the effect changes.
 */
export function expectBigCondition(
  card: CardId,
  read: (g: TestGame, id: InstanceId) => unknown,
  off: unknown,
  on: unknown,
): void {
  const mk = (p1: CardId[], p2: CardId[]) =>
    game(
      { leader: PLAIN_PURPLE, characters: [card, ...p1] },
      { leader: PLAIN_BLUE, characters: p2 },
    );
  const val = (g: TestGame) => read(g, g.find('p1', 'characters', card));
  expect(val(mk([], [])), 'no big Character').toEqual(off);
  expect(val(mk([COST10], [])), 'cost 10 is not 12').toEqual(off);
  expect(val(mk([GIANT], [])), 'your own cost 16 Character').toEqual(on);
  expect(val(mk([], [GIANT])), "the opponent's cost 16 Character counts: any Character").toEqual(
    on,
  );
}
