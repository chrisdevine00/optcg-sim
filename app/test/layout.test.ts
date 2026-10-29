import { describe, expect, it } from 'vitest';
import { computeLayout, type Rect } from '../src/play/board/layout.ts';

const xywh = (r: Rect) => [r.x, r.y, r.w, r.h];

describe('board layout (board.md §3.1, §3.2, §6)', () => {
  it('reproduces the 1280×720 table', () => {
    const L = computeLayout(1280, 720);
    expect(L.supported).toBe(true);
    expect(L.card).toEqual({ w: 84, h: 117 });
    expect(L.axis).toBe(480);
    expect(xywh(L.oppId)).toEqual([16, 0, 238, 32]);
    expect(xywh(L.oppHand)).toEqual([270, 0, 420, 32]);
    expect(xywh(L.opp.donDeck)).toEqual([20, 49, 60, 100]);
    expect(xywh(L.opp.cost)).toEqual([88, 40, 185, 117]);
    expect(xywh(L.opp.life)).toEqual([289, 40, 117, 117]);
    expect(xywh(L.opp.leader)).toEqual([422, 40, 117, 117]);
    expect(xywh(L.opp.stage)).toEqual([555, 40, 117, 117]);
    expect(xywh(L.opp.deck)).toEqual([768, 40, 84, 117]);
    expect(xywh(L.opp.trash)).toEqual([860, 40, 84, 117]);
    expect(L.opp.chars.map((c) => c.x)).toEqual([172, 297, 422, 547, 672]);
    expect(L.opp.chars[0]!.y).toBe(165);
    expect(xywh(L.mid)).toEqual([16, 290, 928, 40]);
    expect(L.me.chars[0]!.y).toBe(338);
    expect(xywh(L.me.donDeck)).toEqual([20, 472, 60, 100]);
    expect(xywh(L.me.leader)).toEqual([422, 463, 117, 117]);
    expect(xywh(L.hand)).toEqual([16, 592, 928, 117]);
    expect(L.rail).toMatchObject({ x: 960, w: 320, head: 44, notice: 32 });
    expect(L.rail.decision).toEqual({ top: 472, parts: [36, 148, 64] });
    expect(L.rail.tall).toEqual({ top: 200, parts: [36, 420, 64] });
    expect(xywh(L.dock)).toEqual([872, 80, 400, 384]);
    expect(xywh(L.dockAlt)).toEqual([16, 40, 400, 384]);
    expect(L.mulligan.card).toEqual({ w: 97, h: 135 });
    expect(L.mulligan.y + L.mulligan.card.h).toBeLessThanOrEqual(463 - 4);
  });

  it('reproduces the 1920×1080 table', () => {
    const L = computeLayout(1920, 1080);
    expect(L.density).toBe('roomy');
    expect(L.card).toEqual({ w: 126, h: 176 });
    expect(L.axis).toBe(760);
    expect(xywh(L.oppId)).toEqual([24, 0, 397, 48]);
    expect(xywh(L.oppHand)).toEqual([445, 0, 630, 48]);
    expect(xywh(L.opp.donDeck)).toEqual([68, 77, 91, 143]);
    expect(xywh(L.opp.cost)).toEqual([171, 60, 277, 176]);
    expect(xywh(L.opp.life)).toEqual([472, 60, 176, 176]);
    expect(xywh(L.opp.leader)).toEqual([672, 60, 176, 176]);
    expect(xywh(L.opp.stage)).toEqual([872, 60, 176, 176]);
    expect(xywh(L.opp.deck)).toEqual([1232, 60, 126, 176]);
    expect(xywh(L.opp.trash)).toEqual([1370, 60, 126, 176]);
    expect(L.opp.chars.map((c) => c.x)).toEqual([296, 484, 672, 860, 1048]);
    expect(xywh(L.mid)).toEqual([24, 436, 1472, 56]);
    expect(L.me.chars[0]!.y).toBe(504);
    expect(xywh(L.me.leader)).toEqual([672, 692, 176, 176]);
    expect(xywh(L.hand)).toEqual([24, 884, 1472, 176]);
    expect(L.rail.decision).toEqual({ top: 744, parts: [44, 220, 72] });
    expect(L.rail.tall).toEqual({ top: 216, parts: [44, 748, 72] });
    expect(xywh(L.dock)).toEqual([1432, 92, 480, 644]);
    expect(xywh(L.dockAlt)).toEqual([24, 60, 480, 644]);
  });

  it('adapts to tablets and short windows (§6.2, §6.3)', () => {
    const a = computeLayout(1180, 740);
    expect(a.card).toEqual({ w: 86, h: 120 });
    expect(a.rail.w).toBe(280);
    expect(a.axis).toBe(483);
    const b = computeLayout(1024, 690);
    expect(b.card).toEqual({ w: 80, h: 112 });
    expect(b.rail.w).toBe(264);
    expect(b.axis).toBe(430);
    expect(b.stacked).toBe(true);
    expect(xywh(b.me.leader)).toEqual([374, 448, 112, 112]);
    expect(xywh(b.me.deck)).toEqual([668, 448, 80, 52]);
    expect(xywh(b.me.trash)).toEqual([668, 508, 80, 52]);
    expect(xywh(b.hand)).toEqual([12, 570, 736, 112]);
    expect(b.rail.decision.top).toBe(426);
    expect(b.rail.decision.parts).toEqual([36, 148, 80]);
    const c = computeLayout(1280, 600);
    expect(c.card).toEqual({ w: 77, h: 108 });
    expect(c.peek).toBe(true);
    expect(c.rail.tall.top).toBe(76);
    expect(computeLayout(900, 500).supported).toBe(false);
  });
});
