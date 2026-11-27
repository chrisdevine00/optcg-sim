/**
 * M10 WP4: the helpers of the WCAG audit (`m10-audit.spec.ts`) and the keyboard game
 * (`m10-keyboard-warlord.spec.ts`). Each is page-level (it runs in the page and returns plain data) so a
 * spec decides what fails and the report generator (`scripts/a11y-audit-report.ts`) reads what was found.
 *
 * Limits, said once: the target check measures boxes, not the user-agent's own controls (a bare native
 * checkbox is measured through its label, as 2.5.8 allows); the overlap check compares text-line boxes
 * before and after the 1.4.12 CSS, so an overlap the design has on purpose (a badge over a card face) is not
 * a finding, only a new one is; vision emulation saves screenshots, and reading them is manual (WP5).
 */
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export interface AxeResult {
  violations: string[];
  incomplete: { id: string; nodes: number; help: string }[];
}

/**
 * Axe at WCAG 2.2 AA (and nothing else: best practice is the board specs' business). `violations` is the
 * list a spec must find empty; `incomplete` is what axe could not decide, appended to
 * `test-results/audit-incomplete-<project>.json` by the caller via `recordIncomplete`.
 */
export async function axeAll(page: Page, name: string): Promise<AxeResult> {
  const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  return {
    violations: r.violations.map(
      (v) => `${name}: ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    ),
    incomplete: r.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length, help: v.help })),
  };
}

/** Merged into `test-results/audit-incomplete-<project>.json` (a restarted worker must not lose earlier entries). */
export function recordIncomplete(project: string, name: string, list: AxeResult['incomplete']) {
  const file = `test-results/audit-incomplete-${project}.json`;
  let all: Record<string, AxeResult['incomplete']> = {};
  try {
    all = JSON.parse(readFileSync(file, 'utf8')) as typeof all;
  } catch {
    /* first write */
  }
  all[name] = list;
  mkdirSync('test-results', { recursive: true });
  writeFileSync(file, JSON.stringify(all, null, 1));
}

export interface HeadingResult {
  found: boolean;
  focused: boolean;
  text: string;
  level: number;
}

/** The page's first level-one heading matching `heading`, and whether it holds focus. */
export async function focusHeading(page: Page, heading: string | RegExp): Promise<HeadingResult> {
  const src =
    typeof heading === 'string' ? { s: heading, re: false } : { s: heading.source, re: true };
  return page.evaluate(({ s, re }) => {
    const hs = [...document.querySelectorAll<HTMLElement>('h1')];
    const ok = (t: string) => (re ? new RegExp(s).test(t) : t.trim() === s);
    const h = hs.find((x) => ok(x.textContent ?? ''));
    return {
      found: !!h,
      focused: !!h && document.activeElement === h,
      text: (h?.textContent ?? hs[0]?.textContent ?? '').trim(),
      level: 1,
    };
  }, src);
}

export interface Stop {
  name: string;
  tag: string;
  /** `none`, `partly` or `fully` obscured by something else at the sampled points. */
  obscured: 'none' | 'partly' | 'fully' | 'offscreen';
}
export interface SweepResult {
  stops: Stop[];
  /** Stopped because focus came back round, left the page, or hit `max`. */
  ended: 'cycle' | 'body' | 'max';
}

/** Tab from the top of the page; for each stop, its name and whether its box is visible (2.4.11). */
export async function tabSweep(page: Page, max = 60): Promise<SweepResult> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    (window as unknown as { __seen: WeakSet<Element> }).__seen = new WeakSet();
    window.scrollTo(0, 0);
  });
  const stops: Stop[] = [];
  let ended: SweepResult['ended'] = 'max';
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      const seen = (window as unknown as { __seen: WeakSet<Element> }).__seen;
      if (!el || el === document.body || el === document.documentElement) return { end: 'body' };
      if (seen.has(el)) return { end: 'cycle' };
      seen.add(el);
      const r = el.getBoundingClientRect();
      const label =
        el.getAttribute('aria-label') ||
        (el.getAttribute('aria-labelledby')
          ? el
              .getAttribute('aria-labelledby')!
              .split(/\s+/)
              .map((id) => document.getElementById(id)?.textContent ?? '')
              .join(' ')
          : '') ||
        (el as HTMLInputElement).labels?.[0]?.textContent ||
        el.innerText ||
        el.getAttribute('title') ||
        el.getAttribute('alt') ||
        el.id ||
        el.dataset.zone ||
        '';
      // Five sample points: the centre and the four points a quarter in from each corner.
      const pts = [
        [0.5, 0.5],
        [0.25, 0.25],
        [0.75, 0.25],
        [0.25, 0.75],
        [0.75, 0.75],
      ].map(([fx, fy]) => [r.left + r.width * fx!, r.top + r.height * fy!] as const);
      let inside = 0;
      let on = 0;
      for (const [x, y] of pts) {
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
        on++;
        const top = document.elementFromPoint(x, y);
        if (top && (el === top || el.contains(top) || top.contains(el))) inside++;
      }
      const obscured: Stop['obscured'] =
        r.width === 0 || r.height === 0 || on === 0
          ? 'offscreen'
          : inside === 0
            ? 'fully'
            : inside < on
              ? 'partly'
              : 'none';
      return {
        name: label.replace(/\s+/g, ' ').trim().slice(0, 80),
        tag:
          el.tagName.toLowerCase() +
          (el.getAttribute('role') ? `[${el.getAttribute('role')}]` : ''),
        obscured,
      };
    });
    if ('end' in s) {
      ended = s.end as 'cycle' | 'body';
      break;
    }
    stops.push(s as Stop);
  }
  return { stops, ended };
}

export interface TargetFinding {
  name: string;
  w: number;
  h: number;
  x: number;
  y: number;
}
export interface TargetsResult {
  count: number;
  /** The smallest side of the smallest target, in CSS pixels. */
  smallest: number;
  smallestName: string;
  /** Under 24 px with another target inside its 24 px circle: a 2.5.8 failure. */
  failing: TargetFinding[];
  /** Under 24 px but spaced clear of every other target: passes by the spacing exception. */
  spaced: number;
  /** Inline links inside a sentence: the inline exception. */
  inline: number;
}

/** Every visible interactive element's box, judged against 2.5.8 (24 px, or the spacing exception). */
export async function targets(page: Page): Promise<TargetsResult> {
  return page.evaluate(() => {
    const SEL =
      'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=menuitem], [role=tab], [role=option], [role=checkbox], [role=radio], [role=switch], [role=slider], [role=gridcell][tabindex], [tabindex]:not([tabindex="-1"])';
    interface T {
      el: HTMLElement;
      r: DOMRect;
      name: string;
      inline: boolean;
    }
    // A modal open: only it takes input, whatever the page under it holds.
    const modal = [...document.querySelectorAll<HTMLElement>('dialog[open], [aria-modal="true"]')]
      .filter((d) => d.getBoundingClientRect().width > 0)
      .pop();
    const visible = (el: HTMLElement) => {
      if (modal && !modal.contains(el)) return false;
      const cs = getComputedStyle(el);
      if (cs.visibility !== 'visible' || cs.display === 'none') return false;
      if ((el as HTMLButtonElement).disabled) return false;
      // An ancestor that hides it (display none, visibility, aria-hidden, inert) removes it.
      if (el.closest('[inert], [hidden]')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const named = (el: HTMLElement) =>
      (
        el.getAttribute('aria-label') ||
        (el as HTMLInputElement).labels?.[0]?.textContent ||
        el.innerText ||
        el.getAttribute('title') ||
        el.id ||
        el.tagName
      )
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60);
    const all: T[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(SEL)) {
      if (!visible(el)) continue;
      let r = el.getBoundingClientRect();
      // A control that has a visible label is one target with it (2.5.8 counts the label's box).
      const lab = (el as HTMLInputElement).labels?.[0];
      if (lab && (el as HTMLInputElement).type !== 'hidden') {
        const lr = lab.getBoundingClientRect();
        if (lr.width * lr.height > r.width * r.height) r = lr;
      }
      // Inline: a link set in running text (2.5.8's inline exception): its block has more than a few words of
      // text that is not itself a link.
      const block = el.closest('p, li, dd, td, dt, blockquote, footer');
      const own = block
        ? (block.textContent ?? '').length -
          [...block.querySelectorAll('a')].reduce((n, a) => n + (a.textContent ?? '').length, 0)
        : 0;
      const cs = getComputedStyle(el);
      const inline =
        el.tagName === 'A' &&
        (cs.display === 'inline' || cs.display === 'inline-block') &&
        own > 20;
      all.push({ el, r, name: named(el), inline });
    }
    // Drop a target that sits wholly inside another target's box and does the same job (a link in a card).
    const targets = all.filter((t) => !t.inline);
    const small = targets.filter((t) => Math.min(t.r.width, t.r.height) < 23.99);
    const circle = (t: T) => ({
      x: t.r.left + t.r.width / 2,
      y: t.r.top + t.r.height / 2,
    });
    const hitsRect = (c: { x: number; y: number }, r: DOMRect) => {
      const nx = Math.max(r.left, Math.min(c.x, r.right));
      const ny = Math.max(r.top, Math.min(c.y, r.bottom));
      return (c.x - nx) ** 2 + (c.y - ny) ** 2 < 12 * 12;
    };
    const failing: TargetFinding[] = [];
    let spaced = 0;
    for (const t of small) {
      const c = circle(t);
      const clash = targets.some((o) => {
        if (o === t) return false;
        // A target nested in this one (or this in it) is one control, not a neighbour.
        if (o.el.contains(t.el) || t.el.contains(o.el)) return false;
        if (hitsRect(c, o.r)) return true;
        if (Math.min(o.r.width, o.r.height) < 23.99) {
          const oc = circle(o);
          return Math.hypot(oc.x - c.x, oc.y - c.y) < 24;
        }
        return false;
      });
      if (clash)
        failing.push({
          name: t.name,
          w: Math.round(t.r.width * 10) / 10,
          h: Math.round(t.r.height * 10) / 10,
          x: Math.round(t.r.left),
          y: Math.round(t.r.top),
        });
      else spaced++;
    }
    let smallest = Infinity;
    let smallestName = '';
    for (const t of targets) {
      const m = Math.min(t.r.width, t.r.height);
      if (m < smallest) {
        smallest = m;
        smallestName = t.name;
      }
    }
    return {
      count: targets.length,
      smallest: smallest === Infinity ? 0 : Math.round(smallest * 10) / 10,
      smallestName,
      failing,
      spaced,
      inline: all.length - targets.length,
    };
  });
}

export interface ZoomResult {
  factor: number;
  css: { w: number; h: number };
  /** `scrollWidth - clientWidth` of the document element: a positive number is a horizontal scrollbar. */
  overflowX: number;
  /** Boxes in the readable channels (decision panel, inspector, log) that spill past their container. */
  clipped: string[];
}

/** Sets the viewport to `base / factor` (CSS pixels as at browser zoom) and measures; restores the size. */
export async function zoom(
  page: Page,
  factor: number,
  base: { width: number; height: number },
  board: boolean,
): Promise<ZoomResult> {
  const w = Math.round(base.width / factor);
  const h = Math.round(base.height / factor);
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(250);
  const r = await page.evaluate((isBoard) => {
    const de = document.documentElement;
    const clipped: string[] = [];
    if (isBoard) {
      const chans = document.querySelectorAll<HTMLElement>(
        '#decision, .log-list, [role="dialog"], [role="alertdialog"]',
      );
      for (const c of chans) {
        const cr = c.getBoundingClientRect();
        if (cr.width === 0) continue;
        if (c.scrollWidth > c.clientWidth + 1)
          clipped.push(
            `${c.id || c.className || c.tagName}: scrollWidth ${c.scrollWidth} > ${c.clientWidth}`,
          );
        for (const el of c.querySelectorAll<HTMLElement>('*')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          // A scrolling ancestor inside the channel is allowed to hold what spills.
          let p: HTMLElement | null = el.parentElement;
          let scrolls = false;
          while (p && p !== c) {
            const o = getComputedStyle(p).overflowX;
            if (o === 'auto' || o === 'scroll') scrolls = true;
            p = p.parentElement;
          }
          if (scrolls) continue;
          if (r.right > cr.right + 1 || r.left < cr.left - 1)
            clipped.push(
              `${c.id || c.className}: <${el.tagName.toLowerCase()}> "${(el.textContent ?? '').trim().slice(0, 30)}" spills ${Math.round(Math.max(r.right - cr.right, cr.left - r.left))} px`,
            );
        }
      }
    }
    return { overflowX: de.scrollWidth - de.clientWidth, clipped: clipped.slice(0, 12) };
  }, board);
  await page.setViewportSize(base);
  await page.waitForTimeout(150);
  return { factor, css: { w, h }, ...r };
}

export interface SpacingResult {
  /** Elements clipped by the injected spacing that were not clipped before. */
  clipped: string[];
  /** Text lines overlapping each other that did not overlap before. */
  overlaps: string[];
  /** Elements showing an ellipsis: their full text stays in the DOM, so their name is whole. */
  truncated: number;
}

const SPACING_CSS = `*, *::before, *::after { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
p { margin-bottom: 2em !important; }`;

/** The 1.4.12 text-spacing override: nothing newly clipped, nothing newly overlapping. */
export async function spacing(page: Page): Promise<SpacingResult> {
  const measure = () =>
    page.evaluate(() => {
      const clipped: string[] = [];
      let truncated = 0;
      const key = (el: Element) =>
        `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(
          (el as HTMLElement).className,
        )
          .split(/\s+/)
          .join('.')}|${(el.textContent ?? '').trim().slice(0, 24)}`;
      // Card faces are fixed-size renderings of a printed card: their text is the card's name and stats, whole in
      // the accessible name and the inspector, so a clipped line there is reported by `truncated`, not failed.
      const exempt = '.face';
      // A modal open: only it is on screen, whatever the page under it does.
      const modal = [...document.querySelectorAll<HTMLElement>('dialog[open], [aria-modal="true"]')]
        .filter((d) => d.getBoundingClientRect().width > 0)
        .pop();
      for (const el of document.querySelectorAll<HTMLElement>('body *')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (!(el.textContent ?? '').trim()) continue;
        if (el.closest(exempt)) {
          const clips = (v: string) => v === 'hidden' || v === 'clip';
          if (
            (clips(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) ||
            (clips(cs.overflowX) && el.scrollWidth > el.clientWidth + 1)
          )
            truncated++;
          continue;
        }
        if (modal && !modal.contains(el)) continue;
        const clips = (v: string) => v === 'hidden' || v === 'clip';
        if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) truncated++;
        else if (
          (clips(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) ||
          (clips(cs.overflowX) &&
            el.scrollWidth > el.clientWidth + 1 &&
            cs.textOverflow !== 'ellipsis')
        )
          clipped.push(key(el));
      }
      // Text-line boxes of visible text nodes, compared pairwise.
      const boxes: { r: DOMRect; k: string }[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = walker.nextNode()) && boxes.length < 900) {
        const t = n as Text;
        if (!t.data.trim()) continue;
        const pe = t.parentElement;
        if (!pe || pe.closest('script, style, [hidden], .sr-only, [aria-hidden="true"]')) continue;
        if (pe.closest(exempt)) continue;
        // The content of a closed <details> (not its <summary>) is not rendered.
        const det = pe.closest('details:not([open])');
        if (det && !pe.closest('summary')) continue;
        if (modal && !modal.contains(pe)) continue;
        const cs = getComputedStyle(pe);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        // Text a scrolling or clipping ancestor hides is not on screen: intersect the ancestors' boxes.
        let visible = true;
        for (
          let p: HTMLElement | null = pe.parentElement;
          p && p !== document.body;
          p = p.parentElement
        ) {
          const o = getComputedStyle(p);
          // A sticky or fixed bar (the review's action row) covers content that scrolls under it by design.
          if (o.position === 'sticky' || o.position === 'fixed') {
            visible = false;
            break;
          }
          // Visually hidden text (the clip-rect or 1 px pattern of a screen-reader-only table) is not on screen.
          const pr0 = p.getBoundingClientRect();
          if (
            o.clip.startsWith('rect(') ||
            o.clipPath.startsWith('inset(50%') ||
            (pr0.width <= 1 && pr0.height <= 1)
          ) {
            visible = false;
            break;
          }
          if (/(hidden|auto|scroll|clip)/.test(o.overflowX + o.overflowY)) {
            const pr = p.getBoundingClientRect();
            const range0 = document.createRange();
            range0.selectNodeContents(t);
            const tr = range0.getBoundingClientRect();
            const cx = tr.left + tr.width / 2;
            const cy = tr.top + tr.height / 2;
            if (cx < pr.left || cx > pr.right || cy < pr.top || cy > pr.bottom) {
              visible = false;
              break;
            }
          }
        }
        if (!visible) continue;
        const range = document.createRange();
        range.selectNodeContents(t);
        for (const r of range.getClientRects()) {
          if (r.width < 2 || r.height < 2) continue;
          if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
          boxes.push({ r, k: `${key(pe)}` });
        }
      }
      const overlaps: string[] = [];
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i]!;
          const b = boxes[j]!;
          if (a.k === b.k) continue;
          const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
          const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
          if (w > 1 && h > 1) {
            const area = w * h;
            const small = Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
            if (area > 0.25 * small) overlaps.push(`${a.k} / ${b.k}`);
          }
        }
      }
      return { clipped, overlaps, truncated };
    });
  const before = await measure();
  const handle = await page.addStyleTag({ content: SPACING_CSS });
  await page.waitForTimeout(250);
  const after = await measure();
  await handle.evaluate((el) => (el as unknown as HTMLElement).remove());
  const had = new Set(before.clipped);
  const hadO = new Set(before.overlaps);
  return {
    clipped: [...new Set(after.clipped.filter((k) => !had.has(k)))].slice(0, 12),
    overlaps: [...new Set(after.overlaps.filter((k) => !hadO.has(k)))].slice(0, 12),
    truncated: after.truncated,
  };
}

export interface ForcedResult {
  sampled: number;
  /** Controls with no visible outline when focused under forced colours. */
  noRing: string[];
  /** Elements that opt out of forced colours (reported, judged by a person). */
  optOut: string[];
}

/**
 * Forced colours: the first ten Tab stops must show an outline when focused (reached by the keyboard, so
 * `:focus-visible` applies as it does for a user). Restores the media.
 */
export async function forced(page: Page): Promise<ForcedResult> {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    window.scrollTo(0, 0);
  });
  const noRing: string[] = [];
  let sampled = 0;
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return {
        ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1,
        what: `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}" outline ${cs.outlineStyle} ${cs.outlineWidth}`,
      };
    });
    if (!s) break;
    sampled++;
    if (!s.ring) noRing.push(s.what);
  }
  const optOut = await page.evaluate(() => {
    const names = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((e) => getComputedStyle(e).forcedColorAdjust === 'none')
      .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(/\s+/)[0]}`);
    return [...new Set(names)].slice(0, 12);
  });
  await page.emulateMedia({ forcedColors: 'none' });
  return { sampled, noRing, optOut };
}

export interface ReducedResult {
  /** Animations still running that move or fade something (transform, opacity, translate, scale, rotate). */
  running: string[];
}

/** `prefers-reduced-motion: reduce`: after the route settles no transform or opacity animation runs. */
export async function reduced(page: Page): Promise<ReducedResult> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(900);
  const running = await page.evaluate(() => {
    const MOVES = ['transform', 'opacity', 'translate', 'scale', 'rotate'];
    const out: string[] = [];
    for (const a of document.getAnimations()) {
      if (a.playState !== 'running') continue;
      const eff = a as Animation & { effect?: KeyframeEffect };
      const props = new Set<string>();
      for (const k of eff.effect?.getKeyframes?.() ?? [])
        for (const p of Object.keys(k)) if (MOVES.includes(p)) props.add(p);
      if (props.size === 0) continue;
      const t = eff.effect?.target as HTMLElement | null;
      const name =
        (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? '';
      out.push(
        `${t?.tagName.toLowerCase()}.${String(t?.className ?? '').split(/\s+/)[0]} ${name} [${[...props].join(',')}]`,
      );
    }
    return out.slice(0, 12);
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return { running };
}

export type Vision = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
export const VISIONS: Vision[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];

/** One colour-vision emulation: a screenshot under `.cache/m10/`, then back to normal vision. */
export async function vision(
  page: Page,
  kind: Vision,
  name: string,
  size: string,
): Promise<string> {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: kind });
    await page.waitForTimeout(150);
    mkdirSync('.cache/m10', { recursive: true });
    const path = `.cache/m10/vision-${kind}-${name}-${size}.png`;
    await page.screenshot({ path });
    return path;
  } finally {
    await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: 'none' });
    await cdp.detach();
  }
}

export interface NavResult {
  viewport: { w: number; h: number };
  items: number;
  /** Distinct top edges among the nav links: more than one means the nav wraps. */
  rows: number;
  headerWidth: number;
  navWidth: number;
  /** Width the nav's links need on one line, and the width the nav has. */
  needed: number;
  /** Links whose label is clipped or ellipsised, or that sit outside the header. */
  truncated: string[];
  /** The header's own horizontal overflow, and the page's. */
  headerOverflow: number;
  pageOverflow: number;
  headerHeight: number;
  smallestLink: number;
}

/** The Main nav at the current viewport: does it fit one row, whole, inside the header (M9's open item)? */
export async function navFit(page: Page): Promise<NavResult> {
  return page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('header.app-header')!;
    const nav = header.querySelector<HTMLElement>('nav')!;
    const links = [...nav.querySelectorAll<HTMLElement>('a')];
    const hr = header.getBoundingClientRect();
    const nr = nav.getBoundingClientRect();
    const rects = links.map((l) => l.getBoundingClientRect());
    const tops = new Set(rects.map((r) => Math.round(r.top)));
    const truncated = links
      .filter((l, i) => {
        const cs = getComputedStyle(l);
        const r = rects[i]!;
        return (
          l.scrollWidth > l.clientWidth + 1 ||
          cs.textOverflow === 'ellipsis' ||
          r.right > hr.right + 1 ||
          r.left < hr.left - 1
        );
      })
      .map((l) => l.textContent ?? '');
    const de = document.documentElement;
    return {
      viewport: { w: innerWidth, h: innerHeight },
      items: links.length,
      rows: tops.size,
      headerWidth: Math.round(hr.width),
      navWidth: Math.round(nr.width),
      needed: Math.round(rects.length ? rects[rects.length - 1]!.right - rects[0]!.left : 0),
      truncated,
      headerOverflow: header.scrollWidth - header.clientWidth,
      pageOverflow: de.scrollWidth - de.clientWidth,
      headerHeight: Math.round(hr.height),
      smallestLink: Math.round(Math.min(...rects.map((r) => Math.min(r.width, r.height)))),
    };
  });
}

/** Counts every key the page is sent (the keyboard game's total) and the longest run of Tabs between others. */
export function countKeys(page: Page) {
  const stats = { keystrokes: 0, tabRun: 0, longestTabRun: 0, byKey: {} as Record<string, number> };
  const press = page.keyboard.press.bind(page.keyboard);
  page.keyboard.press = async (key: string, opts?: { delay?: number }) => {
    stats.keystrokes++;
    stats.byKey[key] = (stats.byKey[key] ?? 0) + 1;
    if (key === 'Tab' || key === 'Shift+Tab') {
      stats.tabRun++;
      stats.longestTabRun = Math.max(stats.longestTabRun, stats.tabRun);
    } else stats.tabRun = 0;
    await press(key, opts);
  };
  return stats;
}
