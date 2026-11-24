/**
 * Helpers for the M6b wave 1 planted tests. Every probe is a script planted on a vanilla test card
 * and checked by the script validator first, so it is also a legal script (the M4b method,
 * docs/research/m4b-runtime-audit.md §2). No real card is scripted here.
 */
import { expect } from 'vitest';
import { validateScript, type CardScript, type Cost, type Step } from '@optcg/cards';
import type { Ability } from '../../../src/testing.ts';
import { BLUE, game } from '../helpers.ts';

/** An [Activate: Main] on the probe card (`a`), validated as a script. */
export function main(effect: Step[], cost?: Cost[], extra: Partial<Ability> = {}): Ability {
  const ab = { id: 'a', kind: 'activate', when: 'activateMain', effect, ...extra } as Ability;
  if (cost) (ab as { cost?: Cost[] }).cost = cost;
  expectValid([ab]);
  return ab;
}

/** Any abilities, validated as a script of the probe card. */
export function expectValid(abilities: Ability[]): void {
  const script = {
    cardId: 'OP02-060',
    textHash: 'x',
    verified: { source: 't', date: '2026-11-23' },
    abilities,
  } as unknown as CardScript;
  expect(validateScript(script)).toEqual([]);
}

/** The errors `validateScript` gives a single ability. */
export function errorsOf(ability: unknown): string[] {
  return validateScript({
    cardId: 'OP02-060',
    textHash: 'x',
    verified: { source: 't', date: '2026-11-23' },
    abilities: [ability],
  });
}

/** Run the probe ability on the first `who` Character of p1. */
export const run = (g: ReturnType<typeof game>, who = BLUE) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', who), ability: 'a' });

/** Is the probe ability offered to p1 (its cost is payable)? */
export const offered = (g: ReturnType<typeof game>, who = BLUE): boolean =>
  g
    .legal()
    .some(
      (a) =>
        a.type === 'activate' && a.ability === 'a' && a.card === g.find('p1', 'characters', who),
    );
