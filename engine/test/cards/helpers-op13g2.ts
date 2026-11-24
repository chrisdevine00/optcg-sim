/**
 * Helpers and constants for the OP-13 group 2 card tests (OP13-032 to OP13-058). Every constant is a
 * vanilla, or a card whose text is inert where the test puts it (a Leader that only matters on another
 * timing, a Character in a hand or on the opponent's side).
 */
import type { InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { dec, expectDecision, game, PLAIN_BLUE, PURPLE, V } from './helpers.ts';

export { dec, expectDecision, game, PLAIN_BLUE, PURPLE, V };
export { cardsOf, counterStep, COST10, SHC_LEADER, useCounter } from './helpers-luffyace.ts';
export { canPick, koBy, pickable } from './helpers-w3s.ts';
export { plantOpponentEffect } from './helpers-rgl-penel.ts';

/** ST04-001 Kaido: a Purple Leader with no automatic effects. */
const PLAIN_PURPLE_LEADER = 'ST04-001';
/** ST05-001 Shanks Leader: {FILM}; only an [Activate: Main] (inert here). */
export const FILM_LEADER = 'ST05-001';
/** OP02-001 Edward.Newgate Leader: {Whitebeard Pirates}; only an [End of Your Turn]. */
export const WB_LEADER = 'OP02-001';
/** OP14-041 Boa Hancock Leader (Blue/Yellow, multicolored); acts on the opponent's turn only. */
export const HANCOCK = 'OP14-041';
/** OP07-038 Boa Hancock Leader (mono-colored). */
export const HANCOCK_MONO = 'OP07-038';
/** OP13-001 Luffy Leader (Green/Red, multicolored, not [Boa Hancock]). */
export const MULTI_LEADER = 'OP13-001';
/** {Whitebeard Pirates} vanillas: cost 4 / 6000 and cost 5 / 7000. */
export const WB4 = 'OP02-003';
export const WB5 = 'OP02-006';
/** {Fish-Man} {Whitebeard Pirates} vanilla, cost 3 / 5000. */
export const WB3 = 'OP03-007';
/** [LittleOars Jr.]: its type {Whitebeard Pirates Allies} only includes the text. */
export const WB_ALLY = 'OP13-056';
/** [Boa Hancock] Characters: cost 3 (Blocker), cost 4 (Blocker), cost 6 vanilla, cost 7 (hand only). */
export const H3 = 'ST03-013';
export const H4 = 'OP01-078';
export const H6 = 'OP16-112';
export const H7 = 'OP16-032';
/** Cost 8 and cost 10 stand-ins on the opponent's side (no cost 9 vanilla exists). */
export const C8 = 'OP14-101';
export const C9 = 'P-041';

export const mk = (
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame =>
  game(
    { leader: PLAIN_BLUE, costArea: { active: 10, rested: 0 }, ...p1 },
    { leader: PLAIN_PURPLE_LEADER, ...p2 },
    extra,
  );

/** Answer every pending choice of `who` with its first legal pick (or `done`). */
export function settle(g: TestGame, who: PlayerId = 'p1'): void {
  for (let i = 0; i < 20; i++) {
    const d = dec(g);
    if (d?.kind !== 'choose' || d.player !== who) return;
    const pickAct = g.legal().find((a) => a.type === 'pick');
    g.act(pickAct ?? { type: 'done' });
  }
}

export const isRested = (g: TestGame, id: InstanceId): boolean => g.card(id).rested === true;
export const mainOf = (g: TestGame, p: PlayerId = 'p1'): boolean => {
  const d = dec(g);
  return d?.kind === 'main' && d.player === p;
};

/** Position: p2 attacks p1's Leader with a 9000 vanilla and p1's top Life card is `top` (a [Trigger] test). */
export function triggerGame(
  top: string,
  p1: Partial<PlayerSpec> = {},
  p2Chars: NonNullable<PlayerSpec['characters']> = [],
): TestGame {
  const g = game(
    { leader: PLAIN_BLUE, life: [top, PURPLE], ...p1 },
    { leader: PLAIN_PURPLE_LEADER, characters: [V.c7, ...p2Chars] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false });
  g.act({ type: 'block', blocker: null });
  expectDecision(g, 'counter', 'p1');
  g.act({ type: 'endCounter' });
  expectDecision(g, 'trigger', 'p1');
  return g;
}
