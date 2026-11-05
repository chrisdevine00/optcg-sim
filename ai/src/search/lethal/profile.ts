/**
 * The defender's worst-case [Counter] (A1, DECISIONS 2026-11-05, corrected). Every [Counter] Event
 * in the archetype prior is read from its script. One placeholder Event is built whose single
 * [Counter] ability is a **"choose one" the defender makes**, with a mode for each distinct effect
 * in the prior, minus its cost and any filter on what it may boost (both only err toward the
 * defender). So each hidden card can be whichever card of the prior is best for the defender at that
 * moment: plain +power (the biggest of any card), +power then rest up to 1 of the attacker's
 * Characters, +power then draw (its own condition kept, so the engine still checks it), and so on.
 *
 * Draws pull from the deck, so a drawing mode is only offered by cards that can really be drawn: the
 * hidden hand and Life, and the top `drawCopies` cards of the deck (a deck holds at most that many
 * copies of the cards that draw); the rest of the deck is the no-draw placeholder. That keeps a chain
 * of draws finite, as a real deck's is.
 *
 * An effect this model does not know is reported in `gaps`: the proof can no longer claim `any-hand`.
 * lethal.test.ts checks that every [Counter] ability in the slice priors is modelled.
 */
import { SCRIPTS } from '@optcg/cards';

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
  return (script.abilities as unknown as Loose[]).filter(
    (a) => a.when === 'counter' || (Array.isArray(a.when) && a.when.includes('counter')),
  );
}

/** `plain`: the biggest +power of any [Counter] card of the prior, Event or Character. */
export function counterProfile(cardIds: readonly string[], plain = 0): CounterProfile {
  const gaps: string[] = [];
  const modes = new Map<string, unknown[]>();
  const drawIds = new Set<string>();
  let rests = false;
  for (const id of cardIds)
    for (const a of counterAbilities(id)) {
      const ops = opsOf(a.effect);
      const bad = ops.filter((op) => !KNOWN.has(op));
      for (const op of bad) gaps.push(`${id}: ${op}`);
      if (bad.length > 0) continue;
      if (ops.includes('rest')) rests = true;
      if (ops.includes('draw')) drawIds.add(id);
      const steps = normalise(a.effect) as unknown[];
      modes.set(JSON.stringify(steps), steps);
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
  const all = [
    plainMode,
    ...Array.from(modes.values()).filter((m) => JSON.stringify(m) !== JSON.stringify(plainMode)),
  ];
  return {
    modes: all,
    modesNoDraw: all.filter((m) => !opsOf(m).includes('draw')),
    rests,
    draws: drawIds.size > 0,
    drawIds: [...drawIds],
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
