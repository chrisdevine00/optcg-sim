/** OP12-038 Two-Sword Style Rashomon. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { cardsOf, counterStep, donArea, SHC_LEADER, useCounter } from './helpers-luffyace.ts';

const ID = 'OP12-038';

describe('OP12-038 Two-Sword Style Rashomon', () => {
  const start = () =>
    game(
      { leader: SHC_LEADER, hand: [ID], ...donArea(3) },
      {
        leader: PLAIN_BLUE,
        characters: [
          { card: V.c3, rested: true },
          { card: V.c4, rested: true },
          { card: V.c1, rested: true },
          { card: V.c5, rested: true }, // base cost 5: too expensive
          V.c2, // active: not a rested Character
        ],
      },
    );

  it("[Main]: you may rest 2 DON!!: K.O. up to 2 of your opponent's rested Characters with a base cost of 4 or less", () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(don(g, 'p1').rested).toBe(3); // 1 to play, 2 for the effect
    expectDecision(g, 'choose', 'p1');
    // Rested and cost 4 or less: the 1-, 3- and 4-cost ones.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.find('p2', 'characters', V.c3), g.find('p2', 'characters', V.c4)]);
    expect(cardsOf(g, 'p2', 'trash').sort()).toEqual([V.c3, V.c4].sort());
    expect(cardsOf(g, 'p2', 'characters').sort()).toEqual([V.c1, V.c2, V.c5].sort());
  });

  it('[Main]: "up to 2" may K.O. one or none', () => {
    const g = start();
    play(g, ID);
    accept(g);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c1) });
    g.act({ type: 'done' });
    expect(cardsOf(g, 'p2', 'trash')).toEqual([V.c1]);
    const none = start();
    play(none, ID);
    accept(none);
    none.act({ type: 'done' });
    expect(cardsOf(none, 'p2', 'trash')).toEqual([]);
  });

  it('[Main]: declining the optional cost does nothing; the Event is still spent', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(cardsOf(g, 'p2', 'trash')).toEqual([]);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('[Main]: an active Character is never a target, even alone', () => {
    const g = game(
      { leader: SHC_LEADER, hand: [ID], ...donArea(3) },
      { leader: PLAIN_BLUE, characters: [V.c1] },
    );
    play(g, ID);
    accept(g);
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c1]);
  });

  it('[Counter]: your Leader gains +3000 power during this battle', () => {
    const g = counterStep({ leader: SHC_LEADER, hand: [ID], ...donArea(1) }, {}, V.c5);
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
