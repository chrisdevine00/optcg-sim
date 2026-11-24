/** OP17-037 Are You That Afraid of the New Era?!. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  game,
  hand,
  none,
  PLAIN_BLUE,
  pick,
  play,
  V,
} from './helpers.ts';
import { cardsOf, counterStep, finishOrder, useCounter } from './helpers-luffyace.ts';
import { OTHER_LEADER, RHP_4, RHP_5 } from './helpers-op17g2.ts';

const ID = 'OP17-037';

describe('OP17-037 Are You That Afraid of the New Era?!', () => {
  const main = (deck: string[]) =>
    game(
      { leader: OTHER_LEADER, hand: [ID], deck, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[Main]: look at 5, add up to 1 card with a type including "Red-Haired Pirates", the rest to the bottom', () => {
    const g = main([BLUE, BLUE, RHP_4, BLUE, BLUE, RHP_5]);
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', RHP_4)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([RHP_4]);
    // The 6th card was not looked at: it is now on top.
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(RHP_5);
  });

  it('[Main]: "up to 1", may add nothing', () => {
    const g = main([RHP_4, BLUE, BLUE, BLUE, BLUE, RHP_5]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(RHP_5);
  });

  describe('[Counter]', () => {
    const step = () =>
      counterStep({
        leader: OTHER_LEADER,
        hand: [ID],
        characters: [V.c1],
        costArea: { active: 2, rested: 0 },
      });

    it('you may rest 1 of your cards: up to 1 of your Leader or Characters gains +3000 power during this battle', () => {
      const g = step();
      useCounter(g, ID);
      accept(g);
      // Cost: rest the Character; then give the Leader the power.
      pick(g, [g.find('p1', 'characters', V.c1)]);
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(8000);
      expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
      endCounter(g);
    });

    it('declining the cost gives no power', () => {
      const g = step();
      useCounter(g, ID);
      decline(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
      expectDecision(g, 'counter', 'p1');
    });

    it('a Character may receive the power instead', () => {
      const g = step();
      useCounter(g, ID);
      accept(g);
      pick(g, [g.leader('p1')]);
      pick(g, [g.find('p1', 'characters', V.c1)]);
      expect(g.power(g.find('p1', 'characters', V.c1))).toBe(6000);
    });
  });
});
