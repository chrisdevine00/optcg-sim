import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { automation, type Card } from '@optcg/cards';
import { SCRIPTED_ANY } from './scripts.ts';
import { CardFace, cardLabel } from '../art/index.ts';

const GAP_X = 16;
const GAP_Y = 16;
const PAD = 16;
const CAPTION = 20;
const OVERSCAN = 2;

function useTileWidth(): number {
  const query = '(min-width: 1600px) and (min-height: 900px)';
  const [roomy, setRoomy] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setRoomy(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return roomy ? 140 : 112;
}

interface Props {
  cards: Card[];
  active: number;
  onActive: (i: number) => void;
  onOpen: (card: Card, tile: HTMLElement) => void;
}

/**
 * Virtualized card grid: only the rows in view (plus a few) are in the DOM, so ~3,000 cards stay fast.
 * Keyboard (accessibility.md grid pattern): one tile is in the tab order; arrows, Home/End and
 * PageUp/PageDown move it; Enter or Space opens the inspector.
 */
export function ResultsGrid({ cards, active, onActive, onOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 600 });
  const [scrollTop, setScrollTop] = useState(0);
  const [focusWanted, setFocusWanted] = useState(false);
  // Art waits while the user scrolls fast, so passing tiles don't each hotlink an image (M1-25).
  const [scrolling, setScrolling] = useState(false);
  const idle = useRef<number | undefined>(undefined);
  const tileW = useTileWidth();
  const tileH = Math.round((tileW * 88) / 63);
  const rowH = tileH + CAPTION + GAP_Y;
  const cols = Math.max(1, Math.floor((size.w - PAD * 2 + GAP_X) / (tileW + GAP_X)));
  // Spread leftover width into the gaps (up to 2x), then centre what remains.
  const spare = size.w - PAD * 2 - cols * tileW;
  const gapX = cols > 1 ? Math.min(GAP_X * 2, spare / (cols - 1)) : 0;
  const offset = PAD + Math.max(0, (spare - gapX * (cols - 1)) / 2);
  const rows = Math.ceil(cards.length / cols);

  useLayoutEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const first = Math.max(0, Math.floor((scrollTop - PAD) / rowH) - OVERSCAN);
  const last = Math.min(rows - 1, Math.ceil((scrollTop + size.h) / rowH) + OVERSCAN);
  const activeRow = Math.floor(active / cols);

  const scrollToRow = useCallback(
    (row: number) => {
      const el = ref.current!;
      const top = PAD + row * rowH;
      if (top < el.scrollTop) el.scrollTop = top - PAD;
      else if (top + rowH > el.scrollTop + el.clientHeight)
        el.scrollTop = top + rowH - el.clientHeight;
    },
    [rowH],
  );

  useEffect(() => {
    if (!focusWanted) return;
    const tile = ref.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (tile) {
      tile.focus({ preventScroll: true });
      setFocusWanted(false);
    }
  }, [focusWanted, active, first, last]);

  const move = (to: number) => {
    const i = Math.max(0, Math.min(cards.length - 1, to));
    onActive(i);
    scrollToRow(Math.floor(i / cols));
    setFocusWanted(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.dataset.index || cards.length === 0) return;
    const page = Math.max(1, Math.floor(size.h / rowH)) * cols;
    const keys: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      ArrowDown: active + cols,
      ArrowUp: active - cols,
      PageDown: active + page,
      PageUp: active - page,
      Home: e.ctrlKey ? 0 : active - (active % cols),
      End: e.ctrlKey
        ? cards.length - 1
        : Math.min(cards.length - 1, active - (active % cols) + cols - 1),
    };
    if (e.key in keys) {
      e.preventDefault();
      move(keys[e.key]!);
    }
  };

  const tiles: number[] = [];
  for (let r = first; r <= last; r++)
    for (let c = 0; c < cols; c++) if (r * cols + c < cards.length) tiles.push(r * cols + c);
  // The tile in the tab order is always rendered, even when scrolled out of view.
  if (cards.length && (activeRow < first || activeRow > last))
    tiles.push(Math.min(active, cards.length - 1));

  return (
    <div
      ref={ref}
      className="results"
      id="results"
      role="list"
      aria-label={`Cards, ${cards.length} results`}
      tabIndex={-1}
      onFocus={(e) => {
        // The skip link lands here; hand focus to the grid's tab stop.
        if (e.target === e.currentTarget)
          e.currentTarget.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
      }}
      onScroll={(e) => {
        setScrollTop(e.currentTarget.scrollTop);
        setScrolling(true);
        window.clearTimeout(idle.current);
        idle.current = window.setTimeout(() => setScrolling(false), 150);
      }}
      onKeyDown={onKeyDown}
      style={{ ['--card-w' as string]: `${tileW}px` }}
    >
      <div className="results-inner" style={{ height: PAD * 2 + rows * rowH - GAP_Y }}>
        {tiles.map((i) => {
          const card = cards[i]!;
          const r = Math.floor(i / cols);
          const c = i % cols;
          const extra = [
            card.verified ? 'in the meta decklists, verified' : '',
            SCRIPTED_ANY ? automation(card) : '',
          ].filter(Boolean);
          return (
            <div
              key={card.id}
              role="listitem"
              aria-setsize={cards.length}
              aria-posinset={i + 1}
              className="tile"
              style={{ top: PAD + r * rowH, left: offset + c * (tileW + gapX), width: tileW }}
            >
              <button
                type="button"
                className="card-btn"
                data-index={i}
                tabIndex={i === active ? 0 : -1}
                title={card.name}
                aria-haspopup="dialog"
                onClick={(e) => {
                  onActive(i);
                  onOpen(card, e.currentTarget);
                }}
                onFocus={() => i !== active && onActive(i)}
              >
                {/* The name comes from this text, which starts with the visible card name (WCAG 2.5.3);
                    the drawn face is aria-hidden. */}
                <span className="sr-only">{cardLabel(card, extra)}</span>
                <CardFace card={card} tile load={!scrolling} />
              </button>
              <span className="tile-caption" aria-hidden="true">
                <span className="num">{card.id}</span>
                {card.verified && (
                  <span className="tile-verified" title="Verified">
                    ✓
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
