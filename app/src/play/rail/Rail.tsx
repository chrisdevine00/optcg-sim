/**
 * The rail (board.md §1, §3.1, §3.11): header, the disclaimer notice (the board's footer
 * equivalent, C15) and the always-visible event log. The decision panel is rendered by the game
 * first in the DOM so Tab reaches it right after the hand (accessibility.md §3.1).
 */
import { useLayoutEffect, useRef, useState } from 'react';
import type { LogLine, Names } from '../game/text.ts';

export const DISCLAIMER_SHORT =
  'Unofficial fan tool. Not affiliated with or endorsed by Bandai, Shueisha or Toei Animation.';
export const DISCLAIMER =
  DISCLAIMER_SHORT +
  ' One Piece and all card names, text and art belong to their respective owners.';

export function RailHeader({
  top,
  height,
  noticeH,
  turnChip,
  myTurn,
  onMenu,
  menuOpen,
  onFullscreen,
  onHome,
  rewound,
}: {
  top: number;
  height: number;
  noticeH: number;
  turnChip: string;
  myTurn: boolean;
  onMenu: () => void;
  menuOpen: boolean;
  onFullscreen: () => void;
  onHome: () => void;
  rewound: boolean;
}) {
  return (
    <div className="rail-top" style={{ top, height: height + noticeH }}>
      <div className="rail-head" style={{ height }}>
        <span className={`chip turn-chip ${myTurn ? 'you' : 'opp'}`}>{turnChip}</span>
        {rewound && (
          <span
            className="chip outline"
            title="This game was rewound: it won’t count in your win rate"
          >
            Rewound
          </span>
        )}
        <span className="spacer" />
        <button
          type="button"
          className="iconbtn"
          aria-label="Game menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={onMenu}
        >
          ≡
        </button>
        <button type="button" className="iconbtn" aria-label="Fullscreen" onClick={onFullscreen}>
          ⤢
        </button>
        <button
          type="button"
          className="iconbtn"
          aria-label="Leave the game (Home)"
          onClick={onHome}
        >
          ⌂
        </button>
      </div>
      <p className="rail-notice" style={{ height: noticeH }} aria-label={DISCLAIMER}>
        <span aria-hidden="true">{DISCLAIMER_SHORT}</span>
        <button type="button" className="info" aria-label={DISCLAIMER} title={DISCLAIMER}>
          ⓘ
        </button>
      </p>
    </div>
  );
}

export function GameLog({
  top,
  height,
  lines,
  names,
  ticker,
  onLink,
  onRewindTo,
  canRewind,
}: {
  top: number;
  height: number;
  lines: LogLine[];
  names: Names;
  ticker: boolean;
  onLink: (card: string | null) => void;
  onRewindTo: (index: number) => void;
  canRewind: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [follow, setFollow] = useState(true);
  const [seen, setSeen] = useState(lines.length);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && (follow || ticker)) el.scrollTop = el.scrollHeight;
  }, [lines.length, follow, ticker, height]);
  const fresh = follow ? 0 : Math.max(0, lines.length - seen);
  if (height <= 0) return null;
  const shown = ticker ? lines.slice(-3) : lines;
  return (
    <section
      className={`log ${ticker ? 'ticker' : ''}`}
      style={{ top, height }}
      aria-label="Event log"
    >
      {!ticker && (
        <h2 className="log-head">
          Event log <span className="subtle">newest at bottom</span>
        </h2>
      )}
      <div
        ref={ref}
        className="log-list"
        role="log"
        aria-live="off"
        aria-label="Game log"
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget;
          const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
          if (follow && !atEnd) setSeen(lines.length);
          setFollow(atEnd);
        }}
      >
        <ol className="log-ol">
          {shown.map((l, i) =>
            l.kind === 'turn' ? (
              <li key={i} className="log-turn">
                {l.text}
              </li>
            ) : (
              <li key={i} className={`log-row ${l.auto ? 'auto' : ''}`}>
                {l.actor && (
                  <span className={`chip actor ${l.actor === names.me ? 'you' : 'opp'}`}>
                    {names.hotseat ? names.player[l.actor] : l.actor === names.me ? 'You' : 'Opp'}
                  </span>
                )}
                <span
                  className="log-text"
                  onPointerEnter={() => onLink(l.cards[0] ?? null)}
                  onPointerLeave={() => onLink(null)}
                >
                  {l.text}
                </span>
                {canRewind && !ticker && l.actor === names.me && !l.auto && (
                  <button
                    type="button"
                    className="log-rw"
                    aria-label={`Rewind to before: ${l.text}`}
                    onClick={() => onRewindTo(l.index)}
                  >
                    ⟲
                  </button>
                )}
              </li>
            ),
          )}
        </ol>
      </div>
      {!follow && fresh > 0 && (
        <button
          type="button"
          className="chip log-new"
          onClick={() => {
            setFollow(true);
          }}
        >
          ↓ {fresh} new
        </button>
      )}
    </section>
  );
}
