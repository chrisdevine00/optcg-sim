/** The scripted-pass harness (app/a11y): the speech probe and the tap-dead fallback (round 3). */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Pass } from '../a11y/src/pass.ts';
import { NvdaReader, type Reader } from '../a11y/src/reader.ts';

const fakePage = () =>
  ({
    bringToFront: async () => {},
    evaluate: async () => undefined,
    waitForTimeout: async () => {},
    url: () => 'about:blank',
  }) as never;

function fakeReader(hears: boolean) {
  let proven = false;
  const r = {
    name: 'NVDA',
    hearsSpeech: true,
    press: async () => {},
    heardSince: (t: number) =>
      hears ? [{ t: t + 1, text: 'Speech probe one, alpha bravo.' }] : [],
    actionLog: async () => [],
    notes: () => [],
    speechProven: () => void (proven = true),
    tapDead: () => null,
  } satisfies Reader;
  return { r, proven: () => proven };
}

describe('the speech probe', () => {
  it('passes when the tap hears the known phrase, and proves the speech source', async () => {
    const { r, proven } = fakeReader(true);
    const pass = new Pass(fakePage(), r, 't', mkdtempSync(join(tmpdir(), 'a11y-')), 'l');
    expect(await pass.speechProbe()).toBe(true);
    expect(proven()).toBe(true);
    expect(pass.invalid).toBeNull();
  });

  it('marks the record invalid and stops the run when NVDA is mute (Firefox r3)', async () => {
    const { r, proven } = fakeReader(false);
    const pass = new Pass(fakePage(), r, 't', mkdtempSync(join(tmpdir(), 'a11y-')), 'l');
    await expect(pass.speechProbe()).rejects.toThrow(/SPEECH TAP DEAD/);
    expect(proven()).toBe(false);
    expect(pass.invalid).toMatch(/INVALID/);
  });
});

describe('Guidepup capture is turned off only for a proven, live tap', () => {
  it('stays on before the probe and after the tap dies', async () => {
    const calls: boolean[] = [];
    const nvda = {
      press: async (_k: string, o: { capture: boolean }) => void calls.push(o.capture),
      spokenPhraseLog: async () => [],
    };
    const r = new NvdaReader(nvda as never);
    const tap = { alive: true, heard: [] as unknown[], dead: null as string | null, deadAt: null };
    Object.assign(r, { tap, tapOk: true });
    await r.press('Tab'); // not proven yet
    r.speechProven();
    await r.press('Tab'); // proven and alive
    tap.alive = false;
    tap.dead = 'the relay closed the connection';
    await r.press('Tab'); // dead
    expect(calls).toEqual([true, false, true]);
    expect(r.notes().join(' ')).toMatch(/SPEECH TAP DEAD/);
  }, 20_000);
});
