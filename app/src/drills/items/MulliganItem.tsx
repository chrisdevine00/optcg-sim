/**
 * The mulligan item (flows F19a): the dealt hand, the seat and their Leader, and two equal buttons,
 * Keep on the left and Redraw on the right, neither pre-focused and neither styled as the answer.
 * Focus starts on the heading, which reads the hand. K and R answer while focus is on the two buttons.
 */
import { useEffect, useRef } from 'react';
import type { Card } from '@optcg/cards';
import { CardFace, cardLabel } from '../../art/index.ts';
import type { MulliganItem as Item } from '../types.ts';
import type { ItemTimer } from '../timer.ts';
import { ItemBar } from '../ItemBar.tsx';
import type { DrillAi } from '../load.ts';

export const handWords = (item: Item, cards: ReadonlyMap<string, Card>): string =>
  item.hand.map((id) => cards.get(id)?.name ?? id).join(', ');

export function MulliganItemScreen({
  item,
  cards,
  index,
  total,
  note,
  timer,
  factor,
  onFactor,
  onAnswer,
  onShow,
  onSkip,
  onLeave,
}: {
  ai: DrillAi;
  item: Item;
  cards: ReadonlyMap<string, Card>;
  index: number;
  total: number;
  note: string | null;
  timer: ItemTimer;
  factor: number | null;
  onFactor?: ((f: number | null) => void) | undefined;
  onAnswer(redraw: boolean): void;
  onShow(): void;
  onSkip(): void;
  onLeave(): void;
}) {
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    head.current?.focus();
  }, [item.id]);
  const mine = cards.get(item.mine);
  const theirs = item.theirs ? cards.get(item.theirs) : undefined;
  const seat = item.first ? 'You go first' : 'You go second';
  return (
    <main className="page page-full drill" id="main" aria-labelledby="page-title">
      <h1 id="page-title" tabIndex={-1} ref={head}>
        Keep or redraw?{' '}
        <span className="sr-only">
          {seat}. Your hand: {handWords(item, cards)}.
        </span>
      </h1>
      <p className="drill-seat">
        <b>{seat}</b> with {mine?.name ?? item.mine}
        {theirs ? `, against ${theirs.name}` : ''}.
      </p>
      <ul className="drill-hand" aria-label="Your hand">
        {item.hand.map((id, i) => {
          const c = cards.get(id);
          return (
            <li key={`${id}-${i}`} className="drill-card">
              {c ? (
                <>
                  <span className="sr-only">{cardLabel(c)}</span>
                  <CardFace card={c} />
                </>
              ) : (
                <span>{id}</span>
              )}
            </li>
          );
        })}
      </ul>
      <div
        className="drill-answers"
        role="group"
        aria-label="Your answer"
        onKeyDown={(e) => {
          // K and R answer only while focus is on these two buttons (WCAG 2.1.4: no page-wide key).
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          const k = e.key.toLowerCase();
          if (k === 'k' || k === 'r') {
            e.preventDefault();
            onAnswer(k === 'r');
          }
        }}
      >
        <button type="button" className="btn drill-answer" onClick={() => onAnswer(false)}>
          Keep <kbd>K</kbd>
        </button>
        <button type="button" className="btn drill-answer" onClick={() => onAnswer(true)}>
          Redraw <kbd>R</kbd>
        </button>
      </div>
      <ItemBar
        drill="mulligan"
        index={index}
        total={total}
        note={note}
        timer={timer}
        factor={factor}
        onFactor={onFactor}
        onShow={onShow}
        onSkip={onSkip}
        onLeave={onLeave}
      />
    </main>
  );
}
