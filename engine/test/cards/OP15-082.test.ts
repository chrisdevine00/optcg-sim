/** OP15-082 Charlotte Lola. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import { COST8, COST9, EVENT, idsOf, koedInBattle, mine, OTHER_LEADER } from './helpers-op15g2.ts';

const ID = 'OP15-082';

describe('OP15-082 Charlotte Lola', () => {
  it('[On Play] trash 3 cards from the top of your deck', () => {
    const g = mine(OTHER_LEADER, { hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5] }, {});
    play(g, ID);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2, V.c3].sort());
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([V.c4, V.c5]);
  });

  it('with only 2 cards in the deck, milling 3 empties it and the game ends (RL-26)', () => {
    const g = mine(OTHER_LEADER, { hand: [ID], deck: [V.c1, V.c2] }, {});
    play(g, ID);
    expect(dec(g)).toBeNull();
  });

  const ko = (trashCards: string[]) =>
    koedInBattle(ID, { leader: OTHER_LEADER, trash: trashCards });
  const cands = (g: ReturnType<typeof ko>) =>
    g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));

  it('[On K.O.] add up to 1 Character card with a cost of 8 or less from your trash to your hand', () => {
    const g = ko([COST8, V.c1]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'trash', COST8)]);
    expect(hand(g, 'p1')).toEqual([COST8]);
  });

  it('cost 9 and Event cards are not candidates; Lola herself (cost 4) is', () => {
    const g = ko([COST9, EVENT, V.c1]);
    const c = cands(g);
    expect(c).toHaveLength(2);
    expect(c).toContain(g.find('p1', 'trash', V.c1));
    expect(c).toContain(g.find('p1', 'trash', ID));
    expect(c).not.toContain(g.find('p1', 'trash', COST9));
    expect(c).not.toContain(g.find('p1', 'trash', EVENT));
  });

  it('"up to 1": may add nothing, never more than 1', () => {
    const g = ko([COST8, V.c1]);
    pick(g, [g.find('p1', 'trash', COST8)]);
    expect(dec(g)?.kind).not.toBe('choose');
    const h = ko([COST8]);
    none(h);
    expect(hand(h, 'p1')).toEqual([]);
    expect(idsOf(h, 'p1', 'trash')).toContain(COST8);
  });

  it('K.O.d on the opponent attack with a plain Leader: the opponent trash is unaffected', () => {
    const g = ko([COST8]);
    none(g);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });
});
