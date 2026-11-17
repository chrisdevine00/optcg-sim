/**
 * Game-plan assertions for the group-1 playbooks (DECISIONS 2026-11-17, M5b): Nico Robin
 * (OP09-062), Yellow Enel (OP05-098), Kalgara (OP08-098) and Boa Hancock (OP14-041). Each test is
 * one "Playbook seed" from the guide in docs/content/archetypes/, planted at the turn the guide
 * names, with the Pirate deciding from its own view under an iteration budget. Every planted seed
 * runs twice, with the playbook's biases and with search alone (M5a precedent, game-plan.test.ts):
 * the seeds that pass only because a bias encodes the guide's line are listed in BIAS_ONLY and run
 * with `it.fails` on search alone, so the test turns red the day search finds the line by itself.
 * The same seeds are also measured over Pirate-vs-Pirate games (`PLAN_GAMES_G1`, nightly).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { queries, reduce, type Action, type GameState } from '@optcg/engine';
import { PLAYBOOKS } from '../src/index.ts';
import { mkdirSync, writeFileSync } from 'node:fs';
import { playMatch } from './support/match.ts';
import { mergeTallies, type Tally } from './support/plan-tally.ts';
import { PlanTallyG1 } from './support/plan-tally-g1.ts';
import { metaDecks } from './support.ts';
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

vi.setConfig({ testTimeout: 60_000 });

const actRaw = (s: GameState, a: Action) => reduce(s, a).state;

const ROBIN = 'OP09-062';
const ENEL = 'OP05-098';
const KALGARA = 'OP08-098';
const HANCOCK = 'OP14-041';
/** The other seat in every planted position: a Rocks (OP17-039) that never blocks or counters. */
const OPP = 'OP17-039';
const life5 = lifeOf(5, 'OP17-050');

interface Pos {
  leader: string;
  turn: number;
  don: number;
  /** The AI went second (its turn numbers are even). */
  second?: boolean;
  mine?: Partial<Spec['p1']>;
  opp?: Partial<Spec['p2']>;
}

/** A position on the AI's own turn (the AI is p1). */
function pos(p: Pos): GameState {
  return start({
    seed: 5,
    turn: p.turn,
    activePlayer: 'p1',
    firstPlayer: p.second ? 'p2' : 'p1',
    p1: {
      leader: p.leader,
      life: lifeOf(4, 'OP17-102'),
      costArea: { active: p.don, rested: 0 },
      decklist: listOf(p.leader),
      ...p.mine,
    },
    p2: {
      leader: OPP,
      life: life5,
      hand: ['OP17-055', 'OP17-056'],
      costArea: { active: Math.min(10, p.don + 1), rested: 0 },
      decklist: listOf(OPP),
      ...p.opp,
    },
  });
}

const played = (steps: ReturnType<typeof play>['steps'], card: string) =>
  steps.filter(
    (s) =>
      s.player === 'p1' &&
      s.action.type === 'playCard' &&
      cardOf(s.view, (s.action as { card: string }).card) === card,
  );

const leaderHandle = (steps: ReturnType<typeof play>['steps']) =>
  steps[0]!.view.zones.p1.leader[0]!.handle;

/** Play `card` from hand directly, then let the AI answer what the play asks (its On Play). */
function playThenDecide(s: GameState, card: string, biases: boolean) {
  const c = queries.zone(s, 'p1', 'hand').find((x) => x.card === card)!;
  const s1 = actRaw(s, { type: 'playCard', card: c.instance, player: 'p1' });
  return play(s1, 'p1', { biases, stop: (x) => queries.decision(x)?.kind === 'main' });
}

describe('the group-1 playbooks are the guides’ seeds', () => {
  it('every seed has an assertion with a threshold, and every bias names one of them', () => {
    for (const id of [ROBIN, ENEL, KALGARA, HANCOCK]) {
      const pb = PLAYBOOKS.get(id)!;
      expect(pb, id).toBeDefined();
      expect(pb.assertions.map((a) => a.seed)).toEqual(pb.assertions.map((_, i) => i + 1));
      for (const a of pb.assertions) expect(a.threshold).toBeGreaterThan(0);
      for (const b of pb.biases) expect(b.seed).toBeLessThanOrEqual(pb.assertions.length);
    }
  });
});

/**
 * Seeds that search alone does not find (so the planted test needs its bias). Filled in from the
 * measured runs; see docs/benchmarks.md "Group 1 playbooks".
 */
const BIAS_ONLY = new Set<string>([
  // Search alone ends the turn without pitching or attacking: the leader's value is not in its rollout.
  'seed 1: the Leader attacks on T2 and pitches a Trigger card',
  // Attacking an 8000-power body into a counter-holding Rocks scores below ending the turn.
  'seed 5: attacks with two 8000-power Trigger Characters on the Linlin turn',
  // Linlin's draw and Life gain outrank every other play, even with nothing for her effect to lift.
  'seed 2: does not play Linlin on an empty field',
  // The free play and the DON!! it needs are the leader's text; search picks a cheaper Shandian.
  'seed 1: the Leader attacks with a DON!! given and plays a Shandian Warrior free',
  'seed 2: the free play is the highest-cost Shandian Warrior in hand',
  // The leader's effect is on the opponent's turn, past the rollout.
  'seed 1: ends the turn with a DON!! given to the Leader',
  // A face-down Life card is unknown to the AI's own view, so search cannot rank which to plant.
  'seed 4: Hiyori puts a Trigger card on top of the Life',
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

  describe(`Nico Robin (OP09-062) game plan, planted, ${label}`, () => {
    t('seed 1: the Leader attacks on T2 and pitches a Trigger card', () => {
      const s = pos({
        leader: ROBIN,
        turn: 3,
        don: 3,
        mine: { hand: ['OP17-107', 'OP17-102', 'OP17-113', 'OP09-078', 'OP17-074'] },
      });
      const { steps } = play(s, 'p1', { biases });
      const leader = leaderHandle(steps);
      expect(steps.some((x) => x.action.type === 'attack' && x.action.attacker === leader)).toBe(
        true,
      );
      const pitch = steps.find(
        (x) => x.view.decision?.kind === 'optional' && x.view.decision.source?.card === ROBIN,
      );
      expect(pitch, 'the pitch was on offer').toBeDefined();
      expect(pitch!.action).toMatchObject({ type: 'optional', accept: true });
    });

    t('seed 1: does not pitch when the DON!! deck is empty (RL-50: it adds nothing)', () => {
      const s = pos({
        leader: ROBIN,
        turn: 11,
        don: 10,
        mine: { hand: ['OP17-107', 'OP17-102', 'OP17-113'] },
      });
      const { steps } = play(s, 'p1', { biases });
      const pitch = steps.find(
        (x) => x.view.decision?.kind === 'optional' && x.view.decision.source?.card === ROBIN,
      );
      if (pitch) expect(pitch.action).toMatchObject({ type: 'optional', accept: false });
    });

    t('seed 2: plays Yamato the first turn it is affordable', () => {
      const s = pos({
        leader: ROBIN,
        turn: 3,
        don: 3,
        mine: { hand: ['OP17-074', 'OP17-107', 'OP17-102', 'OP17-106', 'OP09-078'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP17-074').length).toBe(1);
    });

    t('seed 3: plays Charlotte Pudding on T3 and pays her cost (trashes a Trigger card)', () => {
      const s = pos({
        leader: ROBIN,
        turn: 5,
        don: 5,
        mine: { hand: ['OP17-109', 'OP17-074', 'OP17-107', 'OP17-102', 'OP17-114'] },
      });
      const { steps, state } = play(s, 'p1', { biases });
      expect(played(steps, 'OP17-109').length).toBe(1);
      // The cost is paid: a card with a [Trigger] went to the trash and three came back.
      const pay = steps.find(
        (x) => x.view.decision?.kind === 'optional' && x.view.decision.source?.card === 'OP17-109',
      );
      expect(pay?.action).toMatchObject({ type: 'optional', accept: true });
      expect(queries.zone(state, 'p1', 'trash').length).toBeGreaterThanOrEqual(1);
    });

    t('seed 4: casts Charlotte Linlin on its first 10-DON!! turn', () => {
      const s = pos({
        leader: ROBIN,
        turn: 10,
        don: 10,
        second: true,
        mine: {
          hand: ['OP17-112', 'OP17-109', 'OP17-107', 'OP17-102', 'OP17-106'],
          characters: ['OP17-074'],
        },
        opp: { characters: ['OP17-045'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP17-112').length).toBe(1);
    });

    t('seed 5: attacks with two 8000-power Trigger Characters on the Linlin turn', () => {
      const s = pos({
        leader: ROBIN,
        turn: 12,
        don: 10,
        second: true,
        mine: {
          hand: ['OP17-113'],
          characters: ['OP17-112', 'OP17-107', 'OP17-102'],
        },
        opp: { characters: ['OP17-045'] },
      });
      const { steps } = play(s, 'p1', { biases });
      const handles = new Map(
        steps[0]!.view.zones.p1.characters.map((c) => [c.handle, c.card] as const),
      );
      const attackers = steps.filter(
        (x) =>
          x.player === 'p1' &&
          x.action.type === 'attack' &&
          ['OP17-107', 'OP17-102'].includes(handles.get(x.action.attacker) ?? ''),
      );
      expect(attackers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe(`Yellow Enel (OP05-098) game plan, planted, ${label}`, () => {
    t('seed 1: pays Charlotte Pudding’s cost when a Trigger card is in hand', () => {
      const s = pos({
        leader: ENEL,
        turn: 3,
        don: 3,
        mine: { hand: ['OP17-109', 'OP17-107', 'OP11-106', 'EB04-058'] },
      });
      const { steps } = playThenDecide(s, 'OP17-109', biases);
      const pay = steps.find((x) => x.view.decision?.kind === 'optional');
      expect(pay, 'the cost was on offer').toBeDefined();
      expect(pay!.action).toMatchObject({ type: 'optional', accept: true });
    });

    t('seed 2: plays Linlin with two Trigger Characters on its field', () => {
      const s = pos({
        leader: ENEL,
        turn: 11,
        don: 10,
        mine: {
          hand: ['OP17-112', 'OP17-106', 'OP16-119', 'OP11-106'],
          characters: ['OP17-102', 'OP17-107'],
        },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP17-112').length).toBe(1);
    });

    t('seed 2: does not play Linlin on an empty field', () => {
      const s = pos({
        leader: ENEL,
        turn: 11,
        don: 10,
        mine: { hand: ['OP17-112', 'OP17-106', 'OP16-119', 'OP11-106'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP17-112')).toEqual([]);
    });

    t('seed 3: pays the rest-2-DON!! cost of Sweet 3 Generals', () => {
      const s = pos({
        leader: ENEL,
        turn: 7,
        don: 8,
        mine: { hand: ['OP17-114', 'OP17-107', 'OP11-106'] },
        opp: { characters: ['OP17-045'] },
      });
      const { steps } = playThenDecide(s, 'OP17-114', biases);
      const pay = steps.find((x) => x.view.decision?.kind === 'optional');
      expect(pay, 'the cost was on offer').toBeDefined();
      expect(pay!.action).toMatchObject({ type: 'optional', accept: true });
    });
  });

  describe(`Kalgara (OP08-098) game plan, planted, ${label}`, () => {
    t('seed 1: the Leader attacks with a DON!! given and plays a Shandian Warrior free', () => {
      const s = pos({
        leader: KALGARA,
        turn: 5,
        don: 5,
        mine: { life: lifeOf(5, 'OP17-102'), hand: ['OP15-114', 'OP12-099', 'OP17-107'] },
      });
      const { steps } = play(s, 'p1', { biases });
      const leader = leaderHandle(steps);
      const at = steps.findIndex((x) => x.action.type === 'attack' && x.action.attacker === leader);
      expect(at).toBeGreaterThanOrEqual(0);
      // A DON!! on the Leader when it attacks, however it got there: given from the cost area, or
      // by a Character's effect (the Warlord hard-casts Wyper OP15-114 and takes its gift).
      expect(steps[at]!.view.zones.p1.leader[0]!.don).toBeGreaterThanOrEqual(1);
      const shandians = ['OP15-114', 'OP12-099'];
      expect(
        steps
          .slice(at)
          .some(
            (x) =>
              x.player === 'p1' &&
              x.action.type === 'pick' &&
              shandians.includes(
                typeof x.action.choice === 'string' ? (cardOf(x.view, x.action.choice) ?? '') : '',
              ),
          ) || shandians.some((c) => played(steps, c).length > 0),
      ).toBe(true);
    });

    t('seed 2: the free play is the highest-cost Shandian Warrior in hand', () => {
      const s = pos({
        leader: KALGARA,
        turn: 5,
        don: 5,
        mine: {
          life: lifeOf(5, 'OP17-102'),
          hand: ['OP15-101', 'OP08-110', 'OP15-114', 'OP17-107'],
        },
      });
      const { steps, state } = play(s, 'p1', { biases });
      // The claim: at the Leader's free play, the pick is the highest-cost Shandian Warrior it was
      // offered. (The Warlord may hard-cast Kalgara OP15-101 first and trash a card to dig, so a
      // given card staying in hand is not the claim; see DECISIONS 2026-11-17 "M5b fix round".)
      const ask = steps.find(
        (x) =>
          x.player === 'p1' &&
          x.action.type === 'pick' &&
          x.view.decision?.source?.card === KALGARA &&
          typeof x.action.choice === 'string',
      );
      expect(ask).toBeDefined();
      const costOf = (v: (typeof steps)[number]['view'], h: string) => {
        for (const z of Object.values(v.zones.p1)) {
          const c = z.find((y) => y.handle === h);
          if (c) return c.cost ?? 0;
        }
        return -1;
      };
      const offered = ask!.view.actions.flatMap((a) =>
        a.type === 'pick' && typeof a.choice === 'string' ? [costOf(ask!.view, a.choice)] : [],
      );
      expect(costOf(ask!.view, (ask!.action as { choice: string }).choice)).toBe(
        Math.max(...offered),
      );
      if (tier === 'pirate') {
        const fieldIds = queries.zone(state, 'p1', 'characters').map((c) => c.card);
        expect(fieldIds).toContain('OP15-114');
      }
    });

    t('seed 3: has Upper Yard on the field by the end of T2', () => {
      const s = pos({
        leader: KALGARA,
        turn: 3,
        don: 3,
        mine: {
          life: lifeOf(5, 'OP17-102'),
          hand: ['OP05-117', 'OP15-101', 'OP08-110', 'OP15-108'],
        },
      });
      const { state } = play(s, 'p1', { biases });
      expect(queries.zone(state, 'p1', 'stage').map((c) => c.card)).toContain('OP05-117');
    });

    t('seed 4: Sweet 3 Generals resolves before Wyper’s sweep', () => {
      const s = pos({
        leader: KALGARA,
        turn: 11,
        don: 10,
        mine: { life: lifeOf(5, 'OP17-102'), hand: ['OP17-114', 'OP15-114', 'OP17-107'] },
        opp: { characters: ['OP17-045', 'EB04-031'] },
      });
      const { steps } = play(s, 'p1', { biases });
      const leader = leaderHandle(steps);
      const sweet = steps.findIndex(
        (x) =>
          x.player === 'p1' &&
          x.action.type === 'playCard' &&
          cardOf(x.view, x.action.card) === 'OP17-114',
      );
      const attack = steps.findIndex(
        (x) => x.player === 'p1' && x.action.type === 'attack' && x.action.attacker === leader,
      );
      expect(sweet, 'Sweet 3 Generals was played').toBeGreaterThanOrEqual(0);
      expect(attack, 'the Leader attacked').toBeGreaterThanOrEqual(0);
      expect(sweet).toBeLessThan(attack);
    });

    t('seed 5: does not play Kingdom Come when the turn does not win', () => {
      const s = pos({
        leader: KALGARA,
        turn: 9,
        don: 8,
        mine: { life: lifeOf(5, 'OP17-102'), hand: ['EB01-059', 'OP17-107'] },
        opp: { characters: ['OP17-045', 'EB04-031'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'EB01-059')).toEqual([]);
    });
  });

  describe(`Boa Hancock (OP14-041) game plan, planted, ${label}`, () => {
    t('seed 1: ends the turn with a DON!! given to the Leader', () => {
      const s = pos({
        leader: HANCOCK,
        turn: 4,
        don: 4,
        second: true,
        mine: { hand: ['OP17-109', 'OP14-114', 'OP15-113'] },
      });
      const { steps } = play(s, 'p1', { biases });
      const leader = leaderHandle(steps);
      expect(steps.some((x) => x.action.type === 'giveDon' && x.action.target === leader)).toBe(
        true,
      );
    });

    t('seed 2: activates a Life Trigger that plays a Character', () => {
      let s = start({
        seed: 9,
        turn: 7,
        activePlayer: 'p2',
        firstPlayer: 'p2',
        p1: {
          leader: HANCOCK,
          life: ['OP16-113', 'OP17-102', 'OP17-102', 'OP17-102'],
          costArea: { active: 0, rested: 5 },
          decklist: listOf(HANCOCK),
        },
        p2: {
          leader: OPP,
          life: life5,
          costArea: { active: 6, rested: 0 },
          decklist: listOf(OPP),
        },
      });
      const attacker = queries.zone(s, 'p2', 'leader')[0]!;
      const target = queries.zone(s, 'p1', 'leader')[0]!;
      s = actRaw(s, {
        type: 'attack',
        attacker: attacker.instance,
        target: target.instance,
        player: 'p2',
      });
      const { steps } = play(s, 'p1', {
        biases,
        stop: (x) => queries.decision(x)?.kind === 'main',
      });
      const trig = steps.find((x) => x.view.decision?.kind === 'trigger');
      expect(trig, 'the Trigger was on offer').toBeDefined();
      expect(trig!.action).toMatchObject({ type: 'trigger', activate: true });
    });

    t('seed 3: does not play Shakuyaku while the opponent has more than 3 Life', () => {
      const s = pos({
        leader: HANCOCK,
        turn: 11,
        don: 10,
        mine: { hand: ['OP14-107', 'OP17-109'] },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP14-107')).toEqual([]);
    });

    t('seed 3: plays Shakuyaku when the opponent has 3 or less Life', () => {
      const s = pos({
        leader: HANCOCK,
        turn: 11,
        don: 10,
        mine: { hand: ['OP14-107'] },
        opp: { life: lifeOf(2, 'OP17-050') },
      });
      const { steps } = play(s, 'p1', { biases });
      expect(played(steps, 'OP14-107').length).toBe(1);
    });

    t('seed 4: Hiyori puts a Trigger card on top of the Life', () => {
      const s = pos({
        leader: HANCOCK,
        turn: 5,
        don: 5,
        // Life cards without a [Trigger] (Nami OP11-054 has none), so the pick decides what sits on top.
        mine: {
          life: lifeOf(4, 'OP11-054'),
          hand: ['OP06-106', 'OP15-113', 'OP14-114', 'EB04-058'],
        },
      });
      const { state } = playThenDecide(s, 'OP06-106', biases);
      const top = queries.zone(state, 'p1', 'life')[0]!;
      expect(top.card).toBe('OP14-114');
    });
  });
}

describe.each(PLAN_TIERS)(
  '%s: "Why?" cites the group-1 lines, and only where the condition is public',
  (tier) => {
    beforeAll(() => setTier(tier));
    afterAll(() => setTier('pirate'));
    type Steps = ReturnType<typeof play>['steps'];
    const said = (steps: Steps, pick: (x: Steps[number]) => boolean) =>
      steps.filter(pick).map((x) => JSON.stringify(x.explanation));

    it('Robin: the Leader attack, the pitch and Yamato cite the guide', () => {
      const s = pos({
        leader: ROBIN,
        turn: 3,
        don: 3,
        mine: { hand: ['OP17-107', 'OP17-102', 'OP17-113', 'OP09-078', 'OP17-074'] },
      });
      const { steps } = play(s, 'p1');
      const atk = said(steps, (x) => x.action.type === 'attack' && x.player === 'p1');
      const pitch = said(
        steps,
        (x) => x.view.decision?.source?.card === ROBIN && x.action.type === 'optional',
      );
      const yamato = said(
        steps,
        (x) => x.action.type === 'playCard' && cardOf(x.view, x.action.card) === 'OP17-074',
      );
      expect(atk[0]).toContain('attack with the Leader every turn from turn 2');
      expect(pitch[0]).toContain('pitch a Trigger card on every Leader attack');
      expect(yamato[0]).toContain('Yamato the first turn it is affordable');
    });

    it('Enel: Linlin on a full board cites the guide; Kalgara: giveDon cites the guide', () => {
      const e = pos({
        leader: ENEL,
        turn: 11,
        don: 10,
        mine: { hand: ['OP17-112', 'OP17-106'], characters: ['OP17-102', 'OP17-107'] },
      });
      const linlin = said(
        play(e, 'p1').steps,
        (x) => x.action.type === 'playCard' && cardOf(x.view, x.action.card) === 'OP17-112',
      );
      expect(linlin[0]).toContain('Linlin on a full board');
      const k = pos({
        leader: KALGARA,
        turn: 5,
        don: 5,
        mine: { life: lifeOf(5, 'OP17-102'), hand: ['OP12-099', 'OP17-107'] },
      });
      const give = said(
        play(k, 'p1').steps,
        (x) => x.action.type === 'giveDon' && x.player === 'p1',
      );
      expect(give[0]).toContain('give the Leader a DON!!');
    });

    it('Hancock: giveDon and a met Shakuyaku condition are cited; Hiyori’s hidden pick is not', () => {
      const h = pos({
        leader: HANCOCK,
        turn: 4,
        don: 4,
        second: true,
        mine: { hand: ['OP17-109', 'OP14-114', 'OP15-113'] },
      });
      const give = said(
        play(h, 'p1').steps,
        (x) => x.action.type === 'giveDon' && x.player === 'p1',
      );
      expect(give[0]).toContain('leave one DON!! on Hancock');
      const sh = pos({
        leader: HANCOCK,
        turn: 11,
        don: 10,
        mine: { hand: ['OP14-107'] },
        opp: { life: lifeOf(2, 'OP17-050') },
      });
      const shaku = said(
        play(sh, 'p1').steps,
        (x) => x.action.type === 'playCard' && cardOf(x.view, x.action.card) === 'OP14-107',
      );
      expect(shaku[0]).toContain('Shakuyaku draws 2');
      const hi = pos({
        leader: HANCOCK,
        turn: 5,
        don: 5,
        mine: {
          life: lifeOf(4, 'OP11-054'),
          hand: ['OP06-106', 'OP15-113', 'OP14-114', 'EB04-058'],
        },
      });
      const hiyori = playThenDecide(hi, 'OP06-106', true).steps.filter((x) => x.player === 'p1');
      expect(hiyori.length).toBeGreaterThan(0);
      for (const x of hiyori) expect(JSON.stringify(x.explanation)).not.toContain('Its guide');
    });

    it('a play that breaks a playOnlyIf condition is not cited', () => {
      const e = pos({ leader: ENEL, turn: 11, don: 10, mine: { hand: ['OP17-112'] } });
      const { steps } = play(e, 'p1', { biases: true });
      const linlin = said(
        steps,
        (x) => x.action.type === 'playCard' && cardOf(x.view, x.action.card) === 'OP17-112',
      );
      // Whether or not it plays her, a cite never claims a full board it does not have.
      for (const t of linlin) expect(t).not.toContain('Linlin on a full board');
    });
  },
);

/**
 * The same seeds over Pirate-vs-Pirate games among the four group-1 decks (nightly, like the
 * game-plan run in strength.test.ts): every ordered pairing, mirrors included, so each deck meets
 * each deck in each seat. A turn the AI's own search scores as a win is a finishing turn and is not
 * judged by the plan. An assertion is enforced when it has 10 or more cases; with the biases off the
 * same run is reported, not enforced (as for Rocks and Kaido).
 */
const PLAN_GAMES_G1 = Number(process.env.PLAN_GAMES_G1 ?? 0);

describe.runIf(PLAN_GAMES_G1 > 0)(
  'group-1 game-plan assertions over Pirate-vs-Pirate games',
  () => {
    it(
      `${PLAN_GAMES_G1} games, with and without the biases`,
      () => {
        const decks = [ROBIN, ENEL, KALGARA, HANCOCK].map((l) =>
          metaDecks().find((d) => d.leader === l)!,
        );
        const pairs = decks.flatMap((a) => decks.map((b) => [a, b] as const));
        const run = (biases: boolean) => {
          const tallies: Tally[] = [];
          const results: Record<string, number> = {};
          const exempt: Record<string, { finishing: number; turns: number }> = {};
          for (let g = 0; g < PLAN_GAMES_G1; g++) {
            const [a, b] = pairs[g % pairs.length]!;
            const bySeat = g % 2 === 0 ? { p1: a, p2: b } : { p1: b, p2: a };
            const t1 = new PlanTallyG1('p1', PLAN_TIER, bySeat.p1.leader);
            const t2 = new PlanTallyG1('p2', PLAN_TIER, bySeat.p2.leader);
            const r = playMatch({
              seed: 50_000 + g,
              decks: bySeat,
              tiers: { p1: PLAN_TIER, p2: PLAN_TIER },
              seats: { p1: { biases }, p2: { biases } },
              onDecision: (d) => {
                t1.observe(d);
                t2.observe(d);
              },
            });
            tallies.push(...t1.finish(), ...t2.finish());
            for (const [t, deck] of [
              [t1, bySeat.p1],
              [t2, bySeat.p2],
            ] as const) {
              const e = (exempt[deck.leader] ??= { finishing: 0, turns: 0 });
              e.finishing += t.exempt.finishing;
              e.turns += t.exempt.turns;
            }
            const w = r.result && 'winner' in r.result ? bySeat[r.result.winner].leader : 'draw';
            results[w] = (results[w] ?? 0) + 1;
          }
          const plan = mergeTallies(tallies);
          return {
            results,
            finishingTurnsExempted: exempt,
            plan: plan.map((t) => ({ ...t, rate: t.total ? t.hits / t.total : null })),
          };
        };
        const withBias = run(true);
        const noBias =
          process.env.PLAN_NO_BIAS === '0' || PLAN_TIER !== 'pirate' ? null : run(false);
        mkdirSync('test-results', { recursive: true });
        writeFileSync(
          `test-results/game-plan-g1-${PLAN_GAMES_G1}${PLAN_TIER === 'pirate' ? '' : `-${PLAN_TIER}`}.json`,
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
  },
);
