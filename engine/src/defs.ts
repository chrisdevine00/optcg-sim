/**
 * Card definitions copied into state, so `reduce(state, action)` needs no lookup (ARCHITECTURE §2.1:
 * card data is injected at game start and the state stays self-contained plain JSON).
 */
import {
  hasBaseEffectText,
  printedTimings,
  SCRIPTS,
  scriptReady,
  type Card,
  type RulesClause,
} from '@optcg/cards';
import type { Ability } from './abilities.ts';
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

/**
 * Deck-construction clauses (G12), for decks checked before any script is loaded (the builder).
 * `deckRulesOf` (deck.ts) reads a loaded script first; a test keeps this table and the scripts equal.
 */
export const DECK_RULES: Readonly<Record<CardId, RulesClause[]>> = {
  // OP12-001 Silvers Rayleigh: "you cannot include cards with a cost of 5 or more in your deck".
  'OP12-001': [{ deckRestriction: { cost: { gte: 5 } } }],
  // OP16-042 Prisoner of Impel Down: "you may have any number of this card in your deck".
  'OP16-042': [{ anyNumberInDeck: true }],
};

export const STANDARD_DON = 10;
export const DECK_SIZE = 50;
export const MAX_COPIES = 4;
export const OPENING_HAND = 5;

/**
 * Scripts load per set (M6b-0): a scripted card whose script is not loaded would silently play as
 * vanilla, so building it is an error. Callers `await loadScripts(ids)` before starting a game.
 */
function requireScript(id: CardId): void {
  if (!scriptReady(id))
    throw new Error(
      `The effect script of ${id} is not loaded: await loadScripts() before the game.`,
    );
}

export function donDeckSizeFor(leader: CardId): number {
  requireScript(leader);
  // A script's `rules: [{ donDeckSize }]` and the table above say the same thing; either is read.
  const fromScript = SCRIPTS[leader]?.rules?.find((r) => 'donDeckSize' in r);
  if (fromScript && 'donDeckSize' in fromScript) return fromScript.donDeckSize;
  return RULES_CLAUSES[leader]?.donDeckSize ?? STANDARD_DON;
}

export function toDef(card: Card): Def {
  requireScript(card.id);
  const alsoNamed = SCRIPTS[card.id]?.rules?.flatMap((r) => ('alsoNamed' in r ? r.alsoNamed : []));
  const def: Def = {
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
    // The printed text, for the filters on "no base effect" and "without a [When Attacking] effect".
    baseEffect: hasBaseEffectText(card.effectText, card.triggerText),
    printed: printedTimings(card.effectText),
    // Effect scripts (cards/effects, E-D1); an unscripted card plays for its stats (E-D7, E-D8).
    abilities: (SCRIPTS[card.id]?.abilities ?? []) as Ability[],
  };
  // "Under the rules of this game, also treat this card's name as ..." (EB04-038).
  if (alsoNamed?.length) def.alsoNamed = alsoNamed;
  return def;
}

export class DefTable {
  readonly defs: Record<CardId, Def> = {};
  constructor(readonly lookup: CardLookup) {}

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
