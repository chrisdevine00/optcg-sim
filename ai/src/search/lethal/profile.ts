/**
 * The defender's worst-case [Counter] and hand (A1, DECISIONS 2026-11-05 "A1 corrected" and the L fix
 * round). Every [Counter] Event in the archetype prior is read from its script. One placeholder Event
 * is built whose single [Counter] ability is a **"choose one" the defender makes**, with a mode for
 * each distinct effect in the prior:
 *
 * - **plain +power**: the biggest printed Counter of any Character of the prior (no cost);
 * - **each Event's own effect**, its boost aimed at "your Leader or a Character", its rest at "up to
 *   1 of the opponent's Characters", its draw kept with its own condition;
 * - **DON!! costs are modelled** (the defender's DON!! is public): a mode that costs DON!! −N is
 *   guarded by "you have N or more DON!! on your field" and returns N DON!! as its first step, so
 *   the engine checks and spends the real, public DON!!;
 * - other costs (trash a card, rest DON!!) and filters on what may be boosted are dropped: that only
 *   errs toward the defender.
 *
 * **Types and colors.** A cost on a real card may name a type ("trash 1 card with a type including
 * Rocks Pirates", Shiki), so the placeholder carries the union of every type and color in the prior:
 * it can pay whatever any real card of the prior could. Costs that name a card, a category or a
 * Counter value cannot be met by one placeholder; they are reported as gaps when a card on the
 * defender's public board has them (`handCostGaps`).
 *
 * Draws pull from the deck, so a drawing mode is only offered by cards that can really be drawn: the
 * hidden hand and Life, and the top `drawCopies` cards of the deck.
 *
 * An effect this model does not know, a prior card without data, or a prior Event without a script
 * is a `gap`: the proof can no longer claim `any-hand`. lethal.test.ts checks the slice priors have none.
 */
import { SCRIPTS, type Card } from '@optcg/cards';
import { hasCounterTiming } from '../../knowledge.ts';

type Loose = Record<string, unknown>;

export interface CounterProfile {
  /** Distinct effect modes (each a list of effect steps), plain +power first. */
  modes: unknown[][];
  /** Modes without any draw (for the cards that cannot be drawn). */
  modesNoDraw: unknown[][];
  rests: boolean;
  draws: boolean;
  /** Prior card ids whose [Counter] draws. */
  drawIds: string[];
  /** Union of the types and colors of every card in the prior (what a placeholder carries). */
  types: string[];
  colors: string[];
  /** Effects the placeholder cannot represent: `OP00-000: op`. */
  gaps: string[];
}

const KNOWN = new Set(['power', 'rest', 'draw']);

/** Every `do` op under an effect tree. */
function opsOf(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((n) => opsOf(n, out));
  else if (node && typeof node === 'object') {
    const o = node as Loose;
    if (o.do && typeof o.do === 'object') out.push(...Object.keys(o.do as Loose));
    for (const k of ['then', 'else']) if (o[k]) opsOf(o[k], out);
  }
  return out;
}

/** The effect with every boost aimed at "your Leader or a Character" and every rest at their Characters. */
function normalise(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(normalise);
  if (!node || typeof node !== 'object') return node;
  const o = node as Loose;
  const out: Loose = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === 'do' && v && typeof v === 'object') {
      const d: Loose = {};
      for (const [op, body] of Object.entries(v as Loose)) {
        if (op === 'power') {
          const b = body as Loose;
          d.power = {
            target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
            amount: b.amount,
            duration: 'battle',
          };
        } else if (op === 'rest')
          d.rest = { from: 'characters', owner: 'opponent', pick: { upTo: 1 } };
        else d[op] = body;
      }
      out.do = d;
    } else out[k] = normalise(v);
  }
  return out;
}

function counterAbilities(cardId: string): Loose[] {
  const script = SCRIPTS[cardId];
  if (!script) return [];
  return (script.abilities as unknown as Loose[]).filter((a) => hasCounterTiming(a.when));
}

/** The mode of one [Counter] ability: its DON!! cost made a guard and a real return of DON!!. */
function modeOf(a: Loose): unknown[] {
  const steps = normalise(a.effect) as unknown[];
  const don = ((a.cost as Loose[] | undefined) ?? []).reduce(
    (t, c) => t + (typeof c.donMinus === 'number' ? c.donMinus : 0),
    0,
  );
  if (don === 0) return steps;
  return [
    {
      if: { cmp: [{ donOnField: 'you' }, '>=', don] },
      then: [{ do: { returnDon: { n: don } } }, ...steps],
    },
  ];
}

export function counterProfile(
  cardIds: readonly string[],
  cards: ReadonlyMap<string, Card>,
  /** A floor for the plain +power (the fallback when the prior is unknown). */
  minPlain = 0,
): CounterProfile {
  const gaps: string[] = [];
  const modes = new Map<string, unknown[]>();
  const drawIds = new Set<string>();
  const types = new Set<string>();
  const colors = new Set<string>();
  let rests = false;
  let plain = minPlain;
  for (const id of cardIds) {
    const card = cards.get(id);
    if (!card) {
      gaps.push(`${id}: no card data`);
      continue;
    }
    card.types.forEach((t) => types.add(t));
    card.colors.forEach((c) => colors.add(c));
    if (card.category !== 'Event') plain = Math.max(plain, card.counter ?? 0);
    if (card.category === 'Event' && !SCRIPTS[id]) gaps.push(`${id}: Event without a script`);
    for (const a of counterAbilities(id)) {
      const ops = opsOf(a.effect);
      const bad = ops.filter((op) => !KNOWN.has(op));
      for (const op of bad) gaps.push(`${id}: ${op}`);
      if (bad.length > 0) continue;
      if (ops.includes('rest')) rests = true;
      if (ops.includes('draw')) drawIds.add(id);
      const mode = modeOf(a);
      modes.set(JSON.stringify(mode), mode);
    }
  }
  const plainMode = [
    {
      do: {
        power: {
          target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
          amount: plain,
          duration: 'battle',
        },
      },
    },
  ];
  modes.delete(JSON.stringify(plainMode));
  // A mode that only adds power (no cost guard, nothing else) is dominated by the biggest such mode.
  const pureAmount = (m: unknown[]): number | null => {
    const step = m.length === 1 ? (m[0] as Loose) : null;
    const power = step && step.do && (step.do as Loose).power;
    return power && !('if' in (step as Loose)) ? ((power as Loose).amount as number) : null;
  };
  const rich = Array.from(modes.values()).filter((m) => pureAmount(m) === null);
  const bestPure = Math.max(
    pureAmount(plainMode)!,
    ...Array.from(modes.values()).map((m) => pureAmount(m) ?? 0),
  );
  const all = [
    [{ do: { power: { ...(plainMode[0]!.do.power as Loose), amount: bestPure } } }],
    ...rich,
  ];
  return {
    modes: all,
    modesNoDraw: all.filter((m) => !opsOf(m).includes('draw')),
    rests,
    draws: drawIds.size > 0,
    drawIds: [...drawIds],
    types: [...types],
    colors: [...colors],
    gaps: [...new Set(gaps)],
  };
}

const label = (i: number): string => `Counter mode ${i + 1}`;

/** The placeholder's one [Counter] ability: the defender picks the best mode. */
export function worstAbility(modes: unknown[][]): unknown {
  const effect =
    modes.length === 1
      ? modes[0]
      : [
          {
            chooseOne: modes,
            labels: modes.map((_, i) => label(i)),
            neutral: modes.map((_, i) => label(i)),
          },
        ];
  return { id: 'counter', kind: 'activate', when: 'counter', effect };
}

/**
 * Costs a placeholder cannot pay, found on the cards of the defender's public board: a `hand`
 * selection whose filter or pick names something other than types (a name, a category, a Counter
 * value, distinct names, a total cost). Type filters are met by the placeholder's union of types.
 */
export function handCostGaps(boardCardIds: readonly string[]): string[] {
  const out: string[] = [];
  const bad = (f: unknown): boolean => {
    if (!f || typeof f !== 'object') return false;
    const o = f as Loose;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'type' || k === 'typeIncludes') continue;
      if (k === 'all' || k === 'any') {
        if ((v as unknown[]).some(bad)) return true;
        continue;
      }
      if (k === 'not') {
        if (bad(v)) return true;
        continue;
      }
      return true;
    }
    return false;
  };
  const walk = (id: string, n: unknown): void => {
    if (Array.isArray(n)) return n.forEach((x) => walk(id, x));
    if (!n || typeof n !== 'object') return;
    const o = n as Loose;
    const from = o.from;
    if (from === 'hand' || (Array.isArray(from) && from.includes('hand'))) {
      const pick = (o.pick ?? {}) as Loose;
      if (o.owner !== 'opponent' && (bad(o.filter) || pick.distinctNames || pick.totalCost))
        out.push(`${id}: a card in hand is chosen by more than its type`);
    }
    for (const v of Object.values(o)) walk(id, v);
  };
  for (const id of boardCardIds) walk(id, SCRIPTS[id]?.abilities);
  return [...new Set(out)];
}

/** What a defender can add per card, for a bound the UI can show (and the search never needs). */
export interface DefenceBound {
  /** The most +power one hidden card adds, given the DON!! on the defender's field (public). */
  perCard: number;
  /** Their [Counter] cards can also rest one of your Characters. */
  rests: boolean;
  /** ... or draw. */
  draws: boolean;
  /** The prior has no sourced list: `perCard` is the fallback. */
  noPrior: boolean;
  /** Counter effects the model cannot represent (a bound is then not a bound). */
  gaps: string[];
}

/** The biggest +power of one ability's effect tree. */
function powerOf(node: unknown): number {
  if (Array.isArray(node)) return Math.max(0, ...node.map(powerOf));
  if (!node || typeof node !== 'object') return 0;
  const o = node as Loose;
  let best = 0;
  if (o.do && typeof o.do === 'object') {
    const p = (o.do as Loose).power as Loose | undefined;
    if (p && typeof p.amount === 'number') best = p.amount;
  }
  for (const k of ['then', 'else']) if (o[k]) best = Math.max(best, powerOf(o[k]));
  return best;
}

/**
 * The public defence bound of a Leader's archetype: the most one hidden card can add, for a defender
 * with `defenderDon` DON!! on its field. A Counter that costs DON!! -N counts only if N of them are
 * there. `fallback` is used when the prior is unknown.
 */
export function defenceBound(
  cardIds: readonly string[],
  cards: ReadonlyMap<string, Card>,
  defenderDon: number,
  fallback: number,
): DefenceBound {
  const prof = counterProfile(cardIds, cards, cardIds.length === 0 ? fallback : 0);
  let perCard = cardIds.length === 0 ? fallback : 0;
  for (const id of cardIds) {
    const card = cards.get(id);
    if (card && card.category !== 'Event') perCard = Math.max(perCard, card.counter ?? 0);
    for (const a of counterAbilities(id)) {
      const don = ((a.cost as Loose[] | undefined) ?? []).reduce(
        (t, c) => t + (typeof c.donMinus === 'number' ? c.donMinus : 0),
        0,
      );
      if (don <= defenderDon) perCard = Math.max(perCard, powerOf(a.effect));
    }
  }
  return {
    perCard,
    rests: prof.rests,
    draws: prof.draws,
    noPrior: cardIds.length === 0,
    gaps: prof.gaps,
  };
}
