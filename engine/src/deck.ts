/**
 * Deck construction checks (CR 5-1-2; Standard format, rulings RL-37, ADR 0011). One source for the
 * deck builder, Setup and game start (flows F17 step 7): `createGame` uses the CR checks through
 * `validateDeck`, and the builder and Setup add the format checks.
 *
 * Each issue names its rule and the card numbers involved, so a UI can highlight them. A card the
 * data does not know is an error: the engine cannot play it.
 */
import type { Card, Legality } from '@optcg/cards';
import type { CardId, CardLookup, DeckSpec } from './api.ts';
import { DECK_SIZE, MAX_COPIES } from './defs.ts';

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

/** Every problem with a deck, CR checks first, then the format's. Empty when legal. */
export function deckIssues(
  deck: DeckSpec,
  lookup: CardLookup,
  format: DeckFormat = 'standard',
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
    if (n > MAX_COPIES)
      err(
        'copies',
        'CR 5-1-2-3',
        [id],
        `${n} copies of ${id}; the limit is ${MAX_COPIES} per card number.`,
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
