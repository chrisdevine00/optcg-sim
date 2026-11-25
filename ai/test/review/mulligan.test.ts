/**
 * M8 WP2: the `mulligan` detector. A sourced guide judges the human's keep or redraw: E11 (a Rocks
 * hand with nothing to play before turn 5, kept) is a flag equal to the example; E10 (a keepable
 * Luffy hand, kept) is none; a redrawn keepable hand is the E10 explanation; a Leader with only the
 * default playbook, or a guide that cites no handbook entry, gives no flag.
 */
import { createGame, reduce, startRecord, appendAction } from '@optcg/engine';
import type { Action, PlayerId } from '@optcg/engine';
import { describe, expect, it, vi } from 'vitest';
import { PLAYBOOKS, playbookFor } from '../../src/playbook.ts';
import { counterValueOf } from '../../src/knowledge.ts';
import { chanceAtLeastOne, firstPlayableTurn, mulliganVerdict } from '../../src/search/mulligan.ts';
import { guideName, isSourced } from '../../src/search/review/mulligan.ts';
import { docExample } from '../support/doc.ts';
import { cardMap, lookup, metaDecks } from '../support.ts';
import { listOf } from '../support/scenario.ts';
import { atMulligan, findSeed } from './wp2-mulligan.ts';
import { contextOf, indexOf, run } from './wp2-support.ts';

vi.setConfig({ testTimeout: 120_000 });

const cards = cardMap();
const ROCKS = 'OP17-039';
const LUFFY = 'OP13-001';

const costOf = (id: string): number => cards.get(id)?.cost ?? 99;
const isChar = (id: string): boolean => cards.get(id)?.category === 'Character';
const rule = (leader: string) => playbookFor(leader, listOf(leader), cards).mulligan;
const verdictOf = (leader: string, hand: string[], first: boolean) =>
  mulliganVerdict(
    hand.map((id) => cards.get(id)),
    rule(leader),
    first,
  );

const flagFor = (leader: string, seed: number, first: boolean, redraw: boolean) => {
  const g = atMulligan(leader, seed, first);
  const ctx = contextOf(g.rec(redraw));
  const at = indexOf(ctx.record as never, (a) => a.type === 'mulligan' && a.player === 'p1');
  return { res: run('mulligan', ctx, at), at, ctx };
};

describe('E11: a hand the Rocks guide redraws, kept', () => {
  // The E11 shape: going first, nothing cheaper than 5 among the Characters, one counter card (+2000).
  const seed = findSeed(ROCKS, true, (h) => {
    const chars = h.filter(isChar).map(costOf);
    const counters = h.map((id) => counterValueOf(cards.get(id))).filter((v) => v > 0);
    return (
      !verdictOf(ROCKS, h, true).keep &&
      chars.length > 0 &&
      Math.min(...chars) === 5 &&
      counters.length === 1 &&
      counters[0] === 2000
    );
  });
  const { res, at } = flagFor(ROCKS, seed, true, false);
  const doc = docExample('E11');

  it('is a minor any-hand flag at the mulligan', () => {
    expect(res!.flags).toHaveLength(1);
    expect(res!.flags[0]).toMatchObject({
      kind: 'mulligan',
      severity: 'minor',
      certainty: 'any-hand',
      player: 'p1',
      decisionIndex: at,
      restoreIndex: at,
    });
    expect(res!.flags[0]!.practice).toBeUndefined();
    expect(res!.flags[0]!.did).toEqual([{ kind: 'keep', text: 'Kept your hand.' }]);
  });

  it('matches the E11 example: claim, outcome, nextTime, ids, certainty, sources, figures', () => {
    const e = res!.flags[0]!.explanation;
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
    // The doc's fourth row is leader-specific prose the guide's rule does not carry.
    expect(e.evidence.map((x) => x.figures)).toEqual(
      doc.evidence.slice(0, 3).map((x) => x.figures),
    );
    expect(e.evidence[0]!.text).toBe(doc.evidence[0]!.text);
    expect(e.evidence[2]!.text).toContain('It defends with one card:');
  });

  it('computes the figures: 18 early plays in 50 cards, a 90% chance, the DON!! schedule', () => {
    const e = res!.flags[0]!.explanation;
    expect(e.evidence[1]!.figures).toEqual({ earlyPlays: 18, deckSize: 50, chanceAtLeastOne: 0.9 });
    expect(chanceAtLeastOne(50, 18, 5)).toBeCloseTo(0.905, 3);
    expect([1, 3, 5, 6, 7].map((c) => firstPlayableTurn(c, true))).toEqual([1, 3, 5, 7, 7]);
    expect([1, 3, 5, 6].map((c) => firstPlayableTurn(c, false))).toEqual([2, 4, 6, 6]);
  });

  it('gives no flag when the player redrew it', () => {
    expect(flagFor(ROCKS, seed, true, true).res).toBeNull();
  });
});

describe('E10: a hand the Luffy guide keeps', () => {
  const seed = findSeed(LUFFY, true, (h) => verdictOf(LUFFY, h, true).keep);

  it('kept: no flag', () => {
    expect(flagFor(LUFFY, seed, true, false).res).toBeNull();
  });

  it('redrawn: a flag with the keep explanation (E10 shape)', () => {
    const { res } = flagFor(LUFFY, seed, true, true);
    expect(res!.flags).toHaveLength(1);
    const f = res!.flags[0]!;
    const doc = docExample('E10');
    expect(f).toMatchObject({ kind: 'mulligan', severity: 'minor', certainty: 'any-hand' });
    expect(f.explanation).toMatchObject({
      conceptId: 'mulligan',
      claim: doc.claim,
      nextTime: doc.nextTime,
      lessonId: doc.lessonId,
      certainty: 'any-hand',
      line: doc.line,
    });
    expect(f.explanation.sources).toContain('SH-MUL');
    expect(f.explanation.evidence.length).toBeGreaterThan(0);
    expect(f.did).toEqual([{ kind: 'redraw', text: 'Redrew all five.' }]);
  });
});

describe('who judges', () => {
  it('only a sourced guide: the default playbook and "no sourced rule" guides give no flag', () => {
    // A Leader of the same colours as Rocks with no guide: the same 50 cards, another Leader.
    const rocks = cards.get(ROCKS)!;
    const noGuide = [...cards.values()].find(
      (c) =>
        c.category === 'Leader' &&
        !PLAYBOOKS.has(c.id) &&
        c.colors.join() === rocks.colors.join() &&
        c.life === rocks.life,
    )!;
    expect(playbookFor(noGuide.id, listOf(ROCKS), cards).isDefault).toBe(true);
    const mine = { leader: noGuide.id, main: listOf(ROCKS) };
    const theirs = metaDecks().find((d) => d.leader === ROCKS)!;
    // Control: the same seed and hand, judged by the Rocks guide, is a flag.
    const seed = findSeed(ROCKS, true, (h) => !verdictOf(ROCKS, h, true).keep);
    expect(flagFor(ROCKS, seed, true, false).res!.flags).toHaveLength(1);
    const setup = { seed, decks: { p1: mine, p2: theirs }, chooser: 'p1' as PlayerId };
    const g = createGame({ ...setup, cards: lookup });
    const choose: Action = { type: 'chooseFirst', goFirst: true, player: 'p1' };
    let t = reduce(g.state, choose).state;
    let r = appendAction(startRecord({ setup }, g.state), choose, t);
    const act: Action = { type: 'mulligan', redraw: false, player: 'p1' };
    t = reduce(t, act).state;
    r = appendAction(r, act, t);
    const ctx = contextOf(r);
    const at = indexOf(ctx.record as never, (a) => a.type === 'mulligan' && a.player === 'p1');
    expect(run('mulligan', ctx, at)).toBeNull();
    const unsourced = [...PLAYBOOKS.values()].find((p) => !p.isDefault && !isSourced(p));
    expect(unsourced?.mulligan.source).toMatch(/no sourced rule/);
    expect(isSourced(playbookFor(ROCKS, listOf(ROCKS), cards))).toBe(true);
    expect(guideName(playbookFor(ROCKS, listOf(ROCKS), cards))).toBe('Rocks');
  });

  it('only the human seat is judged', () => {
    const seed = findSeed(ROCKS, true, (h) => !verdictOf(ROCKS, h, true).keep);
    const g = atMulligan(ROCKS, seed, true);
    const ctx = contextOf(g.rec(false), { p1: 'ai', p2: 'human' });
    const at = indexOf(ctx.record as never, (a) => a.type === 'mulligan' && a.player === 'p1');
    expect(run('mulligan', ctx, at)).toBeNull();
  });

  it('agrees with the verdict the Pirate AI uses (one rule)', () => {
    for (let seed = 1; seed < 40; seed++) {
      const g = atMulligan(ROCKS, seed, seed % 2 === 0);
      const keep = verdictOf(ROCKS, g.hand, seed % 2 === 0).keep;
      const flagged = flagFor(ROCKS, seed, seed % 2 === 0, !keep).res;
      expect(flagged, `seed ${seed}`).toBeNull();
      expect(flagFor(ROCKS, seed, seed % 2 === 0, keep).res?.flags).toHaveLength(1);
    }
  });
});
