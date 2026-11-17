import type { Card } from './schema.ts';

/**
 * How much of a card the game can play (ARCHITECTURE §2.4, effect-dsl E-D7/E-D8):
 * - `vanilla`: no effect or trigger text; the card plays fully from its stats;
 * - `keywords`: the text is only printed keyword lines, verified in the card's override;
 * - `scripted`: an effect script exists;
 * - `not-automated`: the card plays for its stats and verified keywords; its effect does not happen.
 */
export type Automation = 'vanilla' | 'keywords' | 'scripted' | 'not-automated';

/** Effect scripts by card number. None exist yet (M4); the index is passed in so the UI stays honest. */
export function automation(card: Card, scripted: ReadonlySet<string> = new Set()): Automation {
  if (scripted.has(card.id)) return 'scripted';
  if (!card.effectText && !card.triggerText) return 'vanilla';
  if (card.verified && !card.triggerText && card.keywords.length > 0) {
    // Keyword lines and their reminder text only.
    const rest = card.effectText
      .replace(/\[(Rush: Character|Rush|Double Attack|Banish|Blocker|Unblockable)\]/g, '')
      .replace(/\([^)]*\)/g, '')
      .trim();
    if (rest === '') return 'keywords';
  }
  return 'not-automated';
}

/** Whether a card plays fully in a game: its effect is scripted, or it has no effect to script. */
export const playsFully = (a: Automation): boolean => a !== 'not-automated';

export interface CoverageCount {
  total: number;
  /** Cards with an effect script. */
  scripted: number;
  /** Cards with no effect text, or only printed keywords: nothing to script. */
  noScriptNeeded: number;
  /** Cards whose effect does not happen in play. */
  notAutomated: number;
  /** `scripted + noScriptNeeded`. */
  fully: number;
}

/** Counts cards by how fully they play (the browser readout and the Setup copy share this). */
export function coverage(cards: Iterable<Card>, scripted: ReadonlySet<string>): CoverageCount {
  const n = { total: 0, scripted: 0, noScriptNeeded: 0, notAutomated: 0, fully: 0 };
  for (const c of cards) {
    const a = automation(c, scripted);
    n.total++;
    if (a === 'scripted') n.scripted++;
    else if (a === 'not-automated') n.notAutomated++;
    else n.noScriptNeeded++;
  }
  n.fully = n.scripted + n.noScriptNeeded;
  return n;
}
