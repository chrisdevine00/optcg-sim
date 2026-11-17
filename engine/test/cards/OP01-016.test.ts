/** OP01-016 Nami. */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import { expectDecision, game, hand, none, pick, play, PLAIN_BLUE, PURPLE } from './helpers.ts';
import { cardsOf, donArea, finishOrder, SHC, SHC_LEADER } from './helpers-luffyace.ts';

const deck = [PURPLE, SHC.sanji1, 'EB02-017', SHC.jinbe2, PURPLE, SHC.zoro4];
const start = () =>
  game({ leader: SHC_LEADER, hand: ['OP01-016'], deck, ...donArea(1) }, { leader: PLAIN_BLUE });

describe('OP01-016 Nami', () => {
  it('[On Play]: look at 5, take a {Straw Hat Crew} card other than [Nami] (the other Nami and the 6th card are not offered), the rest go to the bottom', () => {
    const g = start();
    play(g, 'OP01-016');
    expectDecision(g, 'choose', 'p1');
    const v = project(g.state, 'p1') as unknown as { looking: { card: string }[] };
    expect(v.looking).toHaveLength(5);
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(2);
    for (const c of [SHC.sanji1, SHC.jinbe2])
      expect(offered.some((a) => a.type === 'pick' && a.choice === g.find('p1', 'deck', c))).toBe(
        true,
      );
    pick(g, [g.find('p1', 'deck', SHC.sanji1)]);
    expect(hand(g, 'p1')).toEqual([SHC.sanji1]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(SHC.sanji1);
    finishOrder(g);
    expectDecision(g, 'main', 'p1');
    // 4 cards went to the bottom; the card that was not looked at is now on top.
    const cards = cardsOf(g, 'p1', 'deck');
    expect(cards).toHaveLength(deck.length - 1);
    expect(cards[0]).toBe(deck[5]);
  });

  it('may take nothing even with a match (CR 8-4-4-2); all 5 go to the bottom', () => {
    const g = start();
    play(g, 'OP01-016');
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(deck.length);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(deck[5]);
  });
});
