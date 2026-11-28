/**
 * `/meta/:leaderId` (M9 WP1, learning-ui §5.2): one archetype guide in its file's order. Every
 * sourced claim carries its tag as a link; every claim the guide marks *(inference)* carries "our
 * reasoning", so the player can tell source from opinion at a glance. Defining cards are chips that
 * open the card Inspector; the footer has the as-of date, the confidence and the sources.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Card } from '@optcg/cards';
import { useArt } from '../art/index.ts';
import { Inspector } from '../cards/Inspector.tsx';
import { loadCards } from '../play/setup/decks.ts';
import { Link } from '../router.tsx';
import { cardIdsIn, loadGuides } from './guides.ts';
import { archetypeIdOf, displayName, recordOwner, shortName } from './model.ts';
import type { Guide, GuideBlock, GuideMatchup, Span } from './types.ts';
import './meta.css';

/** Inline text, with sources as links and inference as a visible mark. */
export function Spans({ spans }: { spans: readonly Span[] }) {
  return (
    <>
      {spans.map((s, i) => {
        if (s.kind === 'text') return <span key={i}>{s.text}</span>;
        if (s.kind === 'inference')
          return (
            <span key={i} className="meta-infer" title={s.note ? `Inference ${s.note}` : undefined}>
              our reasoning
              {s.note && <span className="sr-only">, {s.note}</span>}
            </span>
          );
        const inner = (
          <>
            {s.tag}
            <span className="sr-only">, {s.label}</span>
          </>
        );
        return s.url ? (
          <a
            key={i}
            className="meta-src"
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            title={s.label}
          >
            {inner}
          </a>
        ) : (
          <span key={i} className="meta-src" title={s.label}>
            {inner}
          </span>
        );
      })}
    </>
  );
}

function Block({ b }: { b: GuideBlock }) {
  if (b.kind === 'p')
    return (
      <p>
        <Spans spans={b.spans} />
      </p>
    );
  if (b.kind === 'list') {
    const Tag = b.ordered ? 'ol' : 'ul';
    return (
      <Tag>
        {b.items.map((it, i) => (
          <li key={i}>
            <Spans spans={it} />
          </li>
        ))}
      </Tag>
    );
  }
  return (
    <div className="meta-scroll" role="region" aria-label={b.head.join(', ')} tabIndex={0}>
      <table className="meta-table">
        <thead>
          <tr>
            {b.head.map((h, i) => (
              <th key={i} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {b.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c}>
                  <Spans spans={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A card's art as a small decorative window: the name beside it is the chip's label. */
function ChipArt({ card }: { card: Card }) {
  const art = useArt(card.artworks[0]);
  return art.src ? (
    <img
      className="meta-chip-art"
      src={art.src}
      alt=""
      loading="lazy"
      onLoad={art.onLoad}
      onError={art.onError}
    />
  ) : (
    <span className="meta-chip-art" aria-hidden="true" />
  );
}

function MatchupRows({ guide, matchups }: { guide: Guide; matchups: readonly GuideMatchup[] }) {
  return (
    <div
      className="meta-scroll"
      role="region"
      aria-label={`${displayName(guide.leaderId)} matchups`}
      tabIndex={0}
    >
      <table className="meta-table">
        <thead>
          <tr>
            <th scope="col">Opponent</th>
            <th scope="col">Record</th>
            <th scope="col">One-line plan</th>
          </tr>
        </thead>
        <tbody>
          {matchups.map((m) => (
            <tr key={m.opponent}>
              <th scope="row">
                <Link to={`/meta/${m.opponent}`}>{displayName(m.opponent)}</Link>
              </th>
              <td>
                {m.record ? (
                  <>
                    <Spans spans={m.recordSpans} />
                    <div className="subtle">{recordOwner(m)}</div>
                  </>
                ) : (
                  <>
                    <span className="subtle">No record found</span>{' '}
                    <Spans spans={m.recordSpans.filter((x) => x.kind === 'source')} />
                  </>
                )}
              </td>
              <td>
                <Spans spans={m.plan} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GuideRoute({ path }: { path: string }) {
  const key = decodeURIComponent(path.replace(/^\/meta\//, ''));
  const [guides, setGuides] = useState<Guide[] | null>(null);
  const [cards, setCards] = useState<ReadonlyMap<string, Card>>(new Map());
  const [open, setOpen] = useState<Card | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const guide = useMemo(
    () => guides?.find((g) => g.leaderId === key || g.archetypeId === key) ?? null,
    [guides, key],
  );

  useEffect(() => {
    let live = true;
    void loadGuides().then((g) => live && setGuides(g));
    return () => {
      live = false;
    };
  }, []);

  const defining = useMemo(() => {
    const sec = guide?.sections.find((s) => s.id === 'defining-cards');
    const table = sec?.blocks.find((b) => b.kind === 'table');
    return table && table.kind === 'table' ? cardIdsIn(table.rows.map((r) => r[0] ?? [])) : [];
  }, [guide]);

  useEffect(() => {
    if (!guide) return;
    let live = true;
    void loadCards(defining).then((c) => live && setCards(c));
    return () => {
      live = false;
    };
  }, [guide, defining]);

  useEffect(() => {
    document.title = guide
      ? `${guide.title} · OPTCG Sim`
      : guides
        ? 'Guide not found · OPTCG Sim'
        : 'Guide · OPTCG Sim';
    if (guide || guides) document.getElementById('page-title')?.focus();
  }, [guide, guides]);

  if (!guides)
    return (
      <main className="page meta" id="main" aria-busy="true" data-path={path}>
        <h1 id="page-title" tabIndex={-1}>
          Archetype guide
        </h1>
        <p role="status">Loading the guide…</p>
      </main>
    );
  if (!guide)
    return (
      <main className="page meta" id="main" aria-labelledby="page-title" data-path={path}>
        <h1 id="page-title" tabIndex={-1}>
          Guide not found
        </h1>
        <p>
          There is no guide for “{key}”. <Link to="/meta">Back to the Meta Explorer</Link>
        </p>
      </main>
    );

  const deck = `${archetypeIdOf(guide.leaderId)}#1`;
  const play = (side: 'p1' | 'p2', id: string) => `/play?${side}=${encodeURIComponent(id)}`;
  return (
    <main className="page meta meta-guide" id="main" aria-labelledby="page-title" data-path={path}>
      <p className="subtle">
        <Link to="/meta">← Meta Explorer</Link> · <Link to="/meta/matchups">Matchup grid</Link>
      </p>
      <h1 id="page-title" tabIndex={-1}>
        {guide.title}
      </h1>
      <p className="subtle">
        {guide.colors.join(' and ')} · as of {guide.asOf} · confidence: {guide.confidence}
      </p>
      <div className="meta-actions">
        <Link className="btn primary" to={play('p1', deck)}>
          Play this deck
        </Link>
        <Link className="btn" to={play('p2', deck)}>
          Play against this deck
        </Link>
        <Link className="btn" to={`/drills?leader=${guide.leaderId}`}>
          Practise with {shortName(guide.leaderId)}
        </Link>
      </div>
      <nav aria-label="On this page" className="meta-toc">
        <ul>
          {guide.sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#guide-${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const h = document.getElementById(`guide-${s.id}`);
                  h?.scrollIntoView({ block: 'start' });
                  h?.focus();
                }}
              >
                {s.heading}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {guide.sections.map((s) => (
        <section key={s.id} aria-labelledby={`guide-${s.id}`}>
          <h2 id={`guide-${s.id}`} tabIndex={-1}>
            {s.heading}
          </h2>
          {s.blocks.map((b, i) => (
            <Block key={i} b={b} />
          ))}
          {s.id === 'defining-cards' && defining.length > 0 && (
            <ul className="meta-chips" aria-label="Open a defining card">
              {defining.map((id) => {
                const c = cards.get(id);
                return (
                  <li key={id}>
                    {c ? (
                      <button
                        type="button"
                        className="meta-chip"
                        onClick={(e) => {
                          opener.current = e.currentTarget;
                          setOpen(c);
                        }}
                      >
                        <ChipArt card={c} />
                        <span>
                          {c.id} {c.name}
                        </span>
                      </button>
                    ) : (
                      <span className="meta-chip meta-chip-wait">{id}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {s.id === 'mulligan' && (
            <p>
              <Link
                className="btn"
                to={`/drills/mulligan?archetype=${archetypeIdOf(guide.leaderId)}`}
              >
                Try the mulligan trainer for this deck
              </Link>
            </p>
          )}
          {s.id === 'matchups' && (
            <>
              <p className="subtle">
                Records are the row deck’s wins and losses as the guide’s source gives them. “our
                reasoning” marks a plan that is ours, not a source’s.
              </p>
              <MatchupRows guide={guide} matchups={guide.matchups} />
            </>
          )}
          {s.id === 'sourced-lists' && (
            <div
              className="meta-scroll"
              role="region"
              aria-label="Sourced lists table"
              tabIndex={0}
            >
              <table className="meta-table">
                <thead>
                  <tr>
                    <th scope="col">Event</th>
                    <th scope="col">Date</th>
                    <th scope="col">Players</th>
                    <th scope="col">Placing</th>
                    <th scope="col">Record</th>
                    <th scope="col">Player</th>
                    <th scope="col">List</th>
                  </tr>
                </thead>
                <tbody>
                  {guide.lists.map((l, i) => (
                    <tr key={i}>
                      <th scope="row">{l.event}</th>
                      <td className="num">{l.date}</td>
                      <td className="num">{l.players ?? ''}</td>
                      <td>{l.placing}</td>
                      <td className="num">{l.record}</td>
                      <td>{l.player}</td>
                      <td className="meta-list-links">
                        {l.url && (
                          <a href={l.url} target="_blank" rel="noopener noreferrer">
                            Decklist
                            <span className="sr-only"> for {l.event} (opens in a new tab)</span>
                          </a>
                        )}{' '}
                        <Link to={play('p1', `${archetypeIdOf(guide.leaderId)}#${i + 1}`)}>
                          Play this list<span className="sr-only">, {l.event}</span>
                        </Link>{' '}
                        <Link to={play('p2', `${archetypeIdOf(guide.leaderId)}#${i + 1}`)}>
                          Play against this list<span className="sr-only">, {l.event}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {s.id === 'playbook-seeds' && guide.playbook.length > 0 && (
            <ol>
              {guide.playbook.map((p, i) => (
                <li key={i}>
                  <Spans spans={p} />
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
      <footer className="meta-foot" aria-label="Guide sources">
        <p>
          <b>As of {guide.asOf}</b> · confidence: {guide.confidence}. Guide for{' '}
          {shortName(guide.leaderId)}; tags in square brackets open their source.
        </p>
        <h2 className="meta-foot-h">Sources</h2>
        <ul>
          {guide.sources.map((s) => (
            <li key={s}>
              {/^https?:/.test(s) ? (
                <a href={s} target="_blank" rel="noopener noreferrer">
                  {s}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <code>{s}</code>
              )}
            </li>
          ))}
        </ul>
      </footer>
      {open && (
        <Inspector
          card={open}
          onClose={() => {
            setOpen(null);
            opener.current?.focus();
          }}
        />
      )}
    </main>
  );
}
