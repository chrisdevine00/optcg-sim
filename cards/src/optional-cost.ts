/**
 * Does each script's optional-cost flag match its card text? "You may ..." before the colon
 * means the cost is optional (CR 8-3-1-4); a cost with no "you may" is not. Problems are returned
 * as strings, empty when the script agrees with the text.
 *
 * What the flags mean in the engine, and so what is checked:
 * - `activate` on an **Event** ([Main], [Counter]): `costOptional` makes playing the card and
 *   paying the cost separate (engine `optionalCost`). It must equal the text's "you may".
 * - `activate` on anything else ([Activate: Main]): activation is the player's choice already, and
 *   `costOptional` would change legality (an unpayable cost could be "declined"), so the flag must
 *   be absent whatever the text says.
 * - `auto`: a cost makes it optional by construction (CR 8-3-1-4), so the text must say "you may"
 *   before the colon; and an auto with no cost must have no "you may ... :" clause.
 * - `replacement`: `optional` equals "you may" in the replacement sentence.
 * - DON!! −X alone is always optional (RL-52, its reminder text says "You may return"), so a cost
 *   made only of DON!! −X is not judged against the wording.
 */
import type { Ability, Cost } from './dsl.ts';

const HEADERS =
  "On Play|Main|Counter|Activate:\\s*Main|When Attacking|On Your Opponent's Attack|On Block|On K\\.O\\.|Once Per Turn|Your Turn|Opponent's Turn|End of Your Turn|End of Your Opponent's Turn|Trigger";
const SPLIT = new RegExp(`(?<!/\\s?)(?<!\\]\\s?)(?=\\[(?:${HEADERS})\\])`, 'g');
const TIMING_TAG: Record<string, RegExp> = {
  onPlay: /\[On Play\]/,
  whenAttacking: /\[When Attacking\]/,
  onOpponentAttack: /\[On Your Opponent's Attack\]/,
  onBlock: /\[On Block\]/,
  onKO: /\[On K\.O\.\]/,
  endOfYourTurn: /\[End of Your Turn\]/,
  endOfOpponentsTurn: /\[End of Your Opponent's Turn\]/,
  activateMain: /\[Activate:\s*Main\]/,
  main: /\[Main\]/,
  counter: /\[Counter\]/,
};
const ANY_TAG =
  /\[(?:On Play|Main|Counter|Activate:\s*Main|When Attacking|On Your Opponent's Attack|On Block|On K\.O\.|End of Your)/;

function unitsOf(text: string): string[] {
  return text
    .split(SPLIT)
    .map((u) => u.trim())
    .filter(Boolean);
}

function timings(ab: Ability): (string | object)[] {
  if (ab.kind === 'auto') return ab.when;
  if (ab.kind === 'activate') return Array.isArray(ab.when) ? ab.when : [ab.when];
  return [];
}

/** The tags a unit opens with ([Rush: Character] [When Attacking]/[On ...] [Once Per Turn]). */
const lead = (u: string): string => /^(?:\[[^\]]*\]\s*\/?\s*)+/.exec(u)?.[0] ?? '';

function unitFor(ab: Ability, units: string[]): string | undefined {
  if (ab.kind === 'replacement') return units.find((u) => /would be/.test(u));
  const ts = timings(ab);
  const first = ts[0];
  if (typeof first === 'string') {
    const re = TIMING_TAG[first];
    return re && units.find((u) => re.test(lead(u)));
  }
  // An event-worded auto ("When your Leader ... attacks"): a unit that starts with no header tag
  // other than [Once Per Turn].
  return units.find((u) => !ANY_TAG.test(lead(u)));
}

/** The text before the cost colon (or before "to activate this effect"), reminder text removed. */
function costClause(unit: string): string | undefined {
  const plain = unit.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
  const at = plain.indexOf(':');
  if (at >= 0) return plain.slice(0, at);
  const act = plain.search(/to activate this effect/i);
  return act >= 0 ? plain.slice(0, act) : undefined;
}

const hasYouMay = (s: string) => /\byou may\b/i.test(s);
const nonDon = (c: readonly Cost[] | undefined) => (c ?? []).some((k) => !('donMinus' in k));

export function optionalCostProblems(
  script: { cardId: string; abilities: readonly Ability[] },
  card: { category: string; effectText: string | null; triggerText: string | null },
): string[] {
  const out: string[] = [];
  const units = unitsOf(card.effectText ?? '');
  for (const ab of script.abilities) {
    const at = `${script.cardId}.${ab.id}`;
    if (ab.kind !== 'auto' && ab.kind !== 'activate' && ab.kind !== 'replacement') continue;
    const unit = unitFor(ab, units);
    if (unit === undefined) {
      out.push(`${at}: no text unit found for this ability`);
      continue;
    }
    if (ab.kind === 'replacement') {
      if (ab.optional !== hasYouMay(unit))
        out.push(
          `${at}: optional is ${ab.optional} but the text ${hasYouMay(unit) ? 'says' : 'does not say'} "you may"`,
        );
      continue;
    }
    const clause = costClause(unit);
    const judged = nonDon(ab.cost);
    if (!ab.cost?.length) {
      if (clause !== undefined && hasYouMay(clause))
        out.push(`${at}: the text has a "you may ... :" cost clause but the script has no cost`);
      continue;
    }
    if (clause === undefined) {
      if (judged) out.push(`${at}: the script has a cost but the text has no cost clause`);
      continue;
    }
    const you = hasYouMay(clause);
    if (ab.kind === 'auto') {
      if (judged && !you)
        out.push(`${at}: auto with a cost, but the text does not say "you may" before the colon`);
      continue;
    }
    // activate
    const event = card.category === 'Event';
    if (!event) {
      if (ab.costOptional)
        out.push(
          `${at}: costOptional on a non-Event [Activate: Main] would make its cost declinable`,
        );
    } else if (judged && !!ab.costOptional !== you) {
      out.push(
        `${at}: costOptional is ${!!ab.costOptional} but the text ${you ? 'says' : 'does not say'} "you may" before the colon`,
      );
    }
  }
  return out;
}
