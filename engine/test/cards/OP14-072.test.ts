/** OP14-072 Baby 5. */
import { describe, expect, it } from 'vitest';
import { accept, addMost, dec, decline, don, payDon, play, V } from './helpers.ts';
import { DP_LEADER, idsOf, koedInBattle, mine } from './helpers-op14g3.ts';

const ID = 'OP14-072';

describe('OP14-072 Baby 5', () => {
  it('[On Play] add up to 1 DON!! and set it as active', () => {
    const g = mine(DP_LEADER, { hand: [ID] }, {}, 4);
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 4, deck: 5 });
  });

  const ko = (deck: string[], active = 2) =>
    koedInBattle(ID, { leader: DP_LEADER, deck, costArea: { active, rested: 0 } });

  it('[On K.O.] DON!! -1: add up to 1 card from the top of your deck to the top of your Life cards', () => {
    const g = ko([V.c4, V.c5]);
    accept(g);
    payDon(g);
    accept(g); // "add the top card of your deck to your Life?" (one candidate: asked as a yes/no)
    expect(g.zone('p1', 'life')).toHaveLength(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c4);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c5]);
    expect(don(g, 'p1').deck).toBe(9);
  });

  it('"up to 1": may add nothing after paying the DON!! -1', () => {
    const g = ko([V.c4, V.c5]);
    accept(g);
    payDon(g);
    decline(g);
    expect(g.zone('p1', 'life')).toHaveLength(3);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c4, V.c5]);
  });

  it('declining the DON!! -1: nothing is added and no DON!! returns', () => {
    const g = ko([V.c4, V.c5]);
    decline(g);
    expect(g.zone('p1', 'life')).toHaveLength(3);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('with no DON!! on the field the cost cannot be paid: nothing is asked', () => {
    const g = ko([V.c4], 0);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(g.zone('p1', 'life')).toHaveLength(3);
  });
});
