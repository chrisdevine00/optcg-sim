/** OP14-081 Spider Mice. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, trash, V } from './helpers.ts';
import {
  canPick,
  idsOf,
  koedInBattle,
  koNow,
  mine,
  OTHER_LEADER,
  plant,
  rep,
} from './helpers-op14g3.ts';

const ID = 'OP14-081';

describe('OP14-081 Spider Mice', () => {
  it('[On Play] trash 3 cards from the top of your deck', () => {
    const g = mine(OTHER_LEADER, { hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5] });
    play(g, ID);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2, V.c3].sort());
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c4, V.c5]);
  });

  it('[On Play] is not optional and does not ask anything', () => {
    const g = mine(OTHER_LEADER, { hand: [ID], deck: rep(6, V.c1) });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it("[On K.O.] K.O. up to 1 of your opponent's Characters with a base cost of 1", () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER }, { characters: [V.c1, V.c2] });
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c1]);
  });

  it('a base cost of 2 is not a target even alone; "up to 1" allows none', () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER }, { characters: [V.c2] });
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    const h = koedInBattle(ID, { leader: OTHER_LEADER }, { characters: [V.c1] });
    none(h);
    expect(idsOf(h, 'p2', 'characters')).toContain(V.c1);
  });

  it('reads the BASE cost: a base-2 Character reduced to 1 is not a target; a base-1 Character raised to 2 is', () => {
    const g = mine(OTHER_LEADER, { characters: [ID] }, { characters: [V.c1, V.c2] });
    plant(g, 'p1', {
      cost: {
        target: { from: 'characters', owner: 'opponent', filter: { baseCost: { eq: 2 } } },
        amount: -1,
        duration: 'thisTurn',
      },
    });
    plant(g, 'p1', {
      cost: {
        target: { from: 'characters', owner: 'opponent', filter: { baseCost: { eq: 1 } } },
        amount: 1,
        duration: 'thisTurn',
      },
    });
    expect(g.card(g.find('p2', 'characters', V.c2)).cost).toBe(1);
    expect(g.card(g.find('p2', 'characters', V.c1)).cost).toBe(2);
    koNow(g, 'p1', ID, 'p2');
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
  });
});
