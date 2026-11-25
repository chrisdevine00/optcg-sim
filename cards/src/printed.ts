/**
 * What a card's printed text says it has (M6b wave 6, G49): "a Character with no base effect",
 * "without a [When Attacking] effect". It reads the verified card text, never the card's script, so
 * a card that is not scripted yet reads the same as one that is (an unscripted card has no
 * abilities, which would wrongly read as "no effect").
 *
 * Rules (rules-digest 32, CR 2-8-4, 2-8-5): text in parentheses is explanation and has no game
 * effect; "no base effect" is a card with no text. The audit's reading (M6b-Q29, settled) is that a
 * card whose only text is keywords ([Blocker], [Rush], ...) has no base effect; a [Trigger] is
 * printed text and an effect (M6b-Q70).
 */

/** The printed timings a filter can ask for (`{ hasTiming }`), in the DSL's own names. */
export const PRINTED_TIMINGS = [
  'onPlay',
  'whenAttacking',
  'onOpponentAttack',
  'onBlock',
  'onKO',
  'activateMain',
  'endOfYourTurn',
  'endOfOpponentsTurn',
] as const;
export type PrintedTiming = (typeof PRINTED_TIMINGS)[number];

/** A printed bracket, lower-cased with its spaces and the colon's spacing removed, to its timing. */
const MARKERS: Readonly<Record<string, PrintedTiming>> = {
  '[onplay]': 'onPlay',
  '[whenattacking]': 'whenAttacking',
  "[onyouropponent'sattack]": 'onOpponentAttack',
  '[onblock]': 'onBlock',
  '[onk.o.]': 'onKO',
  '[activate:main]': 'activateMain',
  '[endofyourturn]': 'endOfYourTurn',
  "[endofyouropponent'sturn]": 'endOfOpponentsTurn',
};

/**
 * A bracket that is not followed by the word "effect" or "ability": "[On Play] effects are negated"
 * and "Characters without an [On Play] effect" name a timing, they do not print it (OP09-081,
 * PRB01-001).
 */
const BRACKET = /\[[^\]]*\](?!\s*(?:effects?|abilit(?:y|ies))\b)/g;
const KEYWORD_TOKEN = /\[(?:Blocker|Rush(?::\s*Character)?|Double Attack|Banish|Unblockable)\]/gi;

/** The timings printed in an effect text ([On Play], [When Attacking], ...), once each. */
export function printedTimings(effectText: string | null): PrintedTiming[] {
  const out = new Set<PrintedTiming>();
  for (const raw of (effectText ?? '').match(BRACKET) ?? []) {
    const key = raw.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, '');
    const t = MARKERS[key];
    if (t) out.add(t);
  }
  return [...out];
}

/**
 * Does the card have a base effect? Its effect text counts once the reminder text in parentheses
 * and the keyword tokens are taken away, and a [Trigger] text always counts.
 */
export function hasBaseEffectText(effectText: string | null, triggerText: string | null): boolean {
  if (triggerText !== null && triggerText.trim() !== '') return true;
  const rest = (effectText ?? '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(KEYWORD_TOKEN, ' ')
    .replace(/\s+/g, '');
  return rest !== '' && rest !== '-' && rest.toUpperCase() !== 'NULL';
}
