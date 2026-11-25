/** ST18-003 San-Gorou. */
import { describe, expect, it } from 'vitest';
import { dec, hand, V } from './helpers.ts';
import { attack, finishBattle, mk } from './helpers-st1821.ts';

const ID = 'ST18-003';

const start = (active: number, don = 0) =>
  mk({
    characters: [{ card: ID, don }],
    costArea: { active, rested: 0 },
    deck: [V.c3, V.c4, V.c5],
    hand: [],
  });

describe('ST18-003 San-Gorou', () => {
  it('[When Attacking] with 8 DON!! on the field: draws 1 card', () => {
    const g = start(8);
    attack(g, g.find('p1', 'characters', ID));
    expect(hand(g, 'p1')).toEqual([V.c3]);
    finishBattle(g);
  });

  it('boundary: 7 DON!! draws nothing', () => {
    const g = start(7);
    attack(g, g.find('p1', 'characters', ID));
    expect(hand(g, 'p1')).toEqual([]);
    finishBattle(g);
  });

  it('DON!! given to San-Gorou count toward the 8 (6 in the cost area + 2 given)', () => {
    const g = start(6, 2);
    attack(g, g.find('p1', 'characters', ID));
    expect(hand(g, 'p1')).toEqual([V.c3]);
    finishBattle(g);
  });

  it('draws exactly 1 (not per DON!!), and the attack carries on to the block step', () => {
    const g = start(10);
    attack(g, g.find('p1', 'characters', ID));
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(dec(g)?.kind).toBe('block');
    finishBattle(g);
  });

  it('each San-Gorou has its own Once Per Turn: two of them each draw when they attack', () => {
    const g = mk({
      characters: [ID, ID],
      costArea: { active: 8, rested: 0 },
      deck: [V.c3, V.c4, V.c5],
      hand: [],
    });
    attack(g, g.find('p1', 'characters', ID, 0));
    finishBattle(g);
    attack(g, g.find('p1', 'characters', ID, 1));
    expect(hand(g, 'p1')).toEqual([V.c3, V.c4]);
    finishBattle(g);
  });
});
