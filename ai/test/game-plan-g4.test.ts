/**
 * Game-plan assertions for group 4: Monkey.D.Luffy (EB02-010) and Franky (OP18-021) (M11 Track C).
 * Each test is one "Playbook seed" from the archetype guides (docs/content/archetypes/), planted at
 * the turn the guide names, with the Pirate deciding from its own view under an iteration budget,
 * with the playbook's biases and with search alone. The same assertions are measured over
 * Pirate-vs-Pirate games in the nightly run (`PLAN_GAMES`, wired into `npm run test:plan-g4`).
 * Every assertion is our reasoning (no written source), so the seeds are the guides' own.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { type Action, type DeckSpec, type GameState } from '@optcg/engine';
import { PLAYBOOKS } from '../src/index.ts';
import { playMatch } from './support/match.ts';
import { expectTalliesMeetThresholds } from './support/rate.ts';
import { mergeTallies, type Tally } from './support/plan-tally.ts';
import { G4_LEADERS, PlanTallyG4 } from './support/plan-tally-g4.ts';
import {
  PLAN_TIER,
  PLAN_TIERS,
  setTier,
  type Tier,
  cardOf,
  lifeOf,
  listOf,
  play,
  start,
  type Spec,
} from './support/scenario.ts';
import { metaDecks } from './support.ts';

vi.setConfig({ testTimeout: 60_000 });

/** Pirate-vs-Pirate games for the game-plan assertions (nightly; 0 skips). */
const PLAN_GAMES = Number(process.env.PLAN_GAMES_G4 ?? process.env.PLAN_GAMES ?? 0);

describe('the group 4 playbooks are the guides’ seeds', () => {
  it('every guide seed has an assertion with a threshold', () => {
    for (const leader of G4_LEADERS) {
      const guide = readFileSync(
        new URL(`../../docs/content/archetypes/${leader}.md`, import.meta.url),
        'utf8',
      );
      const seeds = guide
        .slice(guide.indexOf('## Playbook seeds'))
        .split('\n')
        .filter((l) => /^\d+\. /.test(l)).length;
      const pb = PLAYBOOKS.get(leader)!;
      expect(pb.assertions.map((a) => a.seed)).toEqual(
        Array.from({ length: seeds }, (_, i) => i + 1),
      );
      for (const a of pb.assertions) expect(a.threshold).toBeGreaterThan(0);
      // No written source: the playbook says so, and cites no handbook entry.
      expect(pb.mulligan.source).toMatch(/our reasoning/);
      expect(pb.mulligan.source).not.toMatch(/SH-/);
    }
  });
});

const LUFFY = 'EB02-010';
const FRANKY = 'OP18-021';
const ROCKS = 'OP17-039';

/** The AI (p1) on its own turn against a Rocks leader. */
function turnOf(
  leader: string,
  turn: number,
  don: number,
  p1: Partial<Spec['p1']>,
  p2: Partial<Spec['p2']> = {},
  firstPlayer: 'p1' | 'p2' = 'p1',
): GameState {
  return start({
    seed: 5,
    turn,
    activePlayer: 'p1',
    firstPlayer,
    p1: {
      leader,
      life: lifeOf(4, 'OP18-038'),
      costArea: { active: don, rested: 0 },
      decklist: listOf(leader),
      ...p1,
    },
    p2: {
      leader: ROCKS,
      hand: ['OP17-055', 'OP17-056'],
      life: lifeOf(5, 'OP17-050'),
      costArea: { active: Math.min(10, don + 1), rested: 0 },
      decklist: listOf(ROCKS),
      ...p2,
    },
  });
}

const luffy = (...a: [number, number, Partial<Spec['p1']>, Partial<Spec['p2']>?]) =>
  turnOf(LUFFY, ...a);
const franky = (...a: [number, number, Partial<Spec['p1']>, Partial<Spec['p2']>?]) =>
  turnOf(FRANKY, ...a);

type Steps = ReturnType<typeof play>['steps'];
const played = (steps: Steps, ...cards: string[]) =>
  steps.findIndex(
    (s) => s.action.type === 'playCard' && cards.includes(cardOf(s.view, s.action.card) ?? ''),
  );
const activated = (steps: Steps, ability: string) =>
  steps.findIndex((s) => s.action.type === 'activate' && s.action.ability === ability);

/**
 * Which planted seeds the search finds without the playbook's move biases (review M5a-08). These
 * run with `it.fails` on search alone: they pass only because a bias encodes the guide's line, and
 * the test turns red the day search alone finds it (then move it out of this set). Filled in from
 * a run with the biases off (M11 Track C).
 */
const BIAS_ONLY = new Set<string>([
  // Nothing in one rollout pays for a DON!! -2 that only returns DON!! and sets as many active.
  'seed 1: uses the Leader’s DON!! -2 on T3 with only Straw Hat Crew Characters',
  // A 1-cost searcher is worth little in one rollout beside a held card.
  'seed 2: opens with a Nami searcher on T1',
  'seed 3: opens with a searcher on T1',
  // The free Stage is a two-step line (the draw and DON!! come after the DON!! -1).
  'seed 1: plays a Stage with the Leader’s DON!! -1 on T2',
  // Franky is not played at all by search alone with this hand (the Stage waits in hand as a Counter).
  'seed 2: plays a Stage before Franky OP18-034',
]);

const PLANTED: [Tier, boolean][] = [
  ...PLAN_TIERS.map((t): [Tier, boolean] => [t, true]),
  ['pirate', false],
];

for (const [tier, biases] of PLANTED) {
  const label = `${tier}, ${biases ? 'with the playbook biases' : 'search alone (biases off)'}`;
  const t = (name: string, fn: () => void) =>
    (!biases && BIAS_ONLY.has(name) ? it.fails : it)(name, () => {
      setTier(tier);
      return fn();
    });

  describe(`Luffy (EB02-010) game plan, planted, ${label}`, () => {
    t('seed 1: uses the Leader’s DON!! -2 on T3 with only Straw Hat Crew Characters', () => {
      const s = luffy(5, 5, {
        characters: ['ST18-001'],
        hand: ['OP12-037', 'OP13-040'],
        costArea: { active: 3, rested: 2 },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(activated(steps, 'set-active')).toBeGreaterThanOrEqual(0);
    });

    t('seed 2: opens with a Nami searcher on T1', () => {
      const s = luffy(1, 1, { hand: ['EB02-017', 'OP12-037', 'OP13-040', 'OP09-078', 'ST18-001'] });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'EB02-017', 'PRB02-012')).toBeGreaterThanOrEqual(0);
    });

    t('seed 3: plays Sanji & Pudding before the Leader’s DON!! -2', () => {
      const s = luffy(5, 5, {
        characters: ['ST18-001'],
        hand: ['EB02-035', 'OP12-037'],
        costArea: { active: 5, rested: 0 },
      });
      const { steps } = play(s, 'p1', { biases });
      const sp = played(steps, 'EB02-035');
      const act = activated(steps, 'set-active');
      expect(sp).toBeGreaterThanOrEqual(0);
      if (act >= 0) expect(sp).toBeLessThan(act);
    });
  });

  // M11C-R5: the Leader's cost is paid before its condition is read, so the AI must not pay it
  // with no Character on the field, or with a Character that is not Straw Hat Crew.
  describe(`Luffy (EB02-010) never pays DON!! -2 for nothing, planted, ${label}`, () => {
    t('seed 4: no DON!! -2 with an empty board', () => {
      const s = luffy(5, 5, {
        characters: [],
        hand: ['OP12-037', 'OP13-040'],
        costArea: { active: 3, rested: 2 },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(activated(steps, 'set-active')).toBe(-1);
    });

    t('seed 4: no DON!! -2 with a Character that is not Straw Hat Crew', () => {
      const s = luffy(5, 5, {
        characters: ['OP13-006'],
        hand: ['OP12-037', 'OP13-040'],
        costArea: { active: 3, rested: 2 },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(activated(steps, 'set-active')).toBe(-1);
    });
  });

  // M11C-R7: the same for the Franky Leader with no Stage of cost 5 or less to play.
  describe(`Franky (OP18-021) never pays DON!! -1 for nothing, planted, ${label}`, () => {
    t('seed 4: no DON!! -1 with no Stage in hand', () => {
      const s = franky(3, 3, { hand: ['OP18-066', 'OP18-072', 'OP18-034'] });
      const { steps } = play(s, 'p1', { biases });
      expect(activated(steps, 'play-stage')).toBe(-1);
    });
  });

  describe(`Franky (OP18-021) game plan, planted, ${label}`, () => {
    t('seed 1: plays a Stage with the Leader’s DON!! -1 on T2', () => {
      const s = franky(3, 3, { hand: ['OP18-075', 'OP18-061', 'OP18-038'] });
      const { steps } = play(s, 'p1', { biases });
      expect(activated(steps, 'play-stage')).toBeGreaterThanOrEqual(0);
    });

    t('seed 2: plays a Stage before Franky OP18-034', () => {
      const s = franky(7, 7, { hand: ['OP18-034', 'OP18-077', 'OP18-038'] });
      const { steps } = play(s, 'p1', { biases });
      const franky34 = played(steps, 'OP18-034');
      expect(franky34).toBeGreaterThanOrEqual(0);
      const stage = Math.min(
        ...[played(steps, 'OP18-077'), activated(steps, 'play-stage')].filter((i) => i >= 0),
      );
      expect(stage).toBeLessThan(franky34);
    });

    t('seed 3: opens with a searcher on T1', () => {
      const s = franky(1, 1, {
        hand: ['EB02-017', 'OP12-037', 'OP18-038', 'OP18-066', 'OP18-072'],
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'EB02-017', 'PRB02-012', 'OP18-061', 'OP18-070')).toBeGreaterThanOrEqual(
        0,
      );
    });
  });
}

const PAIRS: [string, string][] = [
  ['EB02-010', 'OP18-021'],
  ['OP18-021', 'OP17-039'],
  ['OP17-039', 'EB02-010'],
];

describe('group 4 game plans over Pirate-vs-Pirate games', () => {
  it.runIf(PLAN_GAMES > 0)(
    `game-plan assertions over ${PLAN_GAMES} games, with and without the biases`,
    () => {
      const all = metaDecks();
      const deck = (leader: string): DeckSpec => all.find((d) => d.leader === leader)!;
      const run = (biases: boolean) => {
        const tallies: Tally[] = [];
        const results: Record<string, number> = {};
        const exempt: Record<string, { finishing: number; turns: number }> = {};
        for (let g = 0; g < PLAN_GAMES; g++) {
          const [x, y] = PAIRS[g % PAIRS.length]!;
          const swap = Math.floor(g / PAIRS.length) % 2 === 1;
          const bySeat = swap ? { p1: deck(y), p2: deck(x) } : { p1: deck(x), p2: deck(y) };
          const t1 = new PlanTallyG4('p1', PLAN_TIER, bySeat.p1.leader);
          const t2 = new PlanTallyG4('p2', PLAN_TIER, bySeat.p2.leader);
          const r = playMatch({
            seed: 60_000 + g,
            decks: bySeat,
            tiers: { p1: PLAN_TIER, p2: PLAN_TIER },
            seats: { p1: { biases }, p2: { biases } },
            onDecision: (d) => {
              t1.observe(d);
              t2.observe(d);
            },
          });
          tallies.push(
            ...(PLAYBOOKS.has(bySeat.p1.leader) && G4_LEADERS.includes(bySeat.p1.leader as never)
              ? t1.finish()
              : []),
            ...(PLAYBOOKS.has(bySeat.p2.leader) && G4_LEADERS.includes(bySeat.p2.leader as never)
              ? t2.finish()
              : []),
          );
          for (const [t, d] of [
            [t1, bySeat.p1],
            [t2, bySeat.p2],
          ] as const) {
            const e = (exempt[d.leader] ??= { finishing: 0, turns: 0 });
            e.finishing += t.exempt.finishing;
            e.turns += t.exempt.turns;
          }
          const w = r.result && 'winner' in r.result ? bySeat[r.result.winner].leader : 'draw';
          results[w] = (results[w] ?? 0) + 1;
        }
        return {
          results,
          finishingTurnsExempted: exempt,
          plan: mergeTallies(tallies).map((t) => ({
            ...t,
            rate: t.total ? t.hits / t.total : null,
          })),
        };
      };
      const withBias = run(true);
      const noBias = PLAN_TIER === 'pirate' ? run(false) : null;
      mkdirSync('test-results', { recursive: true });
      writeFileSync(
        `test-results/game-plan-g4-${PLAN_GAMES}${PLAN_TIER === 'pirate' ? '' : `-${PLAN_TIER}`}.json`,
        JSON.stringify({ date: new Date().toISOString(), withBias, noBias }, null, 2),
      );
      expectTalliesMeetThresholds(withBias.plan);
    },
    PLAN_TIER === 'pirate' ? 3_600_000 : 10_800_000,
  );
});

export type { Action };
