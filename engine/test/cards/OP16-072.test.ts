/** OP16-072 Hannyabal. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
} from './helpers.ts';
import { orderAll } from './helpers-hancock-rosi.ts';
import { ID_3000, ID_6000, NOT_NAVY } from './helpers-op16g3.ts';

const ID = 'OP16-072';
const deck = [PURPLE, ID_6000, BLUE, ID_3000, BLUE, BLUE, BLUE];
const start = () =>
  game(
    { leader: NOT_NAVY, hand: [ID], deck, costArea: { active: 2, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('OP16-072 Hannyabal', () => {
  it('[On Play] looks at 5, reveals up to 1 {Impel Down} card to hand, the rest go to the bottom', () => {
    const g = start();
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', ID_3000)]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(ID_3000);
    orderAll(g);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([ID_3000]);
    const left = g.zone('p1', 'deck').map((c) => c.card);
    expect(left).toHaveLength(6);
    expect(left.slice(0, 2)).toEqual([BLUE, BLUE]); // the 2 cards not looked at stay on top
  });

  it('"up to 1": only one card may be taken even with two matches', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'deck', ID_6000)]);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([ID_6000]);
  });

  it('may take nothing; all five go to the bottom', () => {
    const g = start();
    play(g, ID);
    none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(7);
    expect(
      g
        .zone('p1', 'deck')
        .slice(0, 2)
        .map((c) => c.card),
    ).toEqual([BLUE, BLUE]);
  });

  it('a non-{Impel Down} card is never offered', () => {
    const g = game(
      {
        leader: NOT_NAVY,
        hand: [ID],
        deck: [PURPLE, BLUE, BLUE, BLUE, BLUE],
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
  });
});
