/**
 * Rebuilding what a saved game needs to be looked at or played from (M8 WP6): the card ids to load,
 * the opponent's and the player's lists, and a `GameConfig` for Study, Play from here and Practice.
 * The record holds the start (decks or a scenario) and who sat where, so a game opened from History
 * needs nothing from the live game that produced it.
 */
import { priorCardIds, PUZZLE_FILLER_CARD } from '@optcg/ai';
import type { Card } from '@optcg/cards';
import type { PlayerId } from '@optcg/engine';
import type { SessionRecord } from '../../session/index.ts';
import type { GameMeta } from '../../store/types.ts';
import type { GameConfig, AiPort } from '../game/controller.ts';
import type { AiDecision } from '../game/ai-client.ts';
import { scenarioCardIds } from '../setup/scenarios.ts';

type Scenario = Extract<SessionRecord['start'], { scenario: unknown }>['scenario'];

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

const idOf = (x: string | { card: string } | undefined): string | undefined =>
  x === undefined ? undefined : typeof x === 'string' ? x : x.card;

/** The Leader card id each seat started with. */
export function leadersOf(record: SessionRecord): Record<PlayerId, string> {
  const st = record.start;
  if ('setup' in st) return { p1: st.setup.decks.p1.leader, p2: st.setup.decks.p2.leader };
  return {
    p1: idOf(st.scenario.p1.leader) ?? '',
    p2: idOf(st.scenario.p2.leader) ?? '',
  };
}

/**
 * Every card id a game needs: both lists, the public priors the lethal checks read, and the filler
 * card of a puzzle cut from the game (their hidden Life and deck are rebuilt from it, M9 WP7).
 */
export function cardIdsOf(record: SessionRecord): string[] {
  const st = record.start;
  const ids = new Set<string>([PUZZLE_FILLER_CARD]);
  const leaders = leadersOf(record);
  if ('setup' in st) {
    for (const p of ['p1', 'p2'] as PlayerId[]) {
      ids.add(st.setup.decks[p].leader);
      for (const c of st.setup.decks[p].main) ids.add(c);
    }
  } else {
    // `scenarioCardIds` takes a scenario with a `mode`; the record's scenario has none.
    for (const c of scenarioCardIds({ ...st.scenario, mode: 'ai' } as never)) ids.add(c);
  }
  for (const l of Object.values(leaders)) {
    if (!l) continue;
    ids.add(l);
    for (const c of priorCardIds(l)) ids.add(c);
  }
  return [...ids];
}

/** A seat's own main deck: a game's list, or a scenario's `decklist` (else empty). */
export function deckOf(record: SessionRecord, seat: PlayerId): string[] {
  const st = record.start;
  if ('setup' in st) return st.setup.decks[seat].main.slice();
  const sc: Scenario = st.scenario;
  const list = (sc[seat].decklist ?? []) as (string | { card: string })[];
  return list.map((x) => idOf(x) ?? '').filter(Boolean);
}

/**
 * The configuration a restored board is built with. The human is the seat that played; the AI is the
 * other, with the same tier it had. `aiCardIds` is the AI's own deck and Leader only: the one card
 * data its worker receives (ARCHITECTURE §4.3).
 */
export function restoreConfig(
  record: SessionRecord,
  meta: Pick<GameMeta, 'me' | 'tier'>,
  cards: ReadonlyMap<string, Card>,
): GameConfig {
  const me = meta.me;
  const ai = other(me);
  const leaders = leadersOf(record);
  const aiDeck = deckOf(record, ai);
  const st = record.start;
  const aiCardIds =
    'setup' in st
      ? [leaders[ai], ...aiDeck]
      : [
          // The AI seat's own scenario cards (and the human's Leader, which the board shows).
          ...scenarioCardIds({
            ...st.scenario,
            mode: 'ai',
            [me]: { leader: st.scenario[me].leader },
            [ai]: st.scenario[ai],
          } as never),
          ...aiDeck,
        ];
  return {
    mode: 'ai',
    human: me,
    names: {
      [me]: 'You',
      [ai]: cards.get(leaders[ai])?.name ?? 'Opponent',
    } as Record<PlayerId, string>,
    tier: meta.tier,
    autoSkip: true,
    alwaysSkip: false,
    speed: 1,
    startPaused: false,
    aiCardIds: aiCardIds.filter(Boolean),
    aiDeck,
    myDeck: deckOf(record, me),
  };
}

/**
 * An AI seat that never answers: a read-only board (the timeline's log, Study) is only looked at, so
 * it must not start an AI worker. Never used for a board that is played.
 */
export const INERT_AI: () => AiPort = () => ({
  planTurn: () => ({ id: 0, result: new Promise<void>(() => undefined) }),
  decide: () => ({ id: 0, result: new Promise<AiDecision>(() => undefined) }),
  reveal: () => undefined,
  cancel: () => undefined,
  reset: () => undefined,
  terminate: () => undefined,
});
