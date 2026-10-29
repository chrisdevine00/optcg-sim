/**
 * Game-plan assertions in planted positions (ARCHITECTURE §4.6, PLAN M5a exit). Each test is one
 * "Playbook seed" from the archetype guides (docs/content/archetypes/OP17-039.md, OP17-058.md),
 * planted at the turn the guide names, with the Pirate deciding from its own view under an
 * iteration budget. The same assertions are also measured statistically over Pirate-vs-Pirate games
 * in the nightly run (strength.test.ts, PLAN_GAMES).
 */
import { describe, expect, it, vi } from 'vitest';
import { queries, reduce, type Action, type GameState } from '@optcg/engine';
import { PLAYBOOKS } from '../src/index.ts';
import { cardOf, lifeOf, listOf, play, start, type Spec } from './support/scenario.ts';

// Searching tests: CI runners are several times slower than a desktop.
vi.setConfig({ testTimeout: 60_000 });

/** Apply an engine action by instance (the test plays the other seat directly). */
const actRaw = (s: GameState, a: Action) => reduce(s, a).state;

const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const life5 = (c: string) => lifeOf(5, c);

/** A Rocks (p1) vs Kaido (p2) position on Rocks's turn. */
function rocksTurn(
  turn: number,
  don: number,
  p1: Partial<Spec['p1']>,
  p2: Partial<Spec['p2']> = {},
): GameState {
  return start({
    seed: 7,
    turn,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: ROCKS,
      life: life5('OP17-050'),
      costArea: { active: don, rested: 0 },
      decklist: listOf(ROCKS),
      ...p1,
    },
    p2: {
      leader: KAIDO,
      hand: ['OP17-073', 'OP15-078', 'OP17-062', 'OP17-061', 'EB04-032'],
      life: life5('OP17-074'),
      costArea: { active: Math.min(10, don + 1), rested: 0 },
      decklist: listOf(KAIDO),
      ...p2,
    },
  });
}

/** A Kaido (p2) position on Kaido's turn (Rocks went first). */
function kaidoTurn(
  turn: number,
  don: number,
  p2: Partial<Spec['p2']>,
  p1: Partial<Spec['p1']> = {},
): GameState {
  return start({
    seed: 11,
    turn,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: ROCKS,
      hand: ['OP17-055', 'OP17-056', 'OP17-045', 'OP17-049', 'OP17-048'],
      life: life5('OP17-050'),
      costArea: { active: don, rested: 0 },
      decklist: listOf(ROCKS),
      ...p1,
    },
    p2: {
      leader: KAIDO,
      life: life5('OP17-074'),
      costArea: { active: don, rested: 0 },
      decklist: listOf(KAIDO),
      ...p2,
    },
  });
}

const played = (steps: ReturnType<typeof play>['steps'], card: string) =>
  steps.filter(
    (s) =>
      s.action.type === 'playCard' && cardOf(s.view, (s.action as { card: string }).card) === card,
  );

describe('the playbooks are the guides’ seeds', () => {
  it('every playbook seed has an assertion with a threshold', () => {
    for (const pb of PLAYBOOKS.values()) {
      expect(pb.assertions.map((a) => a.seed)).toEqual([1, 2, 3, 4, 5]);
      for (const a of pb.assertions) expect(a.threshold).toBeGreaterThan(0);
    }
  });
});

/**
 * Which planted seeds the search finds without the playbook's move biases (review M5a-08). These
 * run with `it.fails` on search alone: they pass only because a bias encodes the guide's line, and
 * the test turns red the day search alone finds it (then move it out of this set).
 */
const BIAS_ONLY = new Set<string>([
  // Holding the −2000 costs nothing visible within one rollout, so search alone spends it.
  'holds the −2000 when it changes nothing: an attack that already fails',
  // A two-step line (shrink, then Ulti's K.O.) the greedy search cannot see one move at a time.
  'seed 4: plays Ulti & Page One only after its Leader attacks and applies the −2000',
]);

for (const biases of [true, false]) {
  const label = biases ? 'with the playbook biases' : 'search alone (biases off)';
  const t = (name: string, fn: () => void) =>
    (!biases && BIAS_ONLY.has(name) ? it.fails : it)(name, fn);
  describe(`Rocks.D.Xebec (OP17-039) game plan, planted, ${label}`, () => {
    t('seed 1: the Leader attacks on T2 (the first turn it may battle)', () => {
      const s = rocksTurn(3, 3, {
        hand: ['OP17-054', 'OP17-045', 'OP17-056', 'OP08-051', 'OP17-055'],
      });
      const { steps } = play(s, 'p1', { biases });
      const leader = steps[0]!.view.zones.p1.leader[0]!.handle;
      expect(
        steps.some(
          (x) => x.player === 'p1' && x.action.type === 'attack' && x.action.attacker === leader,
        ),
      ).toBe(true);
    });

    t('seed 2: pays the reveal cost when holding 2+ cards', () => {
      const s = rocksTurn(3, 3, {
        hand: ['OP17-054', 'OP17-045', 'OP17-056', 'OP08-051', 'OP17-055'],
      });
      const { steps } = play(s, 'p1', { biases });
      const reveal = steps.filter(
        (x) =>
          x.player === 'p1' &&
          x.view.decision?.kind === 'optional' &&
          x.view.decision.source?.card === ROCKS,
      );
      expect(reveal.length).toBeGreaterThan(0);
      for (const r of reveal) {
        expect(r.view.zones.p1.hand.length).toBeGreaterThanOrEqual(2);
        expect(r.action).toMatchObject({ type: 'optional', accept: true });
      }
    });

    t(
      'seed 3: plays OP17-118 on its first 10-DON!! turn and puts two Characters into play with it',
      () => {
        const s = rocksTurn(
          11,
          10,
          {
            hand: ['OP17-118', 'OP17-049', 'OP17-054', 'OP17-055', 'OP17-056'],
            characters: ['OP17-050', 'OP17-045'],
          },
          {
            characters: ['EB04-031', 'OP17-065'],
            hand: ['OP17-073', 'OP15-078', 'OP17-062', 'OP17-061', 'EB04-032'],
          },
        );
        const { steps } = play(s, 'p1', { biases });
        const p = played(steps, 'OP17-118');
        expect(p.length).toBe(1);
        // Its On Play: draw 1 and play up to 2 Rocks Pirates (different names, total cost 9 or less).
        const i = steps.indexOf(p[0]!);
        const next = steps
          .slice(i + 1)
          .find((x) => x.player === 'p1' && x.view.decision?.kind === 'main');
        const boardBefore = queries.zone(p[0]!.before, 'p1', 'characters').length;
        const boardAfter = queries.zone(next!.before, 'p1', 'characters').length;
        expect(boardAfter - boardBefore).toBe(3);
      },
    );

    t('seed 4: does not play Buckin while OP17-118 is in hand after T3', () => {
      const s = rocksTurn(
        7,
        7,
        {
          hand: ['OP08-051', 'OP17-118', 'OP17-048', 'OP17-046', 'OP17-055'],
          characters: ['OP17-045'],
        },
        { characters: ['OP17-073'] },
      );
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP08-051')).toEqual([]);
    });

    t(
      "seed 5: Stussy's On Play stops the opponent's highest-power Character with base cost 6 or less",
      () => {
        let s = rocksTurn(
          5,
          5,
          { hand: ['OP17-054', 'OP17-055', 'OP17-056'] },
          {
            characters: ['EB04-032', 'EB04-031', 'OP17-073'],
          },
        );
        // Play Stussy, then let the AI choose the target of its On Play.
        const stussy = queries.zone(s, 'p1', 'hand').find((c) => c.card === 'OP17-054')!;
        s = actRaw(s, { type: 'playCard', card: stussy.instance, player: 'p1' });
        const { steps } = play(s, 'p1', {
          biases,
          stop: (x) => queries.decision(x)?.kind === 'main',
        });
        const pick = steps.find(
          (x) => x.action.type === 'pick' && x.view.decision?.source?.card === 'OP17-054',
        );
        expect(pick).toBeDefined();
        expect(cardOf(pick!.view, (pick!.action as { choice: string }).choice)).toBe('EB04-031');
      },
    );
  });

  describe(`Kaido (OP17-058) game plan, planted, ${label}`, () => {
    /** Rocks (p1) attacks Kaido's Leader with `attacker`; returns the state at Kaido's first decision. */
    function rocksAttacks(attacker: { card: string; don?: number } | 'leader', leaderDon = 0) {
      const s0 = start({
        seed: 3,
        turn: 6,
        activePlayer: 'p1',
        firstPlayer: 'p2',
        p1: {
          leader: { card: ROCKS, don: leaderDon },
          life: life5('OP17-050'),
          hand: ['OP17-055', 'OP17-056'],
          // A Leader attack still leaves Kyo for the −2000 to shrink, so the choice is real.
          characters:
            attacker === 'leader'
              ? [{ card: 'OP17-045', rested: true }]
              : [{ card: attacker.card, don: attacker.don ?? 0 }],
          costArea: { active: 0, rested: 4 },
          decklist: listOf(ROCKS),
        },
        p2: {
          leader: KAIDO,
          life: lifeOf(4, 'OP17-074'),
          hand: ['OP17-062', 'OP17-061', 'OP17-073', 'EB04-031'],
          costArea: { active: 0, rested: 6 },
          decklist: listOf(KAIDO),
        },
      });
      const by =
        attacker === 'leader'
          ? queries.zone(s0, 'p1', 'leader')[0]!
          : queries.zone(s0, 'p1', 'characters')[0]!;
      const target = queries.zone(s0, 'p2', 'leader')[0]!;
      return {
        s: actRaw(s0, {
          type: 'attack',
          attacker: by.instance,
          target: target.instance,
          player: 'p1',
        }),
      };
    }

    t(
      "seed 1 and 2: uses the Leader's −2000 on a Character attacker when it changes the result, on the attacker",
      () => {
        // Kyo 4000 + 2 DON!! = 6000 into Kaido's 5000 Leader: the −2000 makes it fail.
        const { s } = rocksAttacks({ card: 'OP17-045', don: 2 });
        expect(queries.decision(s)?.kind).toBe('optional');
        const { steps, state } = play(s, 'p2', { biases, stop: (x) => !queries.battle(x) });
        const use = steps.find((x) => x.player === 'p2' && x.view.decision?.kind === 'optional')!;
        expect(use.action).toMatchObject({ type: 'optional', accept: true });
        const pick = steps.find(
          (x) =>
            x.player === 'p2' && x.action.type === 'pick' && typeof x.action.choice === 'string',
        )!;
        expect(cardOf(pick.view, (pick.action as { choice: string }).choice)).toBe('OP17-045');
        // The Counter needed fell from 2000 to 0: no card left Kaido's hand and no Life was lost.
        expect(queries.zone(state, 'p2', 'life').length).toBe(4);
        expect(queries.zone(state, 'p2', 'hand').length).toBe(4);
      },
    );

    t('holds the −2000 when it changes nothing: an attack that already fails', () => {
      const { s } = rocksAttacks({ card: 'OP17-045', don: 0 }); // 4000 into 5000
      const { steps } = play(s, 'p2', { biases, stop: (x) => !queries.battle(x) });
      const use = steps.find((x) => x.player === 'p2' && x.view.decision?.kind === 'optional');
      expect(use, 'the −2000 was on offer').toBeDefined();
      expect(use!.action).toMatchObject({ type: 'optional', accept: false });
    });

    t('holds the −2000 against a Leader attack (it can only shrink Characters, RL-45)', () => {
      const { s } = rocksAttacks('leader', 1);
      const { steps } = play(s, 'p2', { biases, stop: (x) => !queries.battle(x) });
      const use = steps.find(
        (x) =>
          x.player === 'p2' &&
          x.view.decision?.kind === 'optional' &&
          x.view.decision.source?.card === KAIDO,
      );
      expect(use, 'the −2000 was on offer').toBeDefined();
      expect(use!.action).toMatchObject({ type: 'optional', accept: false });
    });

    t('seed 3: plays a DON!!-adding Character by T3', () => {
      const s = kaidoTurn(4, 4, {
        // X.Drake (2 cost, no DON!!) is a real alternative at 4 DON!!.
        hand: ['OP17-073', 'OP17-074', 'OP17-075', 'OP15-078', 'OP17-062'],
      });
      const { steps } = play(s, 'p2', { biases });
      const adders = ['EB04-032', 'OP17-073', 'OP17-074', 'EB04-031'];
      expect(adders.some((c) => played(steps, c).length > 0)).toBe(true);
    });

    t('seed 4: plays Ulti & Page One only after its Leader attacks and applies the −2000', () => {
      const s = kaidoTurn(
        8,
        8,
        { hand: ['OP17-060', 'OP17-074', 'OP15-078', 'OP17-062'], characters: ['EB04-031'] },
        { characters: ['OP17-054'] },
      );
      const { steps } = play(s, 'p2', { biases });
      const ulti = played(steps, 'OP17-060');
      expect(ulti.length).toBe(1);
      const leader = steps[0]!.view.zones.p2.leader[0]!.handle;
      const i = steps.indexOf(ulti[0]!);
      const before = steps.slice(0, i);
      expect(before.some((x) => x.action.type === 'attack' && x.action.attacker === leader)).toBe(
        true,
      );
      // Its [When Attacking] −2000 went on Stussy (5000 → 3000), which Ulti's On Play then K.O.s.
      expect(
        queries.zone(steps[steps.length - 1]!.after, 'p1', 'characters').map((c) => c.card),
      ).not.toContain('OP17-054');
    });

    t('seed 5: lands a 9- or 10-cost Character by T5', () => {
      const s = kaidoTurn(
        10,
        10,
        {
          // Three small plays (X.Drake, Queen, Hawkins) are a real alternative at 10 DON!!.
          hand: ['OP17-061', 'OP17-062', 'OP17-075', 'EB04-032', 'OP17-073'],
          characters: ['EB04-031', 'OP17-074'],
        },
        { characters: ['OP17-048', 'OP17-049'] },
      );
      const { steps } = play(s, 'p2', { biases });
      const big = ['OP17-061', 'OP17-062', 'OP17-063', 'OP17-065', 'ST34-004'];
      expect(big.some((c) => played(steps, c).length > 0)).toBe(true);
    });
  });
}
