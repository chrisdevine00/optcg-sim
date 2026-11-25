/**
 * M8 WP3: the `given-away` detector (explanations.md E21, the lead's definition in DECISIONS "M8 plan").
 * You are p1, human. Game turn 9 is yours: you attack with your [Blocker], then end the turn. Turn 10
 * is theirs and their board alone wins.
 *
 * E21 position (turn 9, your Main): Rocks (OP17-039) Leader 5000, 2 Life (Kyo, OP17-045, no Trigger),
 * no hand; Gloriosa (OP17-046) 1000 [Blocker] on your board. They: Kaido (OP17-058) Leader 5000, Ulti &
 * Page One (OP17-060) 6000, Kaido (OP17-062) 12000: three attackers against 2 Life (three hits).
 * Hand-worked: with your Blocker resting you cannot stop anything, so three hits win; with it kept
 * back it Blocks one attack (and a Blocker stops an attack for good): two hits only take 2 Life.
 */
import { describe, expect, it, vi } from 'vitest';
import { queries, type Action, type GameState } from '@optcg/engine';
import { DETECTORS, certaintyLabel, type ReviewRecord } from '../../src/index.ts';
import { docExample } from '../support/doc.ts';
import { lifeOf, listOf } from '../support/scenario.ts';
import { attackOn, ctxOf, item, recordOf, takeIt, type Spec } from './wp3-support.ts';

vi.setConfig({ testTimeout: 120_000 });

const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const ULTI = 'OP17-060';
const KAIDO_CHAR = 'OP17-062';
const BLOCKER = 'OP17-046'; // Gloriosa, 1000 [Blocker]
const KYO = 'OP17-045';

const E21: Spec = {
  seed: 9,
  turn: 9,
  activePlayer: 'p1',
  firstPlayer: 'p1',
  p1: {
    leader: ROCKS,
    characters: [BLOCKER],
    life: lifeOf(2, KYO),
    hand: [],
    costArea: { active: 0, rested: 0 },
    decklist: listOf(ROCKS),
  },
  p2: {
    leader: KAIDO,
    characters: [ULTI, KAIDO_CHAR],
    life: lifeOf(3, KYO),
    hand: [],
    costArea: { active: 0, rested: 0 },
    decklist: listOf(KAIDO),
  },
};

/**
 * Your turn: `mine` in order (attacks by card, on their Leader), then end. Their turn: attack with
 * `theirs` in order, you take every hit.
 */
function game(
  spec: Spec,
  mine: string[],
  theirs: string[],
  seats?: ReviewRecord['seats'],
): ReviewRecord {
  const m = [...mine];
  const t = [...theirs];
  return recordOf(
    spec,
    (s: GameState, legal: Action[]) => {
      const dec = queries.decision(s)!;
      if (dec.kind === 'main' && dec.player === 'p1') {
        if (queries.turn(s).number > 9) return undefined;
        const next = m.shift();
        return next ? attackOn(s, legal, 'p1', next) : legal.find((a) => a.type === 'endTurn');
      }
      if (dec.kind === 'main' && dec.player === 'p2') {
        const next = t.shift();
        if (next?.startsWith('play:'))
          return legal.find(
            (a) => a.type === 'playCard' && queries.card(s, a.card).card === next.slice(5),
          );
        return next ? attackOn(s, legal, 'p2', next) : legal.find((a) => a.type === 'endTurn');
      }
      return takeIt(legal);
    },
    seats,
  );
}

const run = (rec: ReviewRecord, turn = 9, nodes = 200_000) =>
  DETECTORS['given-away'](item('given-away', turn, 0), ctxOf(rec, nodes));

describe('E21: attacking with a Blocker let their board win', () => {
  const rec = game(E21, [BLOCKER], [ULTI, KAIDO, KAIDO_CHAR]);
  const ctx = ctxOf(rec);

  it('the planted game ends in their win on turn 10', () => {
    const end = ctx.stateAt(rec.actions.length);
    expect(queries.result(end)).toMatchObject({ winner: 'p2' });
    expect(queries.turn(end).number).toBe(10);
  });

  it('flags the Blocker attack: any-hand, severe, on your turn, opening at that attack', () => {
    const r = DETECTORS['given-away'](item('given-away', 9, 0), ctx)!;
    expect(r.flags).toHaveLength(1);
    const f = r.flags[0]!;
    expect(f).toMatchObject({
      kind: 'given-away',
      turn: 9,
      player: 'p1',
      severity: 'severe',
      certainty: 'any-hand',
      practice: { judge: 'survive-turn', turn: 10 },
    });
    expect(rec.actions[f.decisionIndex]).toMatchObject({ type: 'attack', player: 'p1' });
    expect(f.restoreIndex).toBe(f.decisionIndex);
    expect(f.id).toBe(`given-away:9:${f.decisionIndex}`);
    expect(certaintyLabel(f.certainty, 'review')).toBe('Holds whatever they held');
    expect(f.did).toEqual([
      { kind: 'attack', text: 'Attacked their Leader with Gloriosa.', card: BLOCKER },
    ]);
  });

  it('the item may name their turn or yours: the same game, the same flag', () => {
    const a = DETECTORS['given-away'](item('given-away', 9, 0), ctx)!;
    const b = DETECTORS['given-away'](item('given-away', 10, 0), ctx)!;
    expect(b.flags).toEqual(a.flags);
    expect(DETECTORS['given-away'](item('given-away', 8, 0), ctx)).toBeNull();
  });

  it('matches the E21 example: claim, outcome, nextTime, concept, lesson, certainty, line, evidence', () => {
    const e = DETECTORS['given-away'](item('given-away', 9, 0), ctx)!.flags[0]!.explanation;
    const doc = docExample('E21');
    for (const k of [
      'conceptId',
      'claim',
      'line',
      'outcome',
      'certainty',
      'nextTime',
      'lessonId',
      'sources',
    ] as const)
      expect(e[k], k).toEqual(doc[k]);
    expect(e.evidence.map((x) => x.text)).toEqual(doc.evidence.map((x) => x.text));
    // Figures are recomputed from the position, not copied.
    const base = ctx.stateAt(
      rec.actions.findIndex(
        (a, i) =>
          i > 0 &&
          queries.turn(ctx.stateAt(i)).number === 10 &&
          queries.decision(ctx.stateAt(i))?.kind === 'main',
      ),
    );
    const fig = Object.assign({}, ...e.evidence.map((x) => x.figures ?? {})) as Record<
      string,
      number
    >;
    expect(fig).toMatchObject({
      life: queries.zone(base, 'p1', 'life').length,
      hitsNeeded: queries.zone(base, 'p1', 'life').length + 1,
      attackers: 3,
      restingBlockers: 1,
    });
    expect(queries.zone(base, 'p1', 'characters')[0]!.rested).toBe(true);
  });

  it('the line holds: replayed without the attack, their board no longer wins', () => {
    // Re-derive the branch independently: your turn up to the attack, then end the turn.
    const f = DETECTORS['given-away'](item('given-away', 9, 0), ctx)!.flags[0]!;
    const without: ReviewRecord = {
      ...rec,
      actions: [...rec.actions.slice(0, f.decisionIndex), { type: 'endTurn', player: 'p1' }],
    };
    const s = ctxOf(without).stateAt(without.actions.length);
    expect(queries.decision(s)).toMatchObject({ kind: 'main', player: 'p2' });
    // Their three attacks, you Block one and take two: you survive at 0 Life.
    expect(queries.zone(s, 'p1', 'characters')[0]!.rested).toBe(false);
    expect(queries.zone(s, 'p1', 'life')).toHaveLength(2);
  });
});

describe('given-away: certainty reads only the board', () => {
  const KID = 'EB01-003'; // 5000 [Rush], cost 4
  const pad = (xs: string[]): string[] =>
    [...xs, ...Array.from({ length: 30 }, () => KYO)].slice(0, 30);
  const withHidden = (hand: string[], life: string[], deck: string[]): Spec => {
    const { decklist: _drop, ...p2 } = E21.p2;
    void _drop;
    return { ...E21, p2: { ...p2, hand, life, deck } };
  };
  const flag = (spec: Spec) => run(game(spec, [BLOCKER], [ULTI, KAIDO, KAIDO_CHAR]))!.flags[0]!;

  it('the board-only flag is the same whatever their hand, deck order and Life cards are', () => {
    const a = flag(withHidden([], lifeOf(3, KYO), pad([])));
    expect(a.certainty).toBe('any-hand');
    for (const [hand, life, deck] of [
      [[KYO], lifeOf(3, ULTI), pad([KAIDO_CHAR, ULTI])],
      [[ULTI, KAIDO_CHAR], [KYO, ULTI, KAIDO_CHAR], pad([KID, KYO]).reverse()],
      [[KID], lifeOf(3, KAIDO_CHAR), pad([])],
    ] as [string[], string[], string[]][])
      expect(flag(withHidden(hand, life, deck)), hand.join()).toEqual(a);
  });

  /**
   * Their board is a Leader and Ulti: two attackers against your 2 Life (three hits), so the board
   * alone cannot win. With Kid (5000 [Rush], cost 4) from their hand they have a third attacker. Your
   * Blocker resting: lost; kept back: it Blocks one of three, so two hits only.
   */
  it('Hindsight when only their hand made it lethal: never any-hand, never severe', () => {
    const spec: Spec = {
      ...E21,
      p2: {
        ...E21.p2,
        characters: [ULTI],
        hand: [KID],
        costArea: { active: 4, rested: 0 },
      },
    };
    const rec = game(spec, [BLOCKER], ['play:' + KID, KID, KAIDO, ULTI]);
    expect(queries.result(ctxOf(rec).stateAt(rec.actions.length))).toMatchObject({ winner: 'p2' });
    const r = run(rec)!;
    expect(r.flags).toHaveLength(1);
    const f = r.flags[0]!;
    expect(f.certainty).toBe('needed-hidden-info');
    expect(f.severity).toBe('hindsight');
    expect(certaintyLabel(f.certainty, 'review')).toBe('Hindsight: needed their hidden cards');
    expect(f.explanation.claim).toBe('Attacking with Gloriosa left you open to their hand.');
    expect(f.practice).toEqual({ judge: 'survive-turn', turn: 10 });
  });
});

describe('given-away: when it does not flag', () => {
  it('a control: the same loss comes whatever you do (1 Life, three attackers)', () => {
    const spec: Spec = { ...E21, p1: { ...E21.p1, life: lifeOf(1, KYO) } };
    const rec = game(spec, [BLOCKER], [ULTI, KAIDO, KAIDO_CHAR]);
    const r = run(rec)!;
    expect(r.flags).toHaveLength(0);
    expect(r.notes).toHaveLength(1);
    expect(r.notes[0]!.claim).toBe('Their board won whatever you did.');
    expect(r.marker).toBeUndefined();
  });

  it('nothing to say when you never attacked with a Blocker', () => {
    const rec = game(E21, [], [ULTI, KAIDO, KAIDO_CHAR]);
    expect(run(rec)).toBeNull();
  });

  it('only for a human seat that lost, never the winner', () => {
    const rec = game(E21, [BLOCKER], [ULTI, KAIDO, KAIDO_CHAR], { p1: 'ai', p2: 'human' });
    expect(run(rec)).toBeNull();
  });

  it('a cap is a "Not fully checked" marker, never a clean turn', () => {
    const rec = game(E21, [BLOCKER], [ULTI, KAIDO, KAIDO_CHAR]);
    const r = run(rec, 9, 2)!;
    expect(r.flags).toHaveLength(0);
    expect(r.marker).toMatchObject({ turn: 9, kind: 'given-away', reason: 'search-incomplete' });
  });

  it('is inert on a context with no record (the WP0 registry test)', () => {
    expect(DETECTORS['given-away'](item('given-away', 1, 0), {} as never)).toBeNull();
  });
});
