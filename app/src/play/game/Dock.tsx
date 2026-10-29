/**
 * The preview dock and its pinned state, the inspector (board.md §3.12, C19): the card bigger, with
 * our own rendering of its text, its live values with a breakdown, and the "Effect not automated"
 * badge. Pinned, it takes focus; Escape unpins it and returns focus to the card.
 */
import { useEffect, useRef } from 'react';
import { automation } from '@optcg/cards';
import { CardFace } from '../../art/index.ts';
import { SCRIPTED } from '../../cards/scripts.ts';
import type { Rect } from '../board/layout.ts';
import { num } from './text.ts';
import type { G } from './ui.ts';

export interface DockState {
  handle: string | null;
  pinned: boolean;
  how: 'hover' | 'focus';
}

function rich(text: string) {
  return text
    .split('\n')
    .map((line, i) => (
      <p key={i}>
        {line
          .split(/(\[[^\]]+\])/)
          .map((part, j) => (/^\[[^\]]+\]$/.test(part) ? <b key={j}>{part}</b> : part))}
      </p>
    ));
}

export function CardDock({
  g,
  handle,
  pinned,
  rect,
  onClose,
}: {
  g: G;
  handle: string;
  pinned: boolean;
  rect: Rect;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const c = g.cardOf(handle);
  useEffect(() => {
    if (pinned) ref.current?.querySelector<HTMLElement>('.dock-close')?.focus();
  }, [pinned, handle]);
  if (!c?.card) return null;
  const card = c.card;
  const auto = automation(card, SCRIPTED);
  const live = c.power;
  const base = card.power;
  const ownersTurn = g.view.turn.activePlayer === c.owner;
  const vc = Object.values(g.view.zones[c.owner])
    .flat()
    .find((x) => x.handle === handle);
  const don = vc?.don ?? 0;
  const breakdown =
    live !== null && base !== null && live !== base
      ? `${num(live)} = ${num(base)} base${don && ownersTurn ? ` + ${don * 1000} DON!!` : ''}${live - base - (ownersTurn ? don * 1000 : 0) ? ` ${live - base - (ownersTurn ? don * 1000 : 0) > 0 ? '+' : '−'} ${Math.abs(live - base - (ownersTurn ? don * 1000 : 0))} effects` : ''}`
      : null;
  const artW = rect.w >= 480 ? 240 : rect.w >= 400 ? 168 : rect.w >= 320 ? 140 : 104;
  return (
    <div
      ref={ref}
      className={`dock ${pinned ? 'pinned' : ''}`}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
      aria-label={pinned ? `Inspector: ${card.name}` : undefined}
      aria-hidden={pinned ? undefined : true}
      role={pinned ? 'dialog' : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      {pinned && (
        <div className="dock-head">
          <h2>{card.name} · pinned</h2>
          <button
            type="button"
            className="iconbtn dock-close"
            aria-label="Unpin and close (Escape)"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      )}
      <div className="dock-body">
        <div className="dock-art" style={{ ['--card-w' as string]: `${artW}px` }}>
          <CardFace card={card} />
        </div>
        <div className="dock-info">
          {!pinned && <h2 className="dock-name">{card.name}</h2>}
          <p className="subtle">
            {card.id} · {card.category} · {card.colors.join(' / ')}
          </p>
          {card.types.length > 0 && <p className="subtle">{card.types.join(' / ')}</p>}
          <dl className="stats">
            {card.cost !== null && (
              <>
                <dt>Cost</dt>
                <dd>
                  {vc?.cost !== undefined && vc.cost !== null && vc.cost !== card.cost
                    ? `${vc.cost} (printed ${card.cost})`
                    : card.cost}
                </dd>
              </>
            )}
            {base !== null && (
              <>
                <dt>Power</dt>
                <dd>{breakdown ?? num(base)}</dd>
              </>
            )}
            {card.counter !== null && (
              <>
                <dt>Counter</dt>
                <dd>+{card.counter}</dd>
              </>
            )}
            {card.life !== null && (
              <>
                <dt>Life</dt>
                <dd>{card.life}</dd>
              </>
            )}
            {don > 0 && (
              <>
                <dt>DON!!</dt>
                <dd>
                  {don} given{ownersTurn ? '' : ' (no power on the opponent’s turn)'}
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>
      <div className="dock-text">
        {auto === 'not-automated' && <span className="chip warning">Effect not automated</span>}
        {card.effectText ? rich(card.effectText) : <p className="subtle">No effect text.</p>}
        {card.triggerText && (
          <p>
            <b>[Trigger]</b> {card.triggerText}
          </p>
        )}
        {auto === 'not-automated' && pinned && (
          <p className="subtle">
            Effects are automated from M4. Until then this card plays for its power, cost, Counter
            and verified keywords; its effect does not happen.
          </p>
        )}
      </div>
    </div>
  );
}
