/**
 * The E15 position (docs/design/explanations.md): game turn 6, you going second with 6 DON!! active.
 * Monkey.D.Luffy (OP13-001), 4 Life, Jewelry Bonney (EB04-002) active; hand Nami, Sanji, Laboon,
 * Bad Manners Kick Course, Usopp. Kaido (OP17-058), 5 Life, 5 cards in hand, Yamato (OP17-074) and
 * Queen (EB04-032) active.
 */
import {
  projectForSearch,
  queries,
  type Action,
  type GameState,
  type SearchView,
} from '@optcg/engine';
import { metaDecks } from '../support.ts';
import { lifeOf, listOf, start } from './scenario.ts';

export const LUFFY = 'OP13-001';
export const KAIDO = 'OP17-058';

export function e15State(): GameState {
  return start({
    seed: 15,
    turn: 6,
    activePlayer: 'p1',
    firstPlayer: 'p2',
    p1: {
      leader: LUFFY,
      characters: ['EB04-002'],
      hand: ['OP14-031', 'OP13-027', 'OP15-035', 'OP04-016', 'OP14-022'],
      life: lifeOf(4, 'OP14-022'),
      costArea: { active: 6, rested: 0 },
      decklist: metaDecks().find((d) => d.leader === LUFFY)!.main,
    },
    p2: {
      leader: KAIDO,
      characters: ['OP17-074', 'EB04-032'],
      hand: ['OP17-062', 'OP17-061', 'OP17-073', 'OP17-062', 'OP17-061'],
      life: lifeOf(5, 'OP17-073'),
      costArea: { active: 4, rested: 6 },
      donDeck: 0,
      decklist: listOf(KAIDO),
    },
  });
}

/** The handle of the card `id` in `zone` of `player`'s view. */
export function handleOf(
  view: SearchView,
  player: 'p1' | 'p2',
  zone: 'hand' | 'characters' | 'leader',
  id: string,
): string {
  const c = view.zones[player][zone].find((x) => x.card === id);
  if (!c) throw new Error(`no ${id} in ${player} ${zone}`);
  return c.handle;
}

/** The E15 line a search double returns: the line in the doc, as view actions. */
export function e15Line(state: GameState): { view: SearchView; line: Action[] } {
  const view = projectForSearch(state, 'p1');
  const leader = handleOf(view, 'p1', 'leader', LUFFY);
  const yamato = handleOf(view, 'p2', 'characters', 'OP17-074');
  const queen = handleOf(view, 'p2', 'characters', 'EB04-032');
  const bonney = handleOf(view, 'p1', 'characters', 'EB04-002');
  const nami = handleOf(view, 'p1', 'hand', 'OP14-031');
  void queries;
  return {
    view,
    line: [
      { type: 'playCard', card: nami, player: 'p1' },
      // Picks come in handle order (the engine offers each set once).
      ...[yamato, queen].sort().map((choice): Action => ({ type: 'pick', choice, player: 'p1' })),
      { type: 'giveDon', target: leader, player: 'p1' },
      { type: 'attack', attacker: leader, target: yamato, player: 'p1' },
      { type: 'attack', attacker: bonney, target: queen, player: 'p1' },
      { type: 'endTurn', player: 'p1' },
    ],
  };
}
