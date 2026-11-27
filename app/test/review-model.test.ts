/**
 * The review screen's pure model (M8 WP6): flag names and order, what the turn notes and markers
 * collect to, the timeline's turns and the Life line from the record's snapshots, the opponent's
 * notable moves, which flags can be practised, History's rows, and that every lesson link has a page.
 */
import { describe, expect, it } from 'vitest';
import { LESSON, type Explanation, type ReviewFlag, type TurnResult } from '@optcg/ai';
import { GameSession } from '../src/session/index.ts';
import { cardIdsOf, deckOf, leadersOf, restoreConfig } from '../src/play/review/restore.ts';
import {
  REANALYSE_COPY,
  collect,
  finalLife,
  flagName,
  notableMoves,
  practiceOf,
  severityCounts,
  sortFlags,
  summaryText,
  turnStartIndex,
  turnsOf,
  actorsOf,
} from '../src/play/review/model.ts';
import type { LogLine } from '../src/play/game/text.ts';
import { lessonById, LESSONS, parseLessons, plain } from '../src/learn/lessons.ts';
import {
  NO_FILTERS,
  flagsText,
  incomplete,
  practisedText,
  rowLabel,
  visibleRows,
  type Row,
} from '../src/history/model.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { cellName } from '../src/play/review/Timeline.tsx';
import { STALE_COPY } from '../src/store/staleness.ts';
import type { GameMeta, StoredReview } from '../src/store/types.ts';
import { cardMap } from './support.ts';

const ex = (claim: string, certainty: Explanation['certainty'] = 'any-hand'): Explanation => ({
  claim,
  certainty,
  conceptId: 'lethal-math',
  evidence: [],
  line: null,
  outcome: '',
  nextTime: '',
  lessonId: 'L15-lethal-math',
  sources: [],
});

const flag = (
  kind: ReviewFlag['kind'],
  turn: number,
  severity: ReviewFlag['severity'],
  extra: Partial<ReviewFlag> = {},
): ReviewFlag => ({
  id: `${kind}:${turn}:${extra.decisionIndex ?? 0}`,
  kind,
  turn,
  player: 'p1',
  restoreIndex: 0,
  decisionIndex: 0,
  severity,
  certainty: severity === 'hindsight' ? 'needed-hidden-info' : 'any-hand',
  explanation: ex('claim', severity === 'hindsight' ? 'needed-hidden-info' : 'any-hand'),
  did: [],
  ...extra,
});

const actors = {
  playerOf: (t: number) => (t % 2 === 1 ? ('p1' as const) : ('p2' as const)),
  me: 'p1' as const,
  oppName: 'Kaido',
};

describe('flag names and order', () => {
  it('names a flag by turn, whose turn, kind, severity and certainty (the SR name)', () => {
    expect(flagName(flag('missed-lethal', 9, 'severe'), actors)).toBe(
      'Turn 9, your turn: missed lethal, severe, holds whatever they held.',
    );
    expect(flagName(flag('should-counter', 10, 'severe'), actors)).toBe(
      'Turn 10, Kaido’s turn: hit that should have been countered, severe, holds whatever they held.',
    );
    expect(flagName(flag('target', 3, 'hindsight'), actors)).toContain(
      'poor attack ordering, hindsight, hindsight: needed their hidden cards',
    );
    expect(flagName(flag('mulligan', 1, 'minor'), actors)).toMatch(
      /^Start of the game: mulligan, minor/,
    );
  });

  it('orders by severity (Hindsight last), then turn, then decision', () => {
    const list = sortFlags([
      flag('target', 2, 'moderate'),
      flag('missed-lethal', 9, 'severe'),
      flag('don-unused', 1, 'minor'),
      flag('given-away', 3, 'hindsight'),
      flag('counter-wasted', 4, 'moderate'),
      flag('should-counter', 5, 'severe'),
    ]).map((f) => `${f.kind}@${f.turn}`);
    expect(list).toEqual([
      'should-counter@5',
      'missed-lethal@9',
      'target@2',
      'counter-wasted@4',
      'don-unused@1',
      'given-away@3',
    ]);
  });

  it('says the summary and the History counts in words', () => {
    const flags = [flag('missed-lethal', 9, 'severe'), flag('target', 2, 'moderate')];
    expect(summaryText(flags, [])).toBe('2 flags · 1 severe');
    expect(summaryText([flags[0]!], [{ turn: 4, kind: null, reason: 'deadline' }])).toBe(
      '1 flag · 1 severe · 1 not fully checked',
    );
    expect(severityCounts(flags)).toBe('1 severe · 1 moderate');
    expect(severityCounts([])).toBe('No flags');
  });
});

describe('what the results collect to', () => {
  const note = ex('5 active DON!! held for your Leader: not counted as unused');
  const result = (
    itemId: string,
    turn: number,
    flags: ReviewFlag[],
    extra: Partial<TurnResult> = {},
  ): TurnResult => ({ itemId, turn, flags, notes: [], ...extra });

  it('keeps notes (never as flags) by turn, de-duplicates, and takes only the reviewed seat', () => {
    const theirs = flag('missed-lethal', 4, 'severe', { player: 'p2' });
    const c = collect(
      [
        result('a', 3, [], { notes: [note, note] }),
        result('b', 4, [theirs]),
        result('c', 5, [flag('don-unused', 5, 'minor')]),
      ],
      [],
      'p1',
    );
    expect(c.flags.map((f) => f.id)).toEqual(['don-unused:5:0']);
    expect(c.notes.get(3)).toHaveLength(1);
    expect(c.notes.get(3)![0]!.claim).toContain('DON!! held');
    expect(c.markers).toEqual([]);
  });

  it('turns a refuted-but-unfinished hindsight search into a note, not a marker (M8-1)', () => {
    const hindsight = ex('Hindsight check not finished', 'search-incomplete');
    const c = collect([result('m', 7, [], { notes: [hindsight] })], [], 'p1');
    expect(c.markers).toEqual([]);
    expect(c.flags).toEqual([]);
    expect(c.notes.get(7)![0]!.claim).toBe('Hindsight check not finished');
  });

  it('collects markers from results and from the run, once each', () => {
    const m = { turn: 6, kind: 'missed-lethal' as const, reason: 'search-incomplete' as const };
    const c = collect(
      [result('x', 6, [], { marker: m })],
      [m, { turn: 8, kind: null, reason: 'deadline' }],
      'p1',
    );
    expect(c.markers).toHaveLength(2);
  });
});

describe('the timeline from a record', () => {
  const spec = () => {
    const { mode: _m, ...s } = SCENARIOS.lethalDemo!;
    return s;
  };
  it('reads turns, whose they were, where they began and the Life line from the snapshots', () => {
    const session = new GameSession(
      (id) => cardMap().get(id),
      { scenario: spec() },
      { p1: 'human', p2: 'ai' },
    );
    expect(session.apply('p1', { type: 'concede', player: 'p1' }).ok).toBe(true);
    const record = session.exportRecord();
    const turns = turnsOf(record);
    expect(turns).toEqual([{ turn: 9, player: 'p1', startIndex: 0, life: { p1: 3, p2: 1 } }]);
    expect(finalLife(record)).toEqual({ p1: 3, p2: 1 });
    expect(turnStartIndex(turns, 9)).toBe(0);
    expect(actorsOf(turns, 'p1', 'Rocks').playerOf(9)).toBe('p1');
    // The record names the Leaders and the lists, so a game opened from History needs no live game.
    expect(leadersOf(record)).toMatchObject({ p1: expect.any(String), p2: 'OP17-039' });
    expect(cardIdsOf(record)).toContain('OP17-039');
    const cfg = restoreConfig(record, { me: 'p1', tier: 'rookie' }, cardMap());
    expect(cfg).toMatchObject({ mode: 'ai', human: 'p1', tier: 'rookie' });
    expect(cfg.names.p1).toBe('You');
    expect(cfg.aiCardIds).toContain('OP17-039');
    expect(deckOf(record, 'p1')).toBeInstanceOf(Array);
  });
});

describe('the opponent’s notable moves', () => {
  const line = (actor: 'p1' | 'p2', text: string, kind: LogLine['kind'] = 'move'): LogLine => ({
    kind,
    actor,
    text,
    cards: [],
    auto: false,
    index: 0,
  });
  it('picks K.O.s of your Characters, Life hits, plays of cost 5 or more and Leader abilities', () => {
    const cards = cardMap();
    const big = [...cards.values()].find(
      (c) => c.cost !== null && c.cost >= 5 && c.category === 'Character',
    )!;
    const small = [...cards.values()].find((c) => c.cost === 1 && c.category === 'Character')!;
    const m = notableMoves(
      [
        line('p1', 'Turn 1 · You', 'turn'),
        line('p1', 'K.O. · Your Nope', 'move'),
        line('p2', 'Turn 2 · Opp', 'turn'),
        line('p2', `Play ${big.name} · Play ${small.name}`),
        line('p2', 'Kaido attacks your Leader · K.O. · Your Drake · your Life 3 → 2'),
        line('p2', 'Their Kaido: [When Attacking] DON!! −1'),
        line('p2', 'Their Other: something'),
      ],
      cards,
      'p1',
      'Kaido',
    );
    expect(m.get(1)).toBeUndefined();
    const cost = Math.max(
      ...[...cards.values()].filter((c) => c.name === big.name).map((c) => c.cost ?? 0),
    );
    expect(m.get(2)).toEqual(
      [
        `Played ${big.name} (cost ${cost})`,
        'K.O. of your Drake',
        'Hit your Life, 3 to 2',
        'Kaido: [When Attacking] DON!! −1',
      ]
        .slice(0, 3)
        .concat(['and 1 more']),
    );
  });

  it('ignores your own moves and auto-skipped lines', () => {
    const m = notableMoves(
      [
        line('p2', 'Turn 2 · Opp', 'turn'),
        { ...line('p2', 'K.O. · Your A'), auto: true },
        line('p1', 'K.O. · Your B'),
      ],
      cardMap(),
      'p1',
      'Kaido',
    );
    expect(m.size).toBe(0);
  });
});

describe('Practice availability', () => {
  const win = flag('missed-lethal', 9, 'severe', { practice: { judge: 'win-this-turn', turn: 9 } });
  it('gives the detector’s judge and turn for a live game', () => {
    expect(practiceOf(win, true, STALE_COPY)).toEqual({
      ok: true,
      judge: 'win-this-turn',
      turn: 9,
    });
    const given = flag('given-away', 8, 'severe', { practice: { judge: 'survive-turn', turn: 9 } });
    expect(practiceOf(given, true, STALE_COPY)).toEqual({
      ok: true,
      judge: 'survive-turn',
      turn: 9,
    });
    const wasted = flag('counter-wasted', 6, 'moderate', {
      practice: { judge: 'no-counter-on-attack', turn: 6 },
    });
    expect(practiceOf(wasted, true, STALE_COPY)).toMatchObject({ judge: 'no-counter-on-attack' });
  });
  it('uses the stored judge and bar for DON!!, target and mulligan flags', () => {
    const don = flag('don-unused', 8, 'moderate', {
      practice: { judge: 'don-ledger', turn: 8, expect: { unusedMin: 1 } },
    });
    expect(practiceOf(don, true, STALE_COPY)).toEqual({
      ok: true,
      judge: 'don-ledger',
      turn: 8,
      expect: { unusedMin: 1 },
    });
    const tgt = flag('target', 5, 'moderate', {
      practice: { judge: 'target-best', turn: 5, expect: { target: 'c7' } },
    });
    expect(practiceOf(tgt, true, STALE_COPY)).toMatchObject({ judge: 'target-best' });
    const mull = flag('mulligan', 1, 'minor', { practice: { judge: 'mulligan', turn: 1 } });
    expect(practiceOf(mull, true, STALE_COPY)).toEqual({ ok: true, judge: 'mulligan', turn: 1 });
  });
  it('falls back by kind for a stored review without `practice`; a target flag says to analyse again', () => {
    expect(practiceOf(flag('mulligan', 1, 'minor'), true, STALE_COPY)).toMatchObject({
      ok: true,
      judge: 'mulligan',
    });
    expect(practiceOf(flag('don-unused', 2, 'minor'), true, STALE_COPY)).toMatchObject({
      ok: true,
      judge: 'don-ledger',
      expect: { unusedMin: 0 },
    });
    // Never silently solved: without the better target nothing could judge the attack.
    expect(practiceOf(flag('target', 2, 'minor'), true, STALE_COPY)).toEqual({
      ok: false,
      reason: REANALYSE_COPY,
    });
    const noTarget = flag('target', 2, 'minor', { practice: { judge: 'target-best', turn: 2 } });
    expect(practiceOf(noTarget, true, STALE_COPY)).toEqual({ ok: false, reason: REANALYSE_COPY });
    expect(REANALYSE_COPY).toBe('Analyse again to practise this.');
  });
  it('is off for a stale game and for no flag', () => {
    expect(practiceOf(win, false, STALE_COPY)).toEqual({ ok: false, reason: STALE_COPY });
    expect(practiceOf(null, true, STALE_COPY).ok).toBe(false);
  });
});

describe('History rows', () => {
  const meta = (over: Partial<GameMeta> = {}): GameMeta => ({
    result: 'lost',
    me: 'p1',
    myLeader: 'Rocks',
    opponentLeader: 'Kaido',
    tier: 'pirate',
    deckName: 'Rocks',
    turns: 13,
    endedAt: Date.UTC(2026, 9, 28, 12),
    tags: [],
    versions: { engine: '0', cards: '0', scripts: '0' },
    ...over,
  });
  const review = (flags: ReviewFlag[], over: Partial<StoredReview> = {}): StoredReview => ({
    gameId: 'g1',
    analysisVersion: 1,
    engineVersion: '0',
    status: 'complete',
    results: { a: { itemId: 'a', turn: 9, flags, notes: [] } },
    markers: [],
    practised: {},
    ...over,
  });
  const row = (id: string, m: GameMeta, r?: StoredReview, stale?: string): Row => ({
    id,
    meta: m,
    review: r,
    stale,
  });

  it('says a row as a sentence, flags by severity, and what is incomplete', () => {
    const r = row('g1', meta(), review([flag('missed-lethal', 9, 'severe')]));
    expect(rowLabel(r, 'UTC')).toBe(
      'Lost to Kaido, Pirate, 28 October 2026, 13 turns, 1 severe flag. Review.',
    );
    expect(flagsText(r)).toBe('1 severe');
    expect(incomplete(r)).toBe(false);
    expect(incomplete(row('g2', meta()))).toBe(true);
    expect(incomplete(row('g3', meta(), review([], { status: 'partial' })))).toBe(true);
    expect(incomplete(row('g4', meta(), review([], { analysisVersion: 0 })))).toBe(true);
    const practised = row(
      'g6',
      meta(),
      review([flag('missed-lethal', 9, 'severe')], {
        practised: { a: 'solved', b: 'not-yet', c: 'solved' },
      }),
    );
    expect(practisedText(practised)).toBe('Practised: 2 solved, 1 not yet');
    expect(practisedText(r)).toBe('');
    expect(rowLabel(row('g5', meta({ result: 'won' }), review([])), 'UTC')).toContain(
      'Won against Kaido, Pirate, 28 October 2026, 13 turns, no flags.',
    );
  });

  it('filters by result, opponent and severe flags, and sorts by date or severe count', () => {
    const rows = [
      row('a', meta({ endedAt: 3 }), review([flag('missed-lethal', 9, 'severe')])),
      row('b', meta({ endedAt: 2, result: 'won', opponentLeader: 'Rocks' }), review([])),
      row(
        'c',
        meta({ endedAt: 1 }),
        review([
          flag('missed-lethal', 9, 'severe'),
          flag('should-counter', 8, 'severe', { decisionIndex: 4 }),
        ]),
      ),
    ];
    expect(visibleRows(rows, NO_FILTERS).map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(visibleRows(rows, { ...NO_FILTERS, result: 'won' }).map((r) => r.id)).toEqual(['b']);
    expect(visibleRows(rows, { ...NO_FILTERS, opponent: 'Kaido' }).map((r) => r.id)).toEqual([
      'a',
      'c',
    ]);
    expect(visibleRows(rows, { ...NO_FILTERS, severe: true }).map((r) => r.id)).toEqual(['a', 'c']);
    expect(visibleRows(rows, { ...NO_FILTERS, sort: 'severe' }).map((r) => r.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });
});

describe('lessons', () => {
  it('parses the curriculum: every lesson has an idea, a drill and an exit', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(27);
    for (const l of LESSONS) {
      expect(l.concept, l.id).not.toBe('');
      expect(l.drill, l.id).not.toBe('');
      expect(l.exit, l.id).not.toBe('');
      expect(l.stage, l.id).toMatch(/^Stage \d/);
    }
    const l10 = lessonById('L10-counter-or-take')!;
    expect(l10.title).toBe('Counter or take');
    expect(l10.code).toBe('L10');
    expect(l10.stage).toBe('Stage 2 — Core strategy');
    expect(plain('**bold** `code` *it*')).toBe('bold code it');
  });

  it('has a page for every lesson id an explanation can link to (the CI check)', () => {
    const ids = new Set([
      ...Object.values(LESSON),
      'L08-first-full-game',
      'L27-opponent-turn-timing',
    ]);
    for (const id of ids) expect(lessonById(id), id).toBeDefined();
  });

  it('reads a small document', () => {
    const doc = [
      '## Stage 1 — First game',
      '### L99-x-y',
      '- **Concept slugs:** `a` · **Rules:** CR 1-1',
      '- **Concept:** An *idea*.',
      '- **Drill:** Ten items.',
      '- **Exit (untimed):** 8 of 10.',
    ].join('\n');
    expect(parseLessons(doc)).toEqual([
      {
        id: 'L99-x-y',
        code: 'L99',
        title: 'X y',
        stage: 'Stage 1 — First game',
        slugs: 'a',
        rules: 'CR 1-1',
        concept: 'An idea.',
        drill: 'Ten items.',
        exit: '8 of 10.',
        exitTimed: '',
      },
    ]);
  });
});

describe('timeline cell names hold their visible words (WCAG 2.5.3)', () => {
  const turns = [{ turn: 2, player: 'p1' as const, startIndex: 0, life: { p1: 5, p2: 5 } }];
  const a = actorsOf(turns, 'p1', 'Rocks');
  it('a flagged turn still being analysed says "Not analysed yet"', () => {
    const name = cellName(2, a, [flag('target', 2, 'moderate')], undefined, true, false);
    expect(name.startsWith('Not analysed yet: ')).toBe(true);
  });
  it('two flags say "2 flags"', () => {
    const fs = [flag('target', 2, 'moderate'), flag('don-unused', 2, 'minor')];
    expect(cellName(2, a, fs, undefined, false, false).startsWith('2 flags: ')).toBe(true);
  });
  it('one finished flag has no prefix', () => {
    expect(cellName(2, a, [flag('target', 2, 'moderate')], undefined, false, false)).not.toMatch(
      /^(2 flags|Not analysed)/,
    );
  });
});
