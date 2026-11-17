/** OP11-106 Zeus: [On Play] add 1 card from the top or bottom of your Life to your hand: K.O. up to 1 Character with a cost of 5 or less. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  option,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { ENEL, ids } from './helpers-robin.ts';

const ZEUS = 'OP11-106';

const setup = (life: string[]) =>
  game(
    { leader: ENEL, hand: [ZEUS], life, costArea: { active: 2, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [V.c5, V.c6, V.c3] },
  );

describe('OP11-106 Zeus', () => {
  it('[On Play] Life card from the top to hand: K.O. a Character with a cost of 5 or less', () => {
    const g = setup([V.c1, PURPLE, BLUE]);
    play(g, ZEUS);
    accept(g);
    option(g, 'top');
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(ids(g, 'p1', 'life')).toEqual([PURPLE, BLUE]);
    // Targets: cost 5 and 3, not the cost 6.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c5]);
    expect(ids(g, 'p2', 'characters').sort()).toEqual([V.c3, V.c6].sort());
  });

  it('[On Play] the bottom Life card may be taken instead', () => {
    const g = setup([V.c1, PURPLE, BLUE]);
    play(g, ZEUS);
    accept(g);
    option(g, 'bottom');
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(ids(g, 'p1', 'life')).toEqual([V.c1, PURPLE]);
  });

  it('taking a Life card is not damage: no [Trigger] decision', () => {
    const g = setup(['OP17-107', PURPLE]);
    play(g, ZEUS);
    accept(g);
    option(g, 'top');
    expect(hand(g, 'p1')).toEqual(['OP17-107']);
    expectDecision(g, 'choose', 'p1');
  });

  it('the cost may be declined: no Life card, no K.O.', () => {
    const g = setup([V.c1, PURPLE]);
    play(g, ZEUS);
    decline(g);
    expect(g.life('p1')).toBe(2);
    expect(ids(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('with 0 Life the cost cannot be paid', () => {
    const g = setup([]);
    play(g, ZEUS);
    expectDecision(g, 'main', 'p1'); // the cost is not even offered
    expect(ids(g, 'p2', 'characters')).toHaveLength(3);
  });
});
