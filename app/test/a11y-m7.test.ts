/**
 * The M7 screen-reader script (app/a11y/src/m7.ts, accessibility.md §11.5) is wired the way the L
 * script is: its scenarios exist, it has a dry, an NVDA and a VoiceOver spec, and the NVDA workflow
 * can be dispatched with `script=m7` (and `all`). The script itself is run by the workflow, not here.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import {
  M7_BLUNDER_URL,
  M7_HINT_URL,
  M7_SETTINGS_URL,
  M7_TUTORIAL_URL,
  runM7,
} from '../a11y/src/m7.ts';

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

describe('the M7 script', () => {
  it('starts its game parts on scenarios that exist, at Step pace with repeatable AI budgets', () => {
    for (const url of [M7_HINT_URL, M7_BLUNDER_URL]) {
      const q = new URLSearchParams(url.split('?')[1]);
      expect(SCENARIOS[q.get('scenario')!], url).toBeDefined();
      expect(q.get('speed')).toBe('step');
      expect(q.get('aibudget')).toBe('iterations');
      expect(q.get('start')).toBe('1');
    }
    expect(M7_HINT_URL).toContain('scenario=ub-hint-1');
    expect(M7_BLUNDER_URL).toContain('scenario=ub-blunder-1');
    expect(M7_TUTORIAL_URL).toBe('tutorial?restart=1');
    expect(M7_SETTINGS_URL).toBe('settings');
    expect(typeof runM7).toBe('function');
  });

  it('has a dry, an NVDA and a VoiceOver spec that run it', () => {
    for (const k of ['dry', 'nvda', 'voiceover']) {
      const rel = `../a11y/m7.${k}.spec.ts`;
      expect(existsSync(new URL(rel, import.meta.url)), rel).toBe(true);
      expect(read(rel)).toContain('runM7(pass)');
    }
  });

  it('is a choice of the manual NVDA workflow, and is never run on push', () => {
    const wf = read('../../.github/workflows/a11y-nvda.yml');
    expect(wf).toMatch(/options: \[l, m3, m7, m8, both, all\]/);
    expect(wf).toContain("'m7' { 'm7\\.nvda' }");
    expect(wf).toMatch(/on:\s+workflow_dispatch:/);
    expect(wf).not.toMatch(/\n\s+push:/);
  });
});
