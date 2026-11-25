/** EB02-055 Jinbe. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, PURPLE } from './helpers.ts';
import {
  FISH_LEADER,
  ids,
  MERFOLK_LEADER,
  OTHER_LEADER,
  SHC_LEADER,
  trigGame,
} from './helpers-aeb2g2.ts';

const ID = 'EB02-055';
const fire = (leader: string, life = [ID, PURPLE, PURPLE]) => {
  const g = trigGame(ID, { leader, life });
  g.act({ type: 'trigger', activate: true });
  return g;
};

describe('EB02-055 Jinbe', () => {
  it('[Trigger] with a {Fish-Man} Leader and 2 Life left plays this card', () => {
    const g = fire(FISH_LEADER);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(ids(g, 'p1', 'life')).toHaveLength(2);
  });

  it('[Trigger] a {Merfolk} Leader works too', () => {
    const g = fire(MERFOLK_LEADER);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('Life boundary: with 1 Life left it is played; with 3 left it is not (the Life count is after the damage)', () => {
    const one = fire(FISH_LEADER, [ID, PURPLE]);
    expect(ids(one, 'p1', 'characters')).toEqual([ID]);
    const three = fire(FISH_LEADER, [ID, PURPLE, PURPLE, PURPLE]);
    expect(ids(three, 'p1', 'characters')).toEqual([]);
    expect(ids(three, 'p1', 'life')).toHaveLength(3);
  });

  it('must not be played with a Leader that is neither {Fish-Man} nor {Merfolk}', () => {
    for (const leader of [SHC_LEADER, OTHER_LEADER]) {
      const g = fire(leader);
      expect(ids(g, 'p1', 'characters')).toEqual([]);
    }
  });

  it('the Trigger may be declined: the card goes to the hand and is not played', () => {
    const g = trigGame(ID, { leader: FISH_LEADER });
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expectDecision(g, 'main', 'p2');
  });
});
