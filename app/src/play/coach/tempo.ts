/**
 * The tempo meter's numbers (learning-ui §2.9). The DON!! ledger is the AI package's `donLedger`
 * (M7 WP2), shared with the blunder warning and M8's review so the three agree; this file is the
 * panel's view of it: the label, the badge and the expanded line (explanations E06, E07).
 *
 * Reads the player's own view and public card text only; never a hidden card.
 */
import type { Card } from '@optcg/cards';
import type { PlayerView } from '@optcg/engine';
import {
  donLedger,
  explainHeld,
  explainUnused,
  ledgerLabel,
  type DonLedger,
  type Explanation,
} from '@optcg/ai';

export type TempoLedger = DonLedger;

export const ledgerOf = (view: PlayerView, cards: ReadonlyMap<string, Card>): TempoLedger =>
  donLedger(view, cards);

/** "8 DON!! · 4 paid · 1 given · 3 held" (learning-ui §2.9). */
export const tempoLabel = (l: TempoLedger): string => ledgerLabel(l);

/** The strip's badge: DON!! put to use out of all of them ("5/7"). */
export const tempoBadge = (l: TempoLedger): string => `${l.paid + l.given}/${l.total}`;

/** The expanded view's explanation: E06 when DON!! sit unused, E07 when holding was right. */
export function tempoExplanation(
  view: PlayerView,
  l: TempoLedger,
  cards: ReadonlyMap<string, Card>,
  tense: 'left' | 'ending',
): Explanation | null {
  return explainUnused(view, l, cards, tense) ?? explainHeld(view, l, cards);
}
