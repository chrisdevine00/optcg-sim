/** Every scripted card has a test file here (PLAN §5: one test per scripted card). */
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCRIPTED_IDS } from '@optcg/cards';

describe('scripted cards have tests', () => {
  it.each([...SCRIPTED_IDS].sort())('%s', (id) => {
    expect(existsSync(new URL(`./${id}.test.ts`, import.meta.url))).toBe(true);
  });
});
