/**
 * OP16-R3: a hand card placed at the deck bottom "in any order" now asks the owner for the order.
 * The AI (Rookie, Pirate, Warlord) is the owner here: it picks the two cards, then answers the
 * `order` decision, with no fallback and no error.
 */
import { describe, expect, it } from 'vitest';
import { queries, reduce, type GameState } from '@optcg/engine';
import { listOf, play, session, start, type Tier } from './support/scenario.ts';

const IMPEL = 'OP16-022';
const DOFFY = 'OP16-047';
const KAIDO = 'OP17-058';

function position(): GameState {
  const hand = listOf(KAIDO).slice(0, 8);
  return start({
    seed: 5,
    turn: 5,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: { leader: IMPEL, characters: [DOFFY], costArea: { active: 3, rested: 0 } },
    p2: { leader: KAIDO, hand, decklist: listOf(KAIDO) },
  });
}

describe('the AI answers the hand-to-deck-bottom order decision', () => {
  for (const tier of ['rookie', 'pirate', 'warlord'] as Tier[]) {
    it(`${tier}`, () => {
      const s0 = position();
      const doffy = queries.zone(s0, 'p1', 'characters').find((c) => c.card === DOFFY)!;
      const s1 = reduce(s0, {
        type: 'activate',
        card: doffy.instance,
        ability: 'activate',
        player: 'p1',
      } as never).state;
      expect(queries.decision(s1)).toMatchObject({ kind: 'choose', player: 'p2' });
      const fallbacks: unknown[] = [];
      const ai = session('p2', s1, tier, true, { onFallback: (e: unknown) => fallbacks.push(e) });
      const deckBefore = queries.zone(s1, 'p2', 'deck').length;
      const { steps, state } = play(s1, 'p2', {
        ai,
        stop: (s) => queries.decision(s)?.player === 'p1',
      });
      expect(fallbacks).toEqual([]);
      expect(steps.some((x) => x.player === 'p2' && x.action.type === 'order')).toBe(true);
      expect(queries.zone(state, 'p2', 'hand')).toHaveLength(6);
      expect(queries.zone(state, 'p2', 'deck')).toHaveLength(deckBefore + 2);
    });
  }
});
