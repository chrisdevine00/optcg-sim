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

  async press(key: string) {
    const special = VK[key];
    if (special) {
      // `perform` takes Guidepup key objects; these mimic `Key` for keys it does not name.
      const shift = rawKey(0x10, 42);
      const k = rawKey(special.vk, special.scan);
      await this.nvda.perform({ keyCode: [k], modifiers: special.shift ? [shift] : [] } as never, {
        capture: true,
      });
      return;
    }
    // Guidepup splits on "+"; "Shift+Tab" works, a bare "+" does not (handled above).
    await this.nvda.press(key === ' ' ? 'Space' : key, { capture: true });
  }

  heardSince(t: number) {
    return this.tap.since(t);
  }

  async actionLog() {
    return [...(await this.nvda.spokenPhraseLog())];
  }

  notes() {
    return this.tapOk
      ? ['Speech tap: joined the NVDA Remote relay; every phrase NVDA spoke is timestamped.']
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
