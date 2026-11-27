/**
 * `scenarioOf` (M9 WP2): a described position (`ScenarioSpec` without the card lookup) of a real
 * game state, so a drill can start from a moment of a played game. Only a plain player's own Main
 * decision can be written down: a scenario has no way to say "this card has +1000 until the end of
 * the turn", "this ability was used", or "an effect is half resolved". Anything else throws
 * `NotExpressible` with a closed reason, and the caller falls back to replaying the record.
 *
 * `over` swaps what the caller must not copy: a seat's hand, face-down Life and deck. That is how a
 * puzzle built from a recorded game keeps the opponent's real hidden cards out of its position.
 */
import type {
  CardId,
  CardLookup,
  CardPlacement,
  GameState,
  PlayerId,
  PlayerSpec,
  ScenarioSpec,
} from './api.ts';
import type { CardInst, State } from './state.ts';

/** Why a state cannot be written as a scenario: closed, so the fallback and its test are exact. */
export type NotExpressibleReason =
  | 'finished'
  | 'decision'
  | 'stack'
  | 'battle'
  | 'resolving'
  | 'pending'
  | 'delayed'
  | 'duration'
  | 'once-per-turn'
  | 'known';

export const NOT_EXPRESSIBLE_REASONS: readonly NotExpressibleReason[] = [
  'finished',
  'decision',
  'stack',
  'battle',
  'resolving',
  'pending',
  'delayed',
  'duration',
  'once-per-turn',
  'known',
];

export class NotExpressible extends Error {
  constructor(readonly reason: NotExpressibleReason) {
    super(`This position cannot be described as a scenario (${reason}).`);
    this.name = 'NotExpressible';
  }
}

export type ScenarioJson = Omit<ScenarioSpec, 'cards'>;

export interface ScenarioOver {
  /** Replaces a seat's hand (card ids, in order). */
  hand?: Partial<Record<PlayerId, CardId[]>>;
  /** Replaces a seat's Life, top first (a bare id is face down). */
  life?: Partial<Record<PlayerId, (CardId | CardPlacement)[]>>;
  /** Replaces a seat's deck, top first. */
  deck?: Partial<Record<PlayerId, CardId[]>>;
  /** The scenario's seed (it only matters for shuffles the position never reaches); default 1. */
  seed?: number;
}

/** A placement with its defaults left out, so a scenario stays short. */
function place(c: CardInst, turn: number, field: boolean): CardId | CardPlacement {
  const p: CardPlacement = { card: c.card };
  if (c.rested) p.rested = true;
  if (c.don > 0) p.don = c.don;
  if (field && c.played === turn) p.playedThisTurn = true;
  return Object.keys(p).length === 1 ? c.card : p;
}

export function scenarioOf(
  state: GameState,
  lookup: CardLookup,
  over: ScenarioOver = {},
): ScenarioJson {
  const s = state as unknown as State;
  if (s.result) throw new NotExpressible('finished');
  const dec = s.decision;
  if (!dec || dec.kind !== 'main' || dec.player !== s.active || s.phase !== 'main')
    throw new NotExpressible('decision');
  if (s.stack.length !== 1 || s.stack[0]!.f !== 'turn' || s.stack[0]!.step !== 'main')
    throw new NotExpressible('stack');
  if (s.battle) throw new NotExpressible('battle');
  if (s.resolving.length > 0) throw new NotExpressible('resolving');
  if (s.pending.length > 0) throw new NotExpressible('pending');
  if (s.delayed.length > 0) throw new NotExpressible('delayed');
  if (s.mods.length > 0) throw new NotExpressible('duration');
  if (s.oncePerTurn.length > 0) throw new NotExpressible('once-per-turn');
  if (s.known.p1.length > 0 || s.known.p2.length > 0) throw new NotExpressible('known');

  const ids = (list: readonly string[]): CardId[] => list.map((i) => s.cards[i]!.card);
  const checked = (list: CardId[]): CardId[] => {
    for (const c of list) if (!lookup(c)) throw new Error(`scenarioOf: unknown card ${c}`);
    return list;
  };
  const seat = (p: PlayerId): PlayerSpec => {
    const ps = s.players[p];
    const lifeOver = over.life?.[p];
    if (lifeOver) checked(lifeOver.map((x) => (typeof x === 'string' ? x : x.card)));
    const spec: PlayerSpec = {
      leader: place(s.cards[ps.leader]!, s.turn, false),
      hand: checked(over.hand?.[p] ?? ids(ps.hand)),
      deck: checked(over.deck?.[p] ?? ids(ps.deck)),
      life: lifeOver
        ? lifeOver
        : ps.life.map((i) => {
            const c = s.cards[i]!;
            return c.faceUp ? { card: c.card, faceUp: true } : c.card;
          }),
      characters: ps.characters.map((i) => place(s.cards[i]!, s.turn, true)),
      trash: ids(ps.trash),
      costArea: { active: ps.donActive, rested: ps.donRested },
      donDeck: ps.donDeck,
    };
    if (ps.stage.length > 0) spec.stage = place(s.cards[ps.stage[0]!]!, s.turn, true);
    return spec;
  };
  return {
    seed: over.seed ?? 1,
    turn: s.turn,
    activePlayer: s.active,
    firstPlayer: s.first,
    p1: seat('p1'),
    p2: seat('p2'),
  };
}
