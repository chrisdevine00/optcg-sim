/**
 * Board geometry (board.md §2–§3, §6), ported from the Phase 4 calculator (`.cache/design/layout.mjs`)
 * so the app and the document cannot drift apart. Card size comes from the vertical budget; the
 * Leader row is then fitted horizontally by shifting the axis, narrowing the rail, narrowing the cost
 * area and stacking Deck and Trash, in that order (§6.1). Below 76 px cards the board does not render.
 *
 * At 1280×720 and 1920×1080 this reproduces the tables in board.md §3.1 and §3.2 exactly
 * (`app/test/layout.test.ts`).
 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SideRects {
  donDeck: Rect;
  cost: Rect;
  life: Rect;
  leader: Rect;
  stage: Rect;
  deck: Rect;
  trash: Rect;
  chars: Rect[];
}

export interface RailRects {
  x: number;
  w: number;
  head: number;
  notice: number;
  /** Decision panel: top and header / body / footer heights, normal and tall (§3.9). */
  decision: { top: number; parts: [number, number, number] };
  tall: { top: number; parts: [number, number, number] };
  /** Log ticker shown above the tall panel; 0 when the tall panel rises right under the notice. */
  ticker: number;
}

export interface Layout {
  W: number;
  H: number;
  supported: boolean;
  density: 'compact' | 'roomy';
  /** Hand peeks at 60% (compact height, §6.3). */
  peek: boolean;
  card: { w: number; h: number };
  slot: number;
  token: { w: number; h: number };
  gap: number;
  margin: number;
  axis: number;
  boardW: number;
  stacked: boolean;
  costLabelW: number;
  oppId: Rect;
  oppHand: Rect;
  opp: SideRects;
  me: SideRects;
  mid: Rect;
  midCentre: Rect;
  hand: Rect;
  /** Mulligan fan over your empty Character row (§3.14). */
  mulligan: { card: { w: number; h: number }; y: number };
  rail: RailRects;
  dock: Rect;
  dockAlt: Rect;
}

const RATIO = 88 / 63;
export const MIN_CARD_W = 76;

interface Profile {
  strip: number;
  g: number;
  gH: number;
  mid: number;
  bottom: number;
  margin: number;
  roomy: boolean;
  peek: boolean;
  rails: number[];
}

function profile(W: number, H: number): Profile {
  if (W >= 1600 && H >= 900)
    return {
      strip: 48,
      g: 12,
      gH: 16,
      mid: 56,
      bottom: 12,
      margin: 24,
      roomy: true,
      peek: false,
      rails: [400],
    };
  if (H < 650)
    return {
      strip: 28,
      g: 6,
      gH: 8,
      mid: 36,
      bottom: 0,
      margin: 16,
      roomy: false,
      peek: true,
      rails: [320, 280, 264],
    };
  if (W < 1280) {
    const low = H < 720;
    return {
      strip: low ? 28 : 32,
      g: 8,
      gH: low ? 10 : 12,
      mid: 44,
      bottom: low ? 6 : 8,
      margin: 12,
      roomy: false,
      peek: false,
      rails: [320, 280, 264],
    };
  }
  return {
    strip: 32,
    g: 8,
    gH: 12,
    mid: 40,
    bottom: 8,
    margin: 16,
    roomy: false,
    peek: false,
    rails: [320, 280, 264],
  };
}

const r = (x: number, y: number, w: number, h: number): Rect => ({
  x: Math.round(x),
  y: Math.round(y),
  w: Math.round(w),
  h: Math.round(h),
});

export function computeLayout(W: number, H: number): Layout {
  const p = profile(W, H);
  const handFactor = p.peek ? 0.6 : 1;
  const fixed = p.strip + 5 * p.g + p.gH + p.mid + p.bottom;
  let h = Math.floor((H - fixed) / (4 + handFactor));
  let w: number;
  if (p.roomy) {
    w = Math.floor(h / RATIO);
    h = Math.round(w * RATIO);
  } else {
    w = Math.round(h / RATIO);
  }
  const g2 = 2 * p.g;
  const dd = Math.round(0.72 * w);

  // Horizontal fit: rail width, then cost-area width, then stacked Deck and Trash (§6.1).
  let fit: { rail: number; ca: number; stacked: boolean; axis: number } | null = null;
  // Each step keeps the previous ones: narrow the rail fully, then the cost area, then stack.
  const last = p.rails.at(-1)!;
  const steps = [
    ...p.rails.map((rail) => ({ rail, caF: 2.2, stacked: false })),
    { rail: last, caF: 1.9, stacked: false },
    { rail: last, caF: 1.9, stacked: true },
  ];
  for (const { rail, caF, stacked } of steps) {
    const boardW = W - rail;
    const ca = Math.round(caF * w);
    const deckTrashW = stacked ? w : 2 * w + p.g;
    const leftNeed = h / 2 + g2 + h + g2 + ca + p.g + dd + p.margin;
    const rightNeed = h / 2 + g2 + h + g2 + deckTrashW + p.margin;
    const charHalf = 2.5 * h + 2 * p.g + p.margin;
    const lo = Math.max(leftNeed, charHalf);
    const hi = boardW - Math.max(rightNeed, charHalf);
    if (lo <= hi) {
      fit = { rail, ca, stacked, axis: Math.round(Math.min(Math.max(boardW / 2, lo), hi)) };
      break;
    }
  }
  const supported = fit !== null && w >= MIN_CARD_W;
  const f = fit ?? {
    rail: p.rails.at(-1)!,
    ca: Math.round(1.9 * w),
    stacked: true,
    axis: (W - 264) / 2,
  };
  const boardW = W - f.rail;
  const axis = f.axis;

  let y = 0;
  const yStrip = y;
  y += p.strip + p.g;
  const yOppL = y;
  y += h + p.g;
  const yOppC = y;
  y += h + p.g;
  const yMid = y;
  y += p.mid + p.g;
  const yMyC = y;
  y += h + p.g;
  const yMyL = y;
  y += h + p.gH;
  const yHand = y;

  const side = (yy: number, yc: number): SideRects => {
    const lx = axis - h / 2;
    const lifeX = lx - g2 - h;
    const caX = lifeX - g2 - f.ca;
    const ddX = caX - p.g - dd;
    const ddH = Math.round(dd * RATIO);
    let deck: Rect;
    let trash: Rect;
    if (!f.stacked) {
      const trX = boardW - p.margin - w;
      trash = r(trX, yy, w, h);
      deck = r(trX - p.g - w, yy, w, h);
    } else {
      const half = Math.floor((h - p.g) / 2);
      const x = boardW - p.margin - w;
      deck = r(x, yy, w, half);
      trash = r(x, yy + half + p.g, w, half);
    }
    const pitch = h + p.g;
    return {
      donDeck: r(ddX, yy + (h - ddH) / 2 - 8, dd, ddH + 16),
      cost: r(caX, yy, f.ca, h),
      life: r(lifeX, yy, h, h),
      leader: r(lx, yy, h, h),
      stage: r(lx + h + g2, yy, h, h),
      deck,
      trash,
      chars: [-2, -1, 0, 1, 2].map((k) => r(axis + k * pitch - h / 2, yc, h, h)),
    };
  };

  const turnW = Math.min(520, boardW - 2 * p.margin - 2 * 200);
  const handH = p.peek ? Math.round(h * 0.6) : h;

  // Rail (§3.1, §3.9, §6.2, §6.3).
  const railHead = p.roomy ? 56 : 44;
  const notice = f.rail >= 320 ? 32 : 46;
  const parts: [number, number, number] = p.roomy
    ? [44, 220, 72]
    : f.rail < 320
      ? [36, 164, 64]
      : [36, 148, 64];
  const decH = parts[0] + parts[1] + parts[2];
  const narrowOrShort = f.rail < 320 || p.peek;
  const tallTop = p.roomy ? 216 : narrowOrShort ? railHead + notice : 200;
  const tallParts: [number, number, number] = [
    parts[0],
    H - tallTop - parts[0] - parts[2],
    parts[2],
  ];

  const dockW = p.roomy ? 480 : f.rail < 320 ? 360 : 400;
  const dockH = p.roomy ? 644 : Math.min(384, H - decH - railHead - notice - 8);
  const mulW = Math.round(w * 1.15);
  const mulH = Math.round(h * 1.15);
  let mulY = yMyC + (h - mulH) / 2;
  if (mulY + mulH > yMyL - 4) mulY = yMyL - 4 - mulH;

  return {
    W,
    H,
    supported,
    density: p.roomy ? 'roomy' : 'compact',
    peek: p.peek,
    card: { w, h },
    slot: h,
    token: { w: Math.round(w * 0.29), h: Math.round(w * 0.29 * RATIO) },
    gap: p.g,
    margin: p.margin,
    axis,
    boardW,
    stacked: f.stacked,
    costLabelW: p.roomy ? 84 : 58,
    oppId: r(p.margin, yStrip, axis - 2.5 * w - 2 * p.margin, p.strip),
    oppHand: r(axis - 2.5 * w, yStrip, 5 * w, p.strip),
    opp: side(yOppL, yOppC),
    me: side(yMyL, yMyC),
    mid: r(p.margin, yMid, boardW - 2 * p.margin, p.mid),
    midCentre: r(axis - turnW / 2, yMid, turnW, p.mid),
    hand: r(p.margin, yHand, boardW - 2 * p.margin, handH),
    mulligan: { card: { w: mulW, h: mulH }, y: Math.round(mulY) },
    rail: {
      x: boardW,
      w: f.rail,
      head: railHead,
      notice,
      decision: { top: H - decH, parts },
      tall: { top: tallTop, parts: tallParts },
      ticker: narrowOrShort ? 0 : tallTop - railHead - notice,
    },
    dock: r(W - dockW - 8, railHead + notice + 4, dockW, dockH),
    dockAlt: r(p.margin, p.strip + p.g, dockW, dockH),
  };
}

const hits = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Where the preview dock (and the pinned inspector) opens (board.md §3.12, UX-V11). The default is
 * over the log, below the rail notice; while the decision panel is tall, or when that would cover
 * the focused element, it moves onto the board. On the board it avoids the attacker, the defender,
 * every lit card and the focused element, shrinking if no position is clear.
 */
export function placeDock(L: Layout, avoid: Rect[], tall: boolean): Rect {
  if (!tall && !avoid.some((a) => hits(a, L.dock))) return L.dock;
  const sizes = [
    { w: L.dock.w, h: L.dock.h },
    { w: Math.round(L.dock.w * 0.8), h: Math.round(L.dock.h * 0.8) },
    { w: Math.round(L.dock.w * 0.65), h: Math.round(L.dock.h * 0.65) },
  ];
  for (const s of sizes) {
    for (let y = L.dockAlt.y; y + s.h <= L.H - 8; y += 8) {
      for (let x = L.dockAlt.x; x + s.w <= L.boardW - 8; x += 8) {
        const r = { x, y, w: s.w, h: s.h };
        if (!avoid.some((a) => hits(a, r))) return r;
      }
    }
  }
  return { ...L.dockAlt, w: sizes[2]!.w, h: sizes[2]!.h };
}
