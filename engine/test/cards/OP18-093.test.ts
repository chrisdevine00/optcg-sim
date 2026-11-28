/** OP18-093 Sleeptids: any number in the deck; [Blocker]. */
import { describe, expect, it } from 'vitest';
import { SCRIPTS, loadAllScripts } from '@optcg/cards';
import { DECK_RULES } from '../../src/defs.ts';
import { deckIssues } from '../../src/index.ts';
import { cards } from '../fixtures/index.ts';
import { game, PLAIN_BLUE, V } from './helpers.ts';
import { CP_L } from './helpers-op18-g4.ts';

const ID = 'OP18-093';
const times = (n: number, id: string) => Array.from({ length: n }, () => id);
const codes = (main: string[]) =>
  deckIssues({ leader: CP_L, main }, cards(), 'free').map((i) => i.code);

describe('OP18-093 Sleeptids', () => {
  it('the script carries the clause and the static deck-rules table agrees', async () => {
    await loadAllScripts();
    expect(SCRIPTS[ID]!.rules).toEqual([{ anyNumberInDeck: true }]);
    expect(DECK_RULES[ID]).toEqual([{ anyNumberInDeck: true }]);
  });

  it('a deck of 50 copies has no copy-limit issue', () => {
    expect(codes(times(50, ID))).not.toContain('copies');
  });

  it('control: 50 copies of an ordinary card break the 4-copy limit', () => {
    expect(codes(times(50, 'OP03-087'))).toContain('copies');
  });

  it('has [Blocker] and may block an attack on your Leader', () => {
    const g = game(
      { leader: CP_L, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    const blocker = g.find('p1', 'characters', ID);
    expect(g.card(blocker).keywords).toContain('Blocker');
    g.act({ type: 'block', blocker });
    expect(g.card(blocker).rested).toBe(true);
  });
});
