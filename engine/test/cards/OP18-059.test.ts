/** OP18-059 I Pray For Your Success. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, don, endCounter, hand, pick, play, trash, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { mine, MR9 } from './helpers-op18-g3.ts';

const ID = 'OP18-059';

describe('OP18-059 I Pray For Your Success.', () => {
  const start = (handCards = [ID, MR9, BLUE]) => mine({ hand: handCards }, {});

  it('[Main] rest 1 DON!! and trash 1 "Baroque Works" card from your hand: draw 2 cards', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(candidates(g)).toEqual([g.find('p1', 'hand', MR9)]);
    pick(g, [g.find('p1', 'hand', MR9)]);
    expect(trash(g, 'p1').sort()).toEqual([ID, MR9].sort());
    expect(hand(g, 'p1')).toHaveLength(3); // BLUE + 2 drawn
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('declining the cost draws nothing', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([MR9, BLUE]);
    expect(don(g, 'p1').rested).toBe(0);
  });

  it('without a "Baroque Works" card in hand the cost is not offered', () => {
    const g = start([ID, BLUE, V.c2]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  describe('[Counter] you may trash 1 card from your hand: +3000 power during this battle', () => {
    const ctr = (handCards = [ID, BLUE]) =>
      counterStep({ leader: 'ST04-001', hand: handCards, characters: [V.c3] }, {}, V.c5);

    it('on your Leader', () => {
      const g = ctr();
      useCounter(g, ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE)]);
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(8000);
      endCounter(g);
      expect(g.life('p1')).toBe(3);
    });

    it('on a Character', () => {
      const g = ctr();
      useCounter(g, ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE)]);
      pick(g, [g.find('p1', 'characters', V.c3)]);
      expect(g.power(g.find('p1', 'characters', V.c3))).toBe(8000);
    });

    it('declining the cost gives no power', () => {
      const g = ctr();
      useCounter(g, ID);
      decline(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(hand(g, 'p1')).toEqual([BLUE]);
    });
  });
});
