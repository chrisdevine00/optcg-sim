/** EB02-052 Enel: with a "Sky Island" Leader gains [Rush]; [When Attacking] trash 1: with 1 or less Life add 1 to Life, then +1000 power. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
} from './helpers.ts';
import { ENEL, ids } from './helpers-robin.ts';

const ENEL_CHAR = 'EB02-052';

describe('EB02-052 Enel', () => {
  it('has [Rush] only while your Leader has the "Sky Island" type', () => {
    const keywords = (leader: string) => {
      const t = game({ leader, characters: [ENEL_CHAR] }, { leader: PLAIN_BLUE });
      return t.card(t.find('p1', 'characters', ENEL_CHAR)).keywords;
    };
    expect(keywords(ENEL)).toContain('Rush');
    expect(keywords(PLAIN_PURPLE)).not.toContain('Rush');
  });

  const attack = (life: string[], handCards: string[]) => {
    const t = game(
      {
        leader: ENEL,
        characters: [ENEL_CHAR],
        life,
        hand: handCards,
        deck: [PURPLE, BLUE, BLUE],
      },
      { leader: PLAIN_BLUE },
    );
    t.act({
      type: 'attack',
      attacker: t.find('p1', 'characters', ENEL_CHAR),
      target: t.leader('p2'),
    });
    return t;
  };

  it('[When Attacking] trash 1 with 1 Life: add the top card to Life and gain +1000 power', () => {
    const t = attack([BLUE], [PURPLE, BLUE]);
    accept(t);
    pick(t, [t.find('p1', 'hand', PURPLE)]);
    accept(t); // add the top card of the deck to Life
    expect(ids(t, 'p1', 'life')).toEqual([PURPLE, BLUE]);
    expect(t.power(t.find('p1', 'characters', ENEL_CHAR))).toBe(12000);
    expect(ids(t, 'p1', 'trash')).toEqual([PURPLE]);
  });

  it('with 0 Life the condition (1 or less) holds as well', () => {
    const t = attack([], [PURPLE]);
    accept(t);
    pick(t, [t.find('p1', 'hand', PURPLE)]);
    accept(t);
    expect(t.life('p1')).toBe(1);
    expect(t.power(t.find('p1', 'characters', ENEL_CHAR))).toBe(12000);
  });

  it('with 2 or more Life the cost is paid, but there is neither the Life card nor the power (CR 4-10-1)', () => {
    const t = attack([BLUE, BLUE], [PURPLE]);
    accept(t);
    pick(t, [t.find('p1', 'hand', PURPLE)]);
    expect(t.life('p1')).toBe(2);
    expect(t.power(t.find('p1', 'characters', ENEL_CHAR))).toBe(11000);
    expectDecision(t, 'block', 'p2');
  });

  it('the cost may be declined: nothing is trashed', () => {
    const t = attack([BLUE], [PURPLE]);
    decline(t);
    expect(hand(t, 'p1')).toEqual([PURPLE]);
    expect(t.life('p1')).toBe(1);
    expect(t.power(t.find('p1', 'characters', ENEL_CHAR))).toBe(11000);
  });

  it('"up to 1": the Life card may be declined, the power still applies', () => {
    const t = attack([BLUE], [PURPLE]);
    accept(t);
    pick(t, [t.find('p1', 'hand', PURPLE)]);
    decline(t);
    expect(t.life('p1')).toBe(1);
    expect(t.power(t.find('p1', 'characters', ENEL_CHAR))).toBe(12000);
  });
});
