/** EB04-054 Bartholomew Kuma: [On Play] with 2 or less Life, add up to 1 card from the top of your deck to the top of your Life; [On K.O.] add up to 1 card from the top of your opponent's Life to the owner's hand. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, play, V } from './helpers.ts';
import { ids, koedInBattle, koNow, mine, names, OTHER_LEADER } from './helpers-eb04g2.ts';

const ID = 'EB04-054';

const played = (life: string[]) =>
  mine({ leader: OTHER_LEADER, hand: [ID], life, deck: [V.c4, V.c5, V.c6] });

describe('EB04-054 Bartholomew Kuma', () => {
  it('[On Play] with 2 Life: the top card of the deck goes on top of your Life', () => {
    const g = played([V.c1, V.c2]);
    play(g, ID);
    accept(g);
    expect(ids(g, 'p1', 'life')).toEqual([V.c4, V.c1, V.c2]);
    expect(ids(g, 'p1', 'deck')).toEqual([V.c5, V.c6]);
  });

  it('[On Play] boundary: with 3 Life nothing is added', () => {
    const g = played([V.c1, V.c2, V.c3]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.life('p1')).toBe(3);
  });

  it('[On Play] with 0 Life a card is added', () => {
    const g = played([]);
    play(g, ID);
    accept(g);
    expect(ids(g, 'p1', 'life')).toEqual([V.c4]);
  });

  it('[On Play] "up to 1": may add nothing', () => {
    const g = played([V.c1]);
    play(g, ID);
    decline(g);
    expect(g.life('p1')).toBe(1);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it("[On K.O.] by an effect: the top card of the opponent's Life goes to the opponent's hand", () => {
    const g = mine({ leader: OTHER_LEADER, characters: [ID] }, { life: [V.c1, V.c2, V.c3] });
    koNow(g, 'p1', ID, 'p2');
    accept(g);
    expect(names(g, 'p2', 'hand')).toEqual([V.c1]);
    expect(ids(g, 'p2', 'life')).toEqual([V.c2, V.c3]);
    expect(names(g, 'p1', 'hand')).toEqual([]);
  });

  it('[On K.O.] in battle works the same, with no Life condition (even at your 3 Life)', () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER }, { life: [V.c1, V.c2] });
    accept(g);
    expect(names(g, 'p2', 'hand')).toEqual([V.c1]);
    expect(g.life('p2')).toBe(1);
  });

  it('[On K.O.] "up to 1": may take nothing', () => {
    const g = mine({ leader: OTHER_LEADER, characters: [ID] }, { life: [V.c1] });
    koNow(g, 'p1', ID, 'p2');
    decline(g);
    expect(g.life('p2')).toBe(1);
  });
});
