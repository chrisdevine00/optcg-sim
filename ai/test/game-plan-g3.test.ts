/**
 * Game-plan assertions for group 3: Sabo (OP13-004), Purple Enel (OP15-058) and Donquixote
 * Rosinante (OP12-061) (ARCHITECTURE §4.6, PLAN M5b). Each test is one "Playbook seed" from the
 * archetype guides (docs/content/archetypes/), planted at the turn the guide names, with the Pirate
 * deciding from its own view under an iteration budget, with the playbook's biases and with search
 * alone. The same assertions are measured over Pirate-vs-Pirate games in the nightly run
 * (`PLAN_GAMES`, wired into `npm run test:strength`).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { queries, reduce, type Action, type DeckSpec, type GameState } from '@optcg/engine';
import { PLAYBOOKS } from '../src/index.ts';
import { playMatch } from './support/match.ts';
import { mergeTallies, type Tally } from './support/plan-tally.ts';
import { G3_LEADERS, PlanTallyG3 } from './support/plan-tally-g3.ts';
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

// Searching tests: CI runners are several times slower than a desktop.
vi.setConfig({ testTimeout: 60_000 });

/** Pirate-vs-Pirate games for the game-plan assertions (nightly; 0 skips). */
const PLAN_GAMES = Number(process.env.PLAN_GAMES ?? 0);

describe('the group 3 playbooks are the guides’ seeds', () => {
  it('every guide seed has an assertion with a threshold', () => {
    for (const leader of G3_LEADERS) {
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
    }
  });
});

// ------------------------------------------------------------------------------------------------
// Planted positions
// ------------------------------------------------------------------------------------------------

/** Apply an engine action by instance (the test plays the other seat directly). */
const actRaw = (s: GameState, a: Action) => reduce(s, a).state;

const SABO = 'OP13-004';
const ENEL = 'OP15-058';
const ROSI = 'OP12-061';
const ROCKS = 'OP17-039';

/** The AI (p1) on its own turn against a Rocks leader that has `p2`'s board. */
function turnOf(
  leader: string,
  life: string,
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
      life: lifeOf(leader === ROSI ? 4 : 5, life),
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

const sabo = (...a: [number, number, Partial<Spec['p1']>, Partial<Spec['p2']>?, ('p1' | 'p2')?]) =>
  turnOf(SABO, 'OP17-082', ...a);
const enel = (...a: [number, number, Partial<Spec['p1']>, Partial<Spec['p2']>?, ('p1' | 'p2')?]) =>
  turnOf(ENEL, 'OP15-061', ...a);
const rosi = (...a: [number, number, Partial<Spec['p1']>, Partial<Spec['p2']>?, ('p1' | 'p2')?]) =>
  turnOf(ROSI, 'EB04-058', ...a);

const played = (steps: ReturnType<typeof play>['steps'], card: string) =>
  steps.filter(
    (s) =>
      s.action.type === 'playCard' && cardOf(s.view, (s.action as { card: string }).card) === card,
  );
const activated = (steps: ReturnType<typeof play>['steps'], ability: string) =>
  steps.filter((s) => s.action.type === 'activate' && s.action.ability === ability);
const attackers = (steps: ReturnType<typeof play>['steps']) =>
  steps.flatMap((s) => (s.action.type === 'attack' ? [s.action.attacker] : []));
const myHandle = (steps: ReturnType<typeof play>['steps'], card: string) =>
  steps[0]!.view.zones.p1.characters.find((c) => c.card === card)!.handle;

/**
 * Which planted seeds the search finds without the playbook's move biases (review M5a-08). These
 * run with `it.fails` on search alone: they pass only because a bias encodes the guide's line, and
 * the test turns red the day search alone finds it (then move it out of this set).
 */
const BIAS_ONLY = new Set<string>([
  // Nothing in one rollout pays for the surge's DON!! now, so search alone ends the turn instead.
  'seed 1: activates the leader on T2',
  'seed 2: gives the leader’s DON!! to the Character that can attack, which then attacks',
  // A 1-cost body is worth little in one rollout beside a 0-cost event or a held card.
  'seed 3: opens with a 1-cost Character on T1',
  // The discount is worth nothing until the Law is played after it: a two-step line (it needs the
  // `activateBefore` candidate that pairs them, and the DON!! condition only holds after it).
  'seed 1: uses the DON!! -1 discount before playing a Law',
  'seed 5: P-093 is played with its DON!! condition met (own count at or below theirs)',
]);

/** Planted runs: every tier with the biases on; Pirate also with search alone (BIAS_ONLY). */
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

  describe(`Sabo (OP13-004) game plan, planted, ${label}`, () => {
    t('seed 1: lands Saul on T3 rather than a row of cheap bodies', () => {
      const s = sabo(5, 5, {
        hand: ['OP17-089', 'OP17-080', 'OP17-082', 'OP17-087', 'OP17-083'],
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP17-089').length).toBe(1);
    });

    t('seed 2: gives DON!! to Sabo with a cost-12 Character out and three attackers', () => {
      const s = sabo(7, 7, {
        characters: ['OP17-089', 'OP17-080', 'OP17-087'],
        hand: ['OP17-096'],
      });
      const { steps } = play(s, 'p1', { biases });
      const leader = steps[0]!.view.zones.p1.leader[0]!.handle;
      const gave = steps.findIndex(
        (x) => x.action.type === 'giveDon' && x.action.target === leader,
      );
      const swung = steps.findIndex(
        (x) => x.action.type === 'attack' && x.action.attacker === leader,
      );
      expect(gave).toBeGreaterThanOrEqual(0);
      if (swung >= 0) expect(gave).toBeLessThan(swung);
    });

    t('seed 3: plays Loki as the enabler with 6 DON!! and nothing for his On Play to hit', () => {
      const s = sabo(
        6,
        6,
        { hand: ['OP17-119', 'OP17-080', 'OP17-087', 'OP17-082', 'OP17-083'] },
        {},
        'p2',
      );
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP17-119').length).toBe(1);
    });

    t('seed 4: every 2-cost Elbaph body swings with a cost-12 Character out', () => {
      const s = sabo(7, 7, {
        characters: ['OP17-089', 'OP17-080', 'OP17-087', 'OP17-095'],
      });
      const { steps } = play(s, 'p1', { biases });
      const went = new Set(attackers(steps));
      for (const c of ['OP17-080', 'OP17-087', 'OP17-095'])
        expect(went.has(myHandle(steps, c))).toBe(true);
    });
  });

  describe(`Purple Enel (OP15-058) game plan, planted, ${label}`, () => {
    t('seed 1: activates the leader on T2', () => {
      const s = enel(3, 3, {
        characters: ['OP15-061'],
        hand: ['OP15-075', 'OP15-076', 'OP15-067'],
      });
      const { steps } = play(s, 'p1', { biases });
      expect(activated(steps, 'enel-surge').length).toBe(1);
    });

    t(
      'seed 2: gives the leader’s DON!! to the Character that can attack, which then attacks',
      () => {
        // The opponent holds no Counter, so the loaded Character's attack is free.
        const s = enel(
          5,
          2,
          { characters: [{ card: 'OP15-061', rested: true }, 'OP15-067'], hand: ['OP15-075'] },
          { hand: [] },
        );
        const { steps } = play(s, 'p1', { biases });
        const pick = steps.find(
          (x) =>
            x.action.type === 'pick' &&
            x.view.decision?.source?.card === ENEL &&
            typeof x.action.choice === 'string',
        );
        expect(pick).toBeDefined();
        const chosen = (pick!.action as { choice: string }).choice;
        expect(cardOf(pick!.view, chosen)).toBe('OP15-067');
        expect(attackers(steps)).toContain(chosen);
      },
    );

    t('seed 3: opens with a 1-cost Character on T1', () => {
      const s = enel(1, 1, { hand: ['OP15-061', 'OP15-075', 'OP15-077', 'OP15-078', 'OP15-071'] });
      const { steps } = play(s, 'p1', { biases });
      expect(
        ['OP15-061', 'OP15-067', 'OP15-066', 'OP12-071'].some((c) => played(steps, c).length > 0),
      ).toBe(true);
    });

    t('seed 4: pays DON!! -1 to draw on Shura', () => {
      let s = enel(3, 3, { hand: ['OP15-067', 'OP15-071', 'OP15-075'] });
      const shura = queries.zone(s, 'p1', 'hand').find((c) => c.card === 'OP15-067')!;
      s = actRaw(s, { type: 'playCard', card: shura.instance, player: 'p1' });
      const { steps } = play(s, 'p1', {
        biases,
        stop: (x) => queries.decision(x)?.kind === 'main',
      });
      const ask = steps.find(
        (x) => x.view.decision?.kind === 'optional' && x.view.decision.source?.card === 'OP15-067',
      );
      expect(ask).toBeDefined();
      expect(ask!.action).toMatchObject({ type: 'optional', accept: true });
    });

    t('seed 5: the finisher attacks the turn after it was played', () => {
      const s = enel(
        9,
        6,
        { characters: ['OP15-118', 'OP15-061'] },
        { characters: [{ card: 'OP17-050', rested: true }] },
      );
      const { steps } = play(s, 'p1', { biases });
      expect(attackers(steps)).toContain(myHandle(steps, 'OP15-118'));
    });
  });

  describe(`Rosinante (OP12-061) game plan, planted, ${label}`, () => {
    t('seed 1: uses the DON!! -1 discount before playing a Law', () => {
      const s = rosi(3, 3, { hand: ['P-093', 'ST10-010', 'OP16-064', 'OP12-115'] });
      const { steps } = play(s, 'p1', { biases });
      const d = steps.findIndex(
        (x) => x.action.type === 'activate' && x.action.ability === 'law-discount',
      );
      const law = steps.findIndex(
        (x) =>
          x.action.type === 'playCard' &&
          ['P-093', 'ST10-010'].includes(cardOf(x.view, x.action.card) ?? ''),
      );
      expect(law).toBeGreaterThanOrEqual(0);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThan(law);
    });

    t('seed 1: plays a Law at full cost when the discount does not pay', () => {
      // ST10-010 refunds nothing and 5 DON!! pay its 4: the discount would only cost a DON!!.
      const s = rosi(5, 5, { hand: ['ST10-010', 'OP12-115'] });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'ST10-010').length).toBe(1);
      expect(activated(steps, 'law-discount')).toEqual([]);
    });

    t('seed 2: a Law is on the field by T3', () => {
      const s = rosi(5, 5, { characters: ['OP16-064'], hand: ['EB04-038', 'P-093', 'OP12-115'] });
      const { steps } = play(s, 'p1', { biases });
      expect(
        ['EB04-038', 'P-093', 'ST10-010', 'P-088'].some((c) => played(steps, c).length > 0),
      ).toBe(true);
    });

    t('seed 3: the leader shields a Law that would be K.O.’d while Life is 2 or more', () => {
      let s = start({
        seed: 5,
        turn: 6,
        activePlayer: 'p2',
        firstPlayer: 'p1',
        p1: {
          leader: ROSI,
          life: lifeOf(4, 'EB04-058'),
          characters: [{ card: 'P-093', rested: true }],
          costArea: { active: 0, rested: 5 },
          decklist: listOf(ROSI),
        },
        p2: {
          leader: ROCKS,
          life: lifeOf(5, 'OP17-050'),
          characters: ['OP17-049'],
          costArea: { active: 0, rested: 6 },
          decklist: listOf(ROCKS),
        },
      });
      const by = queries.zone(s, 'p2', 'characters')[0]!;
      const law = queries.zone(s, 'p1', 'characters')[0]!;
      s = actRaw(s, { type: 'attack', attacker: by.instance, target: law.instance, player: 'p2' });
      const { steps } = play(s, 'p1', { biases, stop: (x) => !queries.battle(x) });
      const shield = steps.find(
        (x) =>
          x.view.decision?.kind === 'optional' && x.view.decision.source?.ability === 'law-shield',
      );
      expect(shield, 'the shield was on offer').toBeDefined();
      expect(shield!.action).toMatchObject({ type: 'optional', accept: true });
    });

    t('seed 4: Gum-Gum Lightning goes at the real threat, not the 1-cost body', () => {
      const s = rosi(7, 7, { hand: ['OP09-077'] }, { characters: ['OP17-050', 'OP17-054'] });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP09-077').length).toBe(1);
      const pick = steps.find(
        (x) =>
          x.action.type === 'pick' &&
          x.view.decision?.source?.card === 'OP09-077' &&
          typeof x.action.choice === 'string',
      );
      expect(pick).toBeDefined();
      expect(cardOf(pick!.view, (pick!.action as { choice: string }).choice)).toBe('OP17-054');
    });

    t('seed 5: P-093 is played with its DON!! condition met (own count at or below theirs)', () => {
      const s = rosi(3, 5, { hand: ['P-093', 'OP12-115'] }, { costArea: { active: 4, rested: 0 } });
      const { steps } = play(s, 'p1', { biases });
      const p = played(steps, 'P-093');
      expect(p.length).toBe(1);
      const don = p[0]!.view.don;
      const sum = (x: { active: number; rested: number; given: number }) =>
        x.active + x.rested + x.given;
      expect(sum(don.p1)).toBeLessThanOrEqual(sum(don.p2));
    });
  });
}

const PAIRS: [string, string][] = [
  ['OP13-004', 'OP15-058'],
  ['OP15-058', 'OP12-061'],
  ['OP12-061', 'OP13-004'],
];

describe('group 3 game plans over Pirate-vs-Pirate games', () => {
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
          const t1 = new PlanTallyG3('p1', PLAN_TIER, bySeat.p1.leader);
          const t2 = new PlanTallyG3('p2', PLAN_TIER, bySeat.p2.leader);
          // The search's last ranking, read by the tally of the decision it belongs to.
          let ranking: { actions: Action[]; mean: number }[] | null = null;
          const r = playMatch({
            seed: 50_000 + g,
            debug: (_kind, ranked) => {
              ranking = ranked;
            },
            decks: bySeat,
            tiers: { p1: PLAN_TIER, p2: PLAN_TIER },
            seats: { p1: { biases }, p2: { biases } },
            onDecision: (d) => {
              t1.observe(d, ranking);
              t2.observe(d, ranking);
              ranking = null;
            },
          });
          tallies.push(...t1.finish(), ...t2.finish());
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
      // The biases-off report is for the Pirate; the Warlord's nightly run is the biases-on tally.
      const noBias = PLAN_TIER === 'pirate' ? run(false) : null;
      mkdirSync('test-results', { recursive: true });
      writeFileSync(
        `test-results/game-plan-g3-${PLAN_GAMES}${PLAN_TIER === 'pirate' ? '' : `-${PLAN_TIER}`}.json`,
        JSON.stringify({ date: new Date().toISOString(), withBias, noBias }, null, 2),
      );
      for (const t of withBias.plan)
        if (t.total >= 10)
          expect(t.rate!, `${t.leader} seed ${t.seed}: ${t.text}`).toBeGreaterThanOrEqual(
            t.threshold,
          );
    },
    PLAN_TIER === 'pirate' ? 3_600_000 : 10_800_000,
  );
});
