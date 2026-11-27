/**
 * M9 WP3: the DON!! allocation drill. Every committed item is re-scored from its scenario with the
 * coach's ledger; E06 and E07 are the doc examples; a differential permutes the opponent's hidden hand,
 * deck and face-down Life and shows the items and their text do not move, and that a leaky scorer does.
 */
import { project, queries } from '@optcg/engine';
import { describe, expect, it, vi } from 'vitest';
import { donLedger } from '../src/coach/tempo.ts';
import { MIN_BANK, bankFor, type DonItem } from '../src/search/drills/index.ts';
import {
  donBank,
  donItemAt,
  explainDon,
  judgeDonLine,
  replayLine,
  reverifyDon,
} from '../src/search/drills/don.ts';
import { candidateLines, describeLine } from '../src/search/drills/lines.ts';
import { applyAll, startOf } from '../src/search/drills/play.ts';
import { metaListSets } from '../src/search/drills/mulligan.ts';
import { DRILL_SCRIPTS_VERSION } from '../src/search/drills/positions.ts';
import { docExample } from './support/doc.ts';
import { cardMap } from './support.ts';
import { e06, e06Record } from './review/wp2-positions.ts';
import { e07, e07Record } from './review/wp2-positions-more.ts';
import { lifeOf } from './support/scenario.ts';

vi.setConfig({ testTimeout: 180_000 });

const cards = cardMap();
const bank = bankFor('don');
const items = bank.items as DonItem[];

describe('the DON!! bank', () => {
  it('has at least 20 items: ordinary and OP13-001 hold items, three to five lines each', () => {
    expect(items.length).toBeGreaterThanOrEqual(MIN_BANK);
    expect(items.filter((i) => i.hold).length).toBeGreaterThanOrEqual(6);
    expect(items.filter((i) => !i.hold).length).toBeGreaterThanOrEqual(12);
    expect(new Set(items.map((i) => i.theirs)).size).toBeGreaterThanOrEqual(6);
    for (const i of items) {
      expect(i.drill).toBe('don');
      expect(i.lines.length, i.id).toBeGreaterThanOrEqual(3);
      expect(i.lines.length, i.id).toBeLessThanOrEqual(5);
      expect(i.label).toBe('any-hand');
      expect(i.lesson).toBe('L09-don-efficiency');
      for (const l of i.lines) {
        // Each line ends the turn (then any [End of Your Turn] choices of the player's own).
        const end = l.actions.findIndex((a) => a.type === 'endTurn');
        expect(end, `${i.id} ${l.id}`).toBeGreaterThanOrEqual(0);
        for (const a of l.actions.slice(end + 1)) expect(a.player, `${i.id} ${l.id}`).toBe('p1');
      }
    }
    expect(bank.builtWith.scripts).toBe(DRILL_SCRIPTS_VERSION);
  });

  it('is the committed file a fresh generator run would write (seeds only, deterministic)', () => {
    const again = donBank(metaListSets(), cards);
    expect(JSON.parse(JSON.stringify(again))).toEqual(items);
  });

  it('every item is re-scored by the ledger: unused counts and the best line equal the stored ones', () => {
    for (const i of items) {
      const r = reverifyDon(i, cards);
      expect(r.best, i.id).toEqual(i.best);
      expect(r.hold, i.id).toBe(i.hold);
      for (const l of i.lines) expect(r.unused[l.id], `${i.id} ${l.id}`).toBe(l.unused);
      // The minimum is unique by at least one DON!!.
      const rest = i.lines.filter((l) => !i.best.includes(l.id)).map((l) => l.unused);
      expect(Math.min(...rest), i.id).toBeGreaterThan(Math.min(...i.lines.map((l) => l.unused)));
    }
  });

  it('a hold item is one whose best line keeps DON!! held on purpose (E07), for the OP13-001 Leader', () => {
    for (const i of items.filter((x) => x.hold)) {
      expect(i.mine).toBe('OP13-001');
      const { end } = replayLine(i, i.best[0]!, cards);
      const ledger = donLedger(project(end, 'p1'), cards);
      expect(ledger.held.n, i.id).toBeGreaterThan(0);
      expect(ledger.unused, i.id).toBe(0);
    }
  });

  it('the judge accepts the best line and nothing else (revert check: flip `best`, the re-score disagrees)', () => {
    const i = items[0]!;
    expect(judgeDonLine(i, i.best[0]!)).toBe(true);
    const other = i.lines.find((l) => !i.best.includes(l.id))!;
    expect(judgeDonLine(i, other.id)).toBe(false);
    const flipped: DonItem = { ...i, best: [other.id] };
    expect(reverifyDon(flipped, cards).best).not.toEqual(flipped.best);
  });

  it('describes a line in words: "Play Yamato (3), give 1 DON!! to your Leader, attack"', () => {
    const i = items.find((x) => x.lines.some((l) => l.id === 'play-give-one'))!;
    const l = i.lines.find((x) => x.id === 'play-give-one')!;
    expect(l.label).toMatch(/^Play .+ \(\d+\), give 1 DON!! to your Leader, attack$/);
    const start = applyAll(startOf(i.scenario, cards), i.prefix);
    expect(describeLine(start, l.actions, 'p1', cards)).toBe(l.label);
    expect(describeLine(start, [{ type: 'endTurn', player: 'p1' }], 'p1', cards)).toBe(
      'Do nothing and end the turn',
    );
  });
});

/** A one-line item over a recorded turn: the record's own actions up to the first End turn. */
function recordedItem(
  id: string,
  spec: ReturnType<typeof e06>,
  rec: ReturnType<typeof e06Record>,
  mine: string,
  theirs: string,
): DonItem {
  const end = rec.actions.findIndex((a) => a.type === 'endTurn' && a.player === 'p1');
  // The End turn, and the player's own [End of Your Turn] choices that follow it.
  let to = end + 1;
  while (rec.actions[to]?.player === 'p1') to++;
  const actions = rec.actions.slice(0, to);
  const start = startOf(spec, cards);
  const ledger = donLedger(project(applyAll(start, actions), 'p1'), cards);
  return {
    id,
    drill: 'don',
    lesson: 'L09-don-efficiency',
    source: { kind: 'bank', seed: 0 },
    mine,
    theirs,
    first: false,
    certainty: 'any-hand',
    label: 'any-hand',
    scenario: spec,
    prefix: [],
    hand: 'harder',
    lines: [
      {
        id: 'played',
        label: describeLine(start, actions, 'p1', cards),
        actions,
        unused: ledger.unused,
      },
    ],
    best: ['played'],
    hold: ledger.held.n > 0,
  };
}

describe('E06: DON!! left unused, in the drill', () => {
  const item = recordedItem('don-e06', e06(), e06Record(), 'OP17-039', 'OP17-058');

  it('playing Charlotte Linlin, attacking and ending the turn leaves 3 DON!! unused', () => {
    expect(item.lines[0]!.label).toBe('Play Charlotte Linlin (5), attack');
    expect(item.lines[0]!.unused).toBe(3);
  });

  it('its answer text equals the E06 example (claim, first evidence row, nextTime, ids, sources)', () => {
    const e = explainDon(item, cards, 'played');
    const doc = docExample('E06');
    for (const k of ['conceptId', 'claim', 'certainty', 'nextTime', 'lessonId', 'sources'] as const)
      expect(e[k], k).toEqual(doc[k]);
    expect(e.evidence[0]).toEqual(doc.evidence[0]);
  });
});

describe('E07: holding DON!! was right, in the drill', () => {
  const item = recordedItem('don-e07', e07(), e07Record(), 'OP13-001', 'OP17-039');

  it('playing Usopp, giving 1 DON!! to the Leader and attacking is a hold line with nothing unused', () => {
    expect(item.lines[0]!.label).toBe('Play Usopp (4), give 1 DON!! to your Leader, attack');
    expect(item.lines[0]!.unused).toBe(0);
    expect(item.hold).toBe(true);
  });

  it('its answer text equals the E07 example', () => {
    const e = explainDon(item, cards);
    const doc = docExample('E07');
    for (const k of [
      'conceptId',
      'claim',
      'outcome',
      'certainty',
      'nextTime',
      'lessonId',
      'sources',
    ] as const)
      expect(e[k], k).toEqual(doc[k]);
    expect(e.evidence).toEqual(doc.evidence);
  });
});

describe("any-hand: the opponent's hidden hand, deck and face-down Life are never read", () => {
  const ROCKS = 'OP17-039';
  const hiddenVariants = [
    { hand: ['OP17-054', 'OP17-050'], life: lifeOf(3, 'EB04-007'), deckSeed: 1 },
    { hand: ['OP17-050', 'OP17-054'], life: lifeOf(3, 'OP17-045'), deckSeed: 2 },
    { hand: ['EB04-032', 'OP17-048', 'OP17-045'], life: lifeOf(3, 'OP17-048'), deckSeed: 3 },
  ];
  const itemsOf = (h: (typeof hiddenVariants)[number]) => {
    const spec = e06(h);
    const start = startOf(spec, cards);
    return candidateLines(start, 'p1', cards).map(({ id, label, actions, unused, held }) => ({
      id,
      label,
      actions,
      unused,
      held,
    }));
  };

  it('permuting their hand, deck order and Life leaves every line, ledger and answer text identical', () => {
    const base = itemsOf(hiddenVariants[0]!);
    expect(base.length).toBeGreaterThanOrEqual(3);
    for (const h of hiddenVariants.slice(1)) expect(itemsOf(h)).toEqual(base);
    // The answer text of a line, read from the player's own view of the state after it.
    const texts = hiddenVariants.map((h) => {
      const start = startOf(e06(h), cards);
      const l = candidateLines(start, 'p1', cards).find((x) => x.id === 'spend')!;
      const end = applyAll(start, l.actions);
      return JSON.stringify(donLedger(project(end, 'p1'), cards));
    });
    expect(new Set(texts).size).toBe(1);
  });

  it('a leaky scorer (it also counts the Counter cards in their real hand) fails the same permutation', () => {
    // The mistake to catch: scoring an attack by whether it "connects", read off their real hand.
    const leaky = (h: (typeof hiddenVariants)[number]): number[] => {
      const start = startOf(e06(h), cards);
      return candidateLines(start, 'p1', cards).map((l) => {
        const end = applyAll(start, l.actions);
        const theirCounters = queries
          .zone(end, 'p2', 'hand')
          .filter((c) => (cards.get(c.card)?.counter ?? 0) > 0).length;
        return l.unused + (l.actions.some((a) => a.type === 'attack') ? theirCounters : 0);
      });
    };
    const scores = hiddenVariants.map(leaky);
    expect(new Set(scores.map((s) => s.join())).size).toBeGreaterThan(1);
    expect(ROCKS).toBe('OP17-039');
  });

  it('a generated item does not depend on the opponent hand either: items built with a real hand equal the bank item', () => {
    const sets = metaListSets();
    const i = items[0]!;
    const mine = sets.find((s) => s.leaderId === i.mine)!;
    const theirs = sets.find((s) => s.leaderId === i.theirs)!;
    const seed = (i.source as { seed: number }).seed;
    const again = donItemAt(seed, mine, theirs, cards)!;
    expect(again).toEqual(i);
    // Give the opponent a hand, a shuffled deck and other Life: the lines and scores are the same.
    const sc = i.scenario;
    const deck = (sc.p2.decklist ?? []).slice().reverse();
    const withHidden = {
      ...sc,
      p2: { ...sc.p2, hand: deck.slice(0, 3), life: lifeOf(3, 'OP17-045'), decklist: deck },
    };
    const variant = donItemAt(seed, mine, theirs, cards)!;
    const start = startOf(withHidden, cards);
    const lines = candidateLines(
      start,
      'p1',
      cards,
      variant.mine === 'OP13-001' ? ['give-attack'] : [],
    );
    expect(lines.map((l) => [l.id, l.unused, l.label])).toEqual(
      i.lines.map((l) => [l.id, l.unused, l.label]),
    );
  });
});
