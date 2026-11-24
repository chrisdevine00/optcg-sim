/** OP16-042 Prisoner of Impel Down: "you may have any number of this card in your deck". */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { SCRIPTS, loadAllScripts } from '@optcg/cards';
import { DECK_RULES } from '../../src/defs.ts';
import { deckIssues } from '../../src/index.ts';
import { cards } from '../fixtures/index.ts';
import { BLUE_LEADER, PRISONER } from './helpers-op16g2.ts';

const all = cards();
const times = (n: number, id: string) => Array.from({ length: n }, () => id);
const op16 = (
  JSON.parse(
    readFileSync(new URL('../../../cards/data/sets/OP-16.json', import.meta.url), 'utf8'),
  ) as { cards: Card[] }
).cards;
/** Blue Characters of the set other than the Prisoner, 4 copies each fill a deck. */
const filler = op16
  .filter((c) => c.category === 'Character' && c.colors.join() === 'Blue' && c.id !== PRISONER)
  .map((c) => c.id);
const codes = (main: string[]) =>
  deckIssues({ leader: BLUE_LEADER, main }, all, 'free').map((i) => i.code);

describe('OP16-042 Prisoner of Impel Down', () => {
  it('the script carries the clause and the static deck-rules table agrees', async () => {
    await loadAllScripts();
    expect(SCRIPTS[PRISONER]!.rules).toEqual([{ anyNumberInDeck: true }]);
    expect(DECK_RULES[PRISONER]).toEqual([{ anyNumberInDeck: true }]);
  });

  it('8 copies of it are a legal deck; 50 copies of it too', () => {
    const main = [
      ...times(8, PRISONER),
      ...filler.slice(0, 10).flatMap((id) => times(4, id)),
      ...times(2, filler[10]!),
    ];
    expect(main).toHaveLength(50);
    expect(codes(main)).toEqual([]);
    expect(codes(times(50, PRISONER))).toEqual([]);
  });

  it('another card is still capped at 4 copies', () => {
    const main = [
      ...times(8, PRISONER),
      ...times(5, filler[0]!),
      ...filler.slice(1, 10).flatMap((id) => times(4, id)),
      filler[10]!,
    ];
    expect(main).toHaveLength(50);
    const issue = deckIssues({ leader: BLUE_LEADER, main }, all, 'free').find(
      (i) => i.code === 'copies',
    )!;
    expect(issue.cards).toEqual([filler[0]!]);
  });

  it('a card with no clause cannot have 5 copies (CR 5-1-2-3)', () => {
    const main = [
      ...times(5, filler[0]!),
      ...filler.slice(1, 12).flatMap((id) => times(4, id)),
    ].slice(0, 50);
    expect(codes(main)).toContain('copies');
  });
});
