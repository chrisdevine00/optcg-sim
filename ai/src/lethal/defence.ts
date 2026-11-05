/**
 * The defender's visible on-attack effects, read from public card scripts (a card's text is public).
 * The guided count's third question ("How much can they stop?") lists them: Newgate's +3000 for a
 * card, Kaido's −2000 to a Character. The *numbers* the line is checked against come from the
 * engine (`analyse.ts`); this only names the effects so the copy can say where they come from.
 *
 * Conditions on the effect are not read: a listed effect may not apply right now, and the search
 * (which runs the real engine) is what decides that.
 */
import { SCRIPTS } from '@optcg/cards';

export interface DefenceEffect {
  card: string;
  /** `boost`: +power for the defender's Leader; `shrink`: −power for one of the attacker's Characters. */
  kind: 'boost' | 'shrink';
  amount: number;
  /** The cost is a card from their hand (so it competes with Counters for the same cards). */
  costsCard: boolean;
  oncePerTurn: boolean;
}

interface Loose {
  [k: string]: unknown;
}

const isAttacked = (w: unknown): boolean =>
  w === 'onOpponentAttack' ||
  (typeof w === 'object' &&
    w !== null &&
    (w as Loose).event === 'attack' &&
    'target' in (w as Loose));

/** Defensive power effects of `cardId`: [On Your Opponent's Attack] and "when … is attacked". */
export function defenceEffectsOf(cardId: string): DefenceEffect[] {
  const script = SCRIPTS[cardId];
  if (!script) return [];
  const out: DefenceEffect[] = [];
  for (const raw of script.abilities) {
    const a = raw as unknown as Loose;
    if (a.kind !== 'auto' || !Array.isArray(a.when) || !a.when.some(isAttacked)) continue;
    const first = (Array.isArray(a.effect) ? a.effect[0] : null) as Loose | null;
    const power = (first?.do as Loose | undefined)?.power as Loose | undefined;
    if (!power || typeof power.amount !== 'number') continue;
    const owner = (power.target as Loose | undefined)?.owner;
    const kind =
      power.amount > 0 && owner === 'you'
        ? 'boost'
        : power.amount < 0 && owner === 'opponent'
          ? 'shrink'
          : null;
    if (!kind) continue;
    const costs = (Array.isArray(a.cost) ? a.cost : []) as Loose[];
    out.push({
      card: cardId,
      kind,
      amount: Math.abs(power.amount),
      costsCard: costs.some((c) => 'trash' in c),
      oncePerTurn: a.oncePerTurn === true,
    });
  }
  return out;
}
