/**
 * The hidden-gate check (ADR 0005): a decision must not be gated on a hidden zone.
 *
 * The engine pauses the game when it asks a player something, and the pause is visible to the
 * other player (they see the prompt's presence, and through `autoSkip` whether it was asked at
 * all). So when a Condition that reads a hidden zone (hidden.ts: hand, deck top, Life top,
 * looked-at cards) decides whether a prompt is asked, the opponent learns what the hand, deck or
 * Life holds from the pause alone (OP15-002 Lucy: "trash any number of Event or Stage cards from
 * your hand" was asked only if an Event or Stage was held).
 *
 * What is NOT a leak, and so is not reported:
 * - A hidden condition on an ability or `if` whose branches contain no prompt. Either branch
 *   resolves with no pause, and what it changes is public on the board (that is what the card
 *   text itself does: "if you have a Character in hand, draw 1").
 * - `activate`, `permanent` abilities: whether one is offered is told to its owner alone (legal
 *   actions are per player); the opponent sees only a use. An Event's [Main]/[Counter] is an
 *   `activate` too: the play is the owner's choice.
 * - An `if` whose `then` and `else` ask the same prompts (same steps, same options): the pause
 *   is the same either way.
 *
 * What IS reported (a "gate"):
 * 1. `auto` with a hidden ability-level condition whose cost or effect contains a prompt, or
 *    which is `optional` or has a cost (the "use this?" offer is itself a prompt).
 * 2. `trigger` with a hidden ability-level condition (the owner is asked whether to activate a
 *    revealed [Trigger], so a missing offer tells the opponent the condition failed).
 * 3. `replacement` that is `optional` with a hidden condition (the "apply it?" prompt).
 * 4. An `if` step whose condition is hidden and whose `then` and `else` differ in the prompts
 *    they contain.
 * 5. A `forEach` whose count is hidden and whose body contains a prompt (how many prompts).
 *
 * A prompt is: a selector with a `pick` the chooser decides (not `blind`), `may`, `chooseOne`,
 * `lookAtTop`, `draw upTo`, `addDon upTo`, or a player's DON!! return/give choice. The fix is to
 * gate on public facts only (a hand size, a field state) and let the pick be asked at max 0
 * (docs/DECISIONS.md "Empty picks"), as OP15-002 does.
 *
 * Not reported (known limits): a hidden zone read only inside a Selector filter's `Num`; and a
 * hidden condition whose prompt is always followed by a public outcome that reveals the same fact
 * (allowlist such a case, with that reason).
 *
 * Allowlist (`HIDDEN_GATE_ALLOWED`): a gate that is fine, by `cardId/abilityId`, one line of
 * reason. Each entry must still match a reported gate (a stale entry fails the test), so the
 * list can only shrink as scripts are fixed.
 */
import type {
  Ability,
  Action,
  CardScript,
  Condition,
  Cost,
  Effect,
  Num,
  Selector,
  Step,
} from './dsl.ts';
import { abilityReadsHiddenZone } from './hidden.ts';

export interface HiddenGate {
  cardId: string;
  abilityId: string;
  /** Which of the rules above, and where. */
  why: string;
}

/** `cardId/abilityId` to the reason this gate cannot leak. */
export const HIDDEN_GATE_ALLOWED: Readonly<Record<string, string>> = {};

// Reuse the typed walk in hidden.ts through a probe: a condition reads a hidden zone exactly when
// an otherwise empty ability carrying it as its only `conditions` entry does.
function condHidden(c: Condition): boolean {
  return abilityReadsHiddenZone({
    id: 'probe',
    kind: 'auto',
    when: ['onPlay'],
    conditions: [c],
    effect: [],
  } as Ability);
}

const numHidden = (n: Num): boolean => condHidden({ cmp: [n, '>=', 0] } as Condition);

function selPrompts(s: Selector | string | undefined, out: string[]): void {
  if (typeof s !== 'object' || s === null) return;
  if (s.pick && !s.blind) out.push(`pick:${JSON.stringify([s.from, s.owner, s.chooser, s.pick])}`);
}

function costPrompts(k: Cost, out: string[]): void {
  if ('trash' in k) selPrompts(k.trash, out);
  else if ('rest' in k) selPrompts(k.rest, out);
  else if ('ko' in k) selPrompts(k.ko, out);
  else if ('move' in k) selPrompts(k.move, out);
  else if ('giveDon' in k) selPrompts(k.giveDon.to, out);
  else if ('oneOf' in k) for (const a of k.oneOf) for (const c of a) costPrompts(c, out);
}

function actionPrompts(a: Action, out: string[]): void {
  if ('draw' in a) {
    if (a.upTo) out.push('draw upTo');
  } else if ('trashFromHand' in a) selPrompts(a.trashFromHand, out);
  else if ('lookAtTop' in a) out.push(`look:${JSON.stringify(a.lookAtTop)}`);
  else if ('chooseNumber' in a) out.push(`number:${JSON.stringify(a.chooseNumber)}`);
  else if ('move' in a) selPrompts(a.move.what, out);
  else if ('play' in a) selPrompts(a.play.what, out);
  else if ('ko' in a) selPrompts(a.ko, out);
  else if ('rest' in a) selPrompts(a.rest, out);
  else if ('setActive' in a) selPrompts(a.setActive, out);
  else if ('skipRefresh' in a) {
    // DON!! held back are a count, not a choice (G48).
    if (
      a.skipRefresh.from !== 'donCostArea' &&
      !(Array.isArray(a.skipRefresh.from) && a.skipRefresh.from.includes('donCostArea'))
    )
      selPrompts(a.skipRefresh, out);
  } else if ('power' in a) selPrompts(a.power.target, out);
  else if ('setBasePower' in a) selPrompts(a.setBasePower.target, out);
  else if ('cost' in a) selPrompts(a.cost.target, out);
  else if ('giveDon' in a) {
    selPrompts(a.giveDon.to, out);
    if (a.giveDon.from === 'opponent') out.push('giveDon opponent');
  } else if ('addDon' in a) {
    if (a.addDon.some((d) => d.upTo)) out.push('addDon upTo');
  } else if ('returnDon' in a) {
    if (a.returnDon.player === 'opponent') out.push('returnDon opponent');
  } else if ('grant' in a) selPrompts(a.grant.target, out);
  else if ('negate' in a) selPrompts(a.negate.target, out);
  else if ('restrict' in a) selPrompts(a.restrict.target, out);
  else if ('select' in a) selPrompts(a.select, out);
  else if ('swapBasePower' in a) {
    selPrompts(a.swapBasePower.a, out);
    selPrompts(a.swapBasePower.b, out);
  } else if ('canAttackActive' in a) selPrompts(a.canAttackActive.target, out);
  // The damaged player is asked about every Life card taken (a [Trigger] decision, ADR 0005).
  else if ('damage' in a) out.push('damage');
}

/** Every prompt an effect can ask, as comparable tokens in order. */
export function promptsOf(e: Effect, out: string[] = []): string[] {
  for (const s of e) {
    if ('if' in s) {
      promptsOf(s.then, out);
      promptsOf(s.else ?? [], out);
    } else if ('may' in s) {
      out.push(`may:${s.label}`);
      promptsOf(s.may, out);
    } else if ('ifDid' in s) promptsOf(s.then, out);
    else if ('chooseOne' in s) {
      out.push(`choose:${s.labels.join('|')}`);
      for (const b of s.chooseOne) promptsOf(b, out);
    } else if ('forEach' in s) promptsOf(s.do, out);
    else if ('delayed' in s) promptsOf(s.do, out);
    else actionPrompts(s.do, out);
  }
  return out;
}

function walk(e: Effect, at: string, found: string[]): void {
  e.forEach((s: Step, i) => {
    const here = `${at}[${i}]`;
    if ('if' in s) {
      if (condHidden(s.if)) {
        const a = JSON.stringify(promptsOf(s.then));
        const b = JSON.stringify(promptsOf(s.else ?? []));
        if (a !== b) found.push(`${here} if: a hidden condition decides which prompts are asked`);
      }
      walk(s.then, `${here}.then`, found);
      walk(s.else ?? [], `${here}.else`, found);
    } else if ('may' in s) walk(s.may, `${here}.may`, found);
    else if ('ifDid' in s) walk(s.then, `${here}.then`, found);
    else if ('chooseOne' in s) s.chooseOne.forEach((b, j) => walk(b, `${here}.${j}`, found));
    else if ('forEach' in s) {
      if (numHidden(s.forEach) && promptsOf(s.do).length > 0)
        found.push(`${here} forEach: a hidden count decides how many prompts are asked`);
      walk(s.do, `${here}.do`, found);
    } else if ('delayed' in s) walk(s.do, `${here}.do`, found);
  });
}

/** The gates in one ability, each a short description of where. */
export function hiddenGates(ab: Ability): string[] {
  const found: string[] = [];
  if ((ab.conditions ?? []).some(condHidden)) {
    if (ab.kind === 'auto') {
      const costs: string[] = [];
      for (const k of ab.cost ?? []) costPrompts(k, costs);
      if (ab.optional || ab.cost?.length || costs.length || promptsOf(ab.effect).length)
        found.push('conditions: a hidden condition decides whether an auto asks anything');
    } else if (ab.kind === 'trigger') {
      found.push('conditions: a hidden condition decides whether [Trigger] is offered');
    } else if (ab.kind === 'replacement' && ab.optional) {
      found.push('conditions: a hidden condition decides whether a replacement is offered');
    }
  }
  if (ab.kind === 'auto' || ab.kind === 'activate' || ab.kind === 'trigger')
    walk(ab.effect, 'effect', found);
  return found;
}

export function hiddenGateProblems(script: CardScript): HiddenGate[] {
  const out: HiddenGate[] = [];
  for (const ab of script.abilities)
    for (const why of hiddenGates(ab)) out.push({ cardId: script.cardId, abilityId: ab.id, why });
  return out;
}
