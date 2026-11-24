/**
 * Helpers and constants for the OP-16 group 4 card tests (OP16-092 to OP16-118). Every constant
 * below is a vanilla, or a card whose text is inert where the test puts it (trash, hand, a target).
 */
import type { InstanceId, PlayerSpec } from '@optcg/engine';
import { type TestGame } from '../fixtures/index.ts';
import { dec, endCounter, game, passBlock, PLAIN_BLUE, PURPLE, V } from './helpers.ts';

/** OP16-080 Marshall.D.Teach Leader ({Blackbeard Pirates}); its effects only matter on the opponent's attack. */
export const BB_LEADER = 'OP16-080';
/** OP16-079 Yamato Leader ({Land of Wano}). */
export const YAMATO_LEADER = 'OP16-079';
/** Not {Blackbeard Pirates}. */
export const OTHER_LEADER = PLAIN_BLUE;

/** Black {Land of Wano} vanilla Character, cost 8, 9000. */
export const WANO_BLACK = 'OP16-086';
/** Green {Land of Wano} vanilla, cost 1; and Yellow {Land of Wano}, cost 2. */
export const WANO_GREEN_1 = 'OP01-036';
export const WANO_YELLOW_2 = 'ST09-006';
/** Black vanilla, cost 6, 8000, {Former Roger Pirates} (not Wano; Counter 1000). */
export const BLACK_8000 = 'EB01-041';
/** Black vanilla, cost 8, 10000. */
export const COST8 = 'OP12-082';
/** Yellow vanilla [Yamato], cost 5, {Land of Wano}. */
export const YAMATO_5 = 'ST09-013';
/** Black [Yamato], cost 8 (an [On K.O.] only). */
export const YAMATO_8 = 'OP16-096';
/** Black [Yamato], cost 6 (OP16-098) and cost 8 (OP16-097). */
export const YAMATO_6 = 'OP16-098';
/** Black {Blackbeard Pirates} vanillas: cost 4 and cost 5. */
export const BB_4 = 'OP09-082';
export const BB_5 = 'OP10-084';
/** {Blackbeard Pirates} Character, cost 10 (Blocker; Activate text inert in the trash). */
export const BB_10 = 'OP09-093';
/** [Fullalead] Stage (cost 1). */
export const FULLALEAD = 'OP09-099';
/** [Marshall.D.Teach] Character, cost 3, black (Activate: Main only). */
export const TEACH = 'OP09-092';
/** [Absalom] c3, [Dr. Hogback] c4 ([On K.O.] only) and [Perona] c1 (a replacement) for OP16-105. */
export const ABSALOM = 'OP14-100';
export const HOGBACK = 'OP14-110';
export const PERONA = 'OP15-090';
/** [Perona] with cost 5 (green; [On Play] text is inert in the trash). */
export const PERONA_5 = 'OP14-033';
/** An Event with a [Trigger] line. */
export const TRIG_EVENT = 'EB01-020';
/** A Red vanilla Character with 3000 power, cost 1. */
export const RED_1 = 'EB01-005';
/** Whitebeard Pirates vanilla (cost 4, 6000) and [Monkey.D.Luffy] (cost 4). */
export const WB_4 = 'OP02-003';
export const LUFFY_C = 'P-022';

export const names = (g: TestGame, p: 'p1' | 'p2', zone: Parameters<TestGame['zone']>[1]) =>
  g.zone(p, zone).map((c) => c.card);

/** Decline any "optional" decision that is pending (a Leader effect that is not under test). */
export function skipOptional(g: TestGame): void {
  if (dec(g)?.kind === 'optional') g.act({ type: 'optional', accept: false });
}

/**
 * p2 (active, turn 4) attacks p1's rested Character `card` with a 9000-power Character and wins the
 * battle: p1's Character is K.O.'d. Stops at the first decision the K.O. causes (or the end of the battle).
 */
export function koByBattle(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  card: string,
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(
    { ...p1, characters: [{ card, rested: true }, ...(p1.characters ?? [])] },
    { leader: PLAIN_BLUE, ...p2, characters: [V.c7, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c7),
    target: g.find('p1', 'characters', card),
  });
  skipOptional(g);
  if (dec(g)?.kind === 'block') passBlock(g);
  if (dec(g)?.kind === 'counter') endCounter(g);
  return g;
}

/** True when `id` is a legal pick right now. */
export const canPick = (g: TestGame, id: InstanceId): boolean =>
  g.legal().some((a) => a.type === 'pick' && a.choice === id);

/**
 * p2 attacks p1 Leader with a 9000 Character (plus p2chars beside it); the top Life card of p1 is
 * `top` and p1 owes the [Trigger] decision. Like triggers.ts damageWith, with p2 Characters open.
 */
export function trig(
  top: string,
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2chars: string[] = [],
): TestGame {
  const g = game(
    { life: [top, PURPLE], ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c7, ...p2chars] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  skipOptional(g);
  passBlock(g);
  endCounter(g);
  return g;
}
