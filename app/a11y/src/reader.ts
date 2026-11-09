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
  /**
   * Presses one key (Playwright key names: `Tab`, `Shift+Tab`, `ArrowRight`, `q`, `?`). Three
   * pseudo-keys read with the reader's own navigation, as a person would: `Browse:Next` (the next
   * line or item), `Browse:Heading` and `Browse:List` (the next heading or list). NVDA sends the
   * browse-mode keys, VoiceOver its commands; the dry reader moves nothing.
   */
  press(key: string): Promise<void>;
  /** Speech heard since `t`: every phrase, with times. */
  heardSince(t: number): Heard[];
  /** Guidepup's per-action log since index `i` (empty for the dry reader). */
  actionLog(): Promise<string[]>;
  /** Does this reader hear speech at all (a tap or a capture)? The probe needs it. */
  readonly hearsSpeech: boolean;
  /**
   * The reader's speech source has proved it delivers (the probe heard a known phrase). Only then
   * does the NVDA reader turn Guidepup's own per-key capture off.
   */
  speechProven(): void;
  /** Why the speech tap died during the run, or null (always null where there is no tap). */
  tapDead(): string | null;
  /** Anything the reader wants to note in the record (tap status, versions). */
  notes(): string[];
}

/** NVDA key names for the keys the script uses that Guidepup's parser has no name for. */
const VK: Record<string, { vk: number; scan: number; shift?: boolean }> = {
  '?': { vk: 0xbf, scan: 53, shift: true },
  '/': { vk: 0xbf, scan: 53 },
  '+': { vk: 0xbb, scan: 13, shift: true },
};

/** NVDA browse-mode keys for the pseudo-keys of `Reader.press`. */
const BROWSE_NVDA: Record<string, string> = {
  'Browse:Next': 'ArrowDown',
  'Browse:Heading': 'h',
  'Browse:List': 'l',
};

const rawKey = (vk: number, scan: number) => ({
  toString: (down: boolean) =>
    JSON.stringify({ scan_code: scan, extended: false, vk_code: vk, pressed: down, type: 'key' }),
});

export class NvdaReader implements Reader {
  readonly name = 'NVDA';
  readonly hearsSpeech = true;
  private tap = new SpeechTap();
  private tapOk = false;
  /** Set by the probe: a known phrase reached the tap. Until then Guidepup's capture stays on. */
  private proven = false;
  constructor(private nvda: NVDA) {}

  async start() {
    this.tapOk = await this.tap.start();
  }

  speechProven() {
    this.proven = true;
  }

  tapDead() {
    return this.tapOk ? this.tap.dead : null;
  }

  /** The tap is the speech source only while it has proved it delivers and is still up. */
  private get tapUsable() {
    return this.tapOk && this.proven && this.tap.alive;
  }

  /**
   * Sends the key through NVDA. With a proven speech tap, Guidepup's own capture is off: it
   * presses NVDA's stop-speech key before every action and waits for a second of silence after it,
   * which no real user does, and it never returns while something keeps talking (the first run
   * hung for 30 minutes that way). Instead this waits until NVDA has been quiet for a second, at
   * most 10 seconds, and the tap keeps every phrase.
   */
  async press(key: string) {
    key = BROWSE_NVDA[key] ?? key;
    const capture = !this.tapUsable;
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
    const dead = this.tap.dead
      ? [
          `SPEECH TAP DEAD: ${this.tap.dead} at ${new Date(this.tap.deadAt ?? 0).toISOString()}; ${this.tap.heard.length} phrases had been heard. Keys after that use Guidepup's per-key capture only, and the speech columns of the steps after it are incomplete.`,
        ]
      : [];
    return this.tapOk
      ? [
          this.proven
            ? "Speech tap: joined the NVDA Remote relay and passed the speech probe; every phrase NVDA spoke is timestamped. Guidepup's per-key capture is off while the tap is up (it stops speech before each key)."
            : 'Speech tap: joined the NVDA Remote relay but did NOT pass the speech probe: Guidepup per-key capture stayed on.',
          `Speech tap phrases heard: ${this.tap.heard.length}.`,
          ...dead,
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
  readonly hearsSpeech = false;
  speechProven() {}
  tapDead() {
    return null;
  }
  constructor(private page: Page) {}
  async press(key: string) {
    // No screen reader, no virtual cursor: the browse pseudo-keys move nothing (the page's own
    // `h` and `l` keys must not fire either).
    if (key.startsWith('Browse:')) {
      await this.page.waitForTimeout(100);
      return;
    }
    // NVDA's browse mode takes Enter on a heading and clicks it instead of sending the key (the L
    // pass, L-SR1): the dry run does the same, so it fails where a screen-reader user would.
    if (key === 'Enter') {
      const onHeading = await this.page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (el && /^H[1-6]$/.test(el.tagName)) {
          el.click();
          return true;
        }
        return false;
      });
      if (onHeading) {
        await this.page.waitForTimeout(250);
        return;
      }
    }
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
  readonly hearsSpeech = false;
  speechProven() {}
  tapDead() {
    return null;
  }
  constructor(private vo: VoiceOver) {}
  async press(key: string) {
    // VoiceOver's own navigation (Quick Nav is off): VO+Right, and the rotor-style find commands.
    if (key === 'Browse:Next') return void (await this.vo.next());
    if (key === 'Browse:Heading')
      return void (await this.vo.perform(this.vo.keyboardCommands.findNextHeading));
    if (key === 'Browse:List')
      return void (await this.vo.perform(this.vo.keyboardCommands.findNextList));
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
