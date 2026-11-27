/**
 * M8 WP2: the `don-unused` detector on planted records. E06 (3 DON!! left unused: a flag) and E07
 * (OP13-001 holding DON!! on purpose: no flag, a note) equal the examples in explanations.md; a
 * game's first turn, a turn with nothing to spend DON!! on, and a seat that is not human give none.
 */
import { describe, expect, it, vi } from 'vitest';
import { queries, reduce } from '@optcg/engine';
import { e06Record, KAIDO, KYO, ROCKS, SHIKI, ZORO } from './wp2-positions.ts';
import { e07Record } from './wp2-positions-more.ts';
import { docExample } from '../support/doc.ts';
import { listOf } from '../support/scenario.ts';
import { build, contextOf, indexOf, lifeOf, run, step, type Spec } from './wp2-support.ts';

vi.setConfig({ testTimeout: 120_000 });

const endTurnIndex = (rec: ReturnType<typeof e06Record>): number =>
  indexOf(rec, (a) => a.type === 'endTurn');

describe('E06: DON!! left unused', () => {
  const rec = e06Record();
  const ctx = contextOf(rec);
  const at = endTurnIndex(rec);
  const res = run('don-unused', ctx, at);
  const doc = docExample('E06');

  it('flags 3 unused DON!! as moderate, any-hand, restored at the first Main', () => {
    expect(res).not.toBeNull();
    expect(res!.flags).toHaveLength(1);
    const f = res!.flags[0]!;
    expect(f).toMatchObject({
      id: `don-unused:8:${at}`,
      kind: 'don-unused',
      turn: 8,
      player: 'p1',
      severity: 'moderate',
      certainty: 'any-hand',
      decisionIndex: at,
      restoreIndex: 0,
    });
    // M9 WP7: practised from the first Main, against the best candidate line (see practice-flags.test.ts).
    expect(f.practice).toMatchObject({ judge: 'don-ledger', turn: 8 });
  });

  it('matches the E06 example: claim, outcome, nextTime, ids, certainty, line, figures', () => {
    const e = res!.flags[0]!.explanation;
    for (const k of ['conceptId', 'claim', 'outcome', 'certainty', 'nextTime', 'lessonId'] as const)
      expect(e[k], k).toEqual(doc[k]);
    expect(e.evidence.map((x) => x.figures)).toEqual(doc.evidence.map((x) => x.figures));
    expect(e.evidence[0]!.text).toBe(doc.evidence[0]!.text);
    expect(e.evidence[1]!.text).toBe(doc.evidence[1]!.text);
    expect(e.evidence[2]!.text).toBe(doc.evidence[2]!.text);
    expect(e.line!.map((m) => [m.kind, m.card, m.count, m.target])).toEqual(
      doc.line!.map((m) => [m.kind, m.card, m.count, m.target]),
    );
    expect(e.sources).toEqual(doc.sources);
  });

  it('describes what the player did, from the record', () => {
    const did = res!.flags[0]!.did.map((m) => m.kind);
    expect(did).toEqual(['play', 'attack', 'endTurn']);
    expect(res!.flags[0]!.did[0]!.text).toBe('Played Charlotte Linlin.');
  });

  it('has a line that replays with reduce: give 3 DON!! to the Leader, then attack', () => {
    let s = ctx.stateAt(res!.flags[0]!.restoreIndex);
    const leader = queries.zone(s, 'p1', 'leader')[0]!.instance;
    for (let i = 0; i < 3; i++)
      s = reduce(s, { type: 'giveDon', target: leader, player: 'p1' }).state;
    expect(queries.card(s, leader).power).toBe(8000);
    const target = queries.zone(s, 'p2', 'leader')[0]!.instance;
    s = reduce(s, { type: 'attack', attacker: leader, target, player: 'p1' }).state;
    expect(queries.battle(s)).not.toBeNull();
  });

  it('flags nothing for a human seat that is not the mover, an AI seat or an auto end of turn', () => {
    expect(run('don-unused', contextOf(rec, { p1: 'ai', p2: 'human' }), at)).toBeNull();
    expect(run('don-unused', contextOf(rec, undefined, [at]), at)).toBeNull();
  });
});

describe('E07: holding DON!! was right (OP13-001)', () => {
  const rec = e07Record();
  const ctx = contextOf(rec);
  const at = endTurnIndex(rec as never);
  const res = run('don-unused', ctx, at);
  const doc = docExample('E07');

  it('gives no flag and the "not flagged" note, equal to the E07 example', () => {
    expect(res).not.toBeNull();
    expect(res!.flags).toEqual([]);
    expect(res!.notes).toHaveLength(1);
    const n = res!.notes[0]!;
    for (const k of ['conceptId', 'claim', 'outcome', 'certainty', 'nextTime', 'lessonId'] as const)
      expect(n[k], k).toEqual(doc[k]);
    expect(n.evidence.map((x) => x.figures)).toEqual(doc.evidence.map((x) => x.figures));
    expect(n.evidence.map((x) => x.text)).toEqual(doc.evidence.map((x) => x.text));
    expect(n.sources).toEqual(doc.sources);
  });
});

describe('when there is nothing to flag', () => {
  it("the first player's first turn has no flag (1 DON!!, no attack allowed)", () => {
    const spec: Spec = {
      seed: 5,
      turn: 1,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: ROCKS,
        hand: [KYO, SHIKI],
        costArea: { active: 1, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: { leader: KAIDO, costArea: { active: 0, rested: 0 }, decklist: listOf(KAIDO) },
    };
    const rec = build(spec, 'p1', [step.endTurn('p1')]);
    expect(run('don-unused', contextOf(rec), 0)).toBeNull();
  });

  it('unused DON!! with nothing to spend them on is not a flag', () => {
    // The Leader is rested, nothing else attacks, and the only card in hand costs 9.
    const spec: Spec = {
      seed: 6,
      turn: 6,
      activePlayer: 'p1',
      firstPlayer: 'p2',
      p1: {
        leader: { card: ROCKS, rested: true },
        hand: ['OP17-118'],
        life: lifeOf(4, ZORO),
        costArea: { active: 3, rested: 3 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: KAIDO,
        life: lifeOf(4, ZORO),
        costArea: { active: 0, rested: 0 },
        decklist: listOf(KAIDO),
      },
    };
    const rec = build(spec, 'p1', [step.endTurn('p1')]);
    expect(run('don-unused', contextOf(rec), 0)).toBeNull();
  });

  it('one or two unused DON!! with an attack available is a minor flag', () => {
    const spec: Spec = {
      seed: 7,
      turn: 6,
      activePlayer: 'p1',
      firstPlayer: 'p2',
      p1: {
        leader: ROCKS,
        hand: ['OP17-118'],
        life: lifeOf(4, ZORO),
        costArea: { active: 2, rested: 4 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: KAIDO,
        life: lifeOf(4, ZORO),
        costArea: { active: 0, rested: 0 },
        decklist: listOf(KAIDO),
      },
    };
    const rec = build(spec, 'p1', [step.endTurn('p1')]);
    const res = run('don-unused', contextOf(rec), 0)!;
    expect(res.flags).toHaveLength(1);
    expect(res.flags[0]!.severity).toBe('minor');
    expect(res.flags[0]!.explanation.claim).toBe('You left 2 DON!! unused.');
    expect(res.flags[0]!.explanation.line![0]).toMatchObject({ kind: 'giveDon', count: 2 });
  });
});
