/**
 * M9 WP3: the mulligan trainer. The bank is built at call time from the sourced lists; each item's
 * answer is the guide's rule (the function the Pirate AI and the review's flag share) and its text is
 * `explainMulligan`, extracted from the M8 detector without changing it (`review/mulligan.test.ts`
 * stays green and the extraction is compared with the detector's own flag below).
 */
import { describe, expect, it, vi } from 'vitest';
import { playbookFor } from '../src/playbook.ts';
import { MIN_BANK, bankFor } from '../src/search/drills/index.ts';
import { provideMulliganCards } from '../src/search/drills/bank-mulligan.ts';
import {
  deckOf,
  explainMulliganItem,
  handOf,
  judgeMulligan,
  metaListSets,
  mulliganBank,
  mulliganCoverage,
  mulliganLabel,
  verdictOf,
} from '../src/search/drills/mulligan.ts';
import { explainMulligan, isSourced } from '../src/search/review/mulligan.ts';
import { docExample } from './support/doc.ts';
import { cardMap } from './support.ts';
import { counterValueOf } from '../src/knowledge.ts';
import { atMulligan, findSeed } from './review/wp2-mulligan.ts';
import { contextOf, indexOf, run } from './review/wp2-support.ts';
import { mulliganVerdict } from '../src/search/mulligan.ts';
import { listOf } from './support/scenario.ts';

vi.setConfig({ testTimeout: 120_000 });

const cards = cardMap();
const sets = metaListSets();
const bank = mulliganBank(sets, cards);
const classOf = (id: string): 'keep' | 'redraw' => (id.endsWith('-keep') ? 'keep' : 'redraw');

describe('the mulligan bank', () => {
  it('has at least 20 items, both classes, and two or more per sourced guide', () => {
    expect(bank.length).toBeGreaterThanOrEqual(MIN_BANK);
    expect(new Set(bank.map((i) => classOf(i.id)))).toEqual(new Set(['keep', 'redraw']));
    const { sourced, unsourced } = mulliganCoverage(sets, cards);
    expect(sourced).toHaveLength(9);
    expect(unsourced.sort()).toEqual([
      'OP05-098-enel-yellow',
      'OP08-098-kalgara',
      'OP12-061-rosinante',
    ]);
    for (const id of sourced)
      expect(bank.filter((i) => i.archetypeId === id).length, id).toBeGreaterThanOrEqual(2);
    // Nothing for a guide with no sourced rule.
    for (const id of unsourced) expect(bank.filter((i) => i.archetypeId === id)).toEqual([]);
  });

  it('is deterministic: two builds are equal', () => {
    expect(mulliganBank(sets, cards)).toEqual(bank);
  });

  it('holds five real cards of the guide list per hand, with the guide label and any-hand certainty', () => {
    for (const i of bank) {
      expect(i.hand).toHaveLength(5);
      const list = deckOf(i, sets);
      for (const id of i.hand) expect(list, i.id).toContain(id);
      expect(i).toMatchObject({
        drill: 'mulligan',
        lesson: 'L12-mulligan',
        label: 'guide',
        certainty: 'any-hand',
        theirs: null,
      });
      expect(
        handOf(
          sets.find((s) => s.archetypeId === i.archetypeId)!.lists,
          (i.source as { seed: number }).seed,
        ),
      ).toEqual(i.hand);
    }
  });

  it("the judge is the guide's verdict: every item's class agrees, and the other answer is wrong", () => {
    for (const i of bank) {
      const keep = classOf(i.id) === 'keep';
      expect(judgeMulligan(i, !keep, cards, sets), i.id).toBe(true);
      expect(judgeMulligan(i, keep, cards, sets), i.id).toBe(false);
      expect(verdictOf(i, cards, sets).keep, i.id).toBe(keep);
    }
  });

  it('fails when the hand is swapped (revert check: a Keep item given a Redraw hand)', () => {
    const keep = bank.find((i) => classOf(i.id) === 'keep' && i.first)!;
    const redraw = bank.find(
      (i) => i.archetypeId === keep.archetypeId && classOf(i.id) === 'redraw' && i.first,
    );
    expect(redraw).toBeDefined();
    const swapped = { ...keep, hand: redraw!.hand };
    expect(judgeMulligan(swapped, false, cards, sets)).toBe(false);
  });

  it('labels each item "From the <guide> guide (sourced)"', () => {
    const rocks = bank.find((i) => i.archetypeId === 'OP17-039-rocks')!;
    expect(mulliganLabel(rocks, cards)).toBe('From the Rocks guide (sourced)');
  });

  it('is what bankFor serves once the cards are provided, and empty before', () => {
    expect(bankFor('mulligan').items).toEqual([]);
    provideMulliganCards(cards);
    expect(bankFor('mulligan').items).toEqual(bank);
  });
});

describe('the answer text is the M8 explanation, unchanged', () => {
  it('equals the detector flag for the same hand (the extraction moved code, not words)', () => {
    for (const [leader, first, want] of [
      ['OP17-039', true, 'redraw'],
      ['OP13-001', true, 'keep'],
    ] as const) {
      const set = sets.find((s) => s.leaderId === leader)!;
      const item = bank.find(
        (i) => i.archetypeId === set.archetypeId && i.first === first && classOf(i.id) === want,
      )!;
      const e = explainMulliganItem(item, cards, sets);
      expect(e.conceptId).toBe('mulligan');
      expect(e.certainty).toBe('any-hand');
      expect(e.claim).toBe(want === 'keep' ? 'Keep this hand.' : 'Redraw this hand.');
      // The detector, on a game where the player chose the other way, writes the same explanation.
      const seed = findSeed(leader, first, (h) => {
        const pb = playbookFor(leader, listOf(leader), cards);
        return (
          mulliganVerdict(
            h.map((id) => cards.get(id)),
            pb.mulligan,
            first,
          ).keep ===
          (want === 'keep')
        );
      });
      const g = atMulligan(leader, seed, first);
      const ctx = contextOf(g.rec(want === 'keep'));
      const at = indexOf(ctx.record as never, (a) => a.type === 'mulligan' && a.player === 'p1');
      const flag = run('mulligan', ctx, at)!.flags[0]!;
      const direct = explainMulligan({
        hand: g.hand.map((id) => cards.get(id)!),
        ownDeck: listOf(leader),
        pb: playbookFor(leader, listOf(leader), cards),
        first,
        cards,
      });
      expect(flag.explanation).toEqual(direct);
    }
  });

  it('E10: a keepable OP13-001 hand reads as the doc example', () => {
    const set = sets.find((s) => s.leaderId === 'OP13-001')!;
    const item = bank.find(
      (i) => i.archetypeId === set.archetypeId && i.first && classOf(i.id) === 'keep',
    )!;
    const e = explainMulliganItem(item, cards, sets);
    const doc = docExample('E10');
    for (const k of ['conceptId', 'claim', 'nextTime', 'lessonId', 'certainty'] as const)
      expect(e[k], k).toEqual(doc[k]);
    expect(e.line).toEqual(doc.line);
    expect(e.sources).toContain('SH-MUL');
    expect(e.evidence.length).toBeGreaterThan(0);
  });

  it('E11: a Rocks hand with nothing cheaper than 5 and one +2000 counter reads as the doc example', () => {
    const rocks = sets.find((s) => s.leaderId === 'OP17-039')!;
    const pb = playbookFor('OP17-039', listOf('OP17-039'), cards);
    const seed = findSeed('OP17-039', true, (h) => {
      const chars = h
        .map((id) => cards.get(id)!)
        .filter((c) => c.category === 'Character')
        .map((c) => c.cost ?? 99);
      const counters = h.map((id) => counterValueOf(cards.get(id))).filter((v) => v > 0);
      return (
        !mulliganVerdict(
          h.map((id) => cards.get(id)),
          pb.mulligan,
          true,
        ).keep &&
        chars.length > 0 &&
        Math.min(...chars) === 5 &&
        counters.length === 1 &&
        counters[0] === 2000
      );
    });
    const hand = atMulligan('OP17-039', seed, true).hand;
    const item = {
      ...bank.find((i) => i.archetypeId === rocks.archetypeId && i.first)!,
      hand,
      source: { kind: 'bank' as const, seed: 0 },
    };
    const e = explainMulliganItem(item, cards, [{ ...rocks, lists: [listOf('OP17-039')] }]);
    const doc = docExample('E11');
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
    expect(e.line).toEqual(doc.line);
    expect(e.evidence.map((x) => x.figures)).toEqual(
      doc.evidence.slice(0, 3).map((x) => x.figures),
    );
    expect(e.evidence[0]!.text).toBe(doc.evidence[0]!.text);
  });
});

describe('who has items', () => {
  it('only sourced guides: the default playbook gives no rule to teach', () => {
    for (const s of sets) {
      const sourced = isSourced(playbookFor(s.leaderId, s.lists[0], cards));
      expect(
        bank.some((i) => i.archetypeId === s.archetypeId),
        s.archetypeId,
      ).toBe(sourced);
    }
  });
});
