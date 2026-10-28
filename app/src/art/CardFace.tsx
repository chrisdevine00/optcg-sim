import { useState } from 'react';
import type { Artwork, Card } from '@optcg/cards';
import { imageCandidates } from './sources.ts';

const INITIALS: Record<string, string> = {
  Red: 'R',
  Green: 'G',
  Blue: 'B',
  Purple: 'P',
  Black: 'K',
  Yellow: 'Y',
};
const MINUS = '−';

/** Text with ASCII minus replaced by the true minus (visual-system §3.3). */
const num = (n: number) => String(n).replace('-', MINUS);

/**
 * One art source chain for an artwork: tries each candidate URL, then gives up so the caller draws text.
 * Keyed by artwork id so switching art restarts the chain.
 */
export function useArt(artwork: Artwork | undefined) {
  const candidates = imageCandidates(artwork);
  const [state, setState] = useState({ key: artwork?.artworkId, index: 0, loaded: false });
  const current =
    state.key === artwork?.artworkId ? state : { key: artwork?.artworkId, index: 0, loaded: false };
  const src = candidates[current.index];
  return {
    src,
    loaded: current.loaded,
    onLoad: () => setState({ ...current, loaded: true }),
    onError: () => setState({ ...current, index: current.index + 1, loaded: false }),
  };
}

/**
 * Card face, treatment C from docs/design/card-face-study.md: the scan's clean upper band as an "art window"
 * (no SAMPLE watermark), our own name footer and colour band, and live stats on opaque plates. When no image
 * loads, the same frame shows the card as text, so nothing shifts when art arrives or fails.
 */
export function CardFace({
  card,
  artwork = card.artworks[0],
}: {
  card: Card;
  artwork?: Artwork | undefined;
}) {
  const art = useArt(artwork);
  const focus = card.artFocus;
  const showText = !art.src;
  const band =
    card.colors.length > 1
      ? `linear-gradient(90deg, ${card.colors.map((c, i) => `var(--band-${c.toLowerCase()}) ${(i * 100) / card.colors.length}% ${((i + 1) * 100) / card.colors.length}%`).join(', ')})`
      : `var(--band-${card.colors[0]?.toLowerCase() ?? 'black'})`;
  return (
    <span
      className="face"
      aria-hidden="true"
      data-art={showText ? 'text' : art.loaded ? 'image' : 'loading'}
    >
      <span className="face-art">
        {art.src && (
          <img
            key={art.src}
            src={art.src}
            alt=""
            width={600}
            height={838}
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={art.onLoad}
            onError={art.onError}
            style={focus ? { objectPosition: `${focus.x}% ${focus.y}%` } : undefined}
          />
        )}
        {showText && (
          <span className="face-text">
            <span className="face-text-line face-text-kind">{card.category}</span>
            {card.types.length > 0 && (
              <span className="face-text-line">{card.types.join(' / ')}</span>
            )}
            {/* An excerpt fits only where no Counter plate sits on the window's lower edge. */}
            {card.counter === null && (
              <span
                className={`face-text-body${card.effectText || card.triggerText ? '' : ' face-text-none'}`}
              >
                {card.effectText ||
                  (card.triggerText ? `[Trigger] ${card.triggerText}` : 'No effect')}
              </span>
            )}
          </span>
        )}
      </span>
      {card.cost !== null && <span className="plate plate-cost">{num(card.cost)}</span>}
      {card.category === 'Leader' && card.life !== null && (
        <span className="plate plate-life">
          {card.life}
          <span className="plate-unit">Life</span>
        </span>
      )}
      {card.power !== null && <span className="plate plate-power">{num(card.power)}</span>}
      {card.counter !== null && <span className="plate plate-counter">+{card.counter}</span>}
      <span className="face-foot">
        <span className="face-name">{card.name.replace(/\.(?=\S)/g, '.​')}</span>
        <span className="face-band" style={{ background: band }}>
          <span className="face-band-ini">{card.colors.map((c) => INITIALS[c]).join('')}</span>
        </span>
      </span>
    </span>
  );
}

/** Accessible name for a card tile: everything the face shows, in words. */
export function cardLabel(card: Card, extra: string[] = []): string {
  const stats = [
    card.cost !== null ? `cost ${card.cost}` : null,
    card.life !== null ? `${card.life} Life` : null,
    card.power !== null ? `${num(card.power)} power` : null,
    card.counter !== null ? `counter +${card.counter}` : null,
  ].filter(Boolean);
  return [
    `${card.name}, ${card.id}`,
    `${card.colors.join(' and ')} ${card.category}`,
    ...stats,
    ...extra,
  ].join(', ');
}
