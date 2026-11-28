/**
 * M11 Track C: a Counter a public Leader effect gives (OP18-021 Franky: "All Stage cards in your hand
 * have a +3000 Counter") counts in the AI's estimates (BACKLOG §15, review OP18-R4). The value is
 * read from the Leader's script, never listed by card id, so a new Leader with the same shape works
 * with no AI change.
 */
import { describe, expect, it } from 'vitest';
import { actionFromView, project, queries, reduce, type Action } from '@optcg/engine';
import { averageCounter, biggestCounter, counterValueOf, rookie } from '../src/index.ts';
import { counterProfile, defenceBound } from '../src/search/lethal/profile.ts';
import { leaderCounterGrants, priorCardIds, priorFor } from '../src/knowledge.ts';
import { cardMap } from './support.ts';
import { lifeOf, listOf, start } from './support/scenario.ts';

const FRANKY = 'OP18-021';
const STAGE = 'OP18-075'; // Thousand Sunny, a Stage with no printed Counter
const ICEBURG = 'OP18-061'; // a Character with +1000
const cards = cardMap();

describe('Leader-granted Counter values', () => {
  it('reads the grant from the Leader script: Stages in hand, +3000, and nothing for other Leaders', () => {
    expect(leaderCounterGrants(FRANKY)).toEqual([{ categories: ['Stage'], value: 3000 }]);
    for (const other of ['OP13-001', 'EB02-010', 'OP17-039', 'OP15-058', undefined])
      expect(leaderCounterGrants(other), String(other)).toEqual([]);
  });

  it('a Stage counts +3000 under Franky and 0 elsewhere; a printed Counter is never lowered', () => {
    const stage = cards.get(STAGE)!;
    const iceburg = cards.get(ICEBURG)!;
    expect(counterValueOf(stage)).toBe(0);
    expect(counterValueOf(stage, FRANKY)).toBe(3000);
    expect(counterValueOf(stage, 'OP17-039')).toBe(0);
    expect(counterValueOf(iceburg, FRANKY)).toBe(1000);
    // Only the highest applies (CR 2-10-4): a Character with 2000 stays 2000.
    expect(counterValueOf(cards.get('OP18-070')!, FRANKY)).toBe(2000);
  });

  it("the archetype's average and biggest Counter include its Stages", () => {
    const prior = priorFor(FRANKY);
    let sum = 0;
    let n = 0;
    for (const l of prior.lists)
      for (const c of l.cards) {
        sum += counterValueOf(cards.get(c.id)) * c.count * l.weight;
        n += c.count * l.weight;
      }
    const printedOnly = sum / n;
    expect(averageCounter(FRANKY, cards)).toBeGreaterThan(printedOnly + 400);
    expect(biggestCounter(FRANKY, cards)).toBeGreaterThanOrEqual(3000);
  });

  it("the lethal profile's plain Counter counts a hidden Stage as +3000 under Franky only", () => {
    const plain = (ids: string[], leader?: string) => {
      const m = counterProfile(ids, cards, 0, leader).modes[0] as {
        do: { power: { amount: number } };
      }[];
      return m[0]!.do.power.amount;
    };
    expect(plain([STAGE], FRANKY)).toBe(3000);
    expect(plain([STAGE])).toBe(0);
    const ids = priorCardIds(FRANKY);
    expect(defenceBound(ids, cards, 10, 0, false, FRANKY).perCard).toBeGreaterThanOrEqual(3000);
    expect(defenceBound([STAGE], cards, 10, 0, false, FRANKY).perCard).toBe(3000);
    expect(defenceBound([STAGE], cards, 10, 0, false).perCard).toBe(0);
  });
});

describe('Rookie counters a lethal attack with the Stage', () => {
  it('prefers the +3000 Stage to a +1000 Character when it holds both', () => {
    let s = start({
      seed: 5,
      turn: 6,
      activePlayer: 'p2',
      firstPlayer: 'p1',
      p1: {
        leader: FRANKY,
        life: lifeOf(0, 'OP18-038'),
        hand: [ICEBURG, STAGE],
        costArea: { active: 0, rested: 6 },
        decklist: listOf(FRANKY),
      },
      p2: {
        leader: 'OP17-039',
        life: lifeOf(5, 'OP17-050'),
        characters: ['OP17-049'],
        costArea: { active: 0, rested: 6 },
        decklist: listOf('OP17-039'),
      },
    });
    const by = queries.zone(s, 'p2', 'characters')[0]!;
    const leader = queries.zone(s, 'p1', 'leader')[0]!;
    s = reduce(s, {
      type: 'attack',
      attacker: by.instance,
      target: leader.instance,
      player: 'p2',
    } as Action).state;
    // Declining to block reaches the Counter Step.
    const blockView = project(s, 'p1');
    expect(blockView.decision?.kind).toBe('block');
    const noBlock = blockView.actions.find((a) => a.type === 'block' && a.blocker === null)!;
    s = reduce(s, actionFromView(s, 'p1', noBlock)).state;
    const view = project(s, 'p1');
    expect(view.decision?.kind).toBe('counter');
    const printed = (id: string) => cards.get(id)?.counter ?? null;
    const d = rookie(view, { seed: 3, counterOf: printed });
    expect(d.action.type).toBe('counter');
    const handle = (d.action as { card: string }).card;
    const held = view.zones.p1.hand.find((c) => c.handle === handle)!;
    expect(held.card).toBe(STAGE);
    expect(held.counter).toBe(3000);
  });
});
