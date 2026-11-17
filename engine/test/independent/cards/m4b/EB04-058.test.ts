/**
 * EB04-058 Borsalino (Character, Yellow, cost 5, 6000, Counter +1000, {Navy}/{Egghead}, [Blocker]).
 *
 * Card text: "[Blocker] ... [On Play] If you have 2 or less Life cards, add up to 1 card from the top
 * of your deck to the top of your Life cards."
 *
 * Rules: CR 8-3-3 (a failed "if" resolves nothing), CR 8-4-4-1 ("up to" allows 0), CR 10-1-4 [Blocker].
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers, fill, noDefence } from '../../helpers.ts';
import {
  BLUE,
  declineAny,
  deck,
  lifeCards,
  mine,
  playCard,
  RED,
  settleYes,
  SC,
  theirs,
  YL,
} from './kit-a.ts';

const TOP = SC.bobbin;

function game(life: string[], leader: string = YL.neutral) {
  const g = mine(leader, { hand: ['EB04-058'], life, deck: [TOP, ...fill(BLUE, 10)] });
  playCard(g, 'EB04-058');
  return g;
}

describe('EB04-058 Borsalino: [On Play] with 2 or less Life, add the top card of the deck to Life', () => {
  it('2 Life: the deck top becomes the top Life card (3 Life, deck -1)', () => {
    const g = game([RED, RED]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(3);
    expect(lifeCards(g)[0]).toBe(TOP);
    expect(deck(g)).toHaveLength(10);
  });

  it('1 Life and 0 Life also meet "2 or less"', () => {
    for (const life of [[RED], []]) {
      const g = game(life);
      settleYes(g, 'p1');
      expect(g.life('p1')).toBe(life.length + 1);
      expect(lifeCards(g)[0]).toBe(TOP);
    }
  });

  it('CR 8-3-3: with 3 Life the effect does nothing', () => {
    const g = game([RED, RED, RED]);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(3);
    expect(deck(g)[0]).toBe(TOP);
    expect(deck(g)).toHaveLength(11);
  });

  it('CR 8-4-4-1: "up to 1" may be declined', () => {
    const g = game([RED, RED]);
    declineAny(g);
    settleYes(g, 'p1');
    expect(g.life('p1')).toBe(2);
    expect(deck(g)[0]).toBe(TOP);
  });

  it('the Life card is placed face-down (the owner has not revealed it)', () => {
    const g = game([RED]);
    settleYes(g, 'p1');
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });
});

describe('EB04-058 Borsalino: [Blocker]', () => {
  it('has the Blocker keyword and can block an attack on the Leader', () => {
    const g = theirs(YL.neutral, { characters: ['EB04-058'], life: fill(RED, 4) });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', 'EB04-058')]);
    act(g, { type: 'block', blocker: g.find('p1', 'characters', 'EB04-058') });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });
});
