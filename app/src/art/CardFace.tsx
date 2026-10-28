import { useState } from 'react';
import type { Artwork, Card } from '@optcg/cards';
import { imageCandidates } from './sources.ts';
import { reportArtFailure, useArtStatus } from './status.ts';

const INITIALS: Record<string, string> = {
  Red: 'R',
  Green: 'G',
  Blue: 'B',
  Purple: 'P',
  Black: 'Bk',
  Yellow: 'Y',
};
const MINUS = '−';

/** Text with ASCII minus replaced by the true minus (visual-system §3.3). */
const num = (n: number) => String(n).replace('-', MINUS);

/**
 * One art source chain for an artwork: tries each candidate URL, then gives up so the caller draws text.
 * Keyed by artwork id and the retry epoch, so switching art or pressing Retry restarts the chain.
 * `load` defers the first request (the grid holds it while the user is scrolling fast).
 */
export function useArt(artwork: Artwork | undefined, load = true) {
  const { epoch } = useArtStatus();
  const candidates = imageCandidates(artwork);
  const key = `${artwork?.artworkId ?? ''}@${epoch}`;
  const [state, setState] = useState({ key, index: 0, loaded: false, started: load });
  const current =
    state.key === key ? state : { key, index: 0, loaded: false, started: load || state.started };
  const started = current.started || load;
  const src = started ? candidates[current.index] : undefined;
  return {
    src,
    loaded: current.loaded,
    /** True when sources existed but none loaded (the host failed), as opposed to "no image". */
    failed: candidates.length > 0 && current.index >= candidates.length,
    waiting: !started && candidates.length > 0,
    onLoad: () => setState({ ...current, started: true, loaded: true }),
    onError: () => {
      if (current.index + 1 >= candidates.length) reportArtFailure();
      setState({ ...current, started: true, index: current.index + 1, loaded: false });
    },
  };
}

const LEGAL_CHIP: Record<string, string> = { banned: '⛔ Banned', rotated: '⟲ Rotated' };
const LEGAL_WORDS: Record<string, string> = {
  banned: 'banned in Standard',
  rotated: 'rotated out of Standard',
};

/**
 * Card face, treatment C from docs/design/card-face-study.md: the scan's clean upper band as an "art window"
 * (no SAMPLE watermark), our own name footer and colour band, and live stats on opaque plates. When no image
 * loads, the same frame shows the card as text, so nothing shifts when art arrives or fails. `tile` adds the
 * browser's extras: a type line in the footer and a Standard-legality chip.
 */
export function CardFace({
  card,
  artwork = card.artworks[0],
  load = true,
  tile = false,
}: {
  card: Card;
  artwork?: Artwork | undefined;
  load?: boolean;
  tile?: boolean;
}) {
  const art = useArt(artwork, load);
  const focus = card.artFocus;
  const showText = !art.src && !art.waiting;
  const band =
    card.colors.length > 1
      ? `linear-gradient(90deg, ${card.colors.map((c, i) => `var(--band-${c.toLowerCase()}) ${(i * 100) / card.colors.length}% ${((i + 1) * 100) / card.colors.length}%`).join(', ')})`
      : `var(--band-${card.colors[0]?.toLowerCase() ?? 'black'})`;
  const legal = tile ? LEGAL_CHIP[card.legality.standard.status] : undefined;
  return (
    <span
      className={`face${tile ? ' face-tile' : ''}`}
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
            {!tile && card.types.length > 0 && (
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
      {legal && (
        <span className={`face-chip face-chip-${card.legality.standard.status}`}>{legal}</span>
      )}
      <span className="face-foot">
        <span className="face-name">{card.name.replace(/\.(?=\S)/g, '.\u200b')}</span>
        {tile && card.types.length > 0 && (
          <span className="face-type">{card.types.join(' / ')}</span>
        )}
        <span className="face-band" style={{ background: band }}>
          <span className="face-band-ini">{card.colors.map((c) => INITIALS[c]).join(' ')}</span>
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
  const legal = LEGAL_WORDS[card.legality.standard.status];
  return [
    `${card.name}, ${card.id}`,
    `${card.colors.join(' and ')} ${card.category}`,
    ...stats,
    ...(legal ? [legal] : []),
    ...extra,
  ].join(', ');
}
