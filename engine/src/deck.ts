/**
 * Deck construction checks (CR 5-1-2; Standard format, rulings RL-37, ADR 0011). One source for the
 * deck builder, Setup and game start (flows F17 step 7): `createGame` uses the CR checks through
 * `validateDeck`, and the builder and Setup add the format checks.
 *
 * Each issue names its rule and the card numbers involved, so a UI can highlight them. A card the
 * data does not know is an error: the engine cannot play it.
 */
import {
  SCRIPTS,
  type Card,
  type Cmp,
  type Filter,
  type Legality,
  type RulesClause,
} from '@optcg/cards';
import type { CardId, CardLookup, DeckSpec } from './api.ts';
import { DECK_RULES, DECK_SIZE, MAX_COPIES } from './defs.ts';

/** `standard`: CR plus Standard legality. `extra`: CR plus bans and pairs. `free`: CR only. */
export type DeckFormat = 'standard' | 'extra' | 'free';

export type DeckIssueCode =
  | 'unknownLeader'
  | 'notLeader'
  | 'size'
  | 'unknownCard'
  | 'leaderInDeck'
  | 'color'
  | 'copies'
  | 'deckRestriction'
  | 'banned'
  | 'restricted'
  | 'bannedPair'
  | 'rotated'
  | 'legalityUnknown';

export interface DeckIssue {
  code: DeckIssueCode;
  /** `error` blocks play; `warning` is shown but allows it (a card whose legality no source gives yet). */
  severity: 'error' | 'warning';
  /** Rule reference, e.g. "CR 5-1-2-3" or "Standard (banned 2026-10-12)". */
  rule: string;
  /** Card numbers involved. */
  cards: CardId[];
  message: string;
}

const label = (c: Card | undefined, id: CardId) => (c ? `${id} ${c.name}` : id);

/**
 * The deck-construction clauses of a card's rules text (G12): "you may have any number of this card
 * in your deck" and "you cannot include cards with ... in your deck". Read from the card's script
 * when it is loaded, else from `DECK_RULES` (a deck is checked in the builder before any script is
 * loaded; a test keeps the two equal).
 */
export function deckRulesOf(id: CardId): readonly RulesClause[] {
  const script = SCRIPTS[id];
  return script ? (script.rules ?? []) : (DECK_RULES[id] ?? []);
}

const cmpHolds = (v: number | null, k: Cmp): boolean => {
  if (v === null) return false;
  if ('lte' in k) return typeof k.lte === 'number' && v <= k.lte;
  if ('gte' in k) return typeof k.gte === 'number' && v >= k.gte;
  return typeof k.eq === 'number' && v === k.eq;
};

/**
 * Does a card of the deck match a `deckRestriction` filter? Printed values only; the validator
 * (`deckFilter`) accepts exactly the keys read here, with numeric comparisons.
 */
export function cardMatchesDeckFilter(c: Card, f: Filter): boolean {
  if ('category' in f) return f.category.includes(c.category);
  if ('cost' in f) return cmpHolds(c.cost, f.cost);
  if ('baseCost' in f) return cmpHolds(c.cost, f.baseCost);
  if ('power' in f) return cmpHolds(c.power, f.power);
  if ('basePower' in f) return cmpHolds(c.power, f.basePower);
  if ('hasCounter' in f) return (c.counter ?? 0) > 0 === f.hasCounter;
  if ('type' in f) return c.types.includes(f.type);
  if ('typeIncludes' in f) return c.types.some((t) => t.includes(f.typeIncludes));
  if ('name' in f) return c.name === f.name;
  if ('nameIncludes' in f) return c.name.includes(f.nameIncludes);
  if ('color' in f) return c.colors.includes(f.color);
  if ('attribute' in f) return c.attributes.includes(f.attribute);
  if ('multicolor' in f) return c.colors.length > 1;
  if ('hasTrigger' in f) return (c.triggerText !== null && c.triggerText !== '') === f.hasTrigger;
  if ('all' in f) return f.all.every((g) => cardMatchesDeckFilter(c, g));
  if ('any' in f) return f.any.some((g) => cardMatchesDeckFilter(c, g));
  if ('not' in f) return !cardMatchesDeckFilter(c, f.not);
  return false;
}

/** Every problem with a deck, CR checks first, then the format's. Empty when legal. */
export function deckIssues(
  deck: DeckSpec,
  lookup: CardLookup,
  format: DeckFormat = 'standard',
  /** The rules clauses of a card (tests pass their own; the default reads the scripts). */
  rulesOf: (id: CardId) => readonly RulesClause[] = deckRulesOf,
): DeckIssue[] {
  const out: DeckIssue[] = [];
  const err = (code: DeckIssueCode, rule: string, cards: CardId[], message: string) =>
    out.push({ code, severity: 'error', rule, cards, message });

  const leader = lookup(deck.leader);
  if (!leader) {
    err('unknownLeader', 'CR 5-1-2', [deck.leader], `Unknown Leader card ${deck.leader}.`);
    return out;
  }
  if (leader.category !== 'Leader')
    err('notLeader', 'CR 5-1-2', [deck.leader], `${label(leader, deck.leader)} is not a Leader.`);
  if (deck.main.length !== DECK_SIZE) {
    const n = deck.main.length;
    const fix = n > DECK_SIZE ? `remove ${n - DECK_SIZE}` : `add ${DECK_SIZE - n}`;
    err('size', 'CR 5-1-2', [], `${n} cards: the deck needs exactly ${DECK_SIZE} (${fix}).`);
  }

  const counts = new Map<CardId, number>();
  for (const id of deck.main) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const [id, n] of counts) {
    const c = lookup(id);
    if (!c) {
      err('unknownCard', 'CR 5-1-2', [id], `Unknown card ${id}.`);
      continue;
    }
    if (c.category === 'Leader')
      err(
        'leaderInDeck',
        'CR 5-1-2-1',
        [id],
        `${label(c, id)} is a Leader; the deck holds only Characters, Events and Stages.`,
      );
    const off = c.colors.filter((x) => !leader.colors.includes(x));
    if (off.length)
      err(
        'color',
        'CR 5-1-2-2',
        [id],
        `${label(c, id)} is ${off.join(' and ')}, a colour the Leader does not have.`,
      );
    const anyNumber = rulesOf(id).some((r) => 'anyNumberInDeck' in r);
    if (n > MAX_COPIES && !anyNumber)
      err(
        'copies',
        'CR 5-1-2-3',
        [id],
        `${n} copies of ${id}; the limit is ${MAX_COPIES} per card number.`,
      );
  }
  // "Under the rules of this game, you cannot include cards ... in your deck" (G12): the Leader's.
  for (const r of rulesOf(deck.leader)) {
    if (!('deckRestriction' in r)) continue;
    const banned = [...counts.keys()].filter((id) => {
      const c = lookup(id);
      return !!c && cardMatchesDeckFilter(c, r.deckRestriction);
    });
    if (banned.length)
      err(
        'deckRestriction',
        `${deck.leader} (Leader rule)`,
        banned,
        `${label(leader, deck.leader)} forbids ${banned.map((id) => label(lookup(id), id)).join(', ')} in the deck.`,
      );
  }
  if (format === 'free') return out;

  // Format checks: the Leader and every card number in the deck.
  const ids = [deck.leader, ...counts.keys()];
  const legalityOf = (id: CardId): Legality | null => {
    const c = lookup(id);
    return c ? c.legality[format] : null;
  };
  const name = format === 'standard' ? 'Standard' : 'Extra Regulation';
  const seenPairs = new Set<string>();
  for (const id of ids) {
    const l = legalityOf(id);
    if (!l) continue;
    const c = lookup(id);
    if (l.status === 'banned')
      err(
        'banned',
        `${name} (banned ${l.reason ?? ''})`.trim(),
        [id],
        `${label(c, id)} is banned (${l.reason ?? 'undated notice'}).`,
      );
    else if (l.status === 'restricted' && (counts.get(id) ?? 1) > (l.limit ?? 1))
      err(
        'restricted',
        `${name} (restricted)`,
        [id],
        `${counts.get(id)} copies of ${label(c, id)}: it is restricted to ${l.limit ?? 1}.`,
      );
    else if (l.status === 'rotated')
      err(
        'rotated',
        `${name} (${l.reason ?? 'rotated'})`,
        [id],
        `${label(c, id)} is not in ${name} (${l.reason ?? 'rotated'}).`,
      );
    else if (l.status === 'unknown')
      out.push({
        code: 'legalityUnknown',
        severity: 'warning',
        rule: name,
        cards: [id],
        message: `${label(c, id)}: no cited source gives its ${name} legality yet (${l.reason ?? 'unknown'}).`,
      });
    for (const other of l.bannedWith ?? []) {
      if (other !== deck.leader && !counts.has(other)) continue;
      const key = [id, other].sort().join('+');
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      err(
        'bannedPair',
        `${name} (banned pair)`,
        [id, other],
        `${label(c, id)} and ${label(lookup(other), other)} may not be in the same deck.`,
      );
    }
  }
  return out;
}

/** Errors only (what blocks play). */
export const deckErrors = (deck: DeckSpec, lookup: CardLookup, format: DeckFormat = 'standard') =>
  deckIssues(deck, lookup, format).filter((i) => i.severity === 'error');
