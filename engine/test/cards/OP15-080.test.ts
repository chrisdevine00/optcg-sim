/** OP15-080 Oars. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, pick, V } from './helpers.ts';
import {
  idsOf,
  koedInBattle,
  MORIA10,
  MORIA9,
  OARS2,
  orderAll,
  mine,
  OTHER_LEADER,
} from './helpers-op15g2.ts';

const ID = 'OP15-080';

describe('OP15-080 Oars', () => {
  const power = (chars: (string | { card: string; don?: number })[], opp: string[] = []) => {
    const g = mine(OTHER_LEADER, { characters: chars }, { characters: opp });
    return g.power(g.find('p1', 'characters', ID));
  };

  it('with [Gecko Moria] at 10000 power on your field and no other [Oars] it gains +7000 (base 0)', () => {
    expect(power([ID, MORIA10])).toBe(7000);
  });

  it('a [Gecko Moria] with 9000 power is not enough', () => {
    expect(power([ID, MORIA9])).toBe(0);
  });

  it('the current power counts: a 9000 Moria with 1 DON!! given on your turn has 10000', () => {
    expect(power([ID, { card: MORIA9, don: 1 }])).toBe(7000);
  });

  it('without [Gecko Moria] it stays at 0', () => {
    expect(power([ID, V.c7])).toBe(0);
  });

  it('another [Oars] on your field switches it off (both copies)', () => {
    const g = mine(OTHER_LEADER, { characters: [ID, OARS2, MORIA10] });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(0);
    const two = mine(OTHER_LEADER, { characters: [ID, ID, MORIA10] });
    for (const c of two.zone('p1', 'characters').filter((x) => x.card === ID))
      expect(two.power(c.instance)).toBe(0);
  });

  it("an [Oars] on the opponent's field is not on your field (reading): it still gains +7000", () => {
    expect(power([ID, MORIA10], [OARS2])).toBe(7000);
  });

  const ko = (trash: string[]) => koedInBattle(ID, { leader: OTHER_LEADER, trash });

  it('[On K.O.] place 3 cards from your trash at the bottom of your deck: play this Character from your trash', () => {
    const g = ko([V.c1, V.c2, V.c3, V.c4]);
    accept(g);
    pick(g, [
      g.find('p1', 'trash', V.c1),
      g.find('p1', 'trash', V.c2),
      g.find('p1', 'trash', V.c3),
    ]);
    // The owner orders the 3 cards placed at the bottom ("in any order").
    expect(dec(g)?.kind).toBe('order');
    orderAll(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c4]);
    expect(
      g
        .zone('p1', 'deck')
        .slice(-3)
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c1, V.c2, V.c3].sort());
  });

  it('the cost may be declined: Oars stays in the trash', () => {
    const g = ko([V.c1, V.c2, V.c3]);
    decline(g);
    expect(idsOf(g, 'p1', 'trash')).toContain(ID);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('exactly 3 cards are needed: Oars plus one other card in the trash cannot pay', () => {
    const g = ko([V.c1]);
    if (dec(g)?.kind === 'optional') {
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
    }
    expect(idsOf(g, 'p1', 'trash')).toContain(ID);
  });

  it('with only 2 other cards, paying with Oars itself leaves nothing to play (it goes to the deck bottom)', () => {
    const g = ko([V.c1, V.c2]);
    accept(g);
    // Exactly 3 candidates: the choice is forced, only the order is asked.
    expect(dec(g)?.kind).toBe('order');
    orderAll(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
  });
});
