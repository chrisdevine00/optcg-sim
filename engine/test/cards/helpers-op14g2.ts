/**
 * Helpers and constants for the OP-14 group 2 card tests (OP14-035 to OP14-061). Every constant is a
 * vanilla (or a card whose text is inert where the test puts it), so a test never depends on
 * another script.
 */
import type { InstanceId, PlayerId } from '@optcg/engine';
import { withAbilities, type Ability } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { dec, game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

export { dec, game, PLAIN_BLUE, PLAIN_PURPLE, V };
export { canAccept, canActivate, canAttack, offers } from './helpers-op16g1.ts';
export { activate, canPick, pickable } from './helpers-w3s.ts';

/** OP06-020 Hody Jones Leader ({Fish-Man}); only an [Activate: Main] (inert here). */
export const FM_LEADER = 'OP06-020';
/** OP14-020 Dracule Mihawk Leader; only an [Activate: Main] and a passive that needs a <Slash> Leader. */
export const MIHAWK = 'OP14-020';
/** OP11-021 Jinbe Leader ({Fish-Man}); only an [End of Your Turn] (inert unless the turn ends). */
export const JINBE_LEADER = 'OP11-021';
/** OP02-060-style Blue Leader that is none of the above. */
export const OTHER_LEADER = PLAIN_BLUE;
/** OP05-022 Rosinante Leader ({Donquixote Pirates}); a [Blocker] only. */
export const DQ_LEADER = 'OP05-022';

/** {Fish-Man} vanillas: cost 3 / 5000 (also {Whitebeard Pirates}), cost 4 / 6000, cost 5 / 6000. */
export const FM3 = 'OP03-007';
export const FM4 = 'OP07-027';
export const FM5 = 'OP12-023';
/** {Merfolk} vanillas: cost 1 / 3000, cost 3 / 5000, cost 5 / 7000. */
export const MER1 = 'OP03-101';
export const MER3 = 'OP03-111';
export const MER5 = 'OP11-113';
/** {Whitebeard Pirates} vanillas: cost 4 / 6000 and cost 5 / 7000 (no {Fish-Man}). */
export const WB4 = 'OP02-003';
export const WB5 = 'OP02-006';
/** {Impel Down} vanillas: cost 4 / 6000, cost 6 / 8000, cost 7 is OP17-051 (not vanilla-free: unused). */
export const ID4 = 'OP02-088';
export const ID6 = 'OP11-064';
/** {Donquixote Pirates} vanillas: cost 3 / 5000 and cost 4 / 6000. */
export const DQ3 = 'OP05-035';
export const DQ4 = 'OP10-073';
/** OP16-023 Arlong: {Fish-Man} cost 1, 3000. */
export const FM1 = 'OP16-023';

export const fill = (n: number, card: string): string[] => Array.from({ length: n }, () => card);

/** Plant an [Activate: Main] `k` with these steps on every copy of `card`, then run it from `who`. */
export function plantAndRun(
  g: TestGame,
  card: string,
  who: PlayerId,
  effect: unknown[],
  cost?: unknown[],
): void {
  g.state = withAbilities(g.state, card, [
    {
      id: 'k',
      kind: 'activate',
      when: 'activateMain',
      effect,
      ...(cost ? { cost } : {}),
    } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: g.find(who, 'characters', card), ability: 'k' });
}

/** Plant "trash 1 card from your hand" on a vanilla Character of p1 and run it (an effect trash). */
export function effectTrash(g: TestGame, carrier: string, n = 1): void {
  plantAndRun(g, carrier, 'p1', [
    { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: n } } } },
  ]);
}

/** Is the instance a rested card? */
export const isRested = (g: TestGame, id: InstanceId): boolean => g.card(id).rested === true;

/** The card names in a zone. */
export const names = (g: TestGame, p: PlayerId, zone: Parameters<TestGame['zone']>[1]): string[] =>
  g.zone(p, zone).map((c) => c.card);

export const mainOf = (g: TestGame) => dec(g)?.kind === 'main';

export const mine = (
  leader: string,
  p1: Record<string, unknown> = {},
  p2: Record<string, unknown> = {},
  extra: Record<string, unknown> = {},
): TestGame =>
  game(
    { leader, costArea: { active: 8, rested: 0 }, ...p1 } as never,
    { leader: PLAIN_BLUE, ...p2 } as never,
    extra as never,
  );

/** A cost-trash: "trash 1 card from your hand: draw 0" planted on `carrier` and run (a cost, not an effect). */
export function costTrash(g: TestGame, carrier: string): void {
  plantAndRun(
    g,
    carrier,
    'p1',
    [{ do: { draw: 0 } }],
    [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
  );
}
