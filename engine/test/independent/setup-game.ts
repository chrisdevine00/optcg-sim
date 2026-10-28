/**
 * Starting real games through `createGame` (not scenarios), for setup and first-turn rules.
 */
import { createGame, type CardId, type PlayerId } from '@optcg/engine';
import { cards, TestGame } from '../fixtures/index.ts';
import { act, decision, L } from './helpers.ts';

/**
 * A legal 50-card red deck of vanilla Characters (CR 5-1-2): 12 card numbers x 4, plus 2 more.
 * Legal under both Leaders used below: ST01-001 (Red) and OP01-002 (Green/Red).
 */
export const RED_DECK: CardId[] = [
  ...[
    'OP01-010', // Komachiyo, cost 1
    'ST01-003', // Karoo, cost 1
    'OP01-012', // Sai, cost 2
    'ST01-009', // Nefeltari Vivi, cost 2
    'OP01-023', // Marco, cost 3
    'ST01-008', // Nico Robin, cost 3
    'OP01-018', // Hajrudin, cost 4
    'ST01-010', // Franky, cost 4
    'OP02-006', // Kingdew, cost 5
    'OP02-007', // Thatch, cost 6
    'EB03-002', // Ain, cost 5
    'OP11-017', // X.Drake, cost 6
  ].flatMap((id) => [id, id, id, id]),
  'OP02-020', // LittleOars Jr., cost 7
  'OP02-020',
];

export interface NewGameOptions {
  seed?: number;
  chooser?: PlayerId;
  /** Default ST01-001 (5 Life). */
  p1Leader?: CardId;
  /** Default OP01-002 (4 Life). */
  p2Leader?: CardId;
  p1Main?: CardId[];
  p2Main?: CardId[];
}

export function newGame(o: NewGameOptions = {}): TestGame {
  const step = createGame({
    seed: o.seed ?? 7,
    cards: cards(),
    chooser: o.chooser ?? 'p1',
    decks: {
      p1: { leader: o.p1Leader ?? L.redLuffy, main: o.p1Main ?? RED_DECK },
      p2: { leader: o.p2Leader ?? L.law4Life, main: o.p2Main ?? RED_DECK },
    },
  });
  return new TestGame(step.state, step.events);
}

/** Choose first/second and keep both opening hands. Ends in turn 1's Main Phase. */
export function startKeepingHands(g: TestGame, goFirst = true): void {
  act(g, { type: 'chooseFirst', goFirst });
  while (decision(g)?.kind === 'mulligan') act(g, { type: 'mulligan', redraw: false });
}
