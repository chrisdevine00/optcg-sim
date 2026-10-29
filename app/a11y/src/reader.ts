/**
 * The keyboard and ears of a pass. `NvdaReader` sends every key through NVDA (so browse mode,
 * focus mode and NVDA's own single-letter navigation apply, as for a real user) and reads NVDA's
 * speech; `DryReader` sends keys with Playwright and hears nothing, for checking the harness.
 */
import type { Page } from '@playwright/test';
import type { NVDA, VoiceOver } from '@guidepup/guidepup';
import { SpeechTap, type Heard } from './tap.ts';

export interface Reader {
  readonly name: string;
  /** Presses one key (Playwright key names: `Tab`, `Shift+Tab`, `ArrowRight`, `q`, `?`). */
  press(key: string): Promise<void>;
  /** Speech heard since `t`: every phrase, with times. */
  heardSince(t: number): Heard[];
  /** Guidepup's per-action log since index `i` (empty for the dry reader). */
  actionLog(): Promise<string[]>;
  /** Anything the reader wants to note in the record (tap status, versions). */
  notes(): string[];
}

/** NVDA key names for the keys the script uses that Guidepup's parser has no name for. */
const VK: Record<string, { vk: number; scan: number; shift?: boolean }> = {
  '?': { vk: 0xbf, scan: 53, shift: true },
  '/': { vk: 0xbf, scan: 53 },
  '+': { vk: 0xbb, scan: 13, shift: true },
};

const rawKey = (vk: number, scan: number) => ({
  toString: (down: boolean) =>
    JSON.stringify({ scan_code: scan, extended: false, vk_code: vk, pressed: down, type: 'key' }),
});

export class NvdaReader implements Reader {
  readonly name = 'NVDA';
  private tap = new SpeechTap();
  private tapOk = false;
  constructor(private nvda: NVDA) {}

  async start() {
    this.tapOk = await this.tap.start();
  }

  /**
   * Sends the key through NVDA. With the speech tap running, Guidepup's own capture is off: it
   * presses NVDA's stop-speech key before every action and waits for a second of silence after it,
   * which no real user does, and it never returns while something keeps talking (the first run
   * hung for 30 minutes that way). Instead this waits until NVDA has been quiet for a second, at
   * most 10 seconds, and the tap keeps every phrase.
   */
  async press(key: string) {
    const capture = !this.tapOk;
    const t0 = Date.now();
    const special = VK[key];
    const send = special
      ? // `perform` takes Guidepup key objects; these mimic `Key` for keys it does not name.
        this.nvda.perform(
          {
            keyCode: [rawKey(special.vk, special.scan)],
            modifiers: special.shift ? [rawKey(0x10, 42)] : [],
          } as never,
          { capture },
        )
      : // Guidepup splits on "+"; "Shift+Tab" works, a bare "+" does not (handled above).
        this.nvda.press(key === ' ' ? 'Space' : key, { capture });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<'late'>((r) => (timer = setTimeout(() => r('late'), 20_000)));
    const r = await Promise.race([send.then(() => 'sent' as const), late]);
    clearTimeout(timer);
    if (r === 'late') this.lateKeys.push(key);
    if (!capture) await this.quiet(t0);
  }

  /** Keys whose NVDA command did not return within 20 s (noted in the record). */
  lateKeys: string[] = [];

  private async quiet(t0: number) {
    for (;;) {
      const now = Date.now();
      const last = this.tap.heard.at(-1)?.t ?? 0;
      if (now - t0 >= 1000 && now - Math.max(last, t0) >= 1000) return;
      if (now - t0 >= 10_000) return;
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  heardSince(t: number) {
    return this.tap.since(t);
  }

  async actionLog() {
    return [...(await this.nvda.spokenPhraseLog())];
  }

  notes() {
    return this.tapOk
      ? [
          "Speech tap: joined the NVDA Remote relay; every phrase NVDA spoke is timestamped. Guidepup's per-key capture is off (it stops speech before each key).",
          ...(this.lateKeys.length
            ? [`NVDA commands that took over 20 s: ${this.lateKeys.join(', ')}`]
            : []),
        ]
      : [
          `Speech tap unavailable (${this.tap.error ?? 'unknown'}); only Guidepup's per-key capture is recorded.`,
        ];
  }

  stop() {
    this.tap.stop();
  }
}

export class DryReader implements Reader {
  readonly name = 'dry (no screen reader)';
  constructor(private page: Page) {}
  async press(key: string) {
    await this.page.keyboard.press(key === ' ' ? 'Space' : key);
    await this.page.waitForTimeout(250);
  }
  heardSince() {
    return [];
  }
  async actionLog() {
    return [];
  }
  notes() {
    return [
      'Dry run: keys sent by Playwright, no screen reader; only the live regions and focus are recorded.',
    ];
  }
}

/**
 * VoiceOver through Guidepup (the owner's Mac; docs/design/a11y-passes/README.md). There is no
 * speech tap: the record holds what Guidepup captures after each key.
 */
export class VoiceOverReader implements Reader {
  readonly name = 'VoiceOver';
  constructor(private vo: VoiceOver) {}
  async press(key: string) {
    const map: Record<string, string> = {
      '?': 'Shift+ForwardSlash',
      '+': 'Shift+Equals',
      ' ': 'Space',
    };
    await this.vo.press(map[key] ?? key, { capture: true });
  }
  heardSince() {
    return [];
  }
  async actionLog() {
    return [...(await this.vo.spokenPhraseLog())];
  }
  notes() {
    return ["VoiceOver: per-key speech is Guidepup's capture (no speech tap on macOS)."];
  }
}
