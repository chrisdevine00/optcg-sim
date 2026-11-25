/** ST15-002 Edward.Newgate. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, none, pick, play, V } from './helpers.ts';
import { activate, buff, cardsIn, mk, offeredAb } from './helpers-prbst.ts';

const ID = 'ST15-002';

describe('ST15-002 Edward.Newgate', () => {
  it('[On Play]: gives up to 1 rested DON!! to your Leader or 1 of your Characters', () => {
    const g = mk({ hand: [ID], characters: [V.c3] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    // The Leader, Newgate himself and the other Character.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(g.card(g.find('p1', 'characters', V.c3)).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 6, given: 1 });
  });

  it('"up to 1": the give may be skipped', () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    none(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 7, given: 0 });
  });

  describe('[Activate: Main] rest this Character: K.O. up to 1 opponent Character with 5000 power or less', () => {
    const start = (p2chars: string[] = [V.c3, V.c4]) =>
      mk({ characters: [ID] }, { characters: p2chars });
    const newgate = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);

    it('K.O.s a 5000 power Character (boundary); 6000 is not a candidate', () => {
      const g = start();
      activate(g, newgate(g), 'activate');
      expect(g.card(newgate(g)).rested).toBe(true);
      const offered = g
        .legal()
        .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
      expect(offered).toEqual([g.find('p2', 'characters', V.c3)]);
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c4]);
    });

    it('uses the current power: a 6000 Character lowered to 5000 can be K.O.d, a 5000 one raised cannot', () => {
      const g = start();
      buff(g, g.find('p2', 'characters', V.c4), -1000);
      buff(g, g.find('p2', 'characters', V.c3), 1000);
      activate(g, newgate(g), 'activate');
      const offered = g
        .legal()
        .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
      expect(offered).toEqual([g.find('p2', 'characters', V.c4)]);
    });

    it('"up to 1": may K.O. nobody (the cost is still paid)', () => {
      const g = start();
      activate(g, newgate(g), 'activate');
      none(g);
      expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3, V.c4]);
      expect(g.card(newgate(g)).rested).toBe(true);
    });

    it('must not be usable when it is already rested', () => {
      const g = mk({ characters: [{ card: ID, rested: true }] }, { characters: [V.c3] });
      expect(offeredAb(g, newgate(g), 'activate')).toBe(false);
      expect(dec(g)?.kind).toBe('main');
    });
  });
});
