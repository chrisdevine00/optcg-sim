/** EB04-002 Jewelry Bonney. */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import { expectDecision, game, hand, none, pick, play, PLAIN_BLUE, PURPLE } from './helpers.ts';
import { cardsOf, donArea, EGGHEAD, finishOrder, SHC, SHC_LEADER } from './helpers-luffyace.ts';

const deck = [PURPLE, EGGHEAD, 'EB04-002', SHC.sanji1, SHC.jinbe2];
const start = () =>
  game({ leader: SHC_LEADER, hand: ['EB04-002'], deck, ...donArea(1) }, { leader: PLAIN_BLUE });

describe('EB04-002 Jewelry Bonney', () => {
  it('[On Play]: look at 4, take an {Egghead} or {Straw Hat Crew} card other than [Jewelry Bonney] (another Bonney and the 5th card are not offered), the rest go to the bottom', () => {
    const g = start();
    play(g, 'EB04-002');
    expectDecision(g, 'choose', 'p1');
    const v = project(g.state, 'p1') as unknown as { looking: { card: string }[] };
    expect(v.looking).toHaveLength(4);
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(2);
    for (const c of [EGGHEAD, SHC.sanji1])
      expect(offered.some((a) => a.type === 'pick' && a.choice === g.find('p1', 'deck', c))).toBe(
        true,
      );
    pick(g, [g.find('p1', 'deck', EGGHEAD)]);
    expect(hand(g, 'p1')).toEqual([EGGHEAD]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(EGGHEAD);
    finishOrder(g);
    expectDecision(g, 'main', 'p1');
    // 3 cards went to the bottom; the card that was not looked at is now on top.
    const cards = cardsOf(g, 'p1', 'deck');
    expect(cards).toHaveLength(deck.length - 1);
    expect(cards[0]).toBe(deck[4]);
  });

  it('may take nothing even with a match (CR 8-4-4-2); all 4 go to the bottom', () => {
    const g = start();
    play(g, 'EB04-002');
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(deck.length);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(deck[4]);
  });
});
