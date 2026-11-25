/**
 * Helpers and constants for the wave 6 group 1 card tests (EB02-022, EB02-039, EB03-001, -003, -007,
 * -009, -039, OP09-008, -018, -022, OP10-026). Every constant is a vanilla, or a card whose text is
 * made inert where the test puts it (`inert`).
 */
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import { applyOp, withAbilities } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';
import { dec, game, PLAIN_BLUE, PLAIN_PURPLE } from './helpers.ts';

export { canPick, pickable, offeredAb, activate, koBy } from './helpers-w3s.ts';

/** OP06-001 [Uta] Leader (purple/red): its [When Attacking] never comes up in these tests. */
export const UTA_LEADER = 'OP06-001';
/** ST04-001 Kaido: a {Animal Kingdom Pirates} Leader; PLAIN_PURPLE is the same card. */
export const AKP_LEADER = PLAIN_PURPLE;
/** A Leader that is neither [Uta] nor {Animal Kingdom Pirates}. */
export const OTHER_LEADER = PLAIN_BLUE;
/** {Animal Kingdom Pirates} vanillas with no text: 4000, 5000, 6000, 7000 power. */
export const AK = { p4: 'OP02-080', p5: 'OP02-077', p6: 'OP01-103', p7: 'OP01-107' } as const;
/** Characters with a printed effect: [On Play] (1000), [Blocker] only (2000), [When Attacking] (3000), [Rush] (3000). */
export const WITH_ON_PLAY = 'EB01-015';
export const KEYWORD_ONLY = 'EB01-017';
export const WITH_WHEN_ATTACKING = 'EB01-004';
export const RUSH_ONLY = 'OP01-025';
/** A Character with a [Trigger] and no other text (5000 power would not matter: it is 4000). */
export const TRIGGER_ONLY = 'OP01-009';

/** Make the scripts of these cards inert: scenery whose effects must not run when played. */
export function inert(g: TestGame, ...cards: CardId[]): void {
  for (const c of cards) {
    try {
      g.state = withAbilities(g.state, c, []);
    } catch {
      // not in this game: nothing to make inert
    }
  }
}

/** The card ids that can be picked right now. */
export const pickableCards = (g: TestGame): CardId[] =>
  g
    .legal()
    .flatMap((a) =>
      a.type === 'pick' && typeof a.choice === 'string'
        ? [g.card(a.choice as InstanceId).card]
        : [],
    );

/** Whether the accept answer of the open optional decision is legal (its cost can be paid). */
export const canAccept = (g: TestGame): boolean =>
  g.legal().some((a) => a.type === 'optional' && a.accept);

/** Is there a pending `choose` decision of `who`? (raw: no helper answers it) */
export const asks = (g: TestGame, who: PlayerId = 'p1'): boolean => {
  const d = dec(g);
  return d?.kind === 'choose' && d.player === who;
};

/** +n power for this turn on `target` (a stand-in for an effect that did it). */
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

export const TEN = { active: 10, rested: 0 };
export { game };
