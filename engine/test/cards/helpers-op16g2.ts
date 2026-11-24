/**
 * Constants and set-ups for the OP-16 group 2 card tests (OP16-031 to OP16-057). Real OP-16 cards are
 * used as scenery only where their own effect cannot fire (placed on the board, never played).
 */
import type { CardId, PlayerSpec } from '@optcg/engine';
import { endCounter, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';
import type { TestGame } from '../fixtures/index.ts';

/** OP16-022 Monkey.D.Luffy Leader (Blue/Green, 5000, {Straw Hat Crew}{Impel Down}); only an [Activate: Main]. */
export const IMPEL_LEADER = 'OP16-022';
/** OP01-031 Kouzuki Oden Leader (Green, {Land of Wano}): not {Impel Down}, only an [Activate: Main]. */
export const GREEN_LEADER = 'OP01-031';
/** ST03-001 Crocodile Leader (Blue): not {Impel Down}. */
export const BLUE_LEADER = PLAIN_BLUE;

export const PRISONER = 'OP16-042';
/** Distinct {Impel Down} Characters whose effects do not fire when placed on the board. */
export const BUGGY_G = 'OP16-031';
export const MR2_G = 'OP16-036';
export const MR3_G = 'OP16-037';
export const IVANKOV = 'OP16-044';
export const IMPEL_FIVE = [BUGGY_G, MR2_G, MR3_G, IVANKOV, PRISONER];
export const LUFFY_034 = 'OP16-034';
/** Opponent vanillas by cost (Purple): c1 3000 ... c7 9000. */
export const OPP = V;

/** p1's turn, Impel Down leader, `hand`, `characters`, plenty of active DON!!. */
export function mine(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game(
    { leader: IMPEL_LEADER, costArea: { active: 10, rested: 0 }, ...p1 },
    { leader: BLUE_LEADER, ...p2 },
    extra,
  );
}

/** Same with a Leader that is not {Impel Down}. */
export function mineOther(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  leader: CardId = GREEN_LEADER,
): TestGame {
  return game(
    { leader, costArea: { active: 10, rested: 0 }, ...p1 },
    { leader: BLUE_LEADER, ...p2 },
  );
}

/**
 * p2's turn: p2's `attacker` (V.c6, 8000) attacks p1's rested `target`; nobody blocks or counters and
 * the target is K.O.'d. Returns with p1's [On K.O.] or replacement (if any) pending.
 */
export function koedInBattle(
  target: CardId,
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(
    {
      leader: IMPEL_LEADER,
      ...p1,
      characters: [{ card: target, rested: true }, ...(p1.characters ?? [])],
    },
    { leader: BLUE_LEADER, ...p2, characters: [V.c6, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c6),
    target: g.find('p1', 'characters', target),
  });
  passBlock(g);
  endCounter(g);
  return g;
}
