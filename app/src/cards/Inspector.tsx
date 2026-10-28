import { useEffect, useRef, useState, type ReactNode } from 'react';
import { automation, type Card, type TextFix } from '@optcg/cards';
import { useArt } from '../art/index.ts';

const MINUS = '−';
const num = (n: number | null) => (n === null ? '—' : String(n).replace('-', MINUS));

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
  cleanup: 'Upstream junk removed',
  trigger: '[Trigger] marker restored',
  override: 'Corrected by hand',
};

const STATUS: Record<string, string> = {
  legal: 'Legal',
  banned: 'Banned',
  restricted: 'Restricted',
  rotated: 'Not legal (rotated)',
  unknown: 'Unknown',
};

function FullScan({ card, artIndex }: { card: Card; artIndex: number }) {
  const art = useArt(card.artworks[artIndex]);
  return (
    <div className="scan" data-art={art.src ? (art.loaded ? 'image' : 'loading') : 'text'}>
      {art.src ? (
        <img
          key={art.src}
          src={art.src}
          alt={`Card scan of ${card.name} (${card.artworks[artIndex]?.artworkId ?? card.id})`}
          width={600}
          height={838}
          decoding="async"
          onLoad={art.onLoad}
          onError={art.onError}
        />
      ) : (
        <div className="scan-text">
          <p className="scan-text-name">{card.name}</p>
          <p>No image available. The card is shown as text.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Card inspector (board.md §3.12, wireframe 10 "inspect"): the full scan with its watermark, every field
 * in words, the full text, the repairs made to upstream text, verification and automation badges.
 */
export function Inspector({ card, onClose }: { card: Card; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [artIndex, setArtIndex] = useState(0);
  const auto = automation(card);

  useEffect(() => {
    const d = ref.current!;
    if (!d.open) d.showModal();
  }, []);

  const art = card.artworks[artIndex];
  const legal = card.legality.standard;
  return (
    <dialog
      ref={ref}
      className="inspector"
      aria-labelledby="inspector-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current!.close();
      }}
    >
      <header className="inspector-head">
        <h2 id="inspector-title">{card.name}</h2>
        <span className="muted num">{card.id}</span>
        <span className="spacer" />
        <button
          type="button"
          className="iconbtn"
          aria-label="Close inspector (Escape)"
          onClick={() => ref.current!.close()}
        >
          ✕
        </button>
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
          {art && (
            <p className="subtle small">
              {art.artworkId} ·{' '}
              {art.label ?? (art.artworkId === card.id ? 'Base printing' : 'Printing')} ·{' '}
              {art.product}
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
            {auto === 'not-automated' && (
              <span className="chip warning">⚠ Effect not automated</span>
            )}
            {auto === 'keywords' && <span className="chip outline">Keywords automated</span>}
            {auto === 'vanilla' && <span className="chip outline">No effect text</span>}
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
              {card.set} · block {card.block ?? 'unknown'}
            </dd>
            <dt>Standard</dt>
            <dd>
              {STATUS[legal.status]}
              {legal.reason ? ` (${legal.reason})` : ''}
              {legal.bannedWith?.length ? `; banned with ${legal.bannedWith.join(', ')}` : ''}
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
          {auto === 'not-automated' && (
            <p className="notice warning-notice">
              <b>Effect not automated.</b> In a game this card plays for its stats
              {card.keywords.length ? ' and its printed keywords' : ''}; its effect will not happen
              yet.
            </p>
          )}
          {card.textFixes.length > 0 && (
            <details className="fixes">
              <summary>Repairs to the upstream data ({card.textFixes.length})</summary>
              <ul>
                {card.textFixes.map((f, i) => (
                  <li key={i}>
                    <b>{FIX_LABEL[f.kind]}</b> in {f.field}: <q>{f.from || '(empty)'}</q> →{' '}
                    <q>{f.to || '(removed)'}</q>
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
            . Escape closes.
          </p>
        </div>
      </div>
    </dialog>
  );
}
