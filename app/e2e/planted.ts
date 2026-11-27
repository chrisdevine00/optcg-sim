/**
 * The planted games of the M8 e2e (WP7), built once in Playwright's globalSetup and loaded into the
 * browser's IndexedDB by the specs. Each is a finished game of the shape the app saves: a scenario
 * record (engine replays it), the human as p1, ended by a concession so the game is over.
 *
 *   missed-lethal   the app's own lethalDemo scenario: turn 9, lethal on the table, conceded
 *   wasted-counter  E04 (explanations.md): a Counter spent on a hit that lands anyway
 *   should-counter  E05: a hit taken that should have been countered; the game is lost on it
 *   don-unused      E06: eight DON!!, a five-cost card, the Leader attacks with three left over
 *   target          E08: board over face, you attack the Leader with a Character that could clear theirs
 *   mulligan        E11: a Rocks hand the guide redraws, kept (the guide label, never "holds whatever they held")
 *   hindsight       E21 with their Kid in hand (M9 WP8): attacking with the Blocker lost only to a hand you could not see,
 *                   so the flag is Hindsight (certainty needed-hidden-info) and Practice keeps the real hand and says so
 *
 * The positions are those of the detectors' own tests (ai/test/review/*, ai/test/support/*), so what
 * the browser shows is what the unit tests proved; the browser adds the UI around them.
 */
import {
  appendAction,
  queries,
  reduce,
  replay,
  type Action,
  type GameState,
  type RecordWithSnapshots,
} from '@optcg/engine';
import type { ReviewRecord } from '@optcg/ai';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { e04Record, e06Record } from '../../ai/test/review/wp2-positions.ts';
import { attackOn, recordOf, takeIt, type Spec } from '../../ai/test/review/wp3-support.ts';
import { e08Record } from '../../ai/test/support/review-target-positions.ts';
import { plantRecord } from '../../ai/test/support/review-plant.ts';
import { lifeOf, listOf } from '../../ai/test/support/scenario.ts';
import { cardMap, lookup } from '../../ai/test/support.ts';
import { atMulligan, findSeed } from '../../ai/test/review/wp2-mulligan.ts';
import { playbookFor } from '../../ai/src/playbook.ts';
import { mulliganVerdict } from '../../ai/src/search/mulligan.ts';

export type PlantedName =
  | 'missed-lethal'
  | 'wasted-counter'
  | 'should-counter'
  | 'don-unused'
  | 'target'
  | 'mulligan'
  | 'hindsight';

export interface PlantedGame {
  id: string;
  record: ReviewRecord;
  meta: {
    result: 'won' | 'lost' | 'draw';
    me: 'p1';
    myLeader: string;
    opponentLeader: string;
    tier: 'rookie';
    deckName: string;
    turns: number;
    endedAt: number;
    tags: string[];
    versions: ReviewRecord['versions'];
  };
}

const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const ULTI = 'OP17-060';
const KAIDO_CHAR = 'OP17-062';
const RP = 'OP17-056';
const NA = 'OP17-055';
const BUCKIN = 'OP08-051';
const KYO = 'OP17-045';

/** E05, as in ai/test/review/should-counter.test.ts. */
const E05: Spec = {
  seed: 5,
  turn: 10,
  activePlayer: 'p2',
  firstPlayer: 'p1',
  p1: {
    leader: ROCKS,
    life: lifeOf(1, KYO),
    hand: [RP, NA, BUCKIN],
    costArea: { active: 0, rested: 0 },
    decklist: listOf(ROCKS),
  },
  p2: {
    leader: { card: KAIDO, don: 2 },
    characters: [ULTI, KAIDO_CHAR],
    life: lifeOf(3, KYO),
    hand: [],
    costArea: { active: 0, rested: 0 },
    decklist: listOf(KAIDO),
  },
};

function e05Record(): ReviewRecord {
  // The planted mistake: p1 takes every hit without a Counter. p2 attacks in the test's order.
  const queue = [ULTI, KAIDO, KAIDO_CHAR];
  return recordOf(E05, (s, legal) => {
    const dec = queries.decision(s)!;
    if (dec.player === 'p2' && dec.kind === 'main') {
      const next = queue.shift();
      return next ? attackOn(s, legal, 'p2', next) : legal.find((a) => a.type === 'endTurn');
    }
    if (dec.player === 'p1' && dec.kind === 'main') return undefined;
    if (dec.player === 'p1') return legal.find((a) => a.type === 'endCounter') ?? takeIt(legal);
    return takeIt(legal);
  });
}

/**
 * The Hindsight game (ai/test/review/given-away.test.ts, "Hindsight when only their hand made it lethal"):
 * turn 9, you attack with Gloriosa (your only Blocker) and end the turn; on turn 10 their Leader, Ulti and
 * the Kid they hold in hand (5000 [Rush]) take your two Life. Their board alone would not have won.
 */
function hindsightGame(): ReviewRecord {
  const BLOCKER = 'OP17-046';
  const KID = 'EB01-003';
  const spec: Spec = {
    seed: 9,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: ROCKS,
      characters: [BLOCKER],
      life: lifeOf(2, KYO),
      hand: [],
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
    p2: {
      leader: KAIDO,
      characters: [ULTI],
      life: lifeOf(3, KYO),
      hand: [KID],
      costArea: { active: 4, rested: 0 },
      decklist: listOf(KAIDO),
    },
  };
  const mine = [BLOCKER];
  const theirs = ['play:' + KID, KID, KAIDO, ULTI];
  return recordOf(spec, (s, legal) => {
    const dec = queries.decision(s)!;
    if (dec.kind === 'main' && dec.player === 'p1') {
      if (queries.turn(s).number > 9) return undefined;
      const next = mine.shift();
      return next ? attackOn(s, legal, 'p1', next) : legal.find((a) => a.type === 'endTurn');
    }
    if (dec.kind === 'main' && dec.player === 'p2') {
      const next = theirs.shift();
      if (next?.startsWith('play:'))
        return legal.find(
          (a) => a.type === 'playCard' && queries.card(s, a.card).card === next.slice(5),
        );
      return next ? attackOn(s, legal, 'p2', next) : legal.find((a) => a.type === 'endTurn');
    }
    return takeIt(legal);
  });
}

/** The same record with p1's concession appended, unless the game is already over. */
function conceded(rec: RecordWithSnapshots | ReviewRecord): ReviewRecord {
  const full: ReviewRecord = {
    ...(rec as ReviewRecord),
    seats: { p1: 'human', p2: 'ai' },
    auto: [],
    rewinds: [],
  };
  const state = replay(full, lookup).state;
  if (queries.result(state)) return full;
  const a: Action = { type: 'concede', player: 'p1' };
  const next = reduce(state, a).state;
  return {
    ...appendAction(full as unknown as RecordWithSnapshots, a, next),
    seats: full.seats,
    auto: [],
    rewinds: [],
  };
}

function missedLethal(): ReviewRecord {
  const { mode: _mode, ...spec } = SCENARIOS.lethalDemo!;
  void _mode;
  return plantRecord(spec, () => [{ type: 'concede', player: 'p1' }]);
}

/** A Rocks hand the guide would redraw, going first, kept: the mulligan flag (E11). */
function mulliganGame(): ReviewRecord {
  const cards = cardMap();
  const rule = playbookFor(ROCKS, listOf(ROCKS), cards).mulligan;
  const seed = findSeed(
    ROCKS,
    true,
    (h) =>
      !mulliganVerdict(
        h.map((id) => cards.get(id)),
        rule,
        true,
      ).keep,
  );
  return conceded(atMulligan(ROCKS, seed, true).rec(false));
}

const BUILDERS: Record<PlantedName, () => ReviewRecord> = {
  'missed-lethal': missedLethal,
  'wasted-counter': () => conceded(e04Record() as RecordWithSnapshots),
  'should-counter': e05Record,
  'don-unused': () => conceded(e06Record() as RecordWithSnapshots),
  target: () => conceded(e08Record() as unknown as RecordWithSnapshots),
  mulligan: mulliganGame,
  hindsight: hindsightGame,
};

/** The last game turn: records carry a snapshot at every turn boundary. */
export const lastTurn = (r: ReviewRecord): number =>
  (r as unknown as RecordWithSnapshots).snapshots.at(-1)?.turn ?? 0;

export function leaderOf(state: GameState, p: 'p1' | 'p2'): string {
  return queries.zone(state, p, 'leader')[0]!.card;
}

/** Every planted game as the store holds it. Older `endedAt` for the later names, so History orders them. */
export function plantedGames(now = Date.UTC(2026, 10, 25, 12)): Record<PlantedName, PlantedGame> {
  const out = {} as Record<PlantedName, PlantedGame>;
  (Object.keys(BUILDERS) as PlantedName[]).forEach((name, i) => {
    const record = conceded(BUILDERS[name]());
    const end = replay(record, lookup).state;
    out[name] = {
      id: `planted-${name}`,
      record,
      meta: {
        result: 'lost',
        me: 'p1',
        myLeader: leaderOf(end, 'p1'),
        opponentLeader: leaderOf(end, 'p2'),
        tier: 'rookie',
        deckName: 'Planted',
        turns: lastTurn(record),
        endedAt: now - i * 60_000,
        tags: [],
        versions: record.versions,
      },
    };
  });
  return out;
}
