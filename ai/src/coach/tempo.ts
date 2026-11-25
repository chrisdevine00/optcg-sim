/**
 * The DON!! tempo ledger (M7 WP2, learning-ui §2.9, explanations.md E06 and E07). One function the
 * coach's tempo meter, the blunder warning and (M8) the review's "DON!! left unused" flag all call,
 * so the three agree (curriculum L09's exit rule).
 *
 * Reads the asking seat's own `PlayerView` and public card data (printed text and scripts) only:
 * the seat's own hand is its own, everything else here is on the table.
 *
 * - **paid**: DON!! rested (they paid a cost; a rested DON!! stays rested until the next Refresh).
 * - **given**: DON!! attached to a Leader or Character.
 * - **held**: active DON!! something can spend on the opponent's turn: the cost of a [Counter] Event
 *   in hand, and an opponent-turn effect that rests active DON!! (OP13-001), when its conditions hold.
 * - **unused**: active DON!! that are not held.
 */
import { SCRIPTS, type Card } from '@optcg/cards';
import { MINUS } from '../explain.ts';
import type { PlayerView, ViewCard } from '@optcg/engine';
import { hasCounterTiming } from '../knowledge.ts';
import type { Explanation, Move } from '../explanation.ts';

export type HeldKind = 'counter-event' | 'opponent-turn-effect';

/** One thing that holds DON!! back, and how many it can spend. */
export interface HeldReason {
  kind: HeldKind;
  /** The card (printed id) that holds them. */
  card: string;
  /** DON!! this reason can spend on their turn. */
  n: number;
  /** For an effect: the most active DON!! it works with ("5 or fewer"), else null. */
  limit: number | null;
  /** For an effect: power each rested DON!! adds in the battle, else null. */
  perDon: number | null;
}

export interface DonLedger {
  /** Every DON!! on the field: active, rested and given. */
  total: number;
  active: number;
  paid: number;
  given: number;
  held: { n: number; reasons: HeldReason[] };
  /** Active DON!! nothing spends on their turn. */
  unused: number;
}

/** DON!! left unused from which the coach flags (learning-ui §2.8.6: "wasting a whole turn's DON!!"). */
export const UNUSED_FLAG_AT = 3;

type Json = unknown;

const asObj = (v: Json): Record<string, Json> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, Json>) : null;

function walk(v: Json, f: (o: Record<string, Json>) => void): void {
  if (Array.isArray(v)) for (const x of v) walk(x, f);
  else {
    const o = asObj(v);
    if (!o) return;
    f(o);
    for (const x of Object.values(o)) walk(x, f);
  }
}

const whenHas = (when: Json, timing: string): boolean =>
  when === timing || (Array.isArray(when) && when.includes(timing));

/** A script ability that rests active DON!! at the opponent's attack, read from public text. */
function restDonOnTheirAttack(
  cardId: string,
): { donGiven: number; limit: number | null; perDon: number | null } | null {
  const script = SCRIPTS[cardId];
  if (!script) return null;
  for (const ab of script.abilities as unknown as Record<string, Json>[]) {
    if (!whenHas(ab.when, 'onOpponentAttack')) continue;
    let rests = false;
    let limit: number | null = null;
    let perDon: number | null = null;
    walk(ab.effect, (o) => {
      const rest = asObj(o.rest);
      if (rest && rest.from === 'donCostArea') rests = true;
      // "If you have N or fewer active DON!!" (a `cmp` over `donOnField`, state active).
      const cmp = o.cmp;
      if (Array.isArray(cmp) && cmp.length === 3) {
        const left = asObj(cmp[0]);
        if (left && left.donOnField === 'you' && left.state === 'active' && cmp[1] === '<=')
          if (typeof cmp[2] === 'number') limit = cmp[2];
      }
      // "+K power per DON!! rested": a `mul` of a count and a number.
      const mul = o.mul;
      if (Array.isArray(mul) && mul.length === 2 && typeof mul[1] === 'number' && asObj(mul[0]))
        perDon = mul[1] as number;
    });
    if (!rests) continue;
    let donGiven = 0;
    for (const c of (ab.conditions as Json[] | undefined) ?? []) {
      const o = asObj(c);
      if (o && typeof o.donGiven === 'number') donGiven = Math.max(donGiven, o.donGiven);
    }
    return { donGiven, limit, perDon };
  }
  return null;
}

/** Is this a [Counter] Event (it is played from hand during their battle for its cost in DON!!)? */
function isCounterEvent(cardId: string, cards: ReadonlyMap<string, Card>): boolean {
  if (cards.get(cardId)?.category !== 'Event') return false;
  const script = SCRIPTS[cardId];
  return !!script && script.abilities.some((a) => hasCounterTiming((a as { when?: unknown }).when));
}

/** The DON!! ledger of the viewer's own side. Pure; no hidden card is read. */
export function donLedger(view: PlayerView, cards: ReadonlyMap<string, Card>): DonLedger {
  const me = view.player;
  const d = view.don[me];
  const total = d.active + d.rested + d.given;
  const reasons: HeldReason[] = [];

  // [Counter] Events in hand: their cost is what a counter would spend.
  for (const c of view.zones[me].hand) {
    if (!c.card || !isCounterEvent(c.card, cards)) continue;
    const cost = c.cost ?? cards.get(c.card)?.cost ?? 0;
    if (cost > 0)
      reasons.push({ kind: 'counter-event', card: c.card, n: cost, limit: null, perDon: null });
  }

  // Opponent-turn effects on the table that rest active DON!!. Its conditions are checked as the
  // engine checks them (RL-46): given DON!! now, and at most `limit` active DON!!.
  const onTable: ViewCard[] = [
    ...view.zones[me].leader,
    ...view.zones[me].characters,
    ...view.zones[me].stage,
  ];
  for (const c of onTable) {
    if (!c.card || c.negated) continue;
    const e = restDonOnTheirAttack(c.card);
    if (!e || c.don < e.donGiven) continue;
    if (e.limit !== null && d.active > e.limit) continue;
    if (d.active > 0)
      reasons.push({
        kind: 'opponent-turn-effect',
        card: c.card,
        n: d.active,
        limit: e.limit,
        perDon: e.perDon,
      });
  }

  // The same DON!! cannot be spent twice: held is the most they could spend, never above active.
  const n = Math.min(
    d.active,
    reasons.reduce((t, r) => t + r.n, 0),
  );
  return {
    total,
    active: d.active,
    paid: d.rested,
    given: d.given,
    held: { n, reasons },
    unused: d.active - n,
  };
}

// ------------------------------------------------------------------------------------------------
// Explanations: E06 (left unused) and E07 (holding was right)
// ------------------------------------------------------------------------------------------------

const nameOf = (id: string, cards: ReadonlyMap<string, Card>): string => cards.get(id)?.name ?? id;

/** An attacker the seat could still give DON!! to and attack with, by the view's own actions. */
export function attackersAvailable(view: PlayerView): ViewCard[] {
  const me = view.player;
  const mine = [...view.zones[me].leader, ...view.zones[me].characters];
  const handles = new Set(view.actions.flatMap((a) => (a.type === 'attack' ? [a.attacker] : [])));
  return mine.filter((c) => handles.has(c.handle));
}

/**
 * "Unused" (E06). `left`: the tempo meter's text after the turn ended (the claim and the first
 * evidence row; the review adds the turn's history to it). `ending`: the blunder warning before
 * you end the turn, which can also show what the DON!! would do now. Present only when
 * `ledger.unused` reaches the flag threshold. Every number is the view's own.
 */
export function explainUnused(
  view: PlayerView,
  ledger: DonLedger,
  cards: ReadonlyMap<string, Card>,
  tense: 'left' | 'ending' = 'left',
  /**
   * The Tempo tab describes the ledger as the board stands now and recommends no play: no attack
   * to give DON!! to and no line, so it cannot disagree with a hint that plans a different turn
   * (M7-R7). The blunder warning keeps the suggestion.
   */
  ledgerOnly = false,
): Explanation | null {
  if (ledger.unused < UNUSED_FLAG_AT) return null;
  const me = view.player;
  const opp = me === 'p1' ? 'p2' : 'p1';
  const n = ledger.unused;
  const freeEvents = view.zones[me].hand.some(
    (c) => c.card && isCounterEvent(c.card, cards) && (c.cost ?? 0) === 0,
  );
  const why =
    ledger.held.n === 0
      ? freeEvents
        ? 'Your Counter Events cost 0, and nothing else of yours uses DON!! on their turn'
        : 'Nothing of yours uses DON!! on their turn'
      : `${ledger.held.n} of them are held for their turn, and ${n} are not`;
  const evidence: Explanation['evidence'] = [
    {
      text:
        tense === 'left'
          ? `You ended your turn with ${ledger.active} active DON!!. ${why}, so those ${n} did nothing.`
          : `You have ${ledger.active} active DON!!. ${why}, so those ${n} would do nothing.`,
      figures: { activeDonAtEnd: ledger.active, usableOnTheirTurn: ledger.held.n },
    },
  ];
  let line: Move[] | null = null;
  let outcome = ledgerOnly
    ? 'This counts the DON!! as the board stands now, before anything you play. Ask for a hint to see a plan for the whole turn.'
    : 'Giving them before an attack makes it harder to stop.';
  const best =
    tense === 'ending' && !ledgerOnly
      ? attackersAvailable(view)
          .filter((c) => c.power !== null)
          .sort((a, b) => (b.power ?? 0) - (a.power ?? 0))[0]
      : undefined;
  const theirLeader = view.zones[opp].leader[0];
  if (best && theirLeader?.power != null) {
    const atk = best.power!;
    const def = theirLeader.power;
    const boosted = atk + n * 1000;
    const stop = Math.max(0, boosted - def + 1000);
    const stopNow = Math.max(0, atk - def + 1000);
    const who =
      best.handle === view.zones[me].leader[0]?.handle ? 'Leader' : nameOf(best.card!, cards);
    evidence.push({
      text: `Your ${who} attacks at ${atk}. With ${n} DON!! it attacks at ${boosted}, and stopping it takes ${boosted} ${MINUS} ${def} + 1000 = ${stop} instead of ${stopNow}.`,
      figures: {
        attackPower: atk,
        attackWithDon: boosted,
        defencePower: def,
        stopNeeded: stopNow,
        stopNeededWithDon: stop,
      },
    });
    line = [
      {
        kind: 'giveDon',
        text: `Give ${n} DON!! to your ${who} (${boosted}) before it attacks.`,
        card: best.card!,
        count: n,
      },
      { kind: 'attack', text: 'Attack their Leader.', card: best.card!, target: 'leader' },
    ];
    outcome = `They need ${stop - stopNow} more power of counters to stop it.`;
  }
  return {
    conceptId: 'don-efficiency',
    claim:
      tense === 'left'
        ? `You left ${n} DON!! unused.`
        : `Ending your turn leaves ${n} DON!! unused.`,
    evidence,
    line,
    outcome,
    certainty: 'any-hand',
    nextTime:
      'Before you end your turn, spend every DON!! that nothing will use on their turn. Give it to an attacker before the attack, not after.',
    lessonId: 'L09-don-efficiency',
    sources: ['CR 6-5-5-2', 'CR 7-1-4-1', 'SH-DON', 'SH-MIS'],
  };
}

/**
 * "Holding was right" (E07): present only when something holds DON!! and nothing is left unused.
 * For an opponent-turn effect it speaks the card's own numbers (its given-DON!! condition, its
 * limit, what a DON!! is worth on their turn and on yours); for [Counter] Events in hand, their cost.
 */
export function explainHeld(
  view: PlayerView,
  ledger: DonLedger,
  cards: ReadonlyMap<string, Card>,
): Explanation | null {
  if (ledger.held.n === 0 || ledger.unused >= UNUSED_FLAG_AT) return null;
  const me = view.player;
  const evidence: Explanation['evidence'] = [];
  const effect = ledger.held.reasons.find((r) => r.kind === 'opponent-turn-effect');
  const events = ledger.held.reasons.filter((r) => r.kind === 'counter-event');
  let outcome = 'Those DON!! stay ready for their turn.';
  let nextTime =
    'Count the DON!! your hand and your board can spend on their turn as defence, like counters in hand.';
  let sources = ['CR 6-5-5-2', 'CR 10-2-9'];
  if (effect) {
    const holder = view.zones[me].leader
      .concat(view.zones[me].characters)
      .find((c) => c.card === effect.card);
    const owner =
      holder && view.zones[me].leader[0]?.handle === holder.handle
        ? 'Leader'
        : nameOf(effect.card, cards);
    const given = holder?.don ?? 0;
    const per = effect.perDon;
    evidence.push({
      text: `Your ${owner} keeps its ${given} given DON!! through their turn, so its [DON!! x${given}] defence is on.`,
      figures: { givenToLeader: given },
    });
    evidence.push({
      text:
        effect.limit !== null
          ? `You end with ${ledger.active} active DON!!, the most it can use. With ${effect.limit + 1} or more active, the effect can't be used at all.`
          : `You end with ${ledger.active} active DON!!, all of which it can use.`,
      figures: {
        activeDon: ledger.active,
        ...(effect.limit !== null ? { limit: effect.limit } : {}),
      },
    });
    if (per !== null) {
      const theirs = ledger.held.n * per;
      const yours = ledger.held.n * 1000;
      evidence.push({
        text: `On their turn each DON!! you rest gives +${per} in a battle: up to +${theirs} across their attacks. Given on your turn, the same ${ledger.held.n} were worth +1000 each: +${yours}.`,
        figures: { theirTurnValue: theirs, yourTurnValue: yours },
      });
      outcome = `Up to +${theirs} of defence on their turn, instead of +${yours} on your attacks.`;
    }
    evidence.push({
      text: 'DON!! you rest stay rested until your next turn, so choose which of their attacks gets them.',
      figures: {},
    });
    nextTime = `With this ${owner}, end your turn with ${given} DON!! on the ${owner} and up to ${effect.limit ?? ledger.active} active. Count those DON!! as defence, like counters in hand.`;
    sources = ['RL-46', 'RL-13', 'CR 6-5-5-2', 'CR 8-3-2-3', 'SH-RGL'];
  }
  if (events.length > 0) {
    const cost = events.reduce((t, r) => t + r.n, 0);
    evidence.push({
      text: `Your hand holds [Counter] Events that cost ${cost} DON!! in total: ${events
        .map((r) => nameOf(r.card, cards))
        .join(', ')}.`,
      figures: { counterEventCost: cost },
    });
  }
  return {
    conceptId: 'don-efficiency',
    claim: `Keeping ${ledger.held.n} DON!! active was right.`,
    evidence,
    line: null,
    outcome,
    certainty: 'any-hand',
    nextTime,
    lessonId: 'L09-don-efficiency',
    sources,
  };
}

/** The tempo meter's one-line text: its label ("8 DON!! · 4 paid · 1 given · 3 held"). */
export function ledgerLabel(l: DonLedger): string {
  const parts = [`${l.total} DON!!`, `${l.paid} paid`, `${l.given} given`, `${l.held.n} held`];
  if (l.unused > 0) parts.push(`${l.unused} unused`);
  return parts.join(' · ');
}
