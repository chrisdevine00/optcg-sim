/**
 * The scratch drafts of the hardest of the 143 M4b cards (docs/research/m4b-drafts/hard-cards.json)
 * must stay valid scripts: they are how wave 1 checked that the runtime's shape set is enough, and
 * wave 2 starts from them. A draft stops validating when a shape is removed or renamed.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateScript } from '../src/dsl-validate.ts';

const drafts = JSON.parse(
  readFileSync(new URL('../../docs/research/m4b-drafts/hard-cards.json', import.meta.url), 'utf8'),
) as Record<string, unknown>[];

describe('M4b hard-card drafts', () => {
  it('is a list of drafts for distinct cards', () => {
    const ids = drafts.map((d) => d.cardId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(30);
  });

  it.each(drafts.map((d) => [d.cardId as string, d] as const))('%s validates', (_id, draft) => {
    const script = Object.fromEntries(Object.entries(draft).filter(([k]) => !k.startsWith('_')));
    expect(validateScript(script)).toEqual([]);
  });
});
