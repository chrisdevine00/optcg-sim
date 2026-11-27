/** `scenarioOf` (M9 WP2): a real state at a turn's first Main, written as a scenario and rebuilt. */
import { describe, expect, it } from 'vitest';
import {
  checkInvariants,
  createFromScenario,
  legalActions,
  NOT_EXPRESSIBLE_REASONS,
  NotExpressible,
  queries,
  scenarioOf,
  type Action,
  type GameState,
  type InstanceId,
  type PlayerId,
  type ZoneName,
} from '../../src/index.ts';
import { applyOp } from '../../src/testing.ts';
import { cards } from '../fixtures/index.ts';
import { playRandomGame } from '../support/random-game.ts';

const ZONES: ZoneName[] = ['hand', 'deck', 'life', 'leader', 'characters', 'stage', 'trash'];
const PL: PlayerId[] = ['p1', 'p2'];

/** Everything a scenario can say, by position (instance ids differ between the two states). */
function shape(s: GameState) {
  const turn = queries.turn(s);
  const out: Record<string, unknown> = { turn: turn.number, active: turn.activePlayer };
  for (const p of PL) {
    for (const z of ZONES)
      out[`${p}.${z}`] = queries.zone(s, p, z).map((c) => ({
        card: c.card,
        rested: c.rested,
        faceUp: c.faceUp,
        don: c.don,
        fresh: c.played === turn.number,
      }));
    out[`${p}.don`] = queries.don(s, p);
  }
  return out;
}

/** An action with each instance id written as `seat.zone[index]`. */
function positional(s: GameState, a: Action): unknown {
  const where = new Map<InstanceId, string>();
  for (const p of PL)
    for (const z of ZONES)
      queries.zone(s, p, z).forEach((c, i) => where.set(c.instance, `${p}.${z}[${i}]`));
  const o: Record<string, unknown> = { ...a };
  delete o.intentId;
  for (const k of ['attacker', 'target', 'card', 'blocker'])
    if (typeof o[k] === 'string') o[k] = where.get(o[k] as string) ?? o[k];
  const ch = o.choice as { from?: string; card?: string } | string | undefined;
  if (typeof ch === 'string') o.choice = where.get(ch) ?? ch;
  else if (ch?.card) o.choice = { ...ch, card: where.get(ch.card) ?? ch.card };
  return o;
}

/** Up to `n` states, each the first Main decision of a turn, from seeded random games. */
function firstMains(n: number): GameState[] {
  const out: GameState[] = [];
  for (let seed = 1; out.length < n && seed < 200; seed++) {
    const g = playRandomGame({ seed: 9000 + seed, keepStates: true, invariants: false });
    let lastTurn = -1;
    for (const s of g.states) {
      const d = queries.decision(s);
      const t = queries.turn(s);
      if (d?.kind === 'main' && t.phase === 'main' && t.number !== lastTurn) {
        lastTurn = t.number;
        try {
          scenarioOf(s, cards());
        } catch (e) {
          if (e instanceof NotExpressible) continue;
          throw e;
        }
        out.push(s);
        if (out.length >= n) break;
      }
    }
  }
  return out;
}

describe('scenarioOf round trip', () => {
  const states = firstMains(20);

  it('finds twenty seeded first-Main states', () => {
    expect(states).toHaveLength(20);
    // Not all of one turn: the round trip covers early and late boards.
    expect(new Set(states.map((s) => queries.turn(s).number)).size).toBeGreaterThan(3);
  });

  it('rebuilds equal zones, DON!!, order, turn and legal actions', () => {
    for (const s of states) {
      const spec = scenarioOf(s, cards());
      // Plain JSON: a bank can commit it.
      const back = createFromScenario({
        ...JSON.parse(JSON.stringify(spec)),
        cards: cards(),
      }).state;
      expect(checkInvariants(back)).toEqual([]);
      expect(shape(back)).toEqual(shape(s));
      expect(legalActions(back).map((a) => positional(back, a))).toEqual(
        legalActions(s).map((a) => positional(s, a)),
      );
    }
  });

  it('swaps a hand, face-down Life and deck, and nothing else', () => {
    const s = states.find((x) => queries.zone(x, 'p2', 'life').length >= 2)!;
    const filler = queries.zone(s, 'p1', 'deck')[0]!.card;
    const hand = queries.zone(s, 'p2', 'hand').map(() => filler);
    const back = createFromScenario({
      ...scenarioOf(s, cards(), {
        hand: { p2: hand },
        life: { p2: [filler, filler] },
        deck: { p2: [] },
      }),
      cards: cards(),
    }).state;
    expect(queries.zone(back, 'p2', 'hand').map((c) => c.card)).toEqual(hand);
    expect(queries.zone(back, 'p2', 'life')).toHaveLength(2);
    expect(queries.zone(back, 'p2', 'deck')).toHaveLength(0);
    expect(shape(back)['p1.characters']).toEqual(shape(s)['p1.characters']);
  });
});

/** Main decisions after a Character was played this turn (and DON!! given): the mid-turn round trip. */
function midTurn(n: number): GameState[] {
  const out: GameState[] = [];
  for (let seed = 1; out.length < n && seed < 200; seed++) {
    const g = playRandomGame({ seed: 9500 + seed, keepStates: true, invariants: false });
    for (const s of g.states) {
      const d = queries.decision(s);
      const t = queries.turn(s);
      if (d?.kind !== 'main' || t.phase !== 'main') continue;
      const fresh = queries
        .zone(s, t.activePlayer, 'characters')
        .some((c) => c.played === t.number);
      if (!fresh) continue;
      try {
        scenarioOf(s, cards());
      } catch (e) {
        if (e instanceof NotExpressible) continue;
        throw e;
      }
      out.push(s);
      break;
    }
  }
  return out;
}

describe('scenarioOf mid-turn', () => {
  it('keeps a Character played this turn sick, and the DON!! already spent', () => {
    const states = midTurn(8);
    expect(states.length).toBeGreaterThanOrEqual(4);
    for (const s of states) {
      const back = createFromScenario({ ...scenarioOf(s, cards()), cards: cards() }).state;
      expect(checkInvariants(back)).toEqual([]);
      expect(shape(back)).toEqual(shape(s));
      expect(legalActions(back).map((a) => positional(back, a))).toEqual(
        legalActions(s).map((a) => positional(s, a)),
      );
    }
  });
});

describe('scenarioOf refuses what a scenario cannot say', () => {
  const s = firstMains(1)[0]!;

  it('a duration on a card is NotExpressible("duration")', () => {
    const target = queries.zone(s, queries.turn(s).activePlayer, 'leader')[0]!.instance;
    const withMod = applyOp(s, {
      op: 'modifier',
      mod: {
        kind: 'power',
        target,
        amount: 1000,
        duration: { kind: 'thisTurn', turn: queries.turn(s).number },
        controller: queries.turn(s).activePlayer,
      },
    }).state;
    expect(() => scenarioOf(withMod, cards())).toThrow(NotExpressible);
    try {
      scenarioOf(withMod, cards());
    } catch (e) {
      expect((e as NotExpressible).reason).toBe('duration');
    }
  });

  it('a state that is not a Main decision is NotExpressible("decision")', () => {
    const g = playRandomGame({ seed: 12, keepStates: true, invariants: false });
    const other = g.states.find((x) => queries.decision(x)?.kind !== 'main')!;
    expect(() => scenarioOf(other, cards())).toThrow(NotExpressible);
  });

  it('the reasons are a closed list and every thrown reason is on it', () => {
    expect(new Set(NOT_EXPRESSIBLE_REASONS).size).toBe(NOT_EXPRESSIBLE_REASONS.length);
    const g = playRandomGame({ seed: 31, keepStates: true, invariants: false });
    for (const x of g.states) {
      try {
        scenarioOf(x, cards());
      } catch (e) {
        expect(e).toBeInstanceOf(NotExpressible);
        expect(NOT_EXPRESSIBLE_REASONS).toContain((e as NotExpressible).reason);
      }
    }
  });
});
