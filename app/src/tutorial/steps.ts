/**
 * The eight tutorial steps as data (PROMPT.md "Guided tutorial"; flows F2). Each is one fixed-seed
 * scenario on the real engine plus two predicates over the player's own view:
 *
 *  - `allowed` narrows what the engine already allows (the controller's `config.tutorial.allow`
 *    removes, it never adds), and
 *  - `done` says the step's goal shows in the view.
 *
 * Nothing here decides a rule. Where a predicate needs to know that a counter was used it looks for
 * the counter card leaving the hand, never for a power comparison. The cards are named exactly:
 * the player is Starter Deck ST-21 (Monkey.D.Luffy) and always goes second (the seat `p1` with
 * `firstPlayer: 'p2'`), the opponent is ST-22 (Ace & Newgate). Words that state a number read it
 * from the view (`copy.ts`).
 */
import type { Action, ProjectedView, ScenarioSpec } from '@optcg/engine';
import { ST21_LEADER, ST22_LEADER } from './decks.ts';
import type { TutorialStep, TutorialStepId } from './types.ts';

type Spec = Omit<ScenarioSpec, 'cards'>;

const many = (id: string, n: number): string[] => Array.from({ length: n }, () => id);

/** Cards the scenarios name. */
export const C = {
  LUFFY_L: ST21_LEADER,
  ACE_L: ST22_LEADER,
  BONNEY: 'ST21-004', // 1 cost, 3000, no Counter
  JINBE: 'ST21-005', // 2 cost, 4000, Counter +1000, no effect
  STUSSY: 'ST21-006', // 3 cost, 5000, Counter +1000, no effect
  CHOPPER: 'ST21-008', // 4 cost, 6000, Counter +1000, no effect
  VEGAPUNK: 'ST21-013', // 1 cost, 3000, Counter +1000, no effect
  LUFFY: 'ST21-014', // 5 cost, 6000, [Rush]
  DAWN_WHIP: 'ST21-016', // Event; [Trigger] K.O. up to 1 of your opponent's Characters with 4000 power or less
  USOPP: 'ST21-002',
  NEWGATE: 'ST22-003', // 9 cost, 10000, no Counter, no Trigger
  ELMY: 'ST22-004', // 3 cost, 5000, Counter +1000, no effect
  DECALVAN: 'ST22-008', // 2 cost, 4000, no effect
  ACE: 'ST22-010', // 5 cost, 6000, no effect
} as const;

/** Starts of the eight scenarios. The player is `p1` and goes second; the filler cards are inert. */
const base = { firstPlayer: 'p2' as const };

export const SCENARIOS_T: Record<TutorialStepId, Spec> = {
  // A board to look at: every zone has something in it, and nothing can be played.
  't1-zones': {
    ...base,
    seed: 41,
    turn: 4,
    activePlayer: 'p1',
    p1: {
      leader: C.LUFFY_L,
      life: many(C.VEGAPUNK, 5),
      hand: [C.JINBE, C.BONNEY, C.CHOPPER, C.LUFFY, C.STUSSY],
      characters: [C.USOPP],
      trash: [C.VEGAPUNK],
      deck: many(C.VEGAPUNK, 10),
      costArea: { active: 3, rested: 1 },
    },
    p2: {
      leader: C.ACE_L,
      life: many(C.NEWGATE, 5),
      hand: [C.ELMY, C.ACE, C.DECALVAN, C.ELMY],
      characters: [C.DECALVAN],
      deck: many(C.ELMY, 10),
      costArea: { active: 0, rested: 3 },
    },
  },
  // Turn 2, the player's first. The Refresh, Draw and DON!! phases run on their own.
  't2-first-turn': {
    ...base,
    seed: 42,
    turn: 2,
    activePlayer: 'p1',
    phase: 'refresh',
    p1: {
      leader: C.LUFFY_L,
      life: many(C.VEGAPUNK, 5),
      hand: [C.JINBE, C.BONNEY, C.LUFFY, C.CHOPPER, C.STUSSY],
      deck: [C.VEGAPUNK, ...many(C.VEGAPUNK, 9)],
      costArea: { active: 0, rested: 0 },
      donDeck: 10,
    },
    p2: {
      leader: C.ACE_L,
      life: many(C.NEWGATE, 5),
      hand: [C.ELMY, C.ACE, C.DECALVAN, C.ELMY, C.ELMY],
      deck: many(C.ELMY, 10),
      costArea: { active: 0, rested: 1 },
      donDeck: 9,
    },
  },
  't3-don-and-power': {
    ...base,
    seed: 43,
    turn: 4,
    activePlayer: 'p1',
    p1: {
      leader: C.LUFFY_L,
      life: many(C.VEGAPUNK, 5),
      hand: [C.BONNEY, C.CHOPPER, C.LUFFY],
      characters: [C.JINBE],
      deck: many(C.VEGAPUNK, 10),
      costArea: { active: 4, rested: 0 },
    },
    p2: {
      leader: C.ACE_L,
      life: many(C.NEWGATE, 5),
      hand: [C.ELMY, C.ACE],
      deck: many(C.ELMY, 10),
      costArea: { active: 0, rested: 3 },
    },
  },
  // Their Leader and two Characters, one rested and one active; only the Leader may be attacked
  // here, and the step says why the rested Character is not the target.
  't4-attack': {
    ...base,
    seed: 44,
    turn: 4,
    activePlayer: 'p1',
    p1: {
      leader: C.LUFFY_L,
      life: many(C.VEGAPUNK, 5),
      hand: [C.BONNEY, C.CHOPPER],
      characters: [C.JINBE],
      deck: many(C.VEGAPUNK, 10),
      costArea: { active: 4, rested: 0 },
    },
    p2: {
      leader: C.ACE_L,
      life: many(C.NEWGATE, 5),
      hand: [C.ELMY, C.ACE],
      characters: [{ card: C.DECALVAN, rested: true }, C.ACE],
      deck: many(C.ELMY, 10),
      costArea: { active: 0, rested: 3 },
    },
  },
  // Their turn 5: their Leader (5000) attacks yours (5000). Jinbe's Counter +1000 is the answer.
  't5-defend': {
    ...base,
    seed: 45,
    turn: 5,
    activePlayer: 'p2',
    p1: {
      leader: C.LUFFY_L,
      life: many(C.VEGAPUNK, 5),
      hand: [C.JINBE, C.BONNEY, C.LUFFY],
      characters: [C.STUSSY],
      deck: many(C.VEGAPUNK, 10),
      costArea: { active: 0, rested: 4 },
    },
    p2: {
      leader: C.ACE_L,
      life: many(C.NEWGATE, 5),
      hand: [C.ELMY],
      deck: many(C.ELMY, 10),
      costArea: { active: 5, rested: 0 },
    },
  },
  // Their Leader attacks again; the top card of your Life is Gum-Gum Dawn Whip, whose [Trigger]
  // can K.O. their Decalvan Brothers (4000). No Counter in your hand, so the hit lands.
  't6-trigger': {
    ...base,
    seed: 46,
    turn: 5,
    activePlayer: 'p2',
    p1: {
      leader: C.LUFFY_L,
      life: [C.DAWN_WHIP, ...many(C.VEGAPUNK, 4)],
      hand: [C.BONNEY, C.LUFFY],
      characters: [C.STUSSY],
      deck: many(C.VEGAPUNK, 10),
      costArea: { active: 0, rested: 4 },
    },
    p2: {
      leader: C.ACE_L,
      life: many(C.NEWGATE, 5),
      hand: [C.ELMY],
      characters: [C.DECALVAN],
      deck: many(C.ELMY, 10),
      costArea: { active: 5, rested: 0 },
    },
  },
  // Luffy's Leader has 1 DON!! given (its [DON!! x1] condition) and 2 rested DON!! to give away.
  't7-leader': {
    ...base,
    seed: 47,
    turn: 4,
    activePlayer: 'p1',
    p1: {
      leader: { card: C.LUFFY_L, don: 1 },
      life: many(C.VEGAPUNK, 5),
      hand: [C.BONNEY, C.CHOPPER],
      characters: [C.STUSSY],
      deck: many(C.VEGAPUNK, 10),
      costArea: { active: 1, rested: 2 },
    },
    p2: {
      leader: C.ACE_L,
      life: many(C.NEWGATE, 5),
      hand: [C.ELMY, C.ACE],
      deck: many(C.ELMY, 10),
      costArea: { active: 0, rested: 3 },
    },
  },
  // They are at 1 Life with no Characters: two attackers that hit win the game.
  't8-winning': {
    ...base,
    seed: 48,
    turn: 6,
    activePlayer: 'p1',
    p1: {
      leader: C.LUFFY_L,
      life: many(C.VEGAPUNK, 4),
      hand: [C.BONNEY, C.STUSSY],
      characters: [C.CHOPPER],
      deck: many(C.VEGAPUNK, 10),
      costArea: { active: 2, rested: 0 },
    },
    p2: {
      leader: C.ACE_L,
      life: [C.NEWGATE],
      hand: [],
      deck: many(C.ELMY, 10),
      costArea: { active: 0, rested: 4 },
    },
  },
};

// -----------------------------------------------------------------------------------------------
// Reading the player's own view (no hidden card is named: a handle resolves only to what the view
// shows).
// -----------------------------------------------------------------------------------------------

type Zones = ProjectedView['zones'];
type Owner = 'me' | 'opp';
const seat = (v: ProjectedView, o: Owner): 'p1' | 'p2' =>
  o === 'me' ? v.player : v.player === 'p1' ? 'p2' : 'p1';

/** The card id of a handle in this view, wherever it is. */
export function cardIdOf(v: ProjectedView, handle: string): string | null {
  for (const p of ['p1', 'p2'] as const)
    for (const list of Object.values(v.zones[p] as Zones['p1']))
      for (const c of list) if (c.handle === handle) return c.card;
  return null;
}

const mine = (v: ProjectedView, zone: keyof Zones['p1']) => v.zones[v.player][zone];
const theirs = (v: ProjectedView, zone: keyof Zones['p1']) => v.zones[seat(v, 'opp')][zone];
const leaderHandle = (v: ProjectedView, o: Owner) => v.zones[seat(v, o)].leader[0]?.handle;
const count = (v: ProjectedView, zone: keyof Zones['p1'], id: string) =>
  mine(v, zone).filter((c) => c.card === id).length;

/** Prompts inside an effect or cost: always allowed while the step's own action needs them. */
const followUp = (a: Action): boolean =>
  a.type === 'pick' || a.type === 'done' || a.type === 'optional' || a.type === 'order';

const notConcede = (a: Action): boolean => a.type !== 'concede';

/** Words the failure of t8 uses are in the copy table; the step only reports the state. */
const turnPassedWithoutWin = (v: ProjectedView): boolean =>
  v.result === null && v.turn.activePlayer !== v.player;

export const STEPS: readonly TutorialStep[] = [
  {
    id: 't1-zones',
    title: 'The zones',
    scenario: { spec: SCENARIOS_T['t1-zones'] },
    allowed: () => false,
    done: () => false,
    visit: [
      'leader',
      'characters',
      'stage',
      'life',
      'deck',
      'trash',
      'donDeck',
      'costArea',
      'hand',
    ],
    lit: [
      { zone: 'leader', side: 'me' },
      { zone: 'characters', side: 'me' },
      { zone: 'stage', side: 'me' },
      { zone: 'life', side: 'me' },
      { zone: 'deck', side: 'me' },
      { zone: 'trash', side: 'me' },
      { zone: 'donDeck', side: 'me' },
      { zone: 'costArea', side: 'me' },
      { zone: 'hand', side: 'me' },
    ],
    script: 'none',
    copy: {
      intro: 't1-zones.intro',
      prompt: 't1-zones.prompt',
      done: 't1-zones.done',
    },
  },
  {
    id: 't2-first-turn',
    title: 'Your first turn',
    scenario: { spec: SCENARIOS_T['t2-first-turn'] },
    allowed: (a, v) => (a.type === 'playCard' && cardIdOf(v, a.card) === C.JINBE) || followUp(a),
    done: (v) => count(v, 'characters', C.JINBE) > 0,
    lit: [{ card: C.JINBE, side: 'me' }],
    script: 'none',
    copy: {
      intro: 't2-first-turn.intro',
      prompt: 't2-first-turn.prompt',
      blocked: 't2-first-turn.blocked',
      done: 't2-first-turn.done',
    },
  },
  {
    id: 't3-don-and-power',
    title: 'DON!! and power',
    scenario: { spec: SCENARIOS_T['t3-don-and-power'] },
    allowed: (a, v) =>
      a.type === 'giveDon' &&
      a.target === leaderHandle(v, 'me') &&
      (mine(v, 'leader')[0]?.don ?? 0) === 0,
    done: (v) => (mine(v, 'leader')[0]?.don ?? 0) >= 1,
    lit: [
      { zone: 'costArea', side: 'me' },
      { card: C.LUFFY_L, side: 'me' },
    ],
    script: 'none',
    copy: {
      intro: 't3-don-and-power.intro',
      prompt: 't3-don-and-power.prompt',
      blocked: 't3-don-and-power.blocked',
      done: 't3-don-and-power.done',
    },
  },
  {
    id: 't4-attack',
    title: 'Attacking the Leader',
    scenario: { spec: SCENARIOS_T['t4-attack'] },
    allowed: (a, v) =>
      (a.type === 'attack' &&
        a.attacker === leaderHandle(v, 'me') &&
        a.target === leaderHandle(v, 'opp')) ||
      followUp(a),
    done: (v) => v.battle === null && theirs(v, 'life').length < 5,
    lit: [
      { card: C.LUFFY_L, side: 'me' },
      { card: C.ACE_L, side: 'opp' },
    ],
    script: 'none',
    copy: {
      intro: 't4-attack.intro',
      prompt: 't4-attack.prompt',
      blocked: 't4-attack.blocked',
      done: 't4-attack.done',
    },
  },
  {
    id: 't5-defend',
    title: 'Being attacked',
    scenario: { spec: SCENARIOS_T['t5-defend'] },
    allowed: (a, v) =>
      (a.type === 'block' && a.blocker === null) ||
      (a.type === 'counter' &&
        cardIdOf(v, a.card) === C.JINBE &&
        a.target === leaderHandle(v, 'me')) ||
      // "Take the hit" is the Counter Step ended with nothing played: not this step.
      (a.type === 'endCounter' && count(v, 'hand', C.JINBE) === 0) ||
      followUp(a),
    done: (v) => v.battle === null && count(v, 'trash', C.JINBE) > 0,
    lit: [{ card: C.JINBE, side: 'me' }],
    script: 'attack-leader',
    alwaysAsk: true,
    copy: {
      intro: 't5-defend.intro',
      prompt: 't5-defend.prompt',
      blocked: 't5-defend.blocked',
      done: 't5-defend.done',
    },
  },
  {
    id: 't6-trigger',
    title: 'Triggers',
    scenario: { spec: SCENARIOS_T['t6-trigger'] },
    allowed: (a) =>
      (a.type === 'block' && a.blocker === null) ||
      a.type === 'endCounter' ||
      a.type === 'trigger' ||
      followUp(a),
    done: (v) =>
      v.battle === null &&
      v.resolving.length === 0 &&
      mine(v, 'life').length === 4 &&
      !['trigger', 'choose', 'optional'].includes(v.decision?.kind ?? ''),
    script: 'attack-leader',
    alwaysAsk: true,
    copy: {
      intro: 't6-trigger.intro',
      prompt: 't6-trigger.prompt',
      blocked: 't6-trigger.blocked',
      done: 't6-trigger.done',
    },
  },
  {
    id: 't7-leader',
    title: 'Your Leader’s ability',
    scenario: { spec: SCENARIOS_T['t7-leader'] },
    allowed: (a, v) =>
      (a.type === 'activate' && a.card === leaderHandle(v, 'me')) ||
      // Give two: choosing 0 or 1 would spend the once-per-turn ability on less than the lesson.
      (a.type === 'pick' &&
        typeof a.choice === 'object' &&
        'option' in a.choice &&
        a.choice.option === '2') ||
      (followUp(a) && a.type !== 'pick'),
    done: (v) => mine(v, 'characters').some((c) => c.don >= 1),
    lit: [{ card: C.LUFFY_L, side: 'me' }],
    script: 'none',
    copy: {
      intro: 't7-leader.intro',
      prompt: 't7-leader.prompt',
      blocked: 't7-leader.blocked',
      done: 't7-leader.done',
    },
  },
  {
    id: 't8-winning',
    title: 'Winning',
    scenario: { spec: SCENARIOS_T['t8-winning'] },
    allowed: notConcede,
    done: (v) => v.result !== null && 'winner' in v.result && v.result.winner === v.player,
    failed: turnPassedWithoutWin,
    lit: [
      { card: C.LUFFY_L, side: 'me' },
      { card: C.CHOPPER, side: 'me' },
    ],
    script: 'none',
    copy: {
      intro: 't8-winning.intro',
      prompt: 't8-winning.prompt',
      done: 't8-winning.done',
      failed: 't8-winning.failed',
    },
  },
];

export const stepById = (id: TutorialStepId): TutorialStep => STEPS.find((s) => s.id === id)!;
