/** OP06-017 Meteor-Strike of Love. QA-GR: adding Life to the hand is not damage (no [Trigger]). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  endCounter,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { cardsOf, counterStep, donArea, SHC, SHC_LEADER, useCounter } from './helpers-luffyace.ts';

const ID = 'OP06-017';
// Two Life cards whose top card has a [Trigger]: adding it to the hand must not offer it.
const LIFE = ['OP14-019', V.c2, V.c3];

describe('OP06-017 Meteor-Strike of Love', () => {
  const main = (life: string[] = LIFE) =>
    game(
      { leader: SHC_LEADER, hand: [ID], life, characters: [SHC.franky4], ...donArea(2) },
      { leader: PLAIN_BLUE },
    );

  it('[Main]: you may add 1 Life card to your hand: up to 1 of your Leader or Character gains +3000 power during this turn', () => {
    const g = main();
    play(g, ID);
    accept(g);
    // The top Life card goes to the hand, with no [Trigger] decision.
    expect(cardsOf(g, 'p1', 'hand')).toEqual(['OP14-019']);
    expect(g.life('p1')).toBe(2);
    expectDecision(g, 'choose', 'p1');
    const franky = g.find('p1', 'characters', SHC.franky4);
    pick(g, [franky]);
    expect(g.power(franky)).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('[Main]: may go to the Leader', () => {
    const g = main();
    play(g, ID);
    accept(g);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('[Main]: declining the optional cost keeps the Life card and gives nothing', () => {
    const g = main();
    play(g, ID);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Main]: with no Life cards the cost cannot be paid', () => {
    const g = main([]);
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  it('[Counter]: the same effect at the Counter Step; the boost lasts the turn, not just the battle', () => {
    const g = counterStep(
      { leader: SHC_LEADER, hand: [ID], life: [BLUE, V.c2, V.c3], ...donArea(2) },
      {},
      V.c5,
    );
    useCounter(g, ID, 'main-counter');
    accept(g);
    pick(g, [g.leader('p1')]);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(g.life('p1')).toBe(2); // 8000 stops the 7000 attacker
    // "during this turn": still boosted after the battle (read as printed).
    expect(g.power(g.leader('p1'))).toBe(8000);
  });
});
