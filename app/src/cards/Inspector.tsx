import { useEffect, useRef, useState, type ReactNode } from 'react';
import { automation, type Card, type TextFix } from '@optcg/cards';
import { manifest } from '@optcg/cards/browser';
import { IMAGE_SOURCES, retryArt, useArt } from '../art/index.ts';
import { SCRIPTED, SCRIPTED_ANY } from './scripts.ts';

const MINUS = '−';
const num = (n: number | null) => (n === null ? '—' : String(n).replace('-', MINUS));
const setNames = new Map(manifest.sets.map((s) => [s.code, s.name]));

/** Bold the bracketed timing and keyword words ("[On Play]") so abilities scan quickly. */
function richText(text: string): ReactNode[] {
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

const FIX_LABEL: Record<TextFix['kind'], string> = {
  sign: 'Minus sign restored',
  cleanup: 'Upstream note removed',
  trigger: '[Trigger] marker restored',
  override: 'Corrected by hand',
};
const FIELD_LABEL: Record<string, string> = {
  effectText: 'effect text',
  triggerText: 'trigger text',
  name: 'name',
  types: 'types',
  attributes: 'attribute',
  cost: 'cost',
  power: 'power',
  counter: 'counter',
  life: 'life',
  colors: 'colour',
  category: 'category',
};
/** Field values in words: `["Special"]` reads "Special", `[]` reads "none". */
function words(v: string): string {
  if (!v) return '(empty)';
  try {
    const parsed: unknown = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.length ? parsed.join(' / ') : 'none';
    if (parsed === null) return 'none';
  } catch {
    // plain text
  }
  return v;
}

const STATUS: Record<string, string> = {
  legal: 'Legal',
  banned: 'Banned',
  restricted: 'Restricted',
  rotated: 'Rotated',
  unknown: 'Unknown',
};

function FullScan({ card, artIndex }: { card: Card; artIndex: number }) {
  const art = useArt(card.artworks[artIndex]);
  const host = new URL(IMAGE_SOURCES.optcgapi.base).host;
  return (
    <div className="scan" data-art={art.src ? (art.loaded ? 'image' : 'loading') : 'text'}>
      {art.src ? (
        <img
          key={art.src}
          src={art.src}
          alt={`Card scan of ${card.name}`}
          width={600}
          height={838}
          decoding="async"
          onLoad={art.onLoad}
          onError={art.onError}
        />
      ) : (
        <div className="scan-text">
          <p className="scan-text-name">{card.name}</p>
          {art.failed ? (
            <>
              <p role="status">
                Couldn't load the card image ({host} didn't respond). The card is shown as text.
              </p>
              <button type="button" className="btn small" onClick={retryArt}>
                Retry images
              </button>
            </>
          ) : (
            <p>This printing has no image. The card is shown as text.</p>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  card: Card;
  /** Position in the current results, for "Card 3 of 40". */
  position?: { index: number; total: number };
  onPrev?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
  onClose: () => void;
}

/**
 * Card inspector (board.md §3.12, wireframe 10 "inspect"): the full scan with its watermark, every field
 * in words, the full text, the repairs made to upstream text, and verification and automation status.
 * PageUp/PageDown or the buttons move through the current results; the arrow keys are left for artwork.
 */
export function Inspector({ card, position, onPrev, onNext, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [art, setArt] = useState({ id: card.id, index: 0 });
  const artIndex = art.id === card.id ? art.index : 0;
  const setArtIndex = (index: number) => setArt({ id: card.id, index });
  const auto = automation(card, SCRIPTED);

  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const d = ref.current!;
    if (!d.open) d.showModal();
    // Focus starts on Close (board.md §3.12), not on the first navigation button.
    closeBtn.current?.focus();
  }, []);

  const artwork = card.artworks[artIndex];
  const legal = card.legality.standard;
  const legalText =
    legal.status === 'banned'
      ? `Banned${legal.reason ? ` ${legal.reason}` : ''}`
      : `${STATUS[legal.status]}${legal.reason && legal.status !== 'unknown' ? ` (${legal.reason})` : legal.status === 'unknown' ? ' (block not known)' : ''}`;
  return (
    <dialog
      ref={ref}
      className="inspector"
      aria-labelledby="inspector-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current!.close();
      }}
      onKeyDown={(e) => {
        if (e.key === 'PageDown' && onNext) {
          e.preventDefault();
          onNext();
        } else if (e.key === 'PageUp' && onPrev) {
          e.preventDefault();
          onPrev();
        }
      }}
    >
      <header className="inspector-head">
        <h2 id="inspector-title">{card.name}</h2>
        <span className="muted num">{card.id}</span>
        <span className="spacer" />
        {position && (
          <div className="card-nav" role="group" aria-label="Browse results">
            <button
              type="button"
              className="btn small"
              onClick={onPrev}
              disabled={!onPrev}
              aria-keyshortcuts="PageUp"
            >
              ◂ Previous
            </button>
            <span className="small muted num" aria-live="polite">
              {position.index + 1} of {position.total}
            </span>
            <button
              type="button"
              className="btn small"
              onClick={onNext}
              disabled={!onNext}
              aria-keyshortcuts="PageDown"
            >
              Next ▸
            </button>
          </div>
        )}
        <button
          ref={closeBtn}
          type="button"
          className="iconbtn"
          aria-label="Close"
          onClick={() => ref.current!.close()}
        >
          ✕
        </button>
        <kbd className="esc-hint" aria-hidden="true">
          Esc
        </kbd>
      </header>
      <div className="inspector-body">
        <div className="inspector-art">
          <FullScan card={card} artIndex={artIndex} />
          {card.artworks.length > 1 && (
            <div className="art-switch" role="group" aria-label="Artwork">
              <button
                type="button"
                className="btn small"
                aria-label="Previous artwork"
                disabled={artIndex === 0}
                onClick={() => setArtIndex(artIndex - 1)}
              >
                ◂
              </button>
              <span aria-live="polite">
                Art {artIndex + 1} of {card.artworks.length}
              </span>
              <button
                type="button"
                className="btn small"
                aria-label="Next artwork"
                disabled={artIndex === card.artworks.length - 1}
                onClick={() => setArtIndex(artIndex + 1)}
              >
                ▸
              </button>
            </div>
          )}
          {artwork && (
            <p className="subtle small">
              {artwork.label ??
                (artwork.artworkId === card.id ? 'Base printing' : 'Alternate printing')}{' '}
              ·{' '}
              {artwork.product === 'P'
                ? 'Promotion'
                : (setNames.get(artwork.product) ?? artwork.product)}
            </p>
          )}
        </div>
        <div className="inspector-info">
          <div className="badges">
            {card.verified ? (
              <span className="chip success">✓ Verified</span>
            ) : (
              <span className="chip outline">Not verified</span>
            )}
            {SCRIPTED_ANY && auto === 'not-automated' && (
              <span className="chip warning">⚠ Effect not automated</span>
            )}
            {!SCRIPTED_ANY && (auto === 'not-automated' || auto === 'keywords') && (
              <span className="chip outline">Effect not automated</span>
            )}
            {card.textFixes.length > 0 && (
              <span className="chip outline">
                {card.textFixes.length} repair{card.textFixes.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="kind">
            {card.category} · {card.colors.join('/')}
            {card.types.length > 0 && <> · {card.types.join(' / ')}</>}
            {card.attributes.length > 0 && <> · {card.attributes.join('/')}</>}
          </p>
          <dl className="stats">
            {card.category === 'Leader' ? (
              <>
                <dt>Life</dt>
                <dd className="num">{num(card.life)}</dd>
              </>
            ) : (
              <>
                <dt>Cost</dt>
                <dd className="num">{num(card.cost)}</dd>
              </>
            )}
            <dt>Power</dt>
            <dd className="num">{num(card.power)}</dd>
            <dt>Counter</dt>
            <dd className="num">{card.counter === null ? '—' : `+${card.counter}`}</dd>
            <dt>Rarity</dt>
            <dd>{card.rarity}</dd>
            <dt>Set</dt>
            <dd>
              {card.set === 'P' ? 'Promotion' : `${card.set} · ${setNames.get(card.set) ?? ''}`} ·
              block {card.block ?? 'not known'}
            </dd>
            <dt>Standard</dt>
            <dd>
              {legalText}
              {legal.bannedWith?.length
                ? `; may not share a deck with ${legal.bannedWith.join(', ')}`
                : ''}
            </dd>
          </dl>
          {card.keywords.length > 0 && (
            <p className="keywords">
              Printed keywords:{' '}
              {card.keywords.map((k) => (
                <span key={k} className="chip outline">
                  {k}
                </span>
              ))}
            </p>
          )}
          <section className="text" aria-label="Card text">
            {card.effectText
              ? richText(card.effectText)
              : !card.triggerText && <p className="muted">No effect.</p>}
            {card.triggerText && (
              <div className="trigger">{richText(`[Trigger] ${card.triggerText}`)}</div>
            )}
          </section>
          {!SCRIPTED_ANY && auto !== 'vanilla' && (
            <p className="muted small">
              Card effects aren't automated yet; the game engine comes later.
            </p>
          )}
          {SCRIPTED_ANY && auto === 'not-automated' && (
            <p className="notice warning-notice">
              <b>Effect not automated.</b> In a game this card plays for its stats
              {card.keywords.length ? ' and its printed keywords' : ''}; its effect will not happen.
            </p>
          )}
          {card.textFixes.length > 0 && (
            <details className="fixes">
              <summary>Repairs to the upstream data ({card.textFixes.length})</summary>
              <ul>
                {card.textFixes.map((f, i) => (
                  <li key={i}>
                    <b>{FIX_LABEL[f.kind]}</b> in the {FIELD_LABEL[f.field] ?? f.field}:{' '}
                    <q>{words(f.from)}</q> →{' '}
                    <q>{f.kind === 'cleanup' && !f.to ? 'removed' : words(f.to)}</q>
                    {f.source && (
                      <>
                        {' '}
                        <a href={f.source} target="_blank" rel="noreferrer">
                          source
                        </a>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p className="subtle small provenance">
            {card.verified ? (
              <>
                Verified {card.verifiedBy[0]?.date} against{' '}
                {card.verifiedBy.map((s, i) => (
                  <span key={s.url}>
                    {i > 0 && ' and '}
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {new URL(s.url).host}
                    </a>
                  </span>
                ))}
                .
              </>
            ) : (
              <>Text from optcgapi.com, not verified.</>
            )}{' '}
            <a href={card.sourceUrl} target="_blank" rel="noreferrer">
              Upstream record
            </a>
          </p>
        </div>
      </div>
    </dialog>
  );
}
