/** EB05-035 Speed. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  none,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
} from './helpers.ts';
import { cardsOf, finishOrder } from './helpers-luffyace.ts';
import { AKP_6000, SMILE_3000, SMILE_4000, SMILE_5000, SMILE_7000 } from './helpers-eb05g2.ts';

const SPEED = 'EB05-035';
const deck = [SMILE_3000, SMILE_7000, SMILE_4000, PURPLE, AKP_6000, SMILE_5000];
const start = (d = deck) =>
  game(
    { leader: PLAIN_BLUE, hand: [SPEED], deck: d, costArea: { active: 7, rested: 0 }, donDeck: 3 },
    { leader: PLAIN_BLUE },
  );

describe('EB05-035 Speed', () => {
  it('[On Play] DON!! −1, look at 5, add up to 2 {SMILE} cards, then play up to 2 {SMILE} Characters with 5000 power or less from hand', () => {
    const g = start();
    play(g, SPEED);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(4);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', SMILE_3000), g.find('p1', 'deck', SMILE_4000)]);
    finishOrder(g);
    expect(hand(g, 'p1').sort()).toEqual([SMILE_3000, SMILE_4000].sort());
    // Now the play step: both qualify (power 3000 and 4000)
    pick(g, [g.find('p1', 'hand', SMILE_3000), g.find('p1', 'hand', SMILE_4000)]);
    expect(cardsOf(g, 'p1', 'characters').sort()).toEqual([SPEED, SMILE_3000, SMILE_4000].sort());
    expect(hand(g, 'p1')).toEqual([]);
    // the 5 looked-at cards left 3 to the bottom; the 6th card (not looked at) is on top
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(SMILE_5000);
  });

  it('a {SMILE} Character with more than 5000 power can be added but not played', () => {
    const g = start();
    play(g, SPEED);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'deck', SMILE_7000)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SMILE_7000]);
    // No legal play candidate (the prompt is shown with nothing to pick).
    none(g);
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p1', 'characters')).toEqual([SPEED]);
  });

  it('only {SMILE} cards are offered when searching (not the {Animal Kingdom Pirates} non-SMILE one)', () => {
    const g = start();
    play(g, SPEED);
    accept(g);
    payDon(g);
    for (const a of g.legal().filter((x) => x.type === 'pick'))
      expect([SMILE_3000, SMILE_7000, SMILE_4000]).toContain(g.card(a.choice as string).card);
    none(g);
    finishOrder(g);
    none(g); // nothing in hand to play
    expectDecision(g, 'main', 'p1');
  });

  it('a card already in hand can be played too ("from your hand")', () => {
    const g = game(
      {
        leader: PLAIN_BLUE,
        hand: [SPEED, SMILE_5000],
        deck: [BLUE, BLUE, BLUE, BLUE, BLUE, BLUE],
        costArea: { active: 7, rested: 0 },
        donDeck: 3,
      },
      { leader: PLAIN_BLUE },
    );
    play(g, SPEED);
    accept(g);
    payDon(g);
    none(g);
    finishOrder(g);
    pick(g, [g.find('p1', 'hand', SMILE_5000)]);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([SPEED, SMILE_5000]);
  });

  it('declining the DON!! −1 skips the whole effect', () => {
    const g = start();
    play(g, SPEED);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(3);
  });
});
