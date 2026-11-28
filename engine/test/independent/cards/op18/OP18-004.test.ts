/**
 * OP18-004 Karoo (Red Character, cost 3, 4000, {Animal}/{Alabasta}).
 *
 * Card text (cards/data):
 *   "Apply each of the following effects based on this Character's power:
 *    - If it has 5000 power or more, this Character gains [Rush].
 *    - If it has 6000 power or more, this Character gains [Banish].
 *    - If it has 7000 power or more, this Character gains [Unblockable]."
 *
 * Reading (m6b-audit Q14): cumulative tiers on the Character's current power, which includes DON!!
 * given (only on its owner's turn) and other effects (OP18-001's +1000).
 */
import { describe, expect, it } from 'vitest';
import { canHit, kw, LC, mine, theirs, at, VC, playCard } from './kit-c.ts';

const KAROO = 'OP18-004';

function board(don: number, leader: string = LC.luffy, opts: object = {}) {
  const g = mine(leader, {
    characters: [{ card: KAROO, don }],
    costArea: { active: 10 - don, rested: 0 },
    ...opts,
  });
  return { g, k: at(g, 'p1', 'characters', KAROO) };
}

describe('OP18-004 Karoo: keywords by current power', () => {
  it('4000 power: no keyword', () => {
    const { g, k } = board(0);
    expect(g.power(k)).toBe(4000);
    expect(kw(g, k)).not.toContain('Rush');
    expect(kw(g, k)).not.toContain('Banish');
    expect(kw(g, k)).not.toContain('Unblockable');
  });

  it('5000 power: Rush only', () => {
    const { g, k } = board(1);
    expect(g.power(k)).toBe(5000);
    expect(kw(g, k)).toContain('Rush');
    expect(kw(g, k)).not.toContain('Banish');
    expect(kw(g, k)).not.toContain('Unblockable');
  });

  it('6000 power: Rush and Banish', () => {
    const { g, k } = board(2);
    expect(kw(g, k)).toContain('Rush');
    expect(kw(g, k)).toContain('Banish');
    expect(kw(g, k)).not.toContain('Unblockable');
  });

  it('7000 power: Rush, Banish and Unblockable', () => {
    const { g, k } = board(3);
    expect(g.power(k)).toBe(7000);
    for (const w of ['Rush', 'Banish', 'Unblockable']) expect(kw(g, k)).toContain(w);
  });

  it('with OP18-001 (+1000) a played Karoo has 5000 power, so Rush lets it attack the turn it is played', () => {
    // Played from hand with OP18-001 on the field: 4000 + 1000 = 5000 power, so Rush applies.
    const g = mine(LC.karoo, { hand: [KAROO] });
    playCard(g, KAROO);
    const k = at(g, 'p1', 'characters', KAROO);
    expect(g.power(k)).toBe(5000);
    expect(kw(g, k)).toContain('Rush');
    expect(canHit(g, k, g.leader('p2'))).toBe(true);
  });

  it('without enough power it cannot attack the turn it is played', () => {
    const g = mine(LC.luffy, { hand: [KAROO] });
    playCard(g, KAROO);
    const k = at(g, 'p1', 'characters', KAROO);
    expect(canHit(g, k, g.leader('p2'))).toBe(false);
  });

  it('DON!! given add power only on its owner’s turn: on the opponent’s turn the tiers drop to 4000', () => {
    const g = theirs(LC.luffy, { characters: [{ card: KAROO, don: 3 }] });
    const k = at(g, 'p1', 'characters', KAROO);
    expect(g.power(k)).toBe(4000);
    expect(kw(g, k)).not.toContain('Rush');
    expect(kw(g, k)).not.toContain('Banish');
    expect(kw(g, k)).not.toContain('Unblockable');
    void VC;
  });
});
