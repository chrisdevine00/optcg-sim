/**
 * Helpers and fixtures for the wave 3 scripted cards (OP15-002, -003, -010, -012, -017, -023, -026,
 * -028, -059; OP16-024, -041, -074, -100; ST32-003). Every constant is a vanilla, or a card whose text
 * is inert where the test puts it (a hand, a trash, a target).
 */
import type { InstanceId, PlayerId } from '@optcg/engine';
import { applyOp, withAbilities, type Ability } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { dec } from './helpers.ts';

/** OP03-021 Kuro Leader: {East Blue}, <Slash>; only an [Activate: Main] (inert here). */
export const EAST_BLUE_SLASH_LEADER = 'OP03-021';
/** EB01-021 Hannyabal Leader: {Impel Down}; only an [End of Your Turn] (inert here). */
export const IMPEL_LEADER = 'EB01-021';
/** ST09-001 Yamato Leader: its text only matters on the opponent's turn at 2 or less Life. */
export const YAMATO_LEADER = 'ST09-001';
/** Events with a base cost of 2, 3 and 4 (their text is not scripted: `inertEvents` gives them a plain [Main]). */
export const EVENT_2 = 'ST02-017';
export const EVENT_3 = 'ST08-015';
export const EVENT_4 = 'ST01-015';
/** A Stage (cost 1) for a hand. */
export const STAGE = 'OP04-096';
/** {East Blue} vanilla (cost 1, 3000) and a non-{East Blue} one. */
export const EAST_BLUE_1 = 'OP03-023';
/** Impel Down vanillas: cost 4 / 6000 <Strike>, and cost 5 / 7000. */
export const IMPEL_4 = 'OP02-088';
export const IMPEL_5 = 'OP02-053';
/** [Prisoner of Impel Down], cost 6, {Impel Down}. */
export const PRISONER = 'OP16-042';
/** <Slash> vanillas: cost 2 (Patty & Carne), cost 5 (Hyouzou), cost 6 (Dracule Mihawk OP02-055). */
export const SLASH_2 = 'ST12-015';
export const SLASH_5 = 'OP15-030';
export const SLASH_6 = 'OP02-055';
/** A cost 3 <Strike> vanilla (not <Slash>, not [Perona]); and [Perona] (cost 4, <Special>). */
export const STRIKE_3 = 'ST09-011';
export const PERONA = 'ST12-005';

/** Is `ability` of `card` among the legal actions? */
export const offeredAb = (g: TestGame, card: InstanceId, ability: string): boolean =>
  g.legal().some((a) => a.type === 'activate' && a.card === card && a.ability === ability);

export const activate = (g: TestGame, card: InstanceId, ability: string): void => {
  g.act({ type: 'activate', card, ability });
};

/** The instance ids that can be picked right now. */
export const pickable = (g: TestGame): InstanceId[] =>
  g.legal().flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));

/** True when `id` can be picked right now. */
export const canPick = (g: TestGame, id: InstanceId): boolean => pickable(g).includes(id);

/** K.O. `card` of `who` now, as an effect of `by`. */
export function koBy(g: TestGame, who: PlayerId, card: string, by: PlayerId, nth = 0): void {
  g.state = applyOp(g.state, { op: 'ko', card: g.find(who, 'characters', card, nth), by }).state;
}

/** Give `card` a planted [Activate: Main] `k` that K.O.s one of the opponent's Characters. */
export function plantKo(g: TestGame, card: string): void {
  g.state = withAbilities(g.state, card, [
    {
      id: 'k',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } } }],
    } as Ability,
  ]);
}

/** The ids of the options of the pending decision, in order. */
export const optionIds = (g: TestGame): string[] => (dec(g)?.options ?? []).map((o) => o.id);

/** Answer every pending `order` decision in canonical order. */
export function orderAll(g: TestGame): void {
  while (dec(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
}

/** Give each of these (unscripted) Events that is in the game a [Main] that does nothing, so it can be played. */
export function inertEvents(g: TestGame, ...cards: string[]): void {
  const inGame = new Set(
    (['p1', 'p2'] as const).flatMap((p) =>
      (['hand', 'trash', 'deck'] as const).flatMap((z) => g.zone(p, z).map((c) => c.card)),
    ),
  );
  for (const card of cards.filter((c) => inGame.has(c)))
    g.state = withAbilities(g.state, card, [
      { id: 'm', kind: 'activate', when: 'main', effect: [{ do: { draw: 0 } }] } as Ability,
    ]);
}
