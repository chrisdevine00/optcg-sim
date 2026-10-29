/**
 * A card on the board or in the hand (board.md §2.3–§2.5): the art window face (card-face-study.md,
 * treatment C) with live values on opaque plates that stay upright when the card is rested, the
 * legal ring plus a corner glyph naming the action, and at most one chip per chip slot.
 */
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import type { Card } from '@optcg/cards';
import type { ViewCard } from '@optcg/engine';
import { CardFace } from '../../art/index.ts';
import { num } from '../game/text.ts';

export type Glyph = 'play' | 'attack' | 'don' | 'target' | 'block' | 'ability' | 'pick';
export const GLYPHS: Record<Glyph, [string, string]> = {
  play: ['▶', 'can be played'],
  attack: ['⚔', 'can attack'],
  don: ['◆', 'can receive DON!!'],
  target: ['⌖', 'can be targeted'],
  block: ['⌖', 'can block'],
  ability: ['⚡', 'ability ready'],
  pick: ['✓', 'chosen'],
};

/** Keyword plates (board.md §2.3): a glyph at compact density, a short word at roomy. */
const KW: Record<string, [string, string]> = {
  Blocker: ['⛨', 'Blocker'],
  Rush: ['»', 'Rush'],
  'Rush: Character': ['»C', 'Rush: C'],
  'Double Attack': ['×2', 'Double'],
  Banish: ['⊘', 'Banish'],
  Unblockable: ['⤳', 'Unblockable'],
  Trigger: ['T', 'Trigger'],
};

export interface Chip {
  text: string;
  tone?: 'you' | 'opp' | 'attack' | 'warn' | 'don';
}

export interface BoardCardProps {
  view: ViewCard;
  def: Card | undefined;
  /** Box to centre the card in (slot or hand position), in board pixels. */
  box: { x: number; y: number; w: number; h: number };
  size: { w: number; h: number };
  roomy: boolean;
  label: string;
  zone: 'leader' | 'characters' | 'stage' | 'hand' | 'trash' | 'mulligan';
  /** Given DON!! add power on the owner's turn only (CR 6-5-5-2); off-turn badges are outlined. */
  donLive?: boolean;
  glyph?: Glyph | null;
  legal?: boolean;
  selected?: boolean;
  dim?: boolean;
  /** The opponent's acting card (orange ring plus a word chip). */
  acting?: string | null;
  battle?: boolean;
  /** Raised in the hand (staged counter, hover). */
  raised?: boolean;
  chips?: Chip[];
  tabIndex?: number;
  hidden?: boolean;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  onFocus?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  dataZone?: string;
  dataItem?: number;
  describedBy?: string;
  children?: ReactNode;
}

export function BoardCard(p: BoardCardProps) {
  const { view: c, def, size, box } = p;
  const rested = c.rested && p.zone !== 'hand' && p.zone !== 'trash' && p.zone !== 'mulligan';
  const bw = rested ? size.h : size.w;
  const bh = rested ? size.w : size.h;
  const x = box.x + (box.w - bw) / 2;
  const y = box.y + (box.h - bh) / 2;
  const basePower = def?.power ?? null;
  const baseCost = def?.cost ?? null;
  const pDir =
    c.power !== null && basePower !== null && c.power !== basePower
      ? c.power > basePower
        ? 'buff'
        : 'debuff'
      : '';
  const cDir =
    c.cost !== null && baseCost !== null && c.cost !== baseCost
      ? c.cost > baseCost
        ? 'buff'
        : 'debuff'
      : '';
  const isEvent = def?.category === 'Event';
  const timing = isEvent ? (def?.effectText.match(/\[(Counter|Main)\]/)?.[0] ?? '[Event]') : null;
  const kws = [...c.keywords.filter((k) => KW[k]), ...(def?.triggerText ? ['Trigger'] : [])];
  const kwText = kws.length
    ? p.roomy
      ? `${KW[kws[0]!]![1]}${kws.length > 1 ? ` +${kws.length - 1}` : ''}`
      : `${kws
          .slice(0, 2)
          .map((k) => KW[k]![0])
          .join(' ')}${kws.length > 2 ? ` +${kws.length - 2}` : ''}`
    : '';
  const chips = (p.chips ?? []).filter(Boolean);
  const chipText = [rested ? '⟳ Rested' : null, ...chips.map((ch) => ch.text)]
    .filter(Boolean)
    .join(' · ');
  const chipTone = chips[0]?.tone ?? '';
  const style: CSSProperties = {
    left: x,
    top: y,
    width: bw,
    height: bh,
    ['--card-w' as string]: `${size.w}px`,
    // --card-h is computed on :root, so it must be set wherever --card-w changes (63:88, M3-14).
    ['--card-h' as string]: `${size.h}px`,
    ['--face-x' as string]: `${(bw - size.w) / 2}px`,
    ['--face-y' as string]: `${(bh - size.h) / 2}px`,
  };
  const cls = [
    'bc',
    `bc-${p.zone}`,
    rested ? 'rested' : '',
    p.legal ? 'legal' : '',
    p.selected ? 'selected' : '',
    p.dim ? 'dim' : '',
    p.acting ? 'acting' : '',
    p.battle ? 'battle' : '',
    p.raised ? 'raised' : '',
    p.hidden ? 'veiled' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const showStats = p.zone !== 'trash';
  return (
    <button
      type="button"
      className={cls}
      style={style}
      aria-haspopup={p.zone === 'trash' ? 'dialog' : 'menu'}
      aria-describedby={p.describedBy}
      tabIndex={p.tabIndex ?? -1}
      data-handle={c.handle}
      data-zone={p.dataZone}
      data-item={p.dataItem}
      data-card={c.card ?? undefined}
      data-glyph={p.glyph ?? undefined}
      onClick={p.onClick}
      onKeyDown={p.onKeyDown}
      onFocus={p.onFocus}
      onPointerEnter={p.onPointerEnter}
      onPointerLeave={p.onPointerLeave}
    >
      <span className="sr-only">{p.label}</span>
      {c.don > 0 && (
        <span className="don-peek" aria-hidden="true">
          {Array.from({ length: Math.min(3, c.don) }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      )}
      <span className="bc-face" aria-hidden="true">
        {def ? <CardFace card={def} plates={false} /> : <span className="face back-face" />}
      </span>
      {showStats && c.cost !== null && (
        <span className={`bp cost ${cDir}`} aria-hidden="true">
          {Math.max(0, c.cost)}
          {cDir === 'buff' ? '▲' : cDir === 'debuff' ? '▼' : ''}
        </span>
      )}
      {showStats && timing && (
        <span className="bp pow timing" aria-hidden="true">
          {timing}
        </span>
      )}
      {showStats && !timing && c.power !== null && (
        <span className={`bp pow ${pDir}`} aria-hidden="true">
          {num(c.power)}
          {pDir === 'buff' ? (
            <span className="ar">▲</span>
          ) : pDir === 'debuff' ? (
            <span className="ar">▼</span>
          ) : null}
        </span>
      )}
      {showStats && c.don > 0 && (
        <span className={`bp don ${p.donLive === false ? 'off' : ''}`} aria-hidden="true">
          <span className="d">◆</span>
          {c.don}
        </span>
      )}
      {showStats && kwText && (
        <span
          className={`bp kw ${p.roomy ? 'word' : ''}`}
          aria-hidden="true"
          title={kws.join(', ')}
        >
          {kwText}
        </span>
      )}
      {(p.zone === 'hand' || p.zone === 'mulligan') && def?.counter ? (
        <span className="bp ctr" aria-hidden="true">
          +{def.counter}
        </span>
      ) : null}
      {p.glyph && (
        <span className={`glyph g-${p.glyph}`} aria-hidden="true">
          {GLYPHS[p.glyph][0]}
        </span>
      )}
      {chipText && (
        <span className={`cchip ${rested ? 'below' : 'mid'} ${chipTone}`} aria-hidden="true">
          {chipText}
        </span>
      )}
      {p.acting && !chipText && (
        <span className="cchip mid opp" aria-hidden="true">
          {p.acting}
        </span>
      )}
      {p.children}
    </button>
  );
}

/** Our own card back (never the printed back). */
export function CardBack({ style, className = '' }: { style?: CSSProperties; className?: string }) {
  return <span className={`back ${className}`} style={style} aria-hidden="true" />;
}
