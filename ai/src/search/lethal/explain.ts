/**
 * What the lethal detector says, tier by tier (learning-ui §3.1), and the data the guided count
 * checks (§3.2). Copy follows explanations.md: E20 (coach, a proof), E01 and E02 (review), E03
 * (not fully checked), and the rules at the top of that file (claims of at most 12 words, every
 * number in `figures`, the real minus sign, "DON!!", correct plurals).
 *
 * Everything here is arithmetic over a `LethalResult`; nothing reads a game. In `public` results the
 * hidden hand appears only as a count and the archetype's biggest Counter.
 */
import type { Card } from '@optcg/cards';
import { certaintyLabel, type Evidence, type Explanation, type Move } from '../../explanation.ts';
import { MINUS, figureKey } from '../../explain.ts';
import type { DefenceEffect } from './defence.ts';
import type { LineStep } from './analyse.ts';
import type { LethalResult } from './lethal.ts';

type Attack = Extract<LineStep, { kind: 'attack' }>;

export type LethalContext = 'coach' | 'review';

const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
const ord = (i: number): string => ORDINAL[i] ?? `${i + 1}th`;
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n: number, one: string, many = one + 's'): string => `${n} ${n === 1 ? one : many}`;

const nameOf = (cards: ReadonlyMap<string, Card>, id: string): string => cards.get(id)?.name ?? id;

/** "Edward.Newgate" → "Newgate", "Ulti & Page One" → "Ulti": how evidence lines name a card. */
export function shortName(name: string): string {
  const last = name.split('.').pop() ?? name;
  return last.split(' & ')[0]!.trim();
}

// ---------------------------------------------------------------------------------------------
// Tier 1 and 2
// ---------------------------------------------------------------------------------------------

export interface Tier1 {
  status: LethalResult['status'];
  certainty: LethalResult['certainty'];
  /** The bar's words. */
  text: string;
  /** The certainty chip's words, in the live coach. */
  chip: string;
  /** Proven in `public` mode only: "unless a Life card's Trigger stops it (their deck runs N Triggers)". */
  triggerNote: string | null;
  /** The polite screen-reader text (learning-ui §3.1). */
  sr: string;
}

/** Tier 1: whether lethal exists, and how sure we are. Never a guess while checking. */
export function tier1(r: LethalResult): Tier1 {
  const chip = certaintyLabel(r.certainty, 'coach');
  const t = r.trigger;
  const triggerNote =
    r.status === 'proven' && t && t.probabilityNone < 1
      ? `Works against any hand, unless a Life card's Trigger stops it (their deck runs ${t.triggersInPrior}).`
      : null;
  if (r.status === 'proven')
    return {
      status: r.status,
      certainty: r.certainty,
      text: 'Lethal is on the board.',
      chip,
      triggerNote,
      sr: `Lethal: proven, ${chip.toLowerCase()}.`,
    };
  if (r.status === 'refuted') {
    const d = r.defence;
    if (d?.reason === 'attackers') {
      const n = r.facts.attackers.length;
      const text = `No lethal: you need ${plural(d.hitsNeeded, 'hit')} and have ${plural(n, 'attacker')}.`;
      return { status: r.status, certainty: r.certainty, text, chip, triggerNote: null, sr: text };
    }
    const stop = d ? Math.max(1, d.hitsNeeded - d.lifeTaken) : 1;
    const need = d?.hitsNeeded ?? r.facts.hitsNeeded;
    return {
      status: r.status,
      certainty: r.certainty,
      text: `No lethal: they can stop at least ${stop} of the ${need} hits you need.`,
      chip,
      triggerNote: null,
      sr: `No lethal: they can stop at least ${stop} of the ${need} hits.`,
    };
  }
  return {
    status: r.status,
    certainty: 'search-incomplete',
    text: "Couldn't finish checking.",
    chip,
    triggerNote: null,
    sr: "Lethal: couldn't finish checking.",
  };
}

/** Tier 2: how many hits, and how many attackers can hit their Leader. */
export function tier2(r: LethalResult): {
  text: string;
  sr: string;
  hits: number;
  attackers: number;
} {
  const hits = r.facts.hitsNeeded;
  const n = r.facts.attackers.length;
  return {
    text: `You need ${plural(hits, 'hit')}. You have ${plural(n, 'attacker')} that can hit their Leader.`,
    sr: `You need ${plural(hits, 'hit')}. You have ${plural(n, 'attacker')}.`,
    hits,
    attackers: n,
  };
}

// ---------------------------------------------------------------------------------------------
// Tier 3: the Explanation
// ---------------------------------------------------------------------------------------------

/** A figure key for `name`, unique among `taken` ("kaido", then "kaido2"). */
function keyFor(name: string, taken: Set<string>): string {
  const base = figureKey(shortName(name));
  let k = base;
  for (let i = 2; taken.has(k); i++) k = base + i;
  taken.add(k);
  return k;
}

/** "Your Leader with 5 DON!! (10000)", "Kaido (12000)", "Ulti with 2 DON!! (8000)". */
function attackLabel(a: Attack, short: string): string {
  const who = a.leader ? 'Your Leader' : short;
  return a.don > 0 ? `${who} with ${a.don} DON!! (${a.power})` : `${who} (${a.power})`;
}

function defenceSentence(
  r: LethalResult,
  cards: ReadonlyMap<string, Card>,
  tense: 'coach' | 'review',
  figures: Record<string, number>,
): string {
  const f = r.facts;
  const parts: string[] = [];
  const taken = new Set<string>();
  for (const d of f.defence as DefenceEffect[]) {
    const nm = shortName(nameOf(cards, d.card));
    const k = keyFor(nm, taken);
    const once = d.oncePerTurn ? ` once ${tense === 'coach' ? 'this turn' : 'that turn'}` : '';
    if (d.kind === 'boost') {
      parts.push(`${nm} ${d.costsCard ? 'turns a card into' : 'adds'} +${d.amount}${once}`);
      figures[`${k}Boost`] = d.amount;
    } else {
      parts.push(`${nm} gives one of your Characters ${MINUS}${d.amount}${once}`);
      figures[`${k}Shrink`] = d.amount;
    }
  }
  const held = tense === 'coach' ? 'hold' : 'held';
  let head = `They ${held} ${plural(f.handSize, 'card')}.`;
  figures.handSize = f.handSize;
  const counters =
    f.actualCounter !== null
      ? `their cards ${tense === 'coach' ? 'carry' : 'carried'} +${f.actualCounter} of Counter in all`
      : `their counters ${tense === 'coach' ? 'are' : 'were'} +${f.maxPerCard} each`;
  if (f.actualCounter !== null) figures.actualCounterInHand = f.actualCounter;
  else figures.maxPerCard = f.maxPerCard;
  if (parts.length === 0) return `${head} ${cap(counters)}.`;
  head += ` ${parts.join('; ')}; ${counters}.`;
  return head;
}

/** The numbered Moves of a line, with the DON!! gives collected into one step (E20). */
function movesOf(r: LethalResult, cards: ReadonlyMap<string, Card>): Move[] {
  const line = r.line ?? [];
  const moves: Move[] = [];
  const name = (id: string): string => nameOf(cards, id);
  const who = (a: Attack): string => (a.leader ? 'your Leader' : name(a.card));
  const attacks = line.filter((s): s is Attack => s.kind === 'attack');
  const gives = attacks.filter((a) => a.don > 0);
  if (gives.length > 0) {
    const total = gives.reduce((t, a) => t + a.don, 0);
    const one = (a: Attack) => `${who(a)} (${a.power})`;
    let text: string;
    if (gives.length === 1) {
      const g = gives[0]!;
      text = `Give ${g.don === r.facts.activeDon ? `all ${g.don}` : g.don} DON!! to ${one(g)}.`;
      moves.push({ kind: 'giveDon', text, card: g.card, count: g.don });
    } else {
      const bits = gives.map((g, i) =>
        i === 0 ? `${g.don} DON!! to ${one(g)}` : `${g.don} to ${one(g)}`,
      );
      text = `Give ${bits.slice(0, -1).join(', ')} and ${bits[bits.length - 1]}.`;
      moves.push({ kind: 'giveDon', text, count: total });
    }
  }
  for (const s of line) {
    if (s.kind === 'attack') {
      const target = s.target === 'leader' ? 'their Leader' : name(s.target);
      const power = s.don > 0 ? '' : ` (${s.power})`;
      moves.push({
        kind: 'attack',
        text: `Attack ${target} with ${who(s)}${power}.`,
        card: s.card,
        target: s.target,
      });
    } else if (s.kind === 'play')
      moves.push({ kind: 'play', text: `Play ${name(s.card)}.`, card: s.card });
    else if (s.kind === 'activate')
      moves.push({ kind: 'activate', text: `Activate ${name(s.card)}.`, card: s.card });
    else if (s.kind === 'use' && s.card)
      moves.push({ kind: 'activate', text: `Use ${name(s.card)}'s effect.`, card: s.card });
    else if (s.kind === 'choose' && s.card)
      moves.push({ kind: 'choose', text: `Choose ${name(s.card)}.`, card: s.card });
  }
  return moves;
}

/** E01 lists its sources in another order than E20; the snapshot tests compare them as written. */
const SOURCES_REVIEW = [
  'CR 7-1-4-1',
  'CR 7-1-4-1-1-1',
  'CR 7-1-4-1-1-2',
  'CR 6-5-5-2',
  'SH-CTR',
  'SH-DON',
];

const SOURCES_PROOF = [
  'CR 7-1-4-1',
  'CR 7-1-4-1-1-1',
  'CR 7-1-4-1-1-2',
  'CR 6-5-5-2',
  'SH-DON',
  'SH-CTR',
];

/** The per-attack evidence rows ("Ulti with 2 DON!! (8000) needs 4000 to stop. They can make 3000."). */
function attackRows(
  r: LethalResult,
  cards: ReadonlyMap<string, Card>,
  tense: 'coach' | 'review',
): Evidence[] {
  const rows: Evidence[] = [];
  const taken = new Set<string>();
  let hit = 0;
  const attacks = (r.line ?? []).filter((s): s is Attack => s.kind === 'attack');
  for (const a of attacks) {
    const short = shortName(nameOf(cards, a.card));
    const label = attackLabel(a, short);
    if (a.target !== 'leader') {
      rows.push({
        text: `Attack ${shortName(nameOf(cards, a.target))} with ${label} first, to remove it before the hits on their Leader.`,
        figures: { attackPower: a.power },
      });
      continue;
    }
    const k = a.leader ? 'leader' : keyFor(short, taken);
    const o = cap(ord(hit++));
    rows.push({
      text:
        tense === 'coach'
          ? `${label} needs ${a.need}${hit === 1 ? ' to stop' : ''}. They can make ${a.maxDefence}.`
          : `${label} needed ${a.need} to stop. They could make ${a.maxDefence}.`,
      figures: { [`${k}Power`]: a.power, [`stop${cap(k)}`]: a.need, [`maxAt${o}`]: a.maxDefence },
    });
  }
  return rows;
}

/** "Each hit gives them a card: 1 card for your first attack, 2 for the second, 3 for the third." */
function growthRow(r: LethalResult, tense: 'coach' | 'review'): Evidence | null {
  const hits = (r.line ?? []).filter(
    (s): s is Attack => s.kind === 'attack' && s.target === 'leader',
  );
  if (hits.length < 2) return null;
  const figures: Record<string, number> = {};
  const bits = hits.map((a, i) => {
    figures[`cardsAt${cap(ord(i))}`] = a.handSize;
    return i === 0
      ? `${plural(a.handSize, 'card')} for your ${ord(i)} attack`
      : `${a.handSize} for the ${ord(i)}`;
  });
  const lead = tense === 'coach' ? 'Each hit gives them a card' : 'Each hit gave them a card';
  return { text: `${lead}: ${bits.join(', ')}.`, figures };
}

function hitsRow(r: LethalResult, tense: 'coach' | 'review'): Evidence {
  const f = r.facts;
  const figures = {
    opponentLife: f.opponentLife,
    hitsNeeded: f.hitsNeeded,
    attackers: f.attackers.length,
  };
  if (tense === 'coach')
    return {
      text: `They are at ${f.opponentLife} Life, so you need ${plural(f.hitsNeeded, 'hit')}. You have ${plural(f.attackers.length, 'attacker')}.`,
      figures,
    };
  const tail = f.opponentLife === 1 ? ': one for the last Life card, one to win' : '';
  return {
    text: `They had ${f.opponentLife} Life, so you needed ${plural(f.hitsNeeded, 'hit')}${tail}.`,
    figures: { opponentLife: f.opponentLife, hitsNeeded: f.hitsNeeded },
  };
}

function blockerRow(r: LethalResult, tense: 'coach' | 'review'): Evidence | null {
  const n = r.facts.blockers.length;
  if (n === 0) return null;
  return {
    text:
      tense === 'coach'
        ? `They have ${plural(n, 'active Blocker')}. Each can stop one attack.`
        : `They had ${plural(n, 'active Blocker')}. Each could stop one attack.`,
    figures: { blockers: n },
  };
}

function doubleAttackRow(r: LethalResult, cards: ReadonlyMap<string, Card>): Evidence | null {
  const da = r.facts.attackers.filter((a) => a.doubleAttack);
  if (da.length === 0) return null;
  const nm = shortName(nameOf(cards, da[0]!.card));
  return {
    text: `${nm}'s Double Attack takes 2 Life cards from 2 or more Life. At 1 Life it takes the last one and the game goes on.`,
    figures: { doubleAttackers: da.length },
  };
}

function triggerRow(r: LethalResult, tense: 'coach' | 'review'): Evidence | null {
  const t = r.trigger;
  if (!t) return null;
  if (t.probabilityNone >= 1)
    return {
      text:
        tense === 'coach'
          ? "Their deck runs no Trigger cards, so the Life cards can't stop you."
          : "Their deck runs no Trigger cards, so the Life card can't stop you either.",
      figures: { triggersInPrior: 0 },
    };
  return {
    text: `Their deck runs ${plural(t.triggersInPrior, 'Trigger')}. This line works unless one of the ${plural(t.exposed, 'Life card')} you take is one.`,
    figures: {
      triggersInPrior: t.triggersInPrior,
      exposedLife: t.exposed,
      chanceNoTriggerPct: Math.round(t.probabilityNone * 100),
    },
  };
}

const NEXT_PROOF_COACH =
  'Each hit hands them a card. Size each attack against the cards they will have by then, and send the biggest last.';
const NEXT_PROOF_REVIEW =
  'Count Life + 1 hits, then their best possible defence. Put your DON!! where it beats that defence, and send your hardest-to-stop attack last: every hit hands them another card.';

/**
 * The tier-3 `Explanation` of a result. `context` picks the tense and the chip table: `coach` for the
 * live detector, `review` for a flag. `publicResult` lets a review flag built from an `actual`
 * proof say what the public check found.
 */
export function explainLethal(
  r: LethalResult,
  cards: ReadonlyMap<string, Card>,
  context: LethalContext = 'coach',
  publicResult?: LethalResult,
): Explanation {
  const tense = context;
  const f = r.facts;
  if (r.status === 'unknown')
    return {
      conceptId: 'lethal-math',
      claim: "This turn wasn't fully checked for lethal.",
      evidence: [
        hitsRow(r, tense),
        {
          text: `The analysis checked ${r.nodes} lines before it stopped. It found no forced win and no defence that always holds.`,
          figures: { linesChecked: r.nodes },
        },
      ],
      line: null,
      outcome: 'Unknown: no win proven, none ruled out.',
      certainty: 'search-incomplete',
      nextTime:
        'When their defence has many parts, count it in order: Blockers, then effects that trigger on your attack, then cards in hand. If the count is close, attack in the order that makes them spend first.',
      lessonId: 'L16-reading-counters',
      sources: ['CR 7-1-2-1', 'CR 7-1-3-1'],
    };

  const evidence: Evidence[] = [hitsRow(r, tense)];
  const figs: Record<string, number> = {};
  evidence.push({ text: defenceSentence(r, cards, tense, figs), figures: figs });
  const blk = blockerRow(r, tense);
  if (blk) evidence.push(blk);
  const gr = growthRow(r, tense);
  if (gr && r.status === 'proven') evidence.push(gr);

  if (r.status === 'refuted' && r.defence?.reason === 'attackers') {
    const n = f.attackers.length;
    return {
      conceptId: 'lethal-math',
      claim: `No lethal: you need ${plural(f.hitsNeeded, 'hit')} and have ${plural(n, 'attacker')}.`,
      evidence: [hitsRow(r, tense)],
      line: null,
      outcome: 'No win this turn: not enough attackers.',
      certainty: 'any-hand',
      nextTime:
        'Count Life + 1 hits first. Each attacker lands one hit (two Life with Double Attack), so too few attackers means no DON!! split can make lethal.',
      lessonId: 'L15-lethal-math',
      sources: ['CR 7-1-4-1', 'CR 7-1-4-1-1-1'],
    };
  }
  if (r.status === 'refuted') {
    const d = r.defence!;
    const attacks = d.line.filter((s): s is Attack => s.kind === 'attack' && s.target === 'leader');
    const stopped = attacks.find((a) => a.maxDefence >= a.need || a.blockable);
    const short = (a: Attack) => attackLabel(a, shortName(nameOf(cards, a.card)));
    if (stopped && stopped.maxDefence >= stopped.need)
      evidence.push({
        text: `${short(stopped)} needs ${stopped.need} to stop, and they can make ${stopped.maxDefence}.`,
        figures: { stopNeeded: stopped.need, maxDefence: stopped.maxDefence },
      });
    else if (stopped)
      evidence.push({
        text: `${short(stopped)} can be blocked, and a Blocker stops one attack.`,
        figures: { blockers: f.blockers.length },
      });
    evidence.push({
      text: `Your best order lands ${plural(d.lifeTaken, 'hit')} of the ${d.hitsNeeded} you need.`,
      figures: { hitsLanded: d.lifeTaken, hitsNeeded: d.hitsNeeded },
    });
    const stop = Math.max(1, d.hitsNeeded - d.lifeTaken);
    return {
      conceptId: 'lethal-math',
      claim: `No lethal: they can stop at least ${stop} of the ${d.hitsNeeded} hits.`,
      evidence,
      line: null,
      outcome: 'No win this turn: they can stop it.',
      certainty: r.certainty,
      nextTime:
        'Count Life + 1 hits against their best possible defence before you commit your attackers.',
      lessonId: 'L15-lethal-math',
      sources: SOURCES_PROOF,
    };
  }

  // Proven.
  evidence.push(...attackRows(r, cards, tense));
  const da = doubleAttackRow(r, cards);
  if (da) evidence.push(da);
  const tr = context === 'review' ? triggerRow(r, tense) : null;
  if (tr) evidence.push(tr);
  const line = movesOf(r, cards);
  const hits = f.hitsNeeded;
  if (context === 'coach')
    return {
      conceptId: 'lethal-math',
      claim: `You have lethal: ${plural(hits, 'hit')}, and they can't stop any of them.`,
      evidence,
      line,
      outcome: 'Wins the game this turn.',
      certainty: r.certainty,
      nextTime: NEXT_PROOF_COACH,
      lessonId: 'L15-lethal-math',
      sources: SOURCES_PROOF,
    };
  if (r.mode === 'public')
    return {
      conceptId: 'lethal-math',
      claim: 'You had lethal this turn.',
      evidence,
      line,
      outcome: 'Wins the game this turn.',
      certainty: 'any-hand',
      nextTime: NEXT_PROOF_REVIEW,
      lessonId: 'L15-lethal-math',
      sources: SOURCES_REVIEW,
    };
  // Review, found only with their real hand: hindsight (E02).
  if (publicResult && publicResult.status === 'refuted')
    evidence.splice(2, 0, {
      text: `From what you could see, each of their cards could have been up to +${publicResult.facts.maxPerCard}: enough to stop it.`,
      figures: { maxPerCard: publicResult.facts.maxPerCard },
    });
  return {
    conceptId: 'hand-reading',
    claim: 'Against the hand they actually held, you had lethal.',
    evidence,
    line,
    outcome: 'Would have won this turn, against the hand they held.',
    certainty: 'needed-hidden-info',
    nextTime:
      "When lethal depends on their hand, weigh it: if they do have the counters, what do you lose by attacking their Leader anyway? Often only the Characters you didn't K.O.",
    lessonId: 'L16-reading-counters',
    sources: ['CR 7-1-4-1', 'CR 7-1-4-1-1-1', 'SH-MIS', 'SH-DON'],
  };
}

// ---------------------------------------------------------------------------------------------
// The guided count (learning-ui §3.2)
// ---------------------------------------------------------------------------------------------

/** What each of the four questions is checked against. */
export interface GuidedCount {
  /** 1. "How many hits do you need?" Life + 1; a Double Attack note when one of the attackers has it. */
  hits: { opponentLife: number; hitsNeeded: number; doubleAttack: boolean };
  /** 2. "Which of your cards can attack their Leader this turn?" The refs the view names. */
  attackers: { ref: string; card: string; power: number }[];
  /** 3. "How much can they stop?" */
  defence: {
    blockers: number;
    effects: DefenceEffect[];
    handSize: number;
    /** Their deck's biggest Counter (public mode), or null in `actual`. */
    maxPerCard: number | null;
    /** Cards in their hand at each of your attacks, one more after every hit: `[1, 2, 3]`. */
    cardsAtEachAttack: number[];
  };
  /** 4. "Split your DON!!": the line's attacks in order, each with the DON!! it needs. */
  split: {
    ref: string;
    card: string;
    don: number;
    power: number;
    /** What stops this attack: attack power − their Leader's power + 1000. */
    need: number;
    /** What they can have by then. */
    maxDefence: number;
  }[];
  donUsed: number;
  donSpare: number;
}

/** The guided count for a proven result, or null (nothing to check against). */
export function guidedCount(r: LethalResult): GuidedCount | null {
  if (r.status !== 'proven' || !r.line) return null;
  const attacks = r.line.filter((s): s is Attack => s.kind === 'attack' && s.target === 'leader');
  const f = r.facts;
  const donUsed = attacks.reduce((t, a) => t + a.don, 0);
  return {
    hits: {
      opponentLife: f.opponentLife,
      hitsNeeded: f.hitsNeeded,
      doubleAttack: f.attackers.some((a) => a.doubleAttack),
    },
    attackers: f.attackers.map((a) => ({ ref: a.ref, card: a.card, power: a.power })),
    defence: {
      blockers: f.blockers.length,
      effects: f.defence,
      handSize: f.handSize,
      maxPerCard: f.actualCounter === null ? f.maxPerCard : null,
      cardsAtEachAttack: attacks.map((a) => a.handSize),
    },
    split: attacks.map((a) => ({
      ref: a.ref,
      card: a.card,
      don: a.don,
      power: a.power,
      need: a.need,
      maxDefence: a.maxDefence,
    })),
    donUsed,
    donSpare: Math.max(0, f.activeDon - donUsed),
  };
}

export interface CountAnswers {
  hits?: number;
  attackers?: string[];
  /** The player's staged gives and attack order. */
  split?: { ref: string; don: number }[];
}

export interface CountCheck {
  hits: { correct: boolean; reason: string };
  attackers: { correct: boolean; reason: string };
  split: { correct: boolean; reason: string };
}

/**
 * "Check my count": each answer marked, with the reason for a wrong one. The split is right when
 * every attack in the player's order meets its `need` against what they can have by then (the
 * search's line is one answer, not the only one): it is replayed through the numbers the line
 * carries, so a different split that also works is accepted.
 */
export function checkGuidedCount(g: GuidedCount, a: CountAnswers): CountCheck {
  const hitsOk = a.hits === g.hits.hitsNeeded;
  const want = new Set(g.attackers.map((x) => x.ref));
  const got = new Set(a.attackers ?? []);
  const missing = [...want].filter((x) => !got.has(x)).length;
  const extra = [...got].filter((x) => !want.has(x)).length;
  const attOk = missing === 0 && extra === 0;
  let splitOk = false;
  let splitWhy = 'Stage your DON!! and the order of attacks first.';
  if (a.split && a.split.length > 0) {
    const byRef = new Map(g.split.map((s) => [s.ref, s]));
    splitOk = true;
    splitWhy = 'Each attack beats what they can have by then.';
    const total = a.split.reduce((t, x) => t + x.don, 0);
    if (a.split.length < g.hits.hitsNeeded) {
      splitOk = false;
      splitWhy = `You need ${plural(g.hits.hitsNeeded, 'attack')} to land, and you staged ${a.split.length}.`;
    } else if (total > g.donUsed + g.donSpare) {
      splitOk = false;
      splitWhy = `You gave ${total} DON!!, and you have ${g.donUsed + g.donSpare}.`;
    }
    // What they can have at attack `pos` is the line's number for that position: it depends on how
    // many hits came before (one more card each), not on which card attacks.
    a.split.forEach((x, pos) => {
      const s = byRef.get(x.ref);
      if (!splitOk || !s) return;
      const targetPower = s.power - s.need + 1000;
      const power = s.power - s.don * 1000 + x.don * 1000;
      const they = g.split[Math.min(pos, g.split.length - 1)]!.maxDefence;
      if (power - targetPower < they) {
        splitOk = false;
        splitWhy = `Attack ${pos + 1} is ${power} against their ${targetPower}. They can make ${they}, which stops it.`;
      }
    });
  }
  return {
    hits: {
      correct: hitsOk,
      reason: hitsOk
        ? `${g.hits.opponentLife} Life, plus 1.`
        : `They have ${g.hits.opponentLife} Life, so you need ${g.hits.opponentLife} + 1 = ${g.hits.hitsNeeded} hits.`,
    },
    attackers: {
      correct: attOk,
      reason: attOk
        ? 'Those are the cards that can attack their Leader.'
        : `${missing > 0 ? `${plural(missing, 'attacker')} missing. ` : ''}${extra > 0 ? `${plural(extra, 'card')} cannot attack their Leader this turn.` : ''}`.trim(),
    },
    split: { correct: splitOk, reason: splitWhy },
  };
}
