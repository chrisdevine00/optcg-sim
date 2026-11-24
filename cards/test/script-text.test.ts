/**
 * Every effect script was written against its card's current verified text (CardScript.textHash).
 * A scheduled card-data PR that changes a scripted card's text (errata) fails here until the card is
 * re-verified and its script and hash updated (ARCHITECTURE §3 "Update pipeline", M6b-5).
 */
import { describe, expect, it } from 'vitest';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCRIPTS } from '../effects/index.ts';
import { textHash } from '../src/dsl.ts';
import { readSnapshot } from '../scripts/update.ts';

const snapshot = readSnapshot(
  join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'data'),
)!;

describe('scripts match their card text', () => {
  it.each(Object.values(SCRIPTS).map((s) => [s.cardId, s] as const))('%s', (id, s) => {
    const card = snapshot.get(id);
    expect(card, `${id} is not in the card data`).toBeDefined();
    expect(s.textHash, `${id}: card text changed since the script was written; re-verify it`).toBe(
      textHash(card!.effectText, card!.triggerText),
    );
  });
});
