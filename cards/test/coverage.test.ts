import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SetFile } from '../src/schema.ts';
import { automation, coverage, playsFully } from '../src/coverage.ts';

const op17 = JSON.parse(
  readFileSync(new URL('../data/sets/OP-17.json', import.meta.url), 'utf8'),
) as SetFile;
const card = (id: string) => op17.cards.find((c) => c.id === id)!;

describe('automation status', () => {
  it('marks every effect as not automated while no scripts exist', () => {
    expect(automation(card('OP17-039'))).toBe('not-automated');
    expect(automation(card('OP17-039'), new Set(['OP17-039']))).toBe('scripted');
  });

  it('treats a verified keyword-only card as automated through its keywords', () => {
    const blockerOnly = {
      ...card('OP17-039'),
      effectText: '[Blocker] (After your opponent declares an attack, you may rest this card.)',
      triggerText: null,
      keywords: ['Blocker' as const],
      verified: true,
    };
    expect(automation(blockerOnly)).toBe('keywords');
    expect(automation({ ...blockerOnly, verified: false })).toBe('not-automated');
    expect(automation({ ...blockerOnly, effectText: '', keywords: [] })).toBe('vanilla');
  });
});

describe('coverage counts', () => {
  it('counts scripted, nothing-to-script and not-automated separately', () => {
    const vanilla = { ...card('OP17-039'), id: 'ZZ-1', effectText: '', triggerText: null };
    const text = card('OP17-039');
    const n = coverage([vanilla, text, { ...text, id: 'ZZ-2' }], new Set(['OP17-039']));
    expect(n).toEqual({ total: 3, scripted: 1, noScriptNeeded: 1, notAutomated: 1, fully: 2 });
  });

  it('plays fully unless the effect does not happen', () => {
    expect(['vanilla', 'keywords', 'scripted'].every((a) => playsFully(a as never))).toBe(true);
    expect(playsFully('not-automated')).toBe(false);
  });
});
