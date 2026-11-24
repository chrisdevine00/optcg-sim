/**
 * Constants for the OP-17 group 2 card tests. Every Character below is a vanilla (no effect text); the
 * Leaders' effects are inert in these positions (an [Activate: Main] or an attack trigger these tests
 * never reach).
 */
import type { CardId, PlayerSpec } from '@optcg/engine';
import { endCounter, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';

/** ST05-001 Shanks Leader (Purple, 5000, {Red-Haired Pirates}, named [Shanks]): [Activate: Main] only. */
export const SHANKS_LEADER = 'ST05-001';
/** Red, cost 4, 6000, {Red-Haired Pirates} (OP09-016 Rockstar, a vanilla). */
export const RHP_4 = 'OP09-016';
/** Red, cost 5, 7000, {Red-Haired Pirates} (OP09-006 Howling Gab, a vanilla). */
export const RHP_5 = 'OP09-006';
/** Red, cost 8, 10000, named [Shanks], {The Four Emperors}{Red-Haired Pirates} (P-016, a vanilla). */
export const SHANKS_CHAR = 'P-016';
/** Purple vanilla with cost 10 (12000). */
export const COST10 = 'P-041';
/** Blue Leader that is not {Red-Haired Pirates}. */
export const OTHER_LEADER = PLAIN_BLUE;
/** Opponent vanillas by cost (Purple): c1 3000 ... c7 9000. */
export const OPP = V;

/** p1's turn, p2 has these Characters (a `rested` flag per entry). */
export function mainGame(
  p1: Parameters<typeof game>[0],
  oppChars: (CardId | { card: CardId; rested?: boolean })[] = [],
): TestGame {
  return game(p1, { leader: PLAIN_BLUE, characters: oppChars });
}

/**
 * p2's turn: p2's `attacker` (V.c6, 8000) attacks p1's rested `target`, nobody blocks or counters, and
 * the target is K.O.'d. Returns with p1's [On K.O.] pending (if it has one).
 */
export function koedInBattle(
  target: CardId,
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
  attacker: CardId = V.c6,
): TestGame {
  const g = game(
    { ...p1, characters: [{ card: target, rested: true }, ...(p1.characters ?? [])] },
    { leader: PLAIN_BLUE, ...p2, characters: [attacker, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', attacker),
    target: g.find('p1', 'characters', target),
  });
  passBlock(g);
  endCounter(g);
  return g;
}
