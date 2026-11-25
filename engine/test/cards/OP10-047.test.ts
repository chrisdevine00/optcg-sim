/** OP10-047 Koala. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, hand, pick, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { attack, finishBattle, mk, RA2, RA3, RA4, raiseCost } from './helpers-a10g2.ts';

const ID = 'OP10-047';

describe('OP10-047 Koala', () => {
  const start = (extra: string[] = [RA3, RA4, V.c3]) => mk({ characters: [ID, ...extra] });
  const koala = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);

  it('[When Attacking] return a {Revolutionary Army} Character with a cost of 3 or more: +3000 power this turn', () => {
    const g = start();
    attack(g, koala(g));
    accept(g);
    pick(g, [g.find('p1', 'characters', RA3)]);
    expect(hand(g, 'p1')).toEqual([RA3]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(RA3);
    expect(g.power(koala(g))).toBe(6000);
    finishBattle(g);
  });

  it('boundary: cost 3 and 4 are candidates; cost 2 (Revolutionary Army) and a non-{Revolutionary Army} cost 3 are not', () => {
    const g = start([RA3, RA4, RA2, V.c3]);
    attack(g, koala(g));
    accept(g);
    expect(canPick(g, g.find('p1', 'characters', RA3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', RA4))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', RA2))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    expect(canPick(g, koala(g))).toBe(false);
  });

  it('the cost is the current cost: a cost-2 Revolutionary Army raised to 3 can be returned', () => {
    const g = start([RA2]);
    raiseCost(g, g.find('p1', 'characters', RA2), 1);
    attack(g, koala(g));
    accept(g);
    // The only candidate is returned without asking.
    expect(hand(g, 'p1')).toEqual([RA2]);
    expect(g.power(koala(g))).toBe(6000);
  });

  it('"You may": declining returns nothing and gives no power', () => {
    const g = start();
    attack(g, koala(g));
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.power(koala(g))).toBe(3000);
  });

  it('must not be payable with no {Revolutionary Army} Character of cost 3 or more', () => {
    const g = start([RA2, V.c5]);
    attack(g, koala(g));
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.power(koala(g))).toBe(3000);
    expect(hand(g, 'p1')).toEqual([]);
    finishBattle(g);
    expectDecision(g, 'main', 'p1');
  });

  it("must not return the opponent's Characters", () => {
    const g = mk({ characters: [ID] }, { characters: [RA3] });
    attack(g, koala(g));
    expect(dec(g)?.kind).not.toBe('optional');
    expect(hand(g, 'p2')).toEqual([]);
  });
});
