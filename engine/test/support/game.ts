/**
 * Shared helpers for the engine's own tests. Card picks are real cards: vanilla ones play for their
 * stats, and keyword cards carry keywords from verified overrides (E-D7).
 */
import { readFileSync, readdirSync } from 'node:fs';
import type { SetFile } from '@optcg/cards';
import {
  createGame,
  reduce,
  type Action,
  type CardId,
  type DeckSpec,
  type DistributiveOmit,
  type GameEvent,
  type GameEventType,
  type PlayerId,
} from '../../src/index.ts';
import { applyOp, withAbilities, type Ability, type TestOp } from '../../src/testing.ts';
import { cards, TestGame } from '../fixtures/index.ts';

/** Red Leader: 5000 power, 5 Life. */
export const LUFFY = 'ST01-001';
/** Purple Leader: 5000 power, 5 Life. */
export const KAIDO = 'ST04-001';
/** Purple/Yellow Leader, 4 Life (the replacement-hook reference, RL-41). */
export const ROSINANTE = 'OP12-061';
/** Purple Leader whose DON!! deck has 6 cards (RL-40). */
export const ENEL = 'OP15-058';
/** Blue Leader. */
export const ROCKS = 'OP17-039';

/** Red vanilla Character: cost 1, 3000 power, Counter +1000. */
export const RED_1 = 'EB01-005';
/** Red vanilla Character: cost 5, 6000 power, Counter +2000. */
export const RED_5 = 'OP15-016';
/** Purple vanilla Character: cost 1, 3000 power, Counter +1000. */
export const PUR_1 = 'OP02-084';
/** Purple vanilla Character, cost 1, 3000 power. */
export const PUR_1B = 'ST04-009';
/** Purple [Blocker], cost 4, 5000 power, Counter +1000. */
export const BLOCKER = 'OP09-072';
/** Second purple [Blocker], cost 4, 5000 power (named Trafalgar Law). */
export const BLOCKER_LAW = 'ST10-010';
/** Red [Rush], cost 5, 6000 power. */
export const RUSH = 'ST21-014';
/** Blue [Rush: Character], cost 7, 9000 power. */
export const RUSH_CHAR = 'OP17-048';
/** Green [Double Attack], cost 6, 7000 power. */
export const DOUBLE = 'OP13-118';
/** Purple [Banish], cost 9, 10000 power. */
export const BANISH = 'OP17-065';
/** Red Stage, cost 1. */
export const STAGE_RED = 'OP03-020';
/** Purple Stage, cost 3. */
export const STAGE_PUR = 'ST04-017';
/** Red Event, cost 2. */
export const EVENT_RED = 'OP03-017';
/** Yellow vanilla [Trafalgar Law], cost 4, 5000 power, Counter +2000. */
export const LAW = 'P-088';

export const times = (n: number, card: CardId): CardId[] => Array.from({ length: n }, () => card);

/** A legal 50-card deck of vanilla Characters in the Leader's color. */
export function vanillaDeck(color: 'Red' | 'Purple'): CardId[] {
  const ids = vanillaIds(color).slice(0, 13);
  return ids.flatMap((id) => times(4, id)).slice(0, 50);
}

let vanilla: Record<string, CardId[]> | undefined;
function vanillaIds(color: string): CardId[] {
  if (!vanilla) {
    vanilla = {};
    const dir = new URL('../../../cards/data/sets/', import.meta.url);
    for (const f of readdirSync(dir)) {
      const set = JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as SetFile;
      for (const c of set.cards) {
        if (c.category !== 'Character' || c.effectText || c.triggerText || c.colors.length !== 1)
          continue;
        (vanilla[c.colors[0]!] ??= []).push(c.id);
      }
    }
    for (const k of Object.keys(vanilla)) vanilla[k]!.sort();
  }
  return vanilla[color] ?? [];
}

export function decks(p1 = LUFFY, p2 = KAIDO): Record<PlayerId, DeckSpec> {
  return {
    p1: { leader: p1, main: vanillaDeck(p1 === LUFFY ? 'Red' : 'Purple') },
    p2: { leader: p2, main: vanillaDeck(p2 === LUFFY ? 'Red' : 'Purple') },
  };
}

/** A game from `createGame`, wrapped in the fixture's TestGame. */
export function newGame(seed = 7, chooser: PlayerId = 'p1', p1 = LUFFY, p2 = KAIDO): TestGame {
  const step = createGame({ seed, cards: cards(), decks: decks(p1, p2), chooser });
  return new TestGame(step.state, step.events);
}

/** Choose to go first and keep both hands: ends at p1's turn-1 Main Phase. */
export function startedGame(seed = 7): TestGame {
  const g = newGame(seed);
  g.act({ type: 'chooseFirst', goFirst: true });
  g.act({ type: 'mulligan', redraw: false });
  g.act({ type: 'mulligan', redraw: false });
  return g;
}

/** Run a test-only atomic operation on a TestGame (as an effect would). */
export function op(g: TestGame, o: TestOp): GameEvent[] {
  const step = applyOp(g.state, o);
  g.state = step.state;
  g.events.push(...step.events);
  return step.events;
}

export function give(g: TestGame, cardId: CardId, abilities: Ability[]): void {
  g.state = withAbilities(g.state, cardId, abilities);
}

/** Apply an action without the fixture's legality pre-check (for actions legalActions omits). */
export function force(g: TestGame, a: Action): GameEvent[] {
  const step = reduce(g.state, a);
  g.state = step.state;
  g.events.push(...step.events);
  return step.events;
}

export type Act = DistributiveOmit<Action, 'player'> & { player?: PlayerId };

export const types = (events: GameEvent[]): GameEventType[] => events.map((e) => e.type);

/** Pass priority to the end of the current turn: end the Main Phase. */
export function endTurn(g: TestGame): void {
  g.act({ type: 'endTurn' });
}

/** Defender takes no block and no counter. */
export function noDefence(g: TestGame): void {
  g.act({ type: 'block', blocker: null });
  g.act({ type: 'endCounter' });
}
