/** ST17-005 Marshall.D.Teach. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, don, expectDecision, hand, option, pick, V } from './helpers.ts';
import { activate, cardsIn, mk, offeredAb } from './helpers-prbst.ts';

const ID = 'ST17-005';

describe('ST17-005 Marshall.D.Teach', () => {
  const start = (p1 = {}) =>
    mk({
      characters: [ID, V.c3],
      hand: [V.c1, BLUE],
      costArea: { active: 3, rested: 4 },
      deck: [V.c2, V.c4, V.c5],
      ...p1,
    });
  const teach = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);

  it('[Activate: Main] place 1 hand card on top of your deck: give up to 2 rested DON!! to your Leader or 1 Character', () => {
    const g = start();
    activate(g, teach(g), 'activate');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(cardsIn(g, 'p1', 'deck')[0]).toBe(V.c1);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    // "Up to 2": a count, most first, then one target.
    expectDecision(g, 'choose', 'p1');
    option(g, '2');
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(g.card(g.find('p1', 'characters', V.c3)).don).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ rested: 2, given: 2 });
  });

  it('a count of 1 gives 1; 0 gives none (the cost is still paid)', () => {
    const g = start();
    activate(g, teach(g), 'activate');
    pick(g, [g.find('p1', 'hand', BLUE)]);
    option(g, '1');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    const h = start();
    activate(h, teach(h), 'activate');
    pick(h, [h.find('p1', 'hand', BLUE)]);
    option(h, '0');
    expect(don(h, 'p1')).toMatchObject({ rested: 4, given: 0 });
    expect(cardsIn(h, 'p1', 'deck')[0]).toBe(BLUE);
  });

  it('Once Per Turn: it is not offered a second time', () => {
    const g = start();
    activate(g, teach(g), 'activate');
    pick(g, [g.find('p1', 'hand', BLUE)]);
    option(g, '1');
    pick(g, [g.leader('p1')]);
    expect(dec(g)?.kind).toBe('main');
    expect(offeredAb(g, teach(g), 'activate')).toBe(false);
  });

  it('must not be usable with an empty hand (the cost cannot be paid)', () => {
    const g = start({ hand: [] });
    expect(offeredAb(g, teach(g), 'activate')).toBe(false);
  });

  it('with no rested DON!! the cost is paid and nothing is given', () => {
    const g = start({ costArea: { active: 5, rested: 0 } });
    activate(g, teach(g), 'activate');
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(dec(g)?.kind).toBe('main');
    expect(cardsIn(g, 'p1', 'deck')[0]).toBe(BLUE);
    expect(don(g, 'p1').given).toBe(0);
  });
});
