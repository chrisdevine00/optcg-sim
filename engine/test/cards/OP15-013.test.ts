/** OP15-013 Pincers. */
import { describe, expect, it } from 'vitest';
import { mk, RED_LEADER, shrinkLeader } from './helpers-op15g1.ts';

const ID = 'OP15-013';

describe('OP15-013 Pincers', () => {
  const inHand = (shrink: number, active = 2, don = 0) => {
    const g = mk({
      leader: { card: RED_LEADER, don },
      hand: [ID],
      costArea: { active, rested: 0 },
    });
    if (shrink) shrinkLeader(g, 'p1', shrink);
    return { g, id: g.find('p1', 'hand', ID) };
  };

  it('in hand: costs 2 less (4 to 2) while your Leader has 0 power or less', () => {
    const { g, id } = inHand(5000);
    expect(g.card(id).cost).toBe(2);
    expect(g.isLegal({ type: 'playCard', card: id, player: 'p1' })).toBe(true);
  });

  it('boundary: a Leader at 1000 power does not give the discount, below 0 does', () => {
    const one = inHand(4000);
    expect(one.g.card(one.id).cost).toBe(4);
    expect(one.g.isLegal({ type: 'playCard', card: one.id, player: 'p1' })).toBe(false);
    const neg = inHand(7000);
    expect(neg.g.card(neg.id).cost).toBe(2);
  });

  it('must not apply with an untouched Leader (printed cost 4)', () => {
    const { g, id } = inHand(0);
    expect(g.card(id).cost).toBe(4);
  });

  it('reads current power: a DON!! given to the Leader (6000) needs 6000 of reduction', () => {
    const a = inHand(5000, 9, 1);
    expect(a.g.card(a.id).cost).toBe(4);
    const b = inHand(6000, 9, 1);
    expect(b.g.card(b.id).cost).toBe(2);
  });

  it('has [Blocker] on the field, and its discount is only for the hand', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(4);
  });
});
