/**
 * M8 WP4: the attack-target flag (explanations.md E08 and E09). Each example is a planted record;
 * the detector runs on the human's attack and the test asserts:
 * 1. the flag is the one the example describes (kind, severity, ids, what you did);
 * 2. the Explanation's claim, outcome, nextTime, conceptId, lessonId and certainty equal the object
 *    written in explanations.md (read from the doc itself, so copy and code cannot drift);
 * 3. every figure equals a value recomputed here from the engine and the card data;
 * 4. the first line step replays with `reduce` and reaches the stated numbers.
 * Then what is not flagged (a sound attack, a forced one, the AI's), and the marker.
 */
import { describe, expect, it, vi } from 'vitest';
import { SCRIPTS } from '@optcg/cards';
import {
  legalActions,
  projectForSearch,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import { certaintyLabel } from '../../src/index.ts';
import {
  DECIDED,
  detect,
  K,
  judgeTarget,
  MIN_WINS,
  TARGET_GAP,
  targetSetup,
  viewAttackOf,
  worthFlagging,
} from '../../src/search/review/target.ts';
import { explainTarget, type TargetBattle } from '../../src/search/review/explain-target.ts';
import { listOf } from '../support/scenario.ts';
import type { ReviewFlag, ReviewRecord } from '../../src/search/review/index.ts';
import { cardMap, metaDecks } from '../support.ts';
import { docExample } from '../support/doc.ts';
import { attackAction, contextOf, itemAt, plantRecord } from '../support/review-plant.ts';
import {
  e08Plan,
  e08Record,
  e08Spec,
  e09Record,
  HAWKINS,
  KAIDO,
  KING,
  NEWGATE,
  ROCKS,
  SHIKI,
} from '../support/review-target-positions.ts';

vi.setConfig({ testTimeout: 120_000 });

const cards = cardMap();

/** The biggest defensive value across an archetype's sourced lists, worked out here from card data. */
function biggestCounterOf(leader: string): number {
  let best = 0;
  for (const d of metaDecks().filter((x) => x.leader === leader))
    for (const id of new Set(d.main)) {
      const card = cards.get(id)!;
      if (card.category !== 'Event') best = Math.max(best, card.counter ?? 0);
      else
        for (const a of SCRIPTS[id]?.abilities ?? []) {
          const when = (a as { when?: unknown }).when;
          if (when !== 'counter' && !(Array.isArray(when) && when.includes('counter'))) continue;
          for (const m of JSON.stringify(a).match(/"amount":(\d+)/g) ?? [])
            best = Math.max(best, Number(m.split(':')[1]));
        }
    }
  return best;
}

/** Answer your own prompts the long way round (accept, then the first answer) to the opponent's window. */
function throughOwnPrompts(s0: GameState, me: PlayerId): GameState {
  let s = s0;
  for (let i = 0; i < 12; i++) {
    const d = queries.decision(s);
    if (!d || d.player !== me) break;
    const acts = legalActions(s).filter((a) => a.type !== 'concede');
    s = reduce(s, acts.find((a) => a.type === 'optional' && a.accept) ?? acts[0]!).state;
  }
  return s;
}

const run = (rec: ReviewRecord, turn: number, index: number) =>
  detect(itemAt('target', turn, index), contextOf(rec));

/** The engine attack in `s` matching a line step. */
function stepAction(s: GameState, me: PlayerId, step: { card?: string; target?: string }): Action {
  const opp: PlayerId = me === 'p1' ? 'p2' : 'p1';
  const a = legalActions(s).find((x) => {
    if (x.type !== 'attack') return false;
    const atk = queries.card(s, x.attacker);
    const tgt = queries.card(s, x.target);
    const want =
      step.target === 'leader'
        ? tgt.zone === 'leader' && tgt.owner === opp
        : tgt.card === step.target;
    return atk.card === step.card && want;
  });
  if (!a) throw new Error(`no legal attack for ${JSON.stringify(step)}`);
  return a;
}

const sameFlag = (f: ReviewFlag, turn: number, index: number) =>
  expect(f).toMatchObject({
    id: `target:${turn}:${index}`,
    kind: 'target',
    turn,
    player: 'p1',
    restoreIndex: index,
    decisionIndex: index,
    severity: 'moderate',
    certainty: 'any-hand',
  });

describe('E08: board over face', () => {
  const rec = e08Record();
  const ctx = contextOf(rec);
  const result = detect(itemAt('target', 7, 0), ctx);
  const flag = result?.flags[0];
  const doc = docExample('E08');

  it('flags the Leader’s attack on their Leader, once, with the doc’s words', () => {
    expect(result?.flags).toHaveLength(1);
    sameFlag(flag!, 7, 0);
    const e = flag!.explanation;
    expect(e.conceptId).toBe(doc.conceptId);
    expect(e.claim).toBe(doc.claim);
    expect(e.outcome).toBe(doc.outcome);
    expect(e.nextTime).toBe(doc.nextTime);
    expect(e.lessonId).toBe(doc.lessonId);
    expect(e.certainty).toBe(doc.certainty);
    expect(certaintyLabel(e.certainty, 'review')).toBe('Holds whatever they held');
    expect(e.line!.map((m) => [m.kind, m.card, m.target])).toEqual(
      doc.line!.map((m) => [m.kind, m.card, m.target]),
    );
  });

  it('says what you did: both attacks on their Leader', () => {
    expect(flag!.did.map((m) => [m.kind, m.card, m.target])).toEqual([
      ['attack', KAIDO, 'leader'],
      ['attack', KING, 'leader'],
    ]);
  });

  it('every figure equals the engine and the card data', () => {
    const s0 = ctx.stateAt(0);
    const leader = queries.zone(s0, 'p1', 'leader')[0]!;
    const newgate = queries.zone(s0, 'p2', 'characters')[0]!;
    const attack = leader.power!;
    // The line: the Leader attacks Newgate and uses its own effect.
    const atNewgate = stepAction(s0, 'p1', { card: KAIDO, target: NEWGATE });
    const window = throughOwnPrompts(reduce(s0, atNewgate).state, 'p1');
    expect(queries.decision(window)!.player).toBe('p2');
    const defence = queries.card(window, newgate.instance).power!;
    const need = attack - defence + 1000;
    const per = biggestCounterOf(ROCKS);
    const text = cards.get(NEWGATE)!.effectText ?? '';
    const boost = Number(/gains \+(\d+) power during this battle/.exec(text)?.[1]);
    const theirLeader = queries.zone(s0, 'p2', 'leader')[0]!.instance;
    const atLeader = rec.actions.filter(
      (a) => a.type === 'attack' && a.player === 'p1' && a.target === theirLeader,
    ).length;
    const figures = Object.assign({}, ...flag!.explanation.evidence.map((e) => e.figures ?? {}));
    expect(figures).toMatchObject({
      effectBoost: boost,
      attackPower: attack,
      targetPower: defence,
      targetPowerBefore: newgate.power,
      stopNeeded: need,
      maxPerCard: per,
      cardsToSave: Math.ceil(need / per),
      opponentLife: queries.zone(s0, 'p2', 'life').length,
      attacksAtLeader: atLeader,
    });
    // The doc's own numbers, for this position.
    expect([attack, defence, need, per, Math.ceil(need / per)]).toEqual([
      8000, 6000, 3000, 2000, 2,
    ]);
    expect([figures.opponentLife, figures.attacksAtLeader, boost]).toEqual([4, 2, 3000]);
  });

  it('the line replays: Newgate is K.O.’d, or two of their cards are spent', () => {
    const s0 = ctx.stateAt(0);
    const first = flag!.explanation.line![0]!;
    const window = throughOwnPrompts(reduce(s0, stepAction(s0, 'p1', first)).state, 'p1');
    const newgate = queries.zone(s0, 'p2', 'characters')[0]!;
    expect(queries.card(window, newgate.instance).power).toBe(6000);
    // No defence: Newgate is K.O.'d (the preview's do-nothing answers).
    let s = window;
    for (let i = 0; i < 12; i++) {
      const d = queries.decision(s);
      if (!d || d.player !== 'p2') break;
      const acts = legalActions(s);
      s = reduce(
        s,
        acts.find((a) => a.type === 'block' && a.blocker === null) ??
          acts.find((a) => a.type === 'endCounter') ??
          acts.find((a) => a.type === 'optional' && !a.accept) ??
          acts[0]!,
      ).state;
    }
    expect(queries.zone(s, 'p2', 'characters')).toHaveLength(0);
  });

  it('does not flag King’s attack, which had no better target', () => {
    const second = rec.actions.findIndex((a, i) => i > 0 && a.type === 'attack');
    expect(run(rec, 7, second)).toBeNull();
  });
});

describe('E09: face over board', () => {
  const rec = e09Record();
  const ctx = contextOf(rec);
  const result = detect(itemAt('target', 9, 0), ctx);
  const flag = result?.flags[0];
  const doc = docExample('E09');

  it('flags Shiki’s attack on Hawkins with the doc’s words', () => {
    expect(result?.flags).toHaveLength(1);
    sameFlag(flag!, 9, 0);
    const e = flag!.explanation;
    expect(e.conceptId).toBe(doc.conceptId);
    expect(e.claim).toBe(doc.claim);
    expect(e.outcome).toBe(doc.outcome);
    expect(e.nextTime).toBe(doc.nextTime);
    expect(e.lessonId).toBe(doc.lessonId);
    expect(e.certainty).toBe(doc.certainty);
    expect(e.line!.map((m) => [m.kind, m.card, m.target])).toEqual(
      doc.line!.map((m) => [m.kind, m.card, m.target]),
    );
    expect(flag!.did.map((m) => [m.kind, m.card, m.target])).toEqual([['attack', SHIKI, HAWKINS]]);
  });

  it('every figure equals the engine and the card data', () => {
    const s0 = ctx.stateAt(0);
    const shiki = queries.zone(s0, 'p1', 'characters')[0]!;
    const leader = queries.zone(s0, 'p2', 'leader')[0]!;
    const hawkins = queries.zone(s0, 'p2', 'characters')[0]!;
    const attack = shiki.power!;
    const need = attack - leader.power! + 1000;
    const per = biggestCounterOf(KAIDO);
    const hand = queries.zone(s0, 'p2', 'hand').length;
    const figures = Object.assign({}, ...flag!.explanation.evidence.map((e) => e.figures ?? {}));
    expect(figures).toMatchObject({
      chosenPower: hawkins.power,
      attackPower: attack,
      targetPower: leader.power,
      stopNeeded: need,
      handSize: hand,
      biggestCounter: per,
      cardsToSave: Math.ceil(need / per),
    });
    expect([attack, leader.power, need, per, hand, hawkins.power]).toEqual([
      9000, 5000, 5000, 4000, 2, 1000,
    ]);
  });

  it('the line replays: Shiki’s attack on their Leader is legal and reaches their window', () => {
    const s0 = ctx.stateAt(0);
    const first = flag!.explanation.line![0]!;
    const window = throughOwnPrompts(reduce(s0, stepAction(s0, 'p1', first)).state, 'p1');
    expect(queries.decision(window)!.player).toBe('p2');
    const leader = queries.zone(s0, 'p2', 'leader')[0]!;
    expect(queries.card(window, leader.instance).power).toBe(5000);
  });
});

describe('what is not flagged', () => {
  it('the better attack itself (E08, the Leader attacks Newgate) is null', () => {
    const rec = plantRecord(e08Spec(), (s) => [
      attackAction(s, 'p1', KAIDO, NEWGATE),
      attackAction(s, 'p1', KING, 'leader'),
      { type: 'endTurn', player: 'p1' },
    ]);
    expect(rec.actions[0]!.type).toBe('attack');
    expect(run(rec, 7, 0)).toBeNull();
  });

  it('the AI’s own attacks are never judged', () => {
    const rec = { ...e08Record(), seats: { p1: 'ai', p2: 'human' } } as ReviewRecord;
    expect(run(rec, 7, 0)).toBeNull();
  });

  it('an auto-played action is never a decision', () => {
    const rec = { ...e08Record(), auto: [0] } as ReviewRecord;
    expect(run(rec, 7, 0)).toBeNull();
  });

  it('an index that is not an attack is null', () => {
    const rec = e08Record();
    const end = rec.actions.findIndex((a) => a.type === 'endTurn');
    expect(run(rec, 7, end)).toBeNull();
  });

  it('a search that runs out of budget is a marker, never a clean attack', () => {
    const rec = e08Record();
    const out = detect(itemAt('target', 7, 0), contextOf(rec, { ms: 0 }));
    expect(out?.flags).toEqual([]);
    expect(out?.marker).toMatchObject({ turn: 7, kind: 'target', reason: 'search-incomplete' });
  });

  it('an attack with one legal target (E08 without Newgate) is null', () => {
    const spec = e08Spec();
    const alone = { ...spec, p2: { ...spec.p2, characters: [] } };
    const rec = plantRecord(alone, e08Plan);
    expect(run(rec, 7, 0)).toBeNull();
  });

  it('every condition of a flag is needed (worthFlagging)', () => {
    const rec = e08Record();
    const ctx = contextOf(rec);
    const state = ctx.stateAt(0);
    const view = projectForSearch(state, 'p1');
    const chosen = viewAttackOf(state, view, rec.actions[0]!)!;
    const verdict = judgeTarget(view, chosen, targetSetup(view, listOf(KAIDO), cards), {
      iterations: 120,
    });
    expect(verdict).toMatchObject({ status: 'judged', wins: K, states: K });
    expect(verdict.gap).toBeGreaterThanOrEqual(TARGET_GAP);
    expect(worthFlagging(view, verdict, cards)).toBe(true);
    // the gap
    expect(worthFlagging(view, verdict, cards, verdict.gap + 0.01)).toBe(false);
    // the better target must win in most guesses of their hand
    expect(worthFlagging(view, { ...verdict, wins: MIN_WINS - 1 }, cards)).toBe(false);
    // M8-R7: the flag says `any-hand`, so it needs six guessed hands and wins in every one of them
    expect(K).toBeGreaterThanOrEqual(6);
    expect(MIN_WINS).toBe(K);
    expect(verdict.states).toBe(K);
    expect(worthFlagging(view, { ...verdict, wins: (verdict.states ?? 0) - 1 }, cards)).toBe(false);
    // a game decided in the rollouts is a lethal question, for the missed-lethal check
    expect(worthFlagging(view, { ...verdict, bestValue: DECIDED }, cards)).toBe(false);
    // the same target is not a mistake
    expect(worthFlagging(view, { ...verdict, best: verdict.chosen }, cards)).toBe(false);
  });

  it('a Character against a Character is worded from the same differences', () => {
    // E08 with Hawkins on their side too: Newgate was better than Hawkins for the Leader.
    const base = e08Spec();
    const spec = {
      ...base,
      p2: {
        ...base.p2,
        characters: [
          { card: NEWGATE, rested: true },
          { card: HAWKINS, rested: true },
        ],
      },
    };
    const rec = plantRecord(spec, (s) => [
      attackAction(s, 'p1', KAIDO, HAWKINS),
      { type: 'endTurn', player: 'p1' },
    ]);
    const ctx = contextOf(rec);
    const state = ctx.stateAt(0);
    const view = projectForSearch(state, 'p1');
    const z = view.zones;
    const find = (card: string) => z.p2.characters.find((c) => c.card === card)!;
    const battle = (target: number, before: number): TargetBattle => ({
      attackPower: 8000,
      targetPower: target,
      targetPowerBefore: before,
      uses: [],
    });
    const { explanation, line } = explainTarget({
      view,
      cards,
      attacker: z.p1.leader[0]!,
      chosen: find(HAWKINS),
      best: find(NEWGATE),
      chosenBattle: battle(1000, 1000),
      bestBattle: battle(8000, 8000),
      later: [],
      hitsAtLeader: 0,
    });
    expect(explanation.claim).toBe('Newgate was the better target for your Leader.');
    expect(explanation.evidence[0]!.figures).toEqual({ effectBoost: 3000 });
    expect(explanation.evidence[1]!.figures).toMatchObject({
      attackPower: 8000,
      targetPower: 8000,
      stopNeeded: 1000,
      cardsToSave: 1,
    });
    expect(explanation.evidence[2]!.figures).toEqual({ chosenPower: 1000 });
    expect(explanation.outcome).toBe("Newgate K.O.'d, or 1 of their cards spent to save it.");
    expect(line).toHaveLength(1);
    expect(explanation.lessonId).toBe('L14-board-vs-face');
  });
});
