/**
 * The coach's additions to the battle panel (learning-ui §2.7): on your attack, "What they could
 * have"; on defence, "What you have"; and the rule footnotes, shown the first three times each is
 * relevant. Everything on your attack comes from public information: their active Blockers, their
 * visible on-attack effects, the number of cards in their hand and the archetype prior's biggest
 * Counter, the same public bound `public` lethal search uses (ARCHITECTURE §4.4).
 */
import { useEffect, useState } from 'react';
import { SCRIPTS, type Card } from '@optcg/cards';
import { biggestCounter, priorCardIds, priorFor } from '@optcg/ai';
import type { PlayerId, ProjectedView } from '@optcg/engine';
import { num } from '../game/text.ts';
import { noteCount, bumpNote } from './profile.ts';

/**
 * The assumed biggest Counter when their Leader has no sourced list (the search's fallback).
 * TODO(L fix round): switch to the `FALLBACK_COUNTER` and the public-defence-bound function the
 * `ai/` fix exports, so this panel and `public` lethal share one number and one model (L-08).
 */
export const FALLBACK_COUNTER = 4000;

/**
 * Do their deck's [Counter] Events do more than add power? Read from the public scripts of the
 * archetype prior's cards: an effect that rests a Character, or draws, appears in the panel as one
 * line, because the power bound alone would suggest nothing else can change a battle (review L-08).
 */
export function counterExtras(leader: string): { rests: boolean; draws: boolean } {
  let rests = false;
  let draws = false;
  for (const id of priorCardIds(leader))
    for (const ab of SCRIPTS[id]?.abilities ?? []) {
      const a = ab as unknown as { kind?: string; when?: unknown };
      const w = Array.isArray(a.when) ? a.when : [a.when];
      if (a.kind !== 'activate' || !w.includes('counter')) continue;
      const json = JSON.stringify(ab);
      rests ||= /"rest":/.test(json);
      draws ||= /"draw":/.test(json);
    }
  return { rests, draws };
}

export interface TheyCouldHave {
  blockers: string[];
  /** Visible on-attack effects, by card name and the script's own label. */
  effects: { card: string; label: string }[];
  hand: number;
  perCard: number;
  /** `hand × perCard`: the most the hand could add if every card were the deck's biggest Counter. */
  total: number;
  /** Their deck's biggest Counter comes from the assumed fallback, not a sourced list. */
  assumed: boolean;
  /** Their Counters can also rest a Character or draw (not only add power). */
  extras: { rests: boolean; draws: boolean };
}

const isAttackTrigger = (w: unknown): boolean =>
  w === 'onOpponentAttack' ||
  (typeof w === 'object' &&
    w !== null &&
    (w as { event?: string }).event === 'attack' &&
    'target' in (w as object));

/** Public facts about what `defender` could add against an attack, from `view` and card data. */
export function theyCouldHave(
  view: ProjectedView,
  defender: PlayerId,
  cards: ReadonlyMap<string, Card>,
): TheyCouldHave {
  const z = view.zones[defender];
  const name = (id: string | null) => (id ? (cards.get(id)?.name ?? id) : 'a card');
  const blockers = z.characters
    .filter((c) => !c.rested && c.keywords.includes('Blocker'))
    .map((c) => name(c.card));
  const effects: TheyCouldHave['effects'] = [];
  for (const c of [...z.leader, ...z.characters, ...z.stage]) {
    if (!c.card) continue;
    for (const ab of SCRIPTS[c.card]?.abilities ?? []) {
      const a = ab as unknown as { kind?: string; when?: unknown; label?: string };
      if (a.kind === 'auto' && Array.isArray(a.when) && a.when.some(isAttackTrigger) && a.label)
        effects.push({ card: name(c.card), label: a.label });
    }
  }
  const leader = z.leader[0]?.card ?? '';
  const prior = leader ? priorFor(leader) : null;
  const perCard = prior ? biggestCounter(leader, cards) : FALLBACK_COUNTER;
  const hand = z.hand.length;
  return {
    blockers,
    effects,
    hand,
    perCard,
    total: hand * perCard,
    assumed: !prior,
    extras: prior ? counterExtras(leader) : { rests: false, draws: false },
  };
}

export function WhatTheyCouldHave({
  they,
  compact = false,
}: {
  they: TheyCouldHave;
  /** A short panel (tablet, a 600 px window) keeps one line: the hand's bound. */
  compact?: boolean;
}) {
  const { blockers, effects, hand, perCard, total, assumed, extras } = they;
  const more =
    extras.rests || extras.draws
      ? `Their Counters can also ${[extras.rests && 'rest one of your Characters', extras.draws && 'draw a card'].filter(Boolean).join(' or ')}.`
      : null;
  if (compact)
    return (
      <p className="bx-note" data-testid="what-they-could-have">
        <b>They could have:</b> {blockers.length} {blockers.length === 1 ? 'Blocker' : 'Blockers'},{' '}
        {hand} {hand === 1 ? 'card' : 'cards'}
        {hand > 0 ? `, up to +${num(total)} of Counters` : ''}.
      </p>
    );
  return (
    <section className="bx" aria-label="What they could have" data-testid="what-they-could-have">
      <h3 className="bx-h">What they could have</h3>
      <ul className="bx-list">
        <li>
          {blockers.length === 0
            ? 'No active Blockers.'
            : `${blockers.length} active ${blockers.length === 1 ? 'Blocker' : 'Blockers'} (${blockers.join(', ')}): each stops one attack.`}
        </li>
        {effects.map((e, i) => (
          <li key={i}>
            {e.card}: {e.label}
          </li>
        ))}
        <li>
          {hand} {hand === 1 ? 'card' : 'cards'} in hand
          {hand > 0
            ? `: up to +${num(total)} if each is one of ${assumed ? 'a typical deck’s' : 'their deck’s'} +${num(perCard)} Counters`
            : ''}
          .
        </li>
        {more && hand > 0 && <li>{more}</li>}
      </ul>
    </section>
  );
}

export function WhatYouHave({
  counters,
  worth,
  events,
  activeDon,
  staged,
}: {
  counters: number;
  worth: number;
  events: number;
  activeDon: number;
  staged: number;
}) {
  return (
    <section className="bx" aria-label="What you have" data-testid="what-you-have">
      <h3 className="bx-h">What you have</h3>
      <ul className="bx-list">
        <li>
          {counters} Counter {counters === 1 ? 'card' : 'cards'}
          {counters > 0 ? ` worth +${num(worth)}` : ''}
          {staged > 0 ? `, ${staged} staged` : ''}.
        </li>
        {events > 0 && (
          <li>
            {events} Event {events === 1 ? 'Counter' : 'Counters'} to activate, with {activeDon}{' '}
            active DON!! for costs.
          </li>
        )}
        {events === 0 && activeDon > 0 && (
          <li>{activeDon} active DON!!: no Event Counter in hand to pay for.</li>
        )}
      </ul>
    </section>
  );
}

export type NoteKind = 'ties' | 'don' | 'battle';

const NOTES: Record<NoteKind, string> = {
  ties: 'Ties go to the attacker (CR 7-1-4-1).',
  don: 'DON!! add power only on their owner’s turn (CR 6-5-5-2).',
  battle: 'Boosts from Counters and effects last until the end of the battle (CR 7-1-5).',
};

/** A rule footnote, shown the first three times it is relevant per profile (§2.7). */
export function RuleNote({ kind, compact = false }: { kind: NoteKind; compact?: boolean }) {
  const [seen] = useState(() => noteCount(kind));
  useEffect(() => {
    bumpNote(kind);
  }, [kind]);
  if (seen >= 3 || compact) return null;
  return (
    <p className="bx-note" data-testid={`note-${kind}`}>
      {NOTES[kind]}
    </p>
  );
}
