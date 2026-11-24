/**
 * M6b-7: the AI plays with and against any Leader. `playbookFor` and `priorFor` are never null: a
 * Leader with no guide gets the default playbook (built from the AI's deck) and a synthetic prior
 * from play frequency.
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import {
  counterValueOf,
  defaultPlaybook,
  PLAYBOOKS,
  playbookFor,
  priorCardIds,
  priorFor,
} from '../src/index.ts';
import { cardMap, metaDecks } from './support.ts';
import { playMatch } from './support/match.ts';

const META = new Set(metaDecks().map((d) => d.leader));
const TEACH = 'OP09-081';

const standardOk = (c: Card) => ['legal', 'restricted'].includes(c.legality.standard.status);

describe('the prior for any Leader', () => {
  it('meta Leaders keep their sourced lists', () => {
    for (const leader of META) {
      const p = priorFor(leader);
      expect(p.synthetic).toBeUndefined();
      expect(p.pool).toBeUndefined();
      expect(p.lists.length).toBeGreaterThan(0);
    }
  });

  it('a non-meta Leader gets a synthetic prior of legal cards in its colours', () => {
    const cards = cardMap();
    const leaders = [...cards.values()].filter(
      (c) => c.category === 'Leader' && !META.has(c.id) && standardOk(c),
    );
    expect(leaders.length).toBeGreaterThan(50);
    expect(leaders.some((l) => l.id === TEACH)).toBe(true);
    for (const leader of leaders) {
      const p = priorFor(leader.id);
      expect(p.synthetic).toBe(true);
      expect(p.lists).toHaveLength(3);
      expect(p.pool!.length).toBeGreaterThan(0);
      for (const id of priorCardIds(leader.id)) {
        const c = cards.get(id)!;
        expect(c.category, id).not.toBe('Leader');
        expect(standardOk(c), id).toBe(true);
        // CR 5-1-2-2: every colour of the card is one of the Leader's.
        expect(
          c.colors.every((x) => leader.colors.includes(x)),
          `${id} in ${leader.id}`,
        ).toBe(true);
      }
      for (const l of p.lists) {
        const size = l.cards.reduce((t, c) => t + c.count, 0);
        expect(size, leader.id).toBeLessThanOrEqual(50);
        for (const c of l.cards) {
          expect(c.count).toBeGreaterThanOrEqual(1);
          expect(c.count).toBeLessThanOrEqual(cards.get(c.id)!.legality.standard.limit ?? 4);
        }
      }
    }
  });

  it('most Leaders get full 50-card guesses, different from each other', () => {
    const p = priorFor(TEACH);
    expect(p.lists.map((l) => l.cards.reduce((t, c) => t + c.count, 0))).toEqual([50, 50, 50]);
    const [a, b] = p.lists.map((l) => JSON.stringify(l.cards));
    expect(a).not.toBe(b);
    expect(p.lists.map((l) => l.weight)).toEqual([3, 2, 1]);
  });

  it('an unknown Leader gets a prior too (every colour: a wide pool)', () => {
    const p = priorFor('ZZ99-001');
    expect(p.synthetic).toBe(true);
    expect(p.pool!.length).toBeGreaterThan(100);
  });
});

describe('the default playbook', () => {
  const cards = cardMap();
  const deckOf = (ids: string[]) => ids.flatMap((id) => [id, id, id, id]);

  it('is returned for every Leader without a guide, never null', () => {
    for (const leader of META) expect(playbookFor(leader)).toBe(PLAYBOOKS.get(leader));
    expect(PLAYBOOKS.has(TEACH)).toBe(false);
    const pb = playbookFor(TEACH, [], cards);
    expect(pb.isDefault).toBe(true);
    expect(pb.aiName).toBe(cards.get(TEACH)!.name);
    expect(pb.goFirst).toBe(false);
    expect(pb.faceBias).toEqual({ early: 1, mid: 1, late: 1 });
    expect(pb.counterAggression).toBe(1);
    expect(pb.cardValue).toEqual({});
    expect(pb.weights).toEqual({});
    expect(pb.biases).toEqual([]);
    expect(pb.assertions).toEqual([]);
    expect(playbookFor('ZZ99-001').aiName).toBe('The AI');
  });

  const chars = [...cards.values()].filter((c) => c.category === 'Character');
  const early = chars.filter((c) => (c.cost ?? 9) >= 1 && (c.cost ?? 9) <= 3).slice(0, 3);
  const late = chars.filter((c) => (c.cost ?? 0) >= 6 && (c.counter ?? 0) === 0).slice(0, 4);
  const defence = chars.find((c) => (c.cost ?? 0) >= 6 && (c.counter ?? 0) >= 1000)!;
  const deck = [...deckOf([...early, ...late, defence].map((c) => c.id))];

  it('builds its mulligan pieces from the AI’s own deck', () => {
    const pb = defaultPlaybook(TEACH, deck, cards);
    const [e, d] = pb.mulligan.pieces;
    expect(e!.name).toBe('early');
    expect(e!.cards!.sort()).toEqual(early.map((c) => c.id).sort());
    expect(d!.name).toBe('defence');
    expect(d!.cards).toBeUndefined();
    expect(pb.mulligan.requireGoingFirst).toEqual(['early']);
    expect(pb.mulligan.secondShort).toBe(1);
    expect(pb.mulligan.source).toMatch(/S9.*S17/);
  });

  it('a deck without early plays or Counters has no such piece (and keeps)', () => {
    const pb = defaultPlaybook(TEACH, deckOf(late.map((c) => c.id)), cards);
    expect(pb.mulligan.pieces).toEqual([]);
    expect(pb.mulligan.requireGoingFirst).toEqual([]);
    expect(counterValueOf(cards.get(late[0]!.id))).toBe(0);
  });
});

describe('the default mulligan on real opening hands', () => {
  const cards = cardMap();
  // A deck around a non-meta Leader whose Characters have both early plays and Counters.
  const leader = cards.get(TEACH)!;
  const pool = [...cards.values()].filter(
    (c) =>
      c.category === 'Character' &&
      c.colors.every((x) => leader.colors.includes(x)) &&
      c.legality.standard.status === 'legal',
  );
  const picks = [
    ...pool.filter((c) => (c.cost ?? 0) <= 3).slice(0, 4),
    ...pool.filter((c) => (c.cost ?? 0) >= 5).slice(0, 9),
  ];
  const main = picks.flatMap((c) => [c.id, c.id, c.id, c.id]).slice(0, 50);
  const mine = { leader: TEACH, main };
  const rocks = metaDecks().find((d) => d.leader === 'OP17-039')!;
  const pb = defaultPlaybook(TEACH, main, cards);
  const earlySet = new Set(pb.mulligan.pieces[0]!.cards);

  it('keeps and redraws by the [S9] rule, citing no guide', () => {
    const seen = { keep: 0, redraw: 0 };
    for (let seed = 1; seed <= 24; seed++) {
      playMatch({
        seed,
        decks: { p1: mine, p2: rocks },
        tiers: { p1: 'pirate', p2: 'pirate' },
        cap: 8,
        onDecision: (d) => {
          if (d.player !== 'p1' || d.view.decision?.kind !== 'mulligan') return;
          const hand = d.view.zones.p1.hand.map((c) => cards.get(c.card ?? '')!);
          const first = d.view.turn.activePlayer === 'p1';
          const early = hand.some((c) => earlySet.has(c.id));
          const counter = hand.some((c) => !earlySet.has(c.id) && counterValueOf(c) > 0);
          // Each card counts toward one piece: an early card with a Counter serves 'early' only.
          const missing = (early ? 0 : 1) + (counter ? 0 : 1);
          const keep = first ? missing === 0 : missing <= 1;
          expect(d.action).toMatchObject({ type: 'mulligan', redraw: !keep });
          seen[keep ? 'keep' : 'redraw']++;
          const text = JSON.stringify(d.explanation);
          expect(text).not.toMatch(/guide/i);
        },
      });
    }
    expect(seen.keep).toBeGreaterThan(0);
    expect(seen.redraw).toBeGreaterThan(0);
  }, 120_000);
});

describe('the lethal Trigger note for a guessed deck', () => {
  it('a synthetic prior is marked typical, so the copy never says "their usual lists"', async () => {
    const { triggerRisk } = await import('../src/search/lethal/public.ts');
    const cards = cardMap();
    const guessed = triggerRisk(2, priorFor(TEACH), cards);
    expect(guessed.typical).toBe(true);
    const sourced = triggerRisk(2, priorFor('OP17-039'), cards);
    expect(sourced.typical).toBeUndefined();
  });
});
