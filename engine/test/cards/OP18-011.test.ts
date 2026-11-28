/** OP18-011 Nefeltari Vivi. */
import { describe, expect, it } from 'vitest';
import { AA1, ALA1, mk } from './helpers-op18-g1.ts';

const ID = 'OP18-011';
const theirs = { turn: 4, activePlayer: 'p2' } as const;

describe('OP18-011 Nefeltari Vivi', () => {
  it('your {Animal}{Alabasta} Characters gain +1000 power', () => {
    const g = mk({ characters: [ID, AA1] });
    expect(g.power(g.find('p1', 'characters', AA1))).toBe(4000);
  });

  it('a Character with only {Alabasta}, an opponent Character, and Vivi herself are not boosted', () => {
    const g = mk({ characters: [ID, ALA1] }, { characters: [AA1] });
    expect(g.power(g.find('p1', 'characters', ALA1))).toBe(3000);
    expect(g.power(g.find('p2', 'characters', AA1))).toBe(3000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(0);
  });

  it("[Opponent's Turn] she gains [Blocker] and +6000 power", () => {
    const g = mk({ characters: [ID] }, {}, theirs);
    const id = g.find('p1', 'characters', ID);
    expect(g.power(id)).toBe(6000);
    expect(g.card(id).keywords).toContain('Blocker');
  });

  it('on your own turn she has neither', () => {
    const g = mk({ characters: [ID] });
    const id = g.find('p1', 'characters', ID);
    expect(g.power(id)).toBe(0);
    expect(g.card(id).keywords).not.toContain('Blocker');
  });
});
