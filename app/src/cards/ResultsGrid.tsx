import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { automation, type Card } from '@optcg/cards';
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
      role="list"
      aria-label={`Cards, ${cards.length} results`}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      onKeyDown={onKeyDown}
      style={{ ['--card-w' as string]: `${tileW}px` }}
    >
      <div className="results-inner" style={{ height: PAD * 2 + rows * rowH - GAP_Y }}>
        {tiles.map((i) => {
          const card = cards[i]!;
          const r = Math.floor(i / cols);
          const c = i % cols;
          const auto = automation(card);
          const extra = [
            card.verified ? 'verified' : 'not verified',
            auto === 'not-automated' ? 'effect not automated' : auto,
          ];
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
                aria-label={cardLabel(card, extra)}
                aria-haspopup="dialog"
                onClick={(e) => {
                  onActive(i);
                  onOpen(card, e.currentTarget);
                }}
                onFocus={() => i !== active && onActive(i)}
              >
                <CardFace card={card} />
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
