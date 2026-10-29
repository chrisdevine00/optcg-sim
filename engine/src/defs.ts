/**
 * Card definitions copied into state, so `reduce(state, action)` needs no lookup (ARCHITECTURE §2.1:
 * card data is injected at game start and the state stays self-contained plain JSON).
 */
import type { Card } from '@optcg/cards';
import type { CardId, CardLookup } from './api.ts';
import type { Def } from './state.ts';

/**
 * "Under the rules of this game" clauses (effect-dsl.md §4.2 `rules`, CR 8-1-3-3-3). They apply at
 * setup, so they are needed before any effect script exists. M4 moves these into the card scripts.
 */
export const RULES_CLAUSES: Readonly<Record<CardId, { donDeckSize?: number }>> = {
  // OP15-058 Enel: "Under the rules of this game, your DON!! deck consists of 6 cards" (RL-40).
  'OP15-058': { donDeckSize: 6 },
};

export const STANDARD_DON = 10;
export const DECK_SIZE = 50;
export const MAX_COPIES = 4;
export const OPENING_HAND = 5;

export function donDeckSizeFor(leader: CardId): number {
  return RULES_CLAUSES[leader]?.donDeckSize ?? STANDARD_DON;
}

export function toDef(card: Card): Def {
  return {
    id: card.id,
    name: card.name,
    category: card.category,
    colors: card.colors.slice(),
    cost: card.cost,
    power: card.power,
    counter: card.counter,
    life: card.life,
    types: card.types.slice(),
    attributes: card.attributes.slice(),
    keywords: card.keywords.slice(),
    hasTrigger: card.triggerText !== null && card.triggerText !== '',
    abilities: [],
  };
}

export class DefTable {
  readonly defs: Record<CardId, Def> = {};
  constructor(private readonly lookup: CardLookup) {}

  get(id: CardId): Def {
    let d = this.defs[id];
    if (!d) {
      const card = this.lookup(id);
      if (!card) throw new Error(`Unknown card id ${id}`);
      d = toDef(card);
      this.defs[id] = d;
    }
    return d;
  }
}
