/**
 * One scripted pass: drives the page through a `Reader`, and records per step every key, where
 * focus landed, what the screen reader said, and what the app wrote into its live regions.
 * Records go to `results/<project>/` as JSON and Markdown (the workflow uploads that folder).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import type { Reader } from './reader.ts';
import type { Heard } from './tap.ts';

export interface Focus {
  /** The focused element as the accessibility tree has it: `button "Your Leader, Kaido, …"`. */
  aria: string;
  name: string;
  id: string;
  zone: string;
  inBoard: boolean;
  inDecision: boolean;
  inDialog: boolean;
  inCoach: boolean;
  /** Inside a decision's list of options (order, choose). */
  inOptions: boolean;
  tag: string;
}

export interface KeyRec {
  key: string;
  t: number;
  focus: string;
  kind: string;
  /** Speech heard from this key until the next one (speech tap; filled in when the step ends). */
  heard: string[];
  /** What Guidepup captured for this key press (its own per-action log). */
  captured: string[];
  /** Live-region writes from this key until the next one. */
  live: string[];
}

export interface Live {
  t: number;
  region: string;
  text: string;
}

export type Status = 'done' | 'not built' | 'not reached' | 'error';

export interface StepRec {
  n: string;
  title: string;
  do: string;
  expect: string;
  status: Status;
  start: number;
  end: number;
  keys: KeyRec[];
  heard: Heard[];
  live: Live[];
  guidepup: string[];
  notes: string[];
  assists: string[];
  error?: string;
}

const LIVE_SCRIPT = () => {
  const w = window as unknown as { __a11yLive: Live[] };
  w.__a11yLive = [];
  const last: Record<string, string> = {};
  const scan = () => {
    for (const id of ['announce-polite', 'announce-assertive']) {
      const el = document.getElementById(id);
      if (!el) continue;
      const text = (el.textContent ?? '').trim();
      if (text && text !== last[id]) w.__a11yLive.push({ t: Date.now(), region: id, text });
      last[id] = text;
    }
  };
  new MutationObserver(scan).observe(document, {
    subtree: true,
    childList: true,
    characterData: true,
  });
};

/**
 * Records what the page is delivered, so the next NVDA run shows exactly what NVDA sends: a
 * capture-phase logger on the decision panel (pointerdown, mousedown, mouseup, click with
 * `isTrusted`, `detail` and `pointerType`; keydown; focus and blur) and a window keydown counter
 * (the keyboard canary: when keys stop arriving, the browser's toolbar has the keyboard).
 */
const TRACE_SCRIPT = () => {
  const w = window as unknown as { __a11yTrace: TraceRec[]; __a11yKeys: number };
  w.__a11yTrace = [];
  w.__a11yKeys = 0;
  const desc = (t: EventTarget | null) => {
    const e = t as HTMLElement | null;
    if (!e || !e.tagName) return String(t);
    return `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''}`;
  };
  window.addEventListener('keydown', () => void (w.__a11yKeys += 1), true);
  const log = (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (!t?.closest || !(t.closest('#decision') || t === document.body)) return;
    const x = e as MouseEvent & KeyboardEvent & PointerEvent;
    const rec: TraceRec = {
      t: Date.now(),
      type: e.type,
      target: desc(e.target),
      trusted: e.isTrusted,
    };
    if (e.type === 'click' || e.type.startsWith('mouse') || e.type.startsWith('pointer'))
      rec.detail = `detail=${x.detail} pointerType=${x.pointerType ?? ''} button=${x.button}`;
    if (e.type === 'keydown') rec.detail = `key=${x.key}${x.shiftKey ? '+shift' : ''}`;
    if (e.type === 'focusin' || e.type === 'focusout')
      rec.detail = `related=${desc((e as FocusEvent).relatedTarget)}`;
    w.__a11yTrace.push(rec);
  };
  for (const type of [
    'pointerdown',
    'mousedown',
    'mouseup',
    'click',
    'keydown',
    'focusin',
    'focusout',
  ])
    document.addEventListener(type, log, true);
};

interface TraceRec {
  t: number;
  type: string;
  target: string;
  trusted: boolean;
  detail?: string;
}

export class Pass {
  steps: StepRec[] = [];
  /** Every "harness did not reach X" the run noted, with its step (the dry spec asserts none). */
  unreached: string[] = [];
  private cur: StepRec | null = null;
  private logStart = 0;

  constructor(
    readonly page: Page,
    readonly reader: Reader,
    readonly project: string,
    readonly outDir: string,
    /** The script's name: the record files are `<script>.json` and `<script>.md`. */
    readonly script: string = 'm3',
  ) {}

  /** Call before the first navigation: installs the live-region recorder. */
  async install() {
    await this.page.addInitScript(LIVE_SCRIPT);
    await this.page.addInitScript(TRACE_SCRIPT);
  }

  /**
   * Writes what the decision panel was delivered since `since` into the step's notes (L-SR1,
   * L-SR11): every pointer, mouse, click, key and focus event, with `isTrusted`.
   */
  async dumpTrace(label: string, since: number) {
    const all = await this.page
      .evaluate(() => (window as unknown as { __a11yTrace?: TraceRec[] }).__a11yTrace ?? [])
      .catch(() => [] as TraceRec[]);
    const rows = all.filter((r) => r.t >= since);
    this.cur?.notes.push(
      `Event trace, ${label}: ${
        rows.length
          ? rows
              .map(
                (r) =>
                  `${r.type}@${r.target}${r.trusted ? '' : ' (script-made)'}${r.detail ? ` [${r.detail}]` : ''}`,
              )
              .join(' | ')
          : '(no event reached the decision panel or the page body)'
      }`,
    );
  }

  // ------------------------------------------------------------------ page state

  async focus(): Promise<Focus> {
    const f = await this.page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      const label = el?.getAttribute('aria-label');
      const text = (el?.innerText ?? el?.textContent ?? '').replace(/\s+/g, ' ').trim();
      return {
        name: (label ?? text).slice(0, 300),
        id: el?.id ?? '',
        zone: el?.dataset?.zone ?? el?.closest<HTMLElement>('[data-zone]')?.dataset.zone ?? '',
        inBoard: !!el?.closest('.board'),
        inDecision: !!el?.closest('#decision'),
        inDialog: !!el?.closest('dialog, [role="dialog"]'),
        inCoach: !!el?.closest('.coach'),
        inOptions: !!el?.closest('.dec-list, .opts'),
        tag: el?.tagName.toLowerCase() ?? '',
      };
    });
    let aria: string;
    try {
      const snap = await this.page.locator(':focus').first().ariaSnapshot({ timeout: 1000 });
      aria = snap.split('\n')[0]!.replace(/^- /, '').slice(0, 300);
    } catch {
      aria = `${f.tag} (no accessible node)`;
    }
    return { ...f, aria };
  }

  async kind(): Promise<string> {
    return (
      (await this.page
        .locator('#decision')
        .getAttribute('data-kind', { timeout: 2000 })
        .catch(() => null)) ?? ''
    );
  }

  async decisionText(): Promise<string> {
    return (
      await this.page
        .locator('#decision')
        .innerText({ timeout: 2000 })
        .catch(() => '')
    ).replace(/\s+/g, ' ');
  }

  async live(): Promise<Live[]> {
    return await this.page.evaluate(
      () => (window as unknown as { __a11yLive?: Live[] }).__a11yLive ?? [],
    );
  }

  // ------------------------------------------------------------------ recording

  async step(
    n: string,
    title: string,
    doText: string,
    expect: string,
    fn: (s: StepRec) => Promise<unknown>,
  ): Promise<StepRec> {
    const rec: StepRec = {
      n,
      title,
      do: doText,
      expect,
      status: 'done',
      start: Date.now(),
      end: 0,
      keys: [],
      heard: [],
      live: [],
      guidepup: [],
      notes: [],
      assists: [],
    };
    this.cur = rec;
    this.logStart = (await this.reader.actionLog()).length;
    try {
      const st = await fn(rec);
      if (typeof st === 'string') rec.status = st as Status;
    } catch (e) {
      rec.status = 'error';
      rec.error = e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e);
    }
    // Let trailing announcements land before closing the step.
    await this.page.waitForTimeout(1500);
    rec.end = Date.now();
    rec.heard = this.reader.heardSince(rec.start).filter((h) => h.t <= rec.end);
    rec.live = (await this.live()).filter((l) => l.t >= rec.start && l.t <= rec.end);
    rec.guidepup = (await this.reader.actionLog()).slice(this.logStart);
    for (let i = 0; i < rec.keys.length; i++) {
      const from = rec.keys[i]!.t;
      const to = rec.keys[i + 1]?.t ?? rec.end;
      rec.keys[i]!.heard = rec.heard.filter((h) => h.t >= from && h.t < to).map((h) => h.text);
      rec.keys[i]!.live = rec.live
        .filter((l) => l.t >= from && l.t < to)
        .map((l) => (l.region === 'announce-assertive' ? `(assertive) ${l.text}` : l.text));
    }
    this.steps.push(rec);
    this.cur = null;
    this.save();
    return rec;
  }

  note(text: string) {
    this.cur?.notes.push(text);
  }

  /**
   * The script's own check that a step reached the state it needs (the attack confirmed, the coach
   * tall, the detector on). When it did not, the record says so, in the step's notes, instead of
   * the script carrying on as if it had; the verdict then marks the step "not reached (harness)".
   */
  async reached(what: string, ok: boolean | Promise<boolean>): Promise<boolean> {
    if (await ok) return true;
    this.cur?.notes.push(`HARNESS: did not reach ${what}`);
    this.unreached.push(`${this.cur?.n ?? '?'}: ${what}`);
    return false;
  }

  /**
   * The keyboard canary: a harmless key (Shift) must reach the page's window keydown listener.
   * `document.hasFocus()` cannot tell (Playwright's Firefox answers true whatever the OS does), and
   * a Playwright click does not give the page OS keyboard focus.
   */
  async keyboardAlive(): Promise<boolean> {
    const count = () =>
      this.page
        .evaluate(() => (window as unknown as { __a11yKeys?: number }).__a11yKeys ?? 0)
        .catch(() => -1);
    const before = await count();
    await this.reader.press('Shift');
    await this.page.waitForTimeout(250);
    return (await count()) > before;
  }

  /**
   * Gives the page real keyboard focus: after a goto or reload Firefox leaves it in the toolbar
   * while `document.activeElement` still points at the old element. Checks the canary; while it is
   * silent presses F6 (browsers move the keyboard between the toolbar and the page with it) and
   * checks again. Recorded as an assist; returns false (with a note) if it never arrives.
   */
  async focusPage(why: string): Promise<boolean> {
    await this.page.bringToFront();
    for (let i = 0; i < 4; i++) {
      if (await this.keyboardAlive()) {
        if (i > 0) this.cur?.assists.push(`page given keyboard focus with F6 x${i}: ${why}`);
        return true;
      }
      await this.reader.press('F6');
      await this.page.waitForTimeout(300);
    }
    this.cur?.notes.push(`Keyboard focus could not be given to the page (${why}); canary silent.`);
    return false;
  }

  /**
   * The harness moved focus itself because the keyboard path did not get there (for example a
   * letter key that NVDA's browse mode took). Recorded, so the record never hides it.
   */
  async assist(why: string, selectorOrFn: string | (() => Promise<void>)) {
    this.cur?.assists.push(why);
    if (typeof selectorOrFn === 'string') await this.page.locator(selectorOrFn).first().focus();
    else await selectorOrFn();
    await this.page.waitForTimeout(200);
  }

  async press(key: string): Promise<Focus> {
    const t = Date.now();
    const before = (await this.reader.actionLog()).length;
    await this.reader.press(key);
    const captured = (await this.reader.actionLog()).slice(before).filter(Boolean);
    const f = await this.focus();
    this.saveLater();
    this.cur?.keys.push({
      key,
      t,
      focus: f.aria,
      kind: await this.kind(),
      heard: [],
      captured,
      live: [],
    });
    return f;
  }

  /**
   * Presses `key` until `pred` holds for the focus (checked before each press). Stops, with a
   * note, when the keyboard focus has left the page (the browser's toolbar took it).
   */
  async until(key: string, pred: (f: Focus) => boolean, max = 20): Promise<Focus | null> {
    let f = await this.focus();
    for (let i = 0; i < max; i++) {
      if (pred(f)) return f;
      const prev = `${f.id}|${f.tag}|${f.name}|${f.aria}`;
      f = await this.press(key);
      // A Tab that moved nothing may have left the page (the toolbar has the keyboard). Ask the
      // canary; if the keys are not arriving, stop and say so instead of walking the toolbar.
      if (/Tab$/.test(key) && !pred(f) && prev === `${f.id}|${f.tag}|${f.name}|${f.aria}`) {
        if (!(await this.keyboardAlive())) {
          this.note(
            `Keyboard focus left the page after ${key} (canary silent); the key loop stopped.`,
          );
          this.cur?.assists.push('keys were not reaching the page; loop stopped');
          await this.focusPage('keyboard focus had left the page');
          return null;
        }
      }
    }
    return pred(f) ? f : null;
  }

  // ------------------------------------------------------------------ output

  private lastSave = 0;
  /** Saves at most every 10 s while a step runs, so a hung run still leaves its speech. */
  private saveLater() {
    if (Date.now() - this.lastSave < 10_000) return;
    this.save();
  }

  save() {
    this.lastSave = Date.now();
    mkdirSync(this.outDir, { recursive: true });
    const meta = {
      project: this.project,
      reader: this.reader.name,
      readerNotes: this.reader.notes(),
      unreached: this.unreached,
      url: this.page.url(),
      when: new Date().toISOString(),
      commit: process.env.GITHUB_SHA ?? process.env.A11Y_COMMIT ?? 'local',
      versions: versions(),
    };
    writeFileSync(
      join(this.outDir, `${this.script}.json`),
      JSON.stringify({ meta, steps: this.withCurrent() }, null, 2),
    );
    writeFileSync(
      join(this.outDir, `${this.script}.md`),
      toMarkdown(meta, this.withCurrent(), this.script),
    );
  }

  /** The finished steps, plus the running one with the speech heard so far. */
  private withCurrent(): StepRec[] {
    if (!this.cur) return this.steps;
    const c = this.cur;
    const heard = this.reader.heardSince(c.start);
    return [...this.steps, { ...c, status: 'error', error: 'in progress when saved', heard }];
  }
}

function versions(): Record<string, string> {
  const v: Record<string, string> = {};
  for (const k of [
    'NVDA_VERSION',
    'BROWSER_VERSION',
    'GUIDEPUP_VERSION',
    'IMAGE_OS',
    'IMAGE_VERSION',
    'RUNNER_OS',
  ])
    if (process.env[k]) v[k] = process.env[k]!;
  return v;
}

const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function toMarkdown(meta: Record<string, unknown>, steps: StepRec[], script: string): string {
  const out: string[] = [];
  out.push(`# ${script.toUpperCase()} screen-reader pass log (${String(meta.project)})`, '');
  out.push('```json', JSON.stringify(meta, null, 2), '```', '');
  for (const s of steps) {
    out.push(`## Step ${s.n}: ${s.title} (${s.status})`, '');
    out.push(`**Do:** ${s.do}`, '', `**Expect:** ${s.expect}`, '');
    if (s.error) out.push('**Error:**', '```', s.error.slice(0, 2000), '```', '');
    for (const n of s.notes) out.push(`- Note: ${n}`);
    for (const a of s.assists) out.push(`- Harness assist: ${a}`);
    if (s.notes.length || s.assists.length) out.push('');
    out.push(
      '| # | Key | Focus after | Decision | Heard (speech tap) | Guidepup capture | Live regions |',
    );
    out.push('| --- | --- | --- | --- | --- | --- | --- |');
    s.keys.forEach((k, i) =>
      out.push(
        `| ${i + 1} | \`${esc(k.key)}\` | ${esc(k.focus)} | ${k.kind} | ${esc(k.heard.join(' ⏐ '))} | ${esc(k.captured.join(' ⏐ '))} | ${esc(k.live.join(' ⏐ '))} |`,
      ),
    );
    out.push('');
    if (s.guidepup.length) {
      out.push('<details><summary>Guidepup per-key capture</summary>', '');
      for (const g of s.guidepup) out.push(`- ${esc(g)}`);
      out.push('', '</details>', '');
    }
  }
  return out.join('\n');
}
