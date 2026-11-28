/**
 * M9 fix round (docs/reviews/m9-review.md, "Fix round"): the judge and the text of a counter item agree
 * (R3), the empty-hand premise is in every counter and DON!! answer (R6), and the DON!! menu holds the
 * mixed line and the three ways of marking a line best agree (R7).
 */
import { readFileSync } from 'node:fs';
import { project } from '@optcg/engine';
import { describe, expect, it, vi } from 'vitest';
import { donLedger } from '../src/coach/tempo.ts';
import { bankFor, type CounterItem, type DonItem } from '../src/search/drills/index.ts';
import { explainCounter, judgeCounter, type CounterChoice } from '../src/search/drills/counter.ts';
import {
  donBank,
  explainDon,
  judgeDonLine,
  replayLine,
  scoreLines,
} from '../src/search/drills/don.ts';
import {
  EMPTY_HAND_PREMISE,
  emptyOpponentHand,
  withHandPremise,
} from '../src/search/drills/hand-premise.ts';
import { candidateLines } from '../src/search/drills/lines.ts';
import { metaListSets } from '../src/search/drills/mulligan.ts';
import { applyAll, startOf } from '../src/search/drills/play.ts';
import { cardMap } from './support.ts';
import type { Explanation, Move } from '../src/explanation.ts';

vi.setConfig({ testTimeout: 600_000 });

const cards = cardMap();
const counters = bankFor('counter').items as CounterItem[];
const dons = bankFor('don').items as DonItem[];

/** What the answer text says about a choice: does it call it acceptable? (M9-R3) */
function textAccepts(ex: Explanation, item: CounterItem, choice: CounterChoice): boolean {
  const moves: Move[] = ex.line ?? [];
  if (item.judge === 'survive-turn') {
    // The line is the defence that survives; the claim says taking the hit lost.
    return choice === 'counter'
      ? moves.some((m) => m.kind === 'counter')
      : !/lost the game/.test(ex.claim);
  }
  // A take item: the take is the best line; a counter is accepted only by a line that does not call it weaker.
  const accepted = (kind: Move['kind']) =>
    moves.some((m) => m.kind === kind && !/^(Weaker|Not the best|Worse)/.test(m.text));
  return accepted(choice);
}

describe('R3: the counter judge and the answer text agree, over the whole bank', () => {
  it('every item: a choice the text accepts is a choice the judge accepts, and the reverse', () => {
    expect(counters.length).toBeGreaterThanOrEqual(20);
    for (const i of counters) {
      const ex = explainCounter(i, cards)!;
      expect(ex, i.id).not.toBeNull();
      for (const choice of ['counter', 'take'] as const)
        expect(textAccepts(ex, i, choice), `${i.id} ${choice}`).toBe(judgeCounter(i, choice));
    }
  });

  it('no take item says "Also fine" or offers a counter as a fine alternative', () => {
    for (const i of counters.filter((x) => x.expect === 'take')) {
      const ex = explainCounter(i, cards)!;
      for (const m of ex.line ?? []) {
        expect(m.text, i.id).not.toMatch(/also fine/i);
        if (m.kind === 'counter') expect(m.text, i.id).toMatch(/^Weaker/);
      }
    }
  });

  // Two take items from the bank as it stood before EB02-010 and OP18-021 were added (counter-1 and
  // counter-14, M9): the regenerated bank has no take item that shows a counter as the alternative,
  // so these two stay as a fixture and keep the "Weaker: ..." wording pinned.
  const takesWithCounterLine = JSON.parse(
    readFileSync(new URL('./fixtures/counter-weaker-items.json', import.meta.url), 'utf8'),
  ) as CounterItem[];

  it('the take items name the counter as the weaker play, with the cost', () => {
    expect(takesWithCounterLine.length).toBeGreaterThanOrEqual(2);
    for (const i of takesWithCounterLine) {
      const ex = explainCounter(i, cards)!;
      const alt = ex.line!.find((m) => m.kind === 'counter')!;
      expect(alt.text).toMatch(
        /^Weaker: add .* which stops it but spends \d cards to save 1 Life\.$/,
      );
      expect(judgeCounter(i, 'counter')).toBe(false);
    }
  });

  it('the checker has teeth: a take item whose text said "Also fine" would disagree with its judge', () => {
    const i = takesWithCounterLine[0]!;
    const ex = explainCounter(i, cards)!;
    const bad: Explanation = {
      ...ex,
      line: ex.line!.map((m) =>
        m.kind === 'counter' ? { ...m, text: `Also fine: ${m.text}` } : m,
      ),
    };
    expect(textAccepts(bad, i, 'counter')).toBe(true);
    expect(judgeCounter(i, 'counter')).toBe(false);
  });
});

describe('R6: counter and DON!! answers state the empty-opponent-hand premise', () => {
  const says = (ex: Explanation) => ex.evidence.some((e) => /no cards in hand/i.test(e.text));

  it('every bank position gives the opponent no cards in hand', () => {
    for (const i of [...counters, ...dons]) expect(emptyOpponentHand(i), i.id).toBe(true);
  });

  it('every counter answer says so, and the take-at-high-Life rule is conditional on it', () => {
    for (const i of counters) {
      const ex = explainCounter(i, cards)!;
      expect(says(ex), i.id).toBe(true);
      if (i.detector === 'counter-wasted-b')
        expect(ex.nextTime, i.id).toMatch(/^With nothing in their hand, /);
    }
  });

  it('every DON!! answer says so', () => {
    for (const i of dons) expect(says(explainDon(i, cards)), i.id).toBe(true);
  });

  it('an item whose opponent holds cards is left as it was (no premise to state)', () => {
    const i = counters[0]!;
    const ex = explainCounter(i, cards)!;
    const held = {
      ...i,
      scenario: { ...i.scenario, p2: { ...i.scenario.p2, hand: ['OP17-081'] } },
    };
    expect(withHandPremise(ex, held)).toBe(ex);
    expect(EMPTY_HAND_PREMISE).toMatch(/no cards in hand/);
  });
});

describe('R7: the DON!! menu holds the mixed line, and every mode reads the same best set', () => {
  it('some item offers "play what can be played, give the rest" and it is best there', () => {
    const mixed = dons.filter((i) => i.lines.some((l) => l.id === 'spend-give'));
    expect(mixed.length).toBeGreaterThan(0);
    for (const i of mixed) {
      const l = i.lines.find((x) => x.id === 'spend-give')!;
      expect(l.label, i.id).toMatch(/^Play .+ \(\d+\), give \d+ DON!! to .+, attack$/);
      expect(l.unused, i.id).toBe(Math.min(...i.lines.map((x) => x.unused)));
      expect(i.best, i.id).toContain('spend-give');
    }
  });

  it('where the mixed line is distinct from the lines already offered, the menu has it (it never beats the menu unseen)', () => {
    for (const i of dons.filter((x) => !x.hold)) {
      const start = applyAll(startOf(i.scenario, cards), i.prefix);
      const menu = candidateLines(start, 'p1', cards);
      const mixed = menu.find((l) => l.kind === 'spend-give');
      if (mixed) {
        expect(
          i.lines.map((l) => l.id),
          i.id,
        ).toContain('spend-give');
        expect(Math.min(...menu.map((l) => l.unused)), i.id).toBeLessThanOrEqual(mixed.unused);
      }
    }
  });

  it('Choose-a-line and board mode agree for every listed line: best set = lines at the least unused', () => {
    for (const i of dons) {
      const min = Math.min(...i.lines.map((l) => l.unused));
      for (const l of i.lines) {
        // The line judge, and the board judge (`endLedger <= unusedMin` with unusedMin = min).
        expect(judgeDonLine(i, l.id), `${i.id} ${l.id}`).toBe(l.unused <= min);
        const { end } = replayLine(i, l.id, cards);
        expect(donLedger(project(end, 'p1'), cards).unused <= min, `${i.id} ${l.id}`).toBe(
          judgeDonLine(i, l.id),
        );
      }
    }
  });

  it('a menu whose only wrong line is "hold everything" is not an item', () => {
    const start = applyAll(startOf(dons[0]!.scenario, cards), dons[0]!.prefix);
    const lines = candidateLines(start, 'p1', cards);
    const onlyHold = lines.map((l) => (l.kind === 'hold' ? l : { ...l, unused: 0 }));
    expect(scoreLines(onlyHold)).toBeNull();
  });

  it('keeps at least 20 items and at most half are "give everything" alone', () => {
    expect(dons.length).toBeGreaterThanOrEqual(20);
    const giveOnly = dons.filter(
      (i) => !i.hold && i.best.length === 1 && i.best[0] === 'give-attack',
    );
    expect(giveOnly.length).toBeLessThanOrEqual(Math.floor(dons.length / 2));
  });

  it('is what the generator writes (pinned lists)', () => {
    expect(JSON.parse(JSON.stringify(donBank(metaListSets(), cards)))).toEqual(dons);
  });
});
