/**
 * The hint's explanation (M7 WP1; docs/design/explanations.md E15, flows F9, learning-ui §2.4).
 * Second person, to the player. Pure: it takes facts and returns an `Explanation`, so a test can
 * hand it a line and check the words without a search.
 *
 * **What it may say.** The player's own cards (they own that information), the board and counts
 * everyone sees, public card text, and numbers worked out from those. It never names a card in the
 * opponent's hand, deck or Life, and never reports what the determinized guesses held: the facts
 * below carry no such card (`hint.ts` builds them from the view's handles only).
 *
 * **What it says about the result.** The outcome states its condition ("unless they spend 6000 of
 * counters"), never "Likely" (UX-R25). `certainty` is `search-incomplete` when the clock cut the
 * search, and `any-hand` otherwise, because the condition is what the outcome claims.
 */
import { SCRIPTS } from '@optcg/cards';
import type { Action } from '@optcg/engine';
import type { Explanation, Move } from '../explanation.ts';
import { LESSON, MINUS, figureKey, stopText } from '../explain.ts';

/** A card a view handle stands for, as the viewer knows it. */
export interface Named {
  /** The printed name, or "a face-down card". */
  name: string;
  card: string | null;
  isLeader: boolean;
  /** The viewer's own card. */
  mine: boolean;
}
export type Namer = (handle: string) => Named;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const minus = (t: string): string => t.replace(/(^|[\s(])-(\d)/g, `$1${MINUS}$2`);

/** "A", "A and B", "A, B and C". */
export function list(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** An ability's printed label from the card script (public card text), or null. */
export function labelOf(card: string | null, ability: string): string | null {
  if (!card) return null;
  const a = SCRIPTS[card]?.abilities.find((x) => x.id === ability) as
    { label?: string } | undefined;
  return a?.label ?? null;
}

/** The first [On Play] label of a Character or Event's script, or null. */
export function playLabel(card: string | null): string | null {
  if (!card) return null;
  const a = SCRIPTS[card]?.abilities.find((x) => {
    const when = (x as { when?: unknown }).when;
    return Array.isArray(when)
      ? when.includes('onPlay') || when.includes('main')
      : when === 'onPlay' || when === 'main';
  }) as { label?: string } | undefined;
  return a?.label ?? null;
}

/** A long effect label would crowd out the numbers (copy rule: about 30 words per line). */
const short = (label: string, max = 28): string | null =>
  label.split(/\s+/).length > max ? null : label.replace(/\.$/, '');

// ------------------------------------------------------------------------------------------------
// The line as moves
// ------------------------------------------------------------------------------------------------

/**
 * Describe a run of view actions (handles) as the line the player reads. A play or activation takes
 * the picks that answer it; consecutive DON!! given to one card are one step; an attack is its own.
 */
export function describeActions(
  actions: readonly Action[],
  who: Namer,
  options: readonly { id: string; label: string }[] = [],
): Move[] {
  /** A pick's answer as words: a card, a named option, or a DON!! class. */
  const pickText = (c: Extract<Action, { type: 'pick' }>['choice']): string => {
    if (typeof c === 'string') return refOf(who(c));
    if ('option' in c) return options.find((o) => o.id === c.option)?.label ?? 'an option';
    return c.from === 'costActive'
      ? 'an active DON!!'
      : c.from === 'costRested'
        ? 'a rested DON!!'
        : `a DON!! given to ${refOf(who(c.card))}`;
  };
  const out: Move[] = [];
  const ref = (n: Named): string =>
    n.isLeader ? (n.mine ? 'your Leader' : 'their Leader') : n.name;
  let counters = 0;
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i]!;
    const picksAfter = (): string[] => {
      const names: string[] = [];
      while (actions[i + 1]?.type === 'pick') {
        const p = actions[++i] as Extract<Action, { type: 'pick' }>;
        names.push(pickText(p.choice));
      }
      return names;
    };
    switch (a.type) {
      case 'playCard': {
        const n = who(a.card);
        const picks = picksAfter();
        out.push({
          kind: 'play',
          text: `Play ${n.name}${picks.length ? ` and choose ${list(picks)}` : ''}.`,
          ...(n.card ? { card: n.card } : {}),
        });
        break;
      }
      case 'giveDon': {
        const n = who(a.target);
        let count = 1;
        while (
          actions[i + 1]?.type === 'giveDon' &&
          (actions[i + 1] as typeof a).target === a.target
        ) {
          count++;
          i++;
        }
        out.push({
          kind: 'giveDon',
          text: `Give ${count} DON!! to ${ref(n)}.`,
          count,
          ...(n.card ? { card: n.card } : {}),
        });
        break;
      }
      case 'attack': {
        const at = who(a.attacker);
        const tg = who(a.target);
        out.push({
          kind: 'attack',
          text: `Attack ${ref(tg)} with ${at.isLeader ? 'your Leader' : at.name}.`,
          ...(at.card ? { card: at.card } : {}),
          ...(tg.card ? { target: tg.isLeader ? 'leader' : tg.card } : {}),
        });
        break;
      }
      case 'activate': {
        const n = who(a.card);
        const label = labelOf(n.card, a.ability);
        const brief = label ? short(label) : null;
        const picks = picksAfter();
        out.push({
          kind: 'activate',
          text: `Use ${n.isLeader ? 'your Leader' : n.name}${brief ? `: ${brief}` : ''}${picks.length ? `, choosing ${list(picks)}` : ''}.`,
          ...(n.card ? { card: n.card } : {}),
        });
        break;
      }
      case 'pick':
        out.push({
          kind: 'choose',
          text: `Choose ${pickText(a.choice)}.`,
        });
        break;
      case 'done':
        // Finishing a choice after its picks is part of them; finishing with none is a choice too.
        if (actions[i - 1]?.type !== 'pick') out.push({ kind: 'choose', text: 'Choose nothing.' });
        break;
      case 'block':
        out.push(
          a.blocker
            ? {
                kind: 'block',
                text: `Block with ${who(a.blocker).name}.`,
                ...cardOf(who(a.blocker)),
              }
            : { kind: 'take', text: 'Do not block.' },
        );
        break;
      case 'counter': {
        const n = who(a.card);
        counters++;
        out.push({ kind: 'counter', text: `Counter with ${n.name}.`, ...cardOf(n) });
        break;
      }
      case 'endCounter':
        if (counters === 0) out.push({ kind: 'take', text: 'Take the hit.' });
        break;
      case 'trigger':
        out.push({
          kind: 'trigger',
          text: a.activate ? 'Use the [Trigger].' : 'Add it to your hand.',
        });
        break;
      case 'optional':
        out.push({ kind: 'choose', text: a.accept ? 'Use the effect.' : 'Skip the effect.' });
        break;
      case 'mulligan':
        out.push(
          a.redraw ? { kind: 'redraw', text: 'Redraw all five.' } : { kind: 'keep', text: 'Keep.' },
        );
        break;
      case 'chooseFirst':
        out.push({ kind: 'choose', text: a.goFirst ? 'Go first.' : 'Go second.' });
        break;
      case 'endTurn':
        out.push({ kind: 'endTurn', text: 'End your turn.' });
        break;
      default:
        break;
    }
  }
  return out;
}

const refOf = (n: Named): string =>
  n.isLeader ? (n.mine ? 'your Leader' : 'their Leader') : n.name;

const cardOf = (n: Named): { card: string } | Record<string, never> =>
  n.card ? { card: n.card } : {};

// ------------------------------------------------------------------------------------------------
// A Main Phase line
// ------------------------------------------------------------------------------------------------

export interface PlayFact {
  name: string;
  card: string;
  cost: number;
  /** The card's own effect text (a script label), if it has an [On Play] or [Main]. */
  label: string | null;
  power: number | null;
}

export interface ActivationFact {
  name: string;
  isLeader: boolean;
  /** The ability's own printed label, if it has one. */
  label: string | null;
}

export interface AttackFact {
  attacker: string;
  attackerIsLeader: boolean;
  /** With the DON!! the line gives it before the attack. */
  power: number;
  target: string;
  targetIsLeader: boolean;
  targetPower: number;
}

export interface LineFacts {
  plays: PlayFact[];
  activations: ActivationFact[];
  attacks: AttackFact[];
  /** Your hand size and active DON!! now (your own information). */
  handSize: number;
  activeDon: number;
  /** Their Life and the Blockers they could block with now: public. */
  theirLife: number;
  theirBlockers: number;
  /** How many Characters they have (public). */
  theirCharacters: number;
  /** DON!! the line gives to cards, in all. */
  donGiven: number;
  /** Your active DON!! when the line ends the turn, or null when it does not reach that. */
  activeAtEnd: number | null;
  /** The line is a proven lethal (every hand they could hold loses). */
  proven: boolean;
  /** The clock cut the search. */
  incomplete: boolean;
  /** The line stops where it would turn on a card you have not drawn yet. */
  truncated: boolean;
}

const stop = (a: AttackFact): number => a.power - a.targetPower + 1000;
const attackerName = (a: AttackFact): string => (a.attackerIsLeader ? 'your Leader' : a.attacker);

function claimOf(f: LineFacts): string {
  const parts: string[] = [];
  const names = [...new Set(f.plays.map((p) => p.name))];
  if (names.length)
    parts.push(
      `play ${list(names.slice(0, 2))}${names.length > 2 ? ` and ${names.length - 2} more` : ''}`,
    );
  if (f.activations.length)
    parts.push(
      `use ${list(f.activations.slice(0, 2).map((a) => (a.isLeader ? 'your Leader' : a.name)))}`,
    );
  if (f.attacks.length) {
    const leaders = f.attacks.filter((a) => a.targetIsLeader).length;
    if (leaders === f.attacks.length)
      parts.push(
        f.attacks.length === 1
          ? 'attack their Leader'
          : `attack their Leader ${f.attacks.length} times`,
      );
    else if (leaders === 0) {
      const targets = [...new Set(f.attacks.map((a) => a.target))];
      parts.push(
        targets.length >= 2 && targets.length === f.theirCharacters
          ? `attack ${targets.length === 2 ? 'both' : 'all'} their Characters`
          : `attack ${list(targets)}`,
      );
    } else parts.push(`attack ${f.attacks.length} times`);
  }
  if (f.activeAtEnd !== null && f.activeAtEnd > 0)
    parts.push(`end with ${f.activeAtEnd} DON!! active`);
  else if (f.activeAtEnd === 0 && parts.length === 0) parts.push('end your turn');
  if (parts.length === 0) return f.truncated ? 'Start with the plays below.' : 'End your turn.';
  const text =
    parts.length === 1
      ? parts[0]!
      : parts.length === 2
        ? `${parts[0]} and ${parts[1]}`
        : `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
  return `${f.proven ? 'Win this turn: ' : ''}${cap(text)}.`;
}

function conceptOf(f: LineFacts): string {
  if (f.proven) return 'lethal-math';
  if (f.activeAtEnd !== null && f.activeAtEnd >= 3) return 'don-efficiency';
  if (f.attacks.length > 0) return 'board-vs-face';
  return 'tempo';
}

const NEXT: Record<string, string> = {
  'lethal-math':
    'Before each attack, count their Life, their Blockers and the most they can add in counters.',
  'don-efficiency': 'Plan each turn backwards from the DON!! you want active at the end.',
  'board-vs-face':
    'Say what each attack is for before you declare it: a K.O., or a hit on their Leader.',
  tempo: 'Spend your DON!! on cards that change the board, and keep what you cannot use well.',
};

const SOURCES: Record<string, string[]> = {
  'lethal-math': ['CR 7-1-4-1', 'SH-MIS'],
  'don-efficiency': ['CR 6-5-5-2', 'SH-DON'],
  'board-vs-face': ['CR 7-1-1-2', 'CR 7-1-4-1', 'SH-MIS'],
  tempo: ['CR 6-5-5-2', 'SH-MIS'],
};

/**
 * The explanation of a Main Phase line. Evidence, in order: what the plays do (their own card
 * text), what the attacks need to be stopped, the DON!! kept for their turn. Alternatives are
 * separate (`HintAlternative`).
 */
export function explainMainLine(f: LineFacts, line: Move[]): Explanation {
  const concept = conceptOf(f);
  const evidence: Explanation['evidence'] = [];
  const shown = f.plays.filter((p) => p.label && short(p.label)).slice(0, 2);
  const unlabelled = f.plays.filter((p) => !shown.includes(p)).slice(0, shown.length ? 0 : 1);
  if (shown.length)
    evidence.push({
      text: `${shown.map((p) => `${p.name}: ${short(p.label!)}`).join('. ')}.`,
      figures: { cost: shown.reduce((t, p) => t + p.cost, 0) },
    });
  for (const p of unlabelled)
    evidence.push({
      text: `${p.name} costs ${p.cost} and comes in with ${p.power ?? 0} power.`,
      figures: { cost: p.cost, power: p.power ?? 0 },
    });
  for (const a of f.activations.slice(0, 1)) {
    const brief = a.label ? short(a.label) : null;
    if (brief)
      evidence.push({ text: `${a.isLeader ? 'Your Leader' : a.name}: ${brief}.`, figures: {} });
  }
  if (f.attacks.length) {
    const sent = f.attacks.slice(0, 3);
    const figures: Record<string, number> = {};
    const text = sent
      .map((a, i) => {
        const key = figureKey(a.targetIsLeader ? 'leader' : a.target);
        const fk = `stopOn${cap(key)}`;
        figures[fk in figures ? `${fk}${i}` : fk] = stop(a);
        figures[`${figureKey(a.attackerIsLeader ? 'leader' : a.attacker)}Power`] = a.power;
        const by = a.attackerIsLeader ? `your ${a.power} Leader` : a.attacker;
        const head = a.targetIsLeader
          ? `To stop ${by} hitting their Leader`
          : `To save ${a.target} from ${by}`;
        return i === 0
          ? `${head}, they need ${stopText(a.power, a.targetPower)}`
          : a.targetIsLeader
            ? `To stop ${attackerName(a)}, ${stop(a)}`
            : `To save ${a.target} from ${attackerName(a)}, ${stop(a)}`;
      })
      .join('. ');
    evidence.push({ text: `${text}.`, figures });
    if (f.attacks.some((a) => a.targetIsLeader))
      evidence.push({
        text: `They are at ${f.theirLife} Life with ${plural(f.theirBlockers, 'active Blocker')}.`,
        figures: { theirLife: f.theirLife, theirBlockers: f.theirBlockers },
      });
  }
  if (f.activeAtEnd !== null)
    evidence.push({
      text: `You end your turn with ${f.activeAtEnd} DON!! active${f.donGiven ? `, after giving ${f.donGiven}` : ''}.`,
      figures: { activeAtEnd: f.activeAtEnd, donGiven: f.donGiven },
    });

  if (evidence.length === 0 && f.activeAtEnd === null)
    evidence.push({
      text: `You have ${plural(f.handSize, 'card')} in hand and ${f.activeDon} DON!! active.`,
      figures: { handSize: f.handSize, activeDon: f.activeDon },
    });
  const outcomes: string[] = [];
  let ko = 0;
  for (const a of f.attacks.slice(0, 2)) {
    if (a.targetIsLeader)
      outcomes.push(`lands on their Leader unless they block or spend ${stop(a)} of counters`);
    else
      outcomes.push(
        `${ko++ === 0 ? 'K.O.s ' : ''}${a.target} unless they spend ${stop(a)} of counters`,
      );
  }
  const first = outcomes.length
    ? cap(outcomes.length === 2 ? `${outcomes[0]} and ${outcomes[1]}` : outcomes[0]!)
    : f.plays.length
      ? `Puts ${list(f.plays.slice(0, 2).map((p) => p.name))} on your board`
      : f.activations.length
        ? `Uses ${list(f.activations.slice(0, 2).map((a) => (a.isLeader ? 'your Leader' : a.name)))} before the turn ends`
        : 'Keeps your cards and DON!! for their turn';
  const tail =
    f.activeAtEnd !== null && f.activeAtEnd > 0 && f.attacks.length
      ? `, and keeps ${f.activeAtEnd} DON!! active for their turn`
      : '';
  const outcome = f.proven
    ? 'Wins this turn unless they hold more defence than their deck can have.'
    : `${first}${tail}.`;
  return {
    conceptId: concept,
    claim: minus(claimOf(f)),
    evidence: evidence.map((e) => ({ ...e, text: minus(e.text) })),
    line,
    outcome: minus(outcome),
    certainty: f.incomplete ? 'search-incomplete' : 'any-hand',
    nextTime: NEXT[concept]!,
    lessonId: LESSON[concept] ?? 'L08-first-full-game',
    sources: SOURCES[concept]!,
  };
}

// ------------------------------------------------------------------------------------------------
// A defence, a choice, a single step
// ------------------------------------------------------------------------------------------------

export interface DefenceFacts {
  attacker: string;
  attackPower: number;
  target: string;
  targetIsYourLeader: boolean;
  targetPower: number;
  yourLife: number;
  yourHand: number;
  /** What you stage: the blocker (or none), the counters and the value they add. */
  blocker: { name: string; power: number } | null;
  counters: { name: string; value: number }[];
  /** The attacker's keywords (public). */
  keywords: readonly string[];
  incomplete: boolean;
}

/** The staged defence: "Block with X, counter with Y" or "take it". */
export function explainDefence(f: DefenceFacts, line: Move[]): Explanation {
  const need = f.attackPower - f.targetPower + 1000;
  const total = f.counters.reduce((t, c) => t + c.value, 0);
  const stops = total >= need || f.blocker !== null;
  const parts: string[] = [];
  if (f.blocker) parts.push(`block with ${f.blocker.name}`);
  if (f.counters.length) parts.push(`counter with ${list(f.counters.map((c) => c.name))}`);
  const claim = parts.length ? cap(parts.join(' and ')) + '.' : 'Take the hit.';
  const evidence: Explanation['evidence'] = [
    {
      text: `${f.attacker} attacks ${f.targetIsYourLeader ? 'your Leader' : f.target} at ${f.attackPower}. To stop it with counters you need ${stopText(f.attackPower, f.targetPower)}.`,
      figures: { attackPower: f.attackPower, defencePower: f.targetPower, stopNeeded: need },
    },
  ];
  if (f.counters.length)
    evidence.push({
      text: `${list(f.counters.map((c) => c.name))} add ${total}${f.blocker ? '' : ` against the ${need} it needs`}.`,
      figures: { counterTotal: total, stopNeeded: need },
    });
  if (f.targetIsYourLeader)
    evidence.push({
      text: `You are at ${f.yourLife} Life with ${plural(f.yourHand, 'card')} in hand.`,
      figures: { yourLife: f.yourLife, yourHandSize: f.yourHand },
    });
  const takeOutcome = f.targetIsYourLeader
    ? f.yourLife === 0
      ? 'You lose.'
      : `You drop to ${f.yourLife - Math.min(f.yourLife, f.keywords.includes('Double Attack') ? 2 : 1)} Life; the Life card goes to your hand unless it is a [Trigger] you use.`
    : `${f.target} is K.O.'d.`;
  const outcome = stops
    ? f.blocker
      ? `${f.attacker}'s attack is stopped; ${f.blocker.name} (${f.blocker.power}) ${f.attackPower >= f.blocker.power ? `is K.O.'d` : 'survives'}${total >= 0 && f.counters.length ? `, using ${total} of counters` : ''}.`
      : `The attack stops, as it stands now, for ${total} of counters.`
    : takeOutcome;
  return {
    conceptId: f.targetIsYourLeader ? 'counter-or-take' : 'counters-and-blockers',
    claim: minus(claim),
    evidence: evidence.map((e) => ({ ...e, text: minus(e.text) })),
    line,
    outcome: minus(outcome),
    certainty: f.incomplete ? 'search-incomplete' : 'any-hand',
    nextTime:
      'Decide before the first attack which hits you will take: your Life and your counters are one pool.',
    lessonId: LESSON[f.targetIsYourLeader ? 'counter-or-take' : 'counters-and-blockers']!,
    sources: ['CR 7-1-4-1', 'CR 10-1-4-1', 'SH-MIS'],
  };
}

export interface ChoiceFacts {
  /** The prompt the engine shows (public card text). */
  prompt: string;
  /** The effect's own label, when it has one. */
  label: string | null;
  incomplete: boolean;
  /** An opening decision (mulligan, who goes first): the guide's rule, if any. */
  rule?: string[];
}

/** A choice: the picks, said with the prompt that asked for them. */
export function explainChoice(f: ChoiceFacts, line: Move[]): Explanation {
  const claim = line.length
    ? line.map((m) => m.text.replace(/\.$/, '')).join(', ')
    : 'Make this choice';
  const evidence: Explanation['evidence'] = [];
  if (f.rule?.length) for (const r of f.rule) evidence.push({ text: r, figures: {} });
  else {
    evidence.push({ text: /[.?!]$/.test(f.prompt) ? f.prompt : `${f.prompt}.`, figures: {} });
    evidence.push({
      text: 'Of the options you can see, this one scored best in the games the search played out.',
      figures: {},
    });
  }
  return {
    conceptId: f.rule ? 'mulligan' : 'tempo',
    claim: minus(`${claim.replace(/\.$/, '')}.`),
    evidence: evidence.map((e) => ({ ...e, text: minus(e.text) })),
    line,
    outcome: minus(
      f.label ? `${f.label.replace(/\.$/, '')}.` : 'Your effect resolves with this choice.',
    ),
    certainty: f.incomplete ? 'search-incomplete' : 'any-hand',
    nextTime: f.rule
      ? 'Ask three questions: can I act early, do I hold a piece of my plan, can I defend?'
      : 'Read the prompt before you choose: what the effect can reach tells you what it is for.',
    lessonId: f.rule ? LESSON.mulligan! : LESSON.tempo!,
    sources: f.rule ? ['CR 5-2-1-6', 'SH-MUL'] : ['SH-MIS'],
  };
}
