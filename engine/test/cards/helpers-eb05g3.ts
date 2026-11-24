/** Helpers for the EB-05 group 3 card tests (kept apart from helpers.ts so parallel groups do not conflict). */
import type { PlayerId } from '@optcg/engine';
import { withAbilities, type Ability } from '../../src/testing.ts';
import type { TestGame } from '../fixtures/index.ts';

/**
 * The active player's Leader (card id `leaderId`, whose own text is replaced in this state) runs a planted
 * [Activate: Main] that gives every opponent Character matching `filter` -N cost this turn. It stands for
 * "an effect that lowers a cost" so a test can reach a cost 0 Character (no printed Character has cost 0).
 */
export function lowerOpponentCost(
  g: TestGame,
  leaderId: string,
  filter: Record<string, unknown> | null = null,
  amount = -10,
): void {
  const player: PlayerId = g.decider;
  g.state = withAbilities(g.state, leaderId, [
    {
      id: 'planted-cost',
      kind: 'activate',
      when: 'activateMain',
      effect: [
        {
          do: {
            cost: {
              target: { from: 'characters', owner: 'opponent', ...(filter ? { filter } : {}) },
              amount,
              duration: 'thisTurn',
            },
          },
        },
      ],
    } as unknown as Ability,
  ]);
  g.act({ type: 'activate', card: g.leader(player), ability: 'planted-cost' });
}
