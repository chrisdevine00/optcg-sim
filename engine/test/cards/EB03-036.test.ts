/** EB03-036 Baby 5. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, none, payDon, pick, play, V } from './helpers.ts';
import { canPick, cardsIn, costMod, mk } from './helpers-eb03g2.ts';

const ID = 'EB03-036';

describe('EB03-036 Baby 5', () => {
  it('[On Play] DON!! -1: K.O.s up to 2 Characters with a base cost of 3 or less', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c3, V.c2, V.c3] });
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(9); // 10 minus the DON!! returned
    pick(g, [g.find('p2', 'characters', V.c3, 0), g.find('p2', 'characters', V.c2)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(cardsIn(g, 'p2', 'trash').sort()).toEqual([V.c2, V.c3].sort());
  });

  it('boundary: base cost 4 is not a candidate, base cost 3 is', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4, V.c3] });
    play(g, ID);
    accept(g);
    payDon(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
  });

  it('reads the BASE cost: a raised cost-3 Character is a target, a lowered cost-5 one is not', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c3, V.c5] });
    costMod(g, g.find('p2', 'characters', V.c3), 2);
    costMod(g, g.find('p2', 'characters', V.c5), -2);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
  });

  it('"up to 2": may K.O. only 1, or none', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c3, V.c2] });
    play(g, ID);
    accept(g);
    payDon(g);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3]);
    const h = mk({ hand: [ID] }, { characters: [V.c3] });
    play(h, ID);
    accept(h);
    payDon(h);
    none(h);
    expect(cardsIn(h, 'p2', 'characters')).toEqual([V.c3]);
  });

  it('the DON!! −1 is optional: declining returns nothing and K.O.s nothing', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c3] });
    play(g, ID);
    decline(g);
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(10);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3]);
    expectDecision(g, 'main', 'p1');
  });

  it('the DON!! −1 may return a rested DON!! (all 4 DON!! are rested to pay for Baby 5)', () => {
    const g = mk(
      { hand: [ID], costArea: { active: 4, rested: 0 }, donDeck: 6 },
      { characters: [V.c3] },
    );
    play(g, ID);
    // 4 DON!! pay for Baby 5; they are rested but still on the field, so the cost is payable.
    accept(g);
    payDon(g);
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(3);
  });
});
