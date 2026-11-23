/**
 * The effect tagger and coverage measurement (E-D10): tagger patterns on real card text, the coverage
 * arithmetic on a small synthetic pool, backlog order, determinism, and a staleness check on the
 * committed `cards/data/coverage-report.json`.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Card } from '../src/schema.ts';
import { generateReport, REPORT_PATH } from '../scripts/measure-effects.ts';
import { formatTable } from '../scripts/coverage-report.ts';
import {
  analyse,
  cardTags,
  features,
  formatReport,
  loadWeights,
  measure,
  normalize,
  resolveTag,
  splitAbilities,
  splitClauses,
  type CoverageReport,
} from '../scripts/measure.ts';

const prims = (text: string) => features(analyse(text)).prims;

describe('tagger patterns (real card text)', () => {
  const cases: Array<[string, string, string[]]> = [
    ['draw', '[On Play] Draw 2 cards and trash 1 card from your hand.', ['draw', 'trashFromHand']],
    ['draw', '[Main] Draw 1 card.', ['draw']],
    [
      'powerMod',
      '[When Attacking] Up to 1 of your Characters gains +2000 power during this turn.',
      ['powerMod'],
    ],
    [
      'powerMod',
      "[On Play] Give up to 1 of your opponent's Characters -3000 power during this turn.",
      ['powerMod'],
    ],
    [
      'ko',
      "[On Play] K.O. up to 1 of your opponent's Characters with a cost of 3 or less.",
      ['ko'],
    ],
    ['ko', "[Main] K.O. up to 2 of your opponent's rested Characters.", ['ko']],
    [
      'lookAtTop',
      '[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Straw Hat Crew} type card and add it to your hand. Then, place the rest at the bottom of your deck in any order.',
      ['lookAtTop'],
    ],
    [
      'addDon',
      '[Main] Add up to 1 DON!! card from your DON!! deck and set it as active.',
      ['addDon'],
    ],
    ['addDon', '[On Play] Add up to 2 DON!! cards from your DON!! deck and rest them.', ['addDon']],
    [
      'giveDon',
      '[Activate: Main] Give up to 2 rested DON!! cards to 1 of your Leader or Character cards.',
      ['giveDon'],
    ],
    [
      'rest',
      "[On Play] Rest up to 1 of your opponent's Characters with a cost of 4 or less.",
      ['rest'],
    ],
    [
      'move',
      "[On Play] Return up to 1 of your opponent's Characters with a cost of 3 or less to the owner's hand.",
      ['move'],
    ],
    [
      'move',
      '[Trigger] Add up to 1 card from the top of your deck to the top of your Life cards.',
      ['move'],
    ],
    [
      'play',
      '[On Play] Play up to 1 Character card with a cost of 3 or less from your hand.',
      ['play'],
    ],
    ['play', '[Trigger] Play this card.', ['play']],
    [
      'costMod',
      "[On Play] Give up to 1 of your opponent's Characters -3 cost during this turn.",
      ['costMod'],
    ],
    ['setActive', '[Main] Set up to 1 of your Characters as active.', ['setActive']],
    [
      'grantKeyword',
      '[Main] Up to 1 of your Characters gains [Rush] during this turn.',
      ['grantKeyword'],
    ],
    ['restrict', "[Your Turn] This Character cannot be K.O.'d in battle.", ['restrict:cannotBeKO']],
    [
      'chooseOne',
      "[Main] Choose one: • Draw 1 card. • K.O. up to 1 of your opponent's Characters with a cost of 2 or less.",
      ['chooseOne', 'draw', 'ko'],
    ],
    [
      'negateEffects',
      "[On Play] Negate the effects of up to 1 of your opponent's Characters during this turn.",
      ['negateEffects'],
    ],
    ['returnDon', '[On K.O.] Return 1 of your DON!! cards to your DON!! deck.', ['returnDon']],
  ];
  it.each(cases)('%s: %s', (_n, text, expected) => {
    const got = prims(text);
    for (const p of expected) expect(got).toContain(p);
  });

  it('repairs a dropped minus sign (the sign rule)', () => {
    const n = normalize("Give up to 1 of your opponent's Characters 2000 power during this turn.");
    expect(n.text).toContain('-2000 power');
    expect(n.fixes).toEqual(['sign:power -2000']);
    expect(normalize('NULL')).toEqual({ text: '', fixes: ['blank:NULL'] });
  });

  it('splits abilities at tag boundaries and clauses at sentence ends', () => {
    const abs = splitAbilities(
      '[On Play] Draw 1 card. [When Attacking] [Once Per Turn] Draw 1 card. Then, trash 1 card.',
    );
    expect(abs.map(([t]) => t)).toEqual([['[On Play]'], ['[When Attacking]', '[Once Per Turn]']]);
    expect(splitClauses('Draw 1 card. Then, trash 1 card from your hand. K.O. it.')).toEqual([
      'Draw 1 card.',
      'Then, trash 1 card from your hand.',
      'K.O. it.',
    ]);
  });

  it('reads costs and timings', () => {
    const a = analyse(
      '[Activate: Main] [Once Per Turn] DON!! -2 (You may return the specified number of DON!! cards from your field to your DON!! deck.): Draw 1 card.',
    );
    expect(features(a).costs).toContain('cost:donMinus');
    const b = analyse(
      '[On Play] ① (You may rest the specified number of DON!! cards in your cost area.): Draw 1 card.',
    );
    expect(features(b).timings).toContain('onPlay');
    expect(
      analyse(
        "If your Leader's type includes {Whitebeard Pirates}, this Character gains [Blocker].",
      ).abilities[0]!.timings,
    ).toEqual(['permanent']);
  });

  it('maps tagger primitives onto the implemented DSL names, and says unknown when unclear', () => {
    expect(resolveTag('powerMod')).toEqual({ kind: 'action', dsl: 'power', implemented: 'yes' });
    expect(resolveTag('cost:donMinus')).toEqual({
      kind: 'cost',
      dsl: 'donMinus',
      implemented: 'yes',
    });
    expect(resolveTag('timing:onKO')).toEqual({ kind: 'timing', dsl: 'onKO', implemented: 'yes' });
    expect(resolveTag('restrict:cannotPlay')).toEqual({
      kind: 'restriction',
      dsl: null,
      implemented: 'unknown',
    });
    expect(resolveTag('damage').implemented).toBe('unknown');
    expect(cardTags(features(analyse('[On Play] Draw 1 card.')))).toEqual([
      'draw',
      'timing:onPlay',
    ]);
  });
});

let seq = 0;
function mk(over: Partial<Card> & { id: string }): Card {
  seq++;
  return {
    name: over.id,
    category: 'Character',
    colors: ['Red'],
    cost: 1,
    power: 1000,
    counter: null,
    life: null,
    attributes: [],
    types: [],
    rarity: 'C',
    set: 'OP-17',
    block: 5,
    effectText: '',
    triggerText: null,
    keywords: [],
    verified: false,
    verifiedBy: [],
    textFixes: [],
    artworks: [],
    legality: { standard: { status: 'legal' }, extra: { status: 'legal' } },
    sourceUrl: `x/${seq}`,
    fetchedAt: '2026-01-01T00:00:00Z',
    ...over,
  };
}
const legality = (status: 'legal' | 'banned' | 'restricted' | 'rotated' | 'unknown') => ({
  standard: { status },
  extra: { status: 'legal' as const },
});

describe('coverage arithmetic', () => {
  const cards: Card[] = [
    mk({ id: 'OP17-001', category: 'Leader', effectText: '[On Play] Draw 1 card.' }), // unscripted leader
    mk({ id: 'OP17-002', effectText: '[On Play] Draw 1 card.' }), // scripted
    mk({ id: 'OP17-003' }), // vanilla
    mk({
      id: 'OP17-004',
      effectText: "[On Play] K.O. up to 1 of your opponent's Characters with a cost of 1 or less.",
    }),
    mk({ id: 'OP17-005', effectText: '[Blocker]', keywords: ['Blocker'], verified: true }), // keywords
    mk({ id: 'OP17-006', triggerText: 'Play this card.' }), // unscripted via trigger
    mk({ id: 'OP13-001', set: 'OP-13', block: 4, effectText: '[On Play] Draw 1 card.' }),
    mk({ id: 'OP13-002', set: 'OP-13', block: 4, effectText: '[On Play] Draw 1 card.' }),
    mk({ id: 'OP03-001', set: 'OP-03', block: 2, effectText: '[On Play] Draw 1 card.' }),
    mk({ id: 'OP01-001', set: 'OP-01', block: 1, legality: legality('rotated'), effectText: 'x' }),
    mk({ id: 'OP03-002', set: 'OP-03', block: 2, legality: legality('banned'), effectText: 'x' }),
    mk({ id: 'OP03-003', set: 'OP-03', block: 2, legality: legality('restricted') }),
    mk({ id: 'P-001', set: 'P', block: null, legality: legality('unknown'), effectText: 'x' }),
  ];
  const weights = new Map([
    ['OP13-002', 7],
    ['OP17-004', 3],
    ['OP17-006', 5],
    ['OP03-001', 100],
  ]);
  const report = measure({
    cards,
    scripted: new Set(['OP17-002']),
    weights,
    weightSource: 'test',
    asOf: '2026-01-01T00:00:00Z',
  });

  it('counts Standard cards (legal and restricted) and lists unknown separately', () => {
    const o = report.standard.overall;
    // 13 cards minus rotated, banned and unknown = 10 (nine legal, one restricted).
    expect(o.total).toBe(10);
    expect(o).toMatchObject({
      scripted: 1,
      vanilla: 2,
      keywords: 1,
      unscripted: 6,
      playingFully: 4,
    });
    expect(o.pct).toBe(40);
    expect(report.standard.unknown).toEqual({ count: 1, ids: ['P-001'] });
  });

  it('breaks coverage down per block and per set', () => {
    expect(Object.keys(report.standard.byBlock)).toEqual(['2', '4', '5']);
    expect(report.standard.byBlock['5']).toMatchObject({ total: 6, playingFully: 3, pct: 50 });
    expect(report.standard.byBlock['4']).toMatchObject({ total: 2, playingFully: 0, pct: 0 });
    expect(report.standard.byBlock['2']).toMatchObject({ total: 2, vanilla: 1, unscripted: 1 });
    expect(Object.keys(report.standard.bySet)).toEqual(['OP-03', 'OP-13', 'OP-17']);
  });

  it('orders the backlog: block 5, 4, 3 and block 2 last and held; leaders first; then weight', () => {
    expect(report.backlog.map((e) => e.id)).toEqual([
      'OP17-001', // block 5, newest set, leader first
      'OP17-006', // weight 5
      'OP17-004', // weight 3
      'OP13-002', // block 4, weight 7
      'OP13-001',
      'OP03-001', // block 2 last despite weight 100
    ]);
    expect(report.backlog.filter((e) => e.held).map((e) => e.id)).toEqual(['OP03-001']);
    expect(report.backlog.every((e) => e.status === 'unscripted')).toBe(true);
  });

  it('builds the gap list with card counts, weights and the implemented flag', () => {
    const g = (p: string) => report.gaps.find((x) => x.primitive === p)!;
    expect(g('draw')).toMatchObject({ cards: 4, weight: 107, dsl: 'draw', implemented: 'yes' });
    expect(g('ko')).toMatchObject({ cards: 1, weight: 3 });
    expect(g('play')).toMatchObject({ cards: 1, weight: 5 });
    // The scripted card does not count toward a gap.
    expect(g('timing:onPlay').cards).toBe(5);
    expect(report.gaps[0]!.primitive).toBe('timing:onPlay');
  });

  it('computes the clause tag rate over every card', () => {
    // 9 effect cards with one clause each; the 'x' cards are untagged clauses (3 of them).
    expect(report.tagger.clauses).toBe(10);
    expect(report.tagger.clausesTagged).toBe(7);
    expect(report.tagger.clauseTagRate).toBe(70);
  });

  it('is deterministic and key-sorted', () => {
    const a = formatReport(report);
    const b = formatReport(
      measure({
        cards: [...cards].reverse().sort((x, y) => (x.id < y.id ? -1 : 1)),
        scripted: new Set(['OP17-002']),
        weights,
        weightSource: 'test',
        asOf: '2026-01-01T00:00:00Z',
      }),
    );
    expect(a).toBe(b);
    expect(a.indexOf('"asOf"')).toBeLessThan(a.indexOf('"backlog"'));
    expect(a.indexOf('"backlog"')).toBeLessThan(a.indexOf('"standard"'));
    expect(JSON.parse(a)).toEqual(JSON.parse(JSON.stringify(report)));
  });

  it('prefers play-frequency over the meta fallback, and falls back to weight 0', () => {
    const pf = loadWeights({ cards: [{ id: 'A', copies: 4 }] }, null);
    expect(pf.weights.get('A')).toBe(4);
    const meta = loadWeights(null, {
      archetypes: [{ lists: [{ leader: 'L', main: [{ id: 'A', count: 3 }] }] }],
    });
    expect([meta.weights.get('L'), meta.weights.get('A')]).toEqual([1, 3]);
    expect(loadWeights(null, null).weights.size).toBe(0);
  });
});

describe('committed coverage report', () => {
  it('is up to date with the card data, scripts and weights (run `npm run cards:measure`)', () => {
    expect(readFileSync(REPORT_PATH, 'utf8') === generateReport()).toBe(true);
  });

  it('reports a clause tag rate near the Track E figure and prints a table', () => {
    const r = JSON.parse(readFileSync(REPORT_PATH, 'utf8')) as CoverageReport;
    expect(r.tagger.clauseTagRate).toBeGreaterThan(97);
    expect(formatTable(r)).toContain('overall');
  });
});
