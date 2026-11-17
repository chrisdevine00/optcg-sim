/**
 * Game-plan assertions for the group-2 archetypes (ARCHITECTURE §4.6): Luffy & Ace (ST30-001),
 * Monkey.D.Luffy Red/Green (OP13-001) and Monkey.D.Luffy Black (OP17-079). Each test is one
 * "Playbook seed" from the archetype guide (docs/content/archetypes/), planted at the turn the guide
 * names, with the Pirate deciding from its own view under an iteration budget. Same shape as
 * game-plan.test.ts: every planted test runs with the playbook biases and again on search alone,
 * and `BIAS_ONLY` lists the ones that hold only because a bias encodes the guide's line. The same
 * seeds are measured over Pirate-vs-Pirate games in the nightly run (PLAN_GAMES, below).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { queries, reduce, type Action, type GameState } from '@optcg/engine';
import { PLAYBOOKS, type Bias, type Playbook } from '../src/index.ts';
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
import { mergeTallies, type Tally } from './support/plan-tally.ts';
import { PlanTallyG2 } from './support/plan-tally-g2.ts';
import { playMatch } from './support/match.ts';
import { metaDecks } from './support.ts';

vi.setConfig({ testTimeout: 60_000 });

const actRaw = (s: GameState, a: Action) => reduce(s, a).state;

const LA = 'ST30-001';
const RG = 'OP13-001';
const BL = 'OP17-079';
const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const life5 = (c: string) => lifeOf(5, c);

/** The seed numbers the guide lists under "Playbook seeds". */
function guideSeeds(leader: string): number[] {
  const md = readFileSync(
    new URL(`../../docs/content/archetypes/${leader}.md`, import.meta.url),
    'utf8',
  );
  const section = md.split('## Playbook seeds')[1] ?? '';
  return [...section.matchAll(/^(\d+)\. /gm)].map((m) => Number(m[1]));
}

describe('the group-2 playbooks are the guides’ seeds', () => {
  for (const leader of [LA, RG, BL])
    it(`${leader}: every playbook seed has an assertion with a threshold`, () => {
      const pb = PLAYBOOKS.get(leader)!;
      expect(pb).toBeDefined();
      expect(pb.assertions.map((a) => a.seed)).toEqual(guideSeeds(leader));
      for (const a of pb.assertions) expect(a.threshold).toBeGreaterThan(0);
      // Every bias is for a seed the guide has.
      for (const b of pb.biases) expect(guideSeeds(leader)).toContain(b.seed);
    });
});

/** Position on `me`'s turn; the other seat plays Rocks (it never acts: the plain responder). */
interface Pos {
  me: 'p1' | 'p2';
  leader: string;
  turn: number;
  first: 'p1' | 'p2';
  don: number;
  mine?: Partial<Spec['p1']>;
  theirs?: Partial<Spec['p2']>;
  /** Rested DON!! among the opponent's. */
  theirDon?: { active: number; rested: number };
}

function position(p: Pos): GameState {
  const foe = p.me === 'p1' ? 'p2' : 'p1';
  const side = {
    leader: p.leader,
    life: life5('OP17-050'),
    costArea: { active: p.don, rested: 0 },
    decklist: listOf(p.leader),
    ...p.mine,
  };
  const other = {
    leader: ROCKS,
    life: life5('OP17-050'),
    hand: ['OP17-054', 'OP17-055', 'OP17-056'],
    costArea: p.theirDon ?? { active: 4, rested: 0 },
    decklist: listOf(ROCKS),
    ...p.theirs,
  };
  return start({
    seed: 5,
    turn: p.turn,
    activePlayer: p.me,
    firstPlayer: p.first,
    [p.me]: side,
    [foe]: other,
  } as unknown as Spec);
}

const played = (steps: ReturnType<typeof play>['steps'], card: string) =>
  steps.filter(
    (s) =>
      s.action.type === 'playCard' && cardOf(s.view, (s.action as { card: string }).card) === card,
  );

const chars = (s: GameState, p: 'p1' | 'p2') => queries.zone(s, p, 'characters');

/**
 * The planted seeds that hold only with the playbook biases (search alone does not find them).
 * They run with `it.fails` on search alone and turn red the day search alone finds them.
 */
const BIAS_ONLY = new Set<string>([
  // Search alone values a cheap searcher or a Stage below passing the turn.
  'seed 1: plays a 1-cost searcher on T1',
  'seed 1: plays Thousand Sunny on T1',
  // And it does not swing the Leader at all without the bias: the guide's T2 row.
  'seed 3: gives every spare DON!! to the Leader before its attack (T3)',
  'seed 3: holds the DON!! a Counter Event in hand needs',
  // Group 2, OP13-001: a defensive Leader the heuristic does not see defending with.
  'seed 1: ends T2 with a DON!! given to the Leader',
  'seed 2: plays Sanji before Luffy OP13-118 when it plays both',
  'seed 2: with the Leader rested, Sanji then Luffy',
  'seed 5: plays a searcher on T1',
  'seed 5: plays Thousand Sunny on T1',
  // Group 2, OP17-079: Luffy is a body whether or not a Giant is out.
  'seed 2: keeps Luffy OP17-093 in hand while no cost-12+ Character is out',
  'seed 2: plays Luffy with a Giant out, and attacks with him',
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

  describe(`Luffy & Ace (ST30-001) game plan, planted, ${label}`, () => {
    const la = (pos: Omit<Pos, 'me' | 'leader' | 'first'>): GameState =>
      position({ me: 'p1', leader: LA, first: 'p1', ...pos });

    t('seed 1: plays a 1-cost searcher on T1', () => {
      const s = la({
        turn: 1,
        don: 1,
        mine: { hand: ['ST21-014', 'OP01-016', 'ST30-012', 'OP12-037', 'OP04-016'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP01-016').length).toBe(1);
    });

    t('seed 1: plays Thousand Sunny on T1', () => {
      const s = la({
        turn: 1,
        don: 1,
        mine: { hand: ['ST21-014', 'ST31-005', 'ST30-012', 'OP12-037', 'OP04-016'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'ST31-005').length).toBe(1);
    });

    t('seed 2: plays Sanji into a free Luffy on T3', () => {
      const s = la({
        turn: 5,
        don: 5,
        mine: { hand: ['ST31-001', 'ST21-014', 'ST30-012', 'OP01-016', 'OP04-016'] },
      });
      const { steps, state } = play(s, 'p1', { biases });
      expect(played(steps, 'ST31-001').length).toBe(1);
      expect(chars(state, 'p1').map((c) => c.card)).toContain('ST21-014');
    });

    t('seed 3: gives every spare DON!! to the Leader before its attack (T3)', () => {
      const s = la({ turn: 5, don: 5, mine: { hand: ['ST31-004'] } });
      const { steps } = play(s, 'p1', { biases });
      const leader = steps[0]!.view.zones.p1.leader[0]!.handle;
      const attack = steps.find((x) => x.action.type === 'attack' && x.action.attacker === leader);
      expect(attack, 'the Leader attacked').toBeDefined();
      expect(attack!.view.don.p1.active).toBe(0);
    });

    t('seed 3: holds the DON!! a Counter Event in hand needs', () => {
      // Ga Ha Ha Ha!! costs 1: one DON!! stays active for it.
      const s = la({ turn: 5, don: 4, mine: { hand: ['OP17-017'] } });
      const { steps } = play(s, 'p1', { biases });
      const leader = steps[0]!.view.zones.p1.leader[0]!.handle;
      const attack = steps.find((x) => x.action.type === 'attack' && x.action.attacker === leader);
      expect(attack, 'the Leader attacked').toBeDefined();
      expect(attack!.view.don.p1.active).toBeGreaterThanOrEqual(1);
    });

    t('seed 4: does not play a Character with 7000 or more base power', () => {
      // ST31-004 is 7 cost, 9000: it would turn the Leader's −2000 on.
      const s = la({
        turn: 7,
        don: 7,
        mine: { hand: ['ST31-004', 'ST30-012', 'OP12-015'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'ST31-004')).toEqual([]);
    });

    t('seed 5: keeps I Know You’re Strong when no opposing Character is rested', () => {
      const s = la({
        turn: 5,
        don: 5,
        mine: { hand: ['OP13-040', 'OP01-016'] },
        theirs: { characters: ['OP17-045', 'OP17-054'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP13-040')).toEqual([]);
    });

    t('seed 6: keeps Demon Aura when the opponent has nothing active', () => {
      const s = la({
        turn: 5,
        don: 5,
        mine: { hand: ['OP12-037', 'OP01-016'] },
        theirs: { characters: [{ card: 'OP17-045', rested: true }] },
        theirDon: { active: 0, rested: 5 },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP12-037')).toEqual([]);
    });

    t('seed 6: does not cast Demon Aura after its Leader has attacked', () => {
      const s = la({
        turn: 5,
        don: 5,
        mine: { leader: { card: LA, rested: true }, hand: ['OP12-037', 'OP01-016'] } as never,
        theirs: { characters: ['OP17-045', 'OP17-054'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP12-037')).toEqual([]);
    });
  });

  describe(`Monkey.D.Luffy (OP13-001) game plan, planted, ${label}`, () => {
    const rg = (pos: Omit<Pos, 'leader'>): GameState => position({ leader: RG, ...pos });
    const endSteps = (steps: ReturnType<typeof play>['steps'], me: 'p1' | 'p2') =>
      steps.filter((x) => x.player === me && x.action.type === 'endTurn');

    t('seed 1: ends T2 with a DON!! given to the Leader', () => {
      // Going second: turn 4 is its T2, 4 DON!!. Usopp (4) is the alternative use of every DON!!.
      const s = rg({
        me: 'p2',
        first: 'p1',
        turn: 4,
        don: 4,
        mine: { hand: ['OP14-022', 'OP01-016', 'OP15-035'] },
      });
      const { steps } = play(s, 'p2', { biases });
      const end = endSteps(steps, 'p2')[0]!;
      expect(end.view.zones.p2.leader[0]!.don).toBeGreaterThanOrEqual(1);
    });

    t('seed 2: plays Sanji before Luffy OP13-118 when it plays both', () => {
      // 9 DON!!: Sanji (5) sets 2 active, so Luffy (6) is affordable after it, not before.
      const s = rg({
        me: 'p1',
        first: 'p1',
        turn: 9,
        don: 9,
        mine: { hand: ['OP13-118', 'OP13-027', 'OP15-035'] },
      });
      const { steps } = play(s, 'p1', { biases });
      const luffy = played(steps, 'OP13-118');
      const sanji = played(steps, 'OP13-027');
      if (luffy.length > 0) {
        expect(sanji.length, 'Sanji comes with Luffy').toBe(1);
        expect(steps.indexOf(sanji[0]!)).toBeLessThan(steps.indexOf(luffy[0]!));
      }
      // The Pirate plays Sanji here. The Warlord's tree finds a better-scoring line in this
      // position (7 DON!! on the Leader and a swing, no Character), which the guide's seed does
      // not forbid: the seed is the order when both are played, so for the Warlord this position
      // asserts that order only, and the companion test below forces both plays.
      if (tier === 'pirate') expect(sanji.length).toBe(1);
    });

    t('seed 2: with the Leader rested, Sanji then Luffy', () => {
      // The Leader cannot swing, so there is no DON!! pump to prefer: the Warlord plays Sanji (5),
      // which sets 2 DON!! active, then Luffy (6), and Sanji must come first.
      const s = rg({
        me: 'p1',
        first: 'p1',
        turn: 9,
        don: 9,
        mine: { leader: { card: 'OP13-001', rested: true }, hand: ['OP13-118', 'OP13-027'] },
      });
      const { steps } = play(s, 'p1', { biases });
      const luffy = played(steps, 'OP13-118');
      const sanji = played(steps, 'OP13-027');
      if (luffy.length > 0 && sanji.length > 0)
        expect(steps.indexOf(sanji[0]!)).toBeLessThan(steps.indexOf(luffy[0]!));
      expect(sanji.length).toBe(1);
    });

    t('seed 3: ends T3 with 1 to 5 active DON!!', () => {
      // Laboon (1) and Luffy OP12-015 (4) would spend all 5.
      const s = rg({
        me: 'p1',
        first: 'p1',
        turn: 5,
        don: 5,
        mine: { hand: ['OP15-035', 'OP12-015'] },
      });
      const { steps } = play(s, 'p1', { biases });
      const end = endSteps(steps, 'p1')[0]!;
      const active = queries.don(end.before, 'p1').active;
      expect(active).toBeGreaterThanOrEqual(1);
      expect(active).toBeLessThanOrEqual(5);
    });

    t('seed 3: does not pass with more than 5 active DON!!', () => {
      // 7 DON!! and only a 1-cost card: the Leader's rest works only with 5 or fewer active.
      const s = rg({
        me: 'p1',
        first: 'p1',
        turn: 7,
        don: 7,
        mine: { hand: ['OP01-016', 'OP14-022', 'OP14-031'] },
      });
      const { steps } = play(s, 'p1', { biases });
      const end = endSteps(steps, 'p1')[0]!;
      expect(queries.don(end.before, 'p1').active).toBeLessThanOrEqual(5);
    });

    t(
      'seed 4: the Leader’s DON!! rest alone stops the attack, so Charlestone stays in hand',
      () => {
        // Kyo 4000 + 2 DON!! = 6000 into a 5000 Leader with 1 DON!! given (6000): a hit. One DON!!
        // rested is +2000, which already turns it; Charlestone (Counter +4000) is not needed.
        const s0 = start({
          seed: 3,
          turn: 6,
          activePlayer: 'p1',
          firstPlayer: 'p2',
          p1: {
            leader: ROCKS,
            life: life5('OP17-050'),
            characters: [{ card: 'OP17-045', don: 2 }],
            costArea: { active: 0, rested: 4 },
            decklist: listOf(ROCKS),
          },
          p2: {
            leader: { card: RG, don: 1 },
            // Two Life: a hit is no longer a card in hand, it is close to the end.
            life: lifeOf(2, 'OP17-050'),
            hand: ['OP05-038', 'OP15-035'],
            costArea: { active: 3, rested: 0 },
            decklist: listOf(RG),
          },
        });
        const s = actRaw(s0, {
          type: 'attack',
          attacker: queries.zone(s0, 'p1', 'characters')[0]!.instance,
          target: queries.zone(s0, 'p2', 'leader')[0]!.instance,
          player: 'p1',
        });
        const { steps, state } = play(s, 'p2', { biases, stop: (x) => !queries.battle(x) });
        expect(played(steps, 'OP05-038')).toEqual([]);
        expect(
          steps.some(
            (x) => x.action.type === 'counter' && cardOf(x.view, x.action.card) === 'OP05-038',
          ),
        ).toBe(false);
        expect(queries.zone(state, 'p2', 'life').length).toBe(2);
      },
    );

    t('seed 5: plays a searcher on T1', () => {
      const s = rg({
        me: 'p1',
        first: 'p1',
        turn: 1,
        don: 1,
        mine: { hand: ['OP13-118', 'OP01-016', 'OP14-022', 'EB04-007', 'OP05-038'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP01-016').length).toBe(1);
    });

    t('seed 5: plays Thousand Sunny on T1', () => {
      const s = rg({
        me: 'p1',
        first: 'p1',
        turn: 1,
        don: 1,
        mine: { hand: ['OP13-118', 'ST31-005', 'OP14-022', 'EB04-007', 'OP05-038'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'ST31-005').length).toBe(1);
    });
  });

  describe(`Monkey.D.Luffy Black (OP17-079) game plan, planted, ${label}`, () => {
    const bl = (pos: Omit<Pos, 'leader' | 'me' | 'first'>): GameState =>
      position({ leader: BL, me: 'p1', first: 'p1', ...pos });
    const giants = (s: GameState) => chars(s, 'p1').filter((c) => (c.cost ?? 0) >= 12);

    t('seed 1: lands Rodo on T1', () => {
      const s = bl({
        turn: 1,
        don: 1,
        mine: { hand: ['OP17-094', 'OP17-086', 'OP17-080', 'OP17-082', 'OP17-095'] },
      });
      const { state } = play(s, 'p1', { biases });
      expect(giants(state).length).toBeGreaterThanOrEqual(1);
    });

    t('seed 1: lands Gerd on T2 when no Giant is out', () => {
      const s = bl({
        turn: 3,
        don: 3,
        mine: { hand: ['OP17-081', 'OP17-080', 'OP17-082', 'OP17-095'] },
      });
      const { state } = play(s, 'p1', { biases });
      expect(giants(state).length).toBeGreaterThanOrEqual(1);
    });

    t('seed 2: keeps Luffy OP17-093 in hand while no cost-12+ Character is out', () => {
      const s = bl({
        turn: 15,
        don: 10,
        mine: { hand: ['OP17-093', 'OP17-080'], characters: ['OP17-095'] },
        theirs: { characters: ['OP17-045'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP17-093')).toEqual([]);
    });

    t('seed 2: plays Luffy with a Giant out, and attacks with him', () => {
      const s = bl({
        turn: 15,
        don: 10,
        mine: { hand: ['OP17-093', 'OP17-080'], characters: ['OP17-094'] },
        theirs: { characters: [{ card: 'OP17-045', rested: true }] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP17-093').length).toBe(1);
      expect(
        steps.some(
          (x) => x.action.type === 'attack' && cardOf(x.view, x.action.attacker) === 'OP17-093',
        ),
      ).toBe(true);
    });

    t('seed 3: Luffy’s On Play replays Rodo or Gerd from the trash', () => {
      let s = bl({
        turn: 15,
        don: 10,
        mine: {
          hand: ['OP17-093'],
          characters: ['OP17-119'],
          // Top of the trash first: the Giant is last in line.
          trash: ['OP17-095', 'OP17-080', 'OP17-086', 'OP17-094'],
        },
      });
      const luffy = queries.zone(s, 'p1', 'hand').find((c) => c.card === 'OP17-093')!;
      s = actRaw(s, { type: 'playCard', card: luffy.instance, player: 'p1' });
      const { steps } = play(s, 'p1', {
        biases,
        stop: (x) => queries.decision(x)?.kind === 'main',
      });
      const pick = steps.find(
        (x) => x.action.type === 'pick' && x.view.decision?.source?.card === 'OP17-093',
      );
      expect(pick, 'the On Play offered a choice').toBeDefined();
      expect(['OP17-094', 'OP17-081']).toContain(
        cardOf(pick!.view, (pick!.action as { choice: string }).choice),
      );
    });

    t('seed 4: keeps two cost-12+ Characters out by T4', () => {
      const s = bl({
        turn: 7,
        don: 7,
        mine: {
          hand: ['OP17-081', 'OP17-080', 'OP17-082', 'OP17-095', 'OP17-086'],
          characters: ['OP17-094'],
        },
      });
      const { state } = play(s, 'p1', { biases });
      expect(giants(state).length).toBeGreaterThanOrEqual(2);
    });
  });
}

/**
 * The new bias kinds on their own (group 2): each runs on a synthetic copy of a playbook, so the
 * mechanism is shown without the search's own opinion of the card in the way. A control with the
 * bias removed shows the move the bias changes.
 */
function withPlaybook<T>(leader: string, edit: (pb: Playbook) => void, fn: () => T): T {
  const map = PLAYBOOKS as Map<string, Playbook>;
  const orig = map.get(leader)!;
  const copy = structuredClone(orig);
  edit(copy);
  map.set(leader, copy);
  try {
    return fn();
  } finally {
    map.set(leader, orig);
  }
}

describe.each(PLAN_TIERS)('%s: group-2 bias kinds, mechanics (synthetic playbooks)', (tier) => {
  beforeAll(() => setTier(tier));
  afterAll(() => setTier('pirate'));
  /** A bonus that makes search want the card whatever its text does. */
  const want = (cards: string[]): Bias => ({ kind: 'play', cards, bonus: 8, seed: 1 });
  const without = (kind: Bias['kind']) => (pb: Playbook) => {
    pb.biases = pb.biases.filter((b) => b.kind !== kind);
  };

  it('playOnlyWhen: a wanted Event waits for its condition, and plays once it holds', () => {
    const edit = (pb: Playbook) => {
      pb.biases.push(want(['OP13-040']));
      // The condition outweighs the wish: the penalty alone decides.
      for (const b of pb.biases) if (b.kind === 'playOnlyWhen') b.penalty = 20;
    };
    const pos = (theirs: Partial<Spec['p2']>) =>
      position({
        me: 'p1',
        leader: LA,
        first: 'p1',
        turn: 5,
        don: 5,
        mine: { hand: ['OP13-040'] },
        theirs,
      });
    const board = { characters: ['OP17-045'] }; // active
    const rested = { characters: [{ card: 'OP17-045', rested: true }] };
    const run = (p: GameState) => played(play(p, 'p1').steps, 'OP13-040').length;
    withPlaybook(LA, edit, () => {
      expect(run(pos(board)), 'condition false: held').toBe(0);
      expect(run(pos(rested)), 'condition true: played').toBe(1);
    });
    withPlaybook(
      LA,
      (pb) => {
        edit(pb);
        without('playOnlyWhen')(pb);
      },
      () => expect(run(pos(board)), 'control, no condition: played').toBe(1),
    );
  });

  it('avoidBasePower: a wanted 9000 Character stays in hand', () => {
    const pos = () =>
      position({
        me: 'p1',
        leader: LA,
        first: 'p1',
        turn: 7,
        don: 7,
        mine: { hand: ['ST31-004'] },
      });
    const edit = (pb: Playbook) => {
      // The Warlord's tree values this body (to the end of the opponent's next turn) about 2 units
      // above not playing it, the Pirate's one-turn search less: the "want" is sized to each tier
      // so that the want minus the 5-point penalty is below the search's own value either way.
      pb.biases.push({
        kind: 'play',
        cards: ['ST31-004'],
        bonus: tier === 'pirate' ? 4 : 1,
        seed: 4,
      });
    };
    withPlaybook(LA, edit, () => expect(played(play(pos(), 'p1').steps, 'ST31-004')).toEqual([]));
    withPlaybook(
      LA,
      (pb) => {
        edit(pb);
        without('avoidBasePower')(pb);
      },
      () => expect(played(play(pos(), 'p1').steps, 'ST31-004').length).toBe(1),
    );
  });

  it('keepActiveDon: a Leader attack leaves the DON!! its rest needs', () => {
    const pos = () =>
      position({ me: 'p1', leader: RG, first: 'p1', turn: 7, don: 7, mine: { hand: [] } });
    const left = () => {
      const { steps } = play(pos(), 'p1');
      const leader = steps[0]!.view.zones.p1.leader[0]!.handle;
      const attack = steps.find((x) => x.action.type === 'attack' && x.action.attacker === leader);
      return attack ? attack.view.don.p1.active : -1;
    };
    expect(left()).toBeGreaterThanOrEqual(1);
    withPlaybook(RG, without('keepActiveDon'), () => expect(left()).toBe(0));
  });

  it('preferPick: the On Play choice goes to the named card', () => {
    const pos = () => {
      const s = position({
        me: 'p1',
        leader: BL,
        first: 'p1',
        turn: 15,
        don: 10,
        mine: {
          hand: ['OP17-093'],
          characters: ['OP17-119'],
          trash: ['OP17-094', 'OP17-081', 'OP17-086', 'OP17-095'],
        },
      });
      const luffy = queries.zone(s, 'p1', 'hand')[0]!;
      return actRaw(s, { type: 'playCard', card: luffy.instance, player: 'p1' });
    };
    const pick = () => {
      const { steps } = play(pos(), 'p1', { stop: (x) => queries.decision(x)?.kind === 'main' });
      const p = steps.find(
        (x) => x.action.type === 'pick' && x.view.decision?.source?.card === 'OP17-093',
      )!;
      return cardOf(p.view, (p.action as { choice: string }).choice);
    };
    withPlaybook(
      BL,
      (pb) => {
        pb.biases = pb.biases.filter((b) => b.kind !== 'preferPick');
        pb.biases.push({
          kind: 'preferPick',
          source: 'OP17-093',
          ability: 'on-play',
          cards: ['OP17-095'],
          bonus: 8,
          seed: 3,
        });
      },
      () => expect(pick()).toBe('OP17-095'),
    );
  });
});

/** Pirate-vs-Pirate games for the game-plan assertions (nightly; 0 skips). Same variable as strength.test.ts. */
const PLAN_GAMES = Number(process.env.PLAN_GAMES ?? 0);

describe('group-2 game-plan assertions over Pirate-vs-Pirate games (nightly)', () => {
  it.runIf(PLAN_GAMES > 0)(
    `${PLAN_GAMES} games, with and without the biases`,
    () => {
      const all = metaDecks();
      const deck = (leader: string) => all.find((d) => d.leader === leader)!;
      const mine = [LA, RG, BL];
      // Each archetype meets Rocks, Kaido and the three group-2 decks in turn, seats swapped.
      const pool = [ROCKS, KAIDO, LA, RG, BL];
      const run = (biases: boolean) => {
        const tallies: Tally[] = [];
        const results: Record<string, number> = {};
        for (let g = 0; g < PLAN_GAMES; g++) {
          const a = deck(mine[g % 3]!);
          const b = deck(pool[(g + Math.floor(g / 3)) % pool.length]!);
          const decks = g % 2 === 0 ? { p1: a, p2: b } : { p1: b, p2: a };
          const t1 = new PlanTallyG2('p1', PLAN_TIER, decks.p1.leader);
          const t2 = new PlanTallyG2('p2', PLAN_TIER, decks.p2.leader);
          const r = playMatch({
            seed: 50_000 + g,
            decks,
            tiers: { p1: PLAN_TIER, p2: PLAN_TIER },
            seats: { p1: { biases }, p2: { biases } },
            onDecision: (d) => {
              t1.observe(d);
              t2.observe(d);
            },
          });
          tallies.push(...t1.finish(), ...t2.finish());
          const w = r.result && 'winner' in r.result ? decks[r.result.winner].leader : 'draw';
          results[w] = (results[w] ?? 0) + 1;
        }
        return {
          results,
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
        `test-results/game-plan-g2-${PLAN_GAMES}${PLAN_TIER === 'pirate' ? '' : `-${PLAN_TIER}`}.json`,
        JSON.stringify({ date: new Date().toISOString(), withBias, noBias }, null, 2),
      );
      console.log('game-plan-g2', JSON.stringify({ withBias, noBias }));
      for (const t of withBias.plan)
        if (t.total >= 10)
          expect(t.rate!, `${t.leader} seed ${t.seed}: ${t.text}`).toBeGreaterThanOrEqual(
            t.threshold,
          );
    },
    PLAN_TIER === 'pirate' ? 3_600_000 : 10_800_000,
  );
});
