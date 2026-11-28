/** OP18-009 Super Spot-Billed Duck Troops. */
import { describe, expect, it } from 'vitest';
import { pick } from './helpers.ts';
import { activate, canPick, offeredAb } from './helpers-w3s.ts';
import { AA1, AA5, ALA2, mk } from './helpers-op18-g1.ts';

const ID = 'OP18-009';
const A = 'trash-self';
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);
const trashed = (g: ReturnType<typeof mk>) => g.zone('p1', 'trash').map((c) => c.card);

describe('OP18-009 Super Spot-Billed Duck Troops', () => {
  it('has [Rush]', () => {
    const g = mk({ characters: [{ card: ID, playedThisTurn: true }] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
  });

  it('[Activate: Main] trash it with 9 DON!! on the field: play up to 1 [Karoo] from your hand', () => {
    const g = mk({ characters: [ID], hand: [AA1, ALA2, AA5], costArea: { active: 9, rested: 0 } });
    activate(g, g.find('p1', 'characters', ID), A);
    expect(canPick(g, g.find('p1', 'hand', AA1))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', AA5))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', ALA2))).toBe(false); // not named [Karoo]
    pick(g, [g.find('p1', 'hand', AA5)]);
    expect(chars(g)).toEqual([AA5]);
    expect(trashed(g)).toEqual([ID]);
  });

  it('rested DON!! count: 5 active + 4 rested is 9', () => {
    const g = mk({ characters: [ID], hand: [AA1], costArea: { active: 5, rested: 4 } });
    activate(g, g.find('p1', 'characters', ID), A);
    pick(g, [g.find('p1', 'hand', AA1)]);
    expect(chars(g)).toEqual([AA1]);
  });

  it('with 8 DON!! the cost is still paid but no [Karoo] is played', () => {
    const g = mk({ characters: [ID], hand: [AA1], costArea: { active: 8, rested: 0 } });
    activate(g, g.find('p1', 'characters', ID), A);
    expect(chars(g)).toEqual([]);
    expect(trashed(g)).toEqual([ID]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([AA1]);
  });

  it('is offered even with no [Karoo] in hand (the cost can be paid)', () => {
    const g = mk({ characters: [ID], hand: [ALA2], costArea: { active: 9, rested: 0 } });
    expect(offeredAb(g, g.find('p1', 'characters', ID), A)).toBe(true);
  });
});
