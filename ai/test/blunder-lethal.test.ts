/**
 * M7 WP2: the `missed-lethal` kind on planted positions (worked by hand, as lethal.test.ts does).
 *
 * Their Leader (Rocks, OP17-039) is at 1 Life with no hand and no Blockers. You have a 5000 Leader
 * and a 9000 Character, both able to attack. Two hits are needed (Life 1, then 0). Their hidden
 * hand after the first hit is one card worth at most +2000 (Rocks's lists, E01/E20), so 9000
 * against 5000 + 2000 still lands: the public search proves lethal for any hand.
 */
import { describe, expect, it, vi } from 'vitest';
import { projectForSearch, type Action, type GameState, type SearchView } from '@optcg/engine';
import { scoreDecision, warningsOf } from '../src/coach/blunder.ts';
import { actionKey } from '../src/coach/types.ts';
import { cardMap } from './support.ts';
import { asVanilla } from './support/vanilla.ts';
import { lifeOf, listOf, start } from './support/scenario.ts';

vi.setConfig({ testTimeout: 120_000 });
asVanilla('OP13-001', 'OP13-027', 'OP13-118');

const cards = cardMap();
const LUFFY = 'OP13-001';
const ZORO = 'EB04-007';
const SANJI = 'OP13-027';
const ROCKS = 'OP17-039';
const game = { ownDeck: listOf(ROCKS), leader: LUFFY, opponentLeader: ROCKS };
const ctx = { cards, game, budget: { iterations: 150 }, lethalCap: { nodes: 250_000 } } as const;

function position(o: {
  life: number;
  hand: string[];
  active?: number;
  mine?: string[];
  restedChar?: boolean;
}): GameState {
  return start({
    seed: 11,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: LUFFY,
      characters: [ZORO],
      life: lifeOf(4, ZORO),
      hand: o.mine ?? [],
      costArea: { active: o.active ?? 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
    p2: {
      leader: ROCKS,
      characters: o.restedChar ? [{ card: ZORO, rested: true }] : [],
      life: lifeOf(o.life, ZORO),
      hand: o.hand,
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
  });
}

const attacks = (v: SearchView): Extract<Action, { type: 'attack' }>[] =>
  v.actions.filter((a): a is Extract<Action, { type: 'attack' }> => a.type === 'attack');
const kindsOf = (t: ReturnType<typeof scoreDecision>, a: Action) => t.kinds[actionKey(a)] ?? [];

describe('missed lethal', () => {
  it('a proven lethal: ending the turn is flagged, the attacks on their Leader are not', () => {
    const v = projectForSearch(position({ life: 1, hand: [] }), 'p1');
    const t = scoreDecision(v, ctx);
    const end = v.actions.find((a) => a.type === 'endTurn')!;
    expect(kindsOf(t, end)).toEqual(['missed-lethal']);
    const leaderOf = attacks(v).find((a) => a.target === v.zones.p2.leader[0]!.handle);
    expect(attacks(v).length).toBeGreaterThan(0);
    for (const a of attacks(v)) expect(kindsOf(t, a)).toEqual([]);
    expect(leaderOf).toBeDefined();
    const w = warningsOf(t, end)[0]!;
    expect(w.explanation.certainty).toBe('any-hand');
    expect(w.explanation.claim).toBe('You have lethal this turn, and this move gives it up.');
    expect(w.explanation.line?.some((m) => m.kind === 'attack')).toBe(true);
    // The better action is the proven line's first step, and it is one of the legal actions.
    expect(v.actions.some((a) => actionKey(a) === actionKey(w.better!))).toBe(true);
    expect(kindsOf(t, w.better!)).toEqual([]);
  });

  it('with a rested Character to hit instead, attacking it leaves every proven line', () => {
    const v = projectForSearch(position({ life: 1, hand: [], restedChar: true }), 'p1');
    const t = scoreDecision(v, ctx);
    const rested = v.zones.p2.characters[0]!.handle;
    const leader = v.zones.p2.leader[0]!.handle;
    const toChar = attacks(v).filter((a) => a.target === rested);
    const toLeader = attacks(v).filter((a) => a.target === leader);
    expect(toChar.length).toBe(2);
    for (const a of toChar) expect(kindsOf(t, a)).toEqual(['missed-lethal']);
    for (const a of toLeader) expect(kindsOf(t, a)).toEqual([]);
  });

  it('a side play that keeps the lethal is not flagged (the check re-proves it)', () => {
    const v = projectForSearch(position({ life: 1, hand: [], mine: [SANJI], active: 5 }), 'p1');
    const t = scoreDecision(v, ctx);
    const play = v.actions.find((a) => a.type === 'playCard')!;
    expect(kindsOf(t, play)).toEqual([]);
    const end = v.actions.find((a) => a.type === 'endTurn')!;
    expect(kindsOf(t, end)).toContain('missed-lethal');
  });

  it('no proven lethal, no flag: three Life and a full hand', () => {
    const v = projectForSearch(position({ life: 3, hand: [ZORO, ZORO, ZORO, ZORO] }), 'p1');
    const t = scoreDecision(v, ctx);
    expect(Object.values(t.kinds).flat()).not.toContain('missed-lethal');
  });

  it('a search that hits its cap says nothing: "unknown" is never a flag', () => {
    const v = projectForSearch(position({ life: 1, hand: [], restedChar: true }), 'p1');
    const t = scoreDecision(v, { ...ctx, lethalCap: { nodes: 1 } });
    expect(Object.values(t.kinds).flat()).not.toContain('missed-lethal');
  });

  it("without the seat's list, ending the turn is still flagged by the plain rule", () => {
    const v = projectForSearch(position({ life: 1, hand: [] }), 'p1');
    const t = scoreDecision(v, {
      cards,
      budget: { iterations: 10 },
      lethalCap: { nodes: 250_000 },
    });
    expect(t.incomplete).toBe(true);
    expect(t.certainty).toBe('search-incomplete');
    const end = v.actions.find((a) => a.type === 'endTurn')!;
    expect(kindsOf(t, end)).toEqual(['missed-lethal']);
  });
});
