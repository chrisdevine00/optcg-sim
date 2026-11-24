/** EB04-043 Kaku: [Once Per Turn] if your black Character with a base cost of 5 or less would be K.O.'d by your opponent's effect, you may place 3 cards from your trash at the bottom of your deck instead; [On Play] trash 2 cards from the top of your deck. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, pick, play, V } from './helpers.ts';
import {
  BLACK1,
  BLACK5,
  BLACK6,
  ids,
  koNow,
  mine,
  OTHER_LEADER,
  plant,
  rep,
} from './helpers-eb04g2.ts';

const ID = 'EB04-043';
const TRASH = [V.c1, V.c2, V.c3, V.c4];

const setup = (chars: string[], trash: string[] = TRASH) =>
  mine({ leader: OTHER_LEADER, characters: chars, trash });
/** Place the cards of an `order` decision at the bottom in the order offered first. */
const settle = (g: ReturnType<typeof setup>) => {
  while (dec(g)?.kind === 'order') g.act(g.legal()[0]!);
};

describe('EB04-043 Kaku', () => {
  it('[On Play] trashes 2 cards from the top of your deck', () => {
    const g = mine({ leader: OTHER_LEADER, hand: [ID], deck: [V.c1, V.c2, V.c3] });
    play(g, ID);
    expect(ids(g, 'p1', 'trash')).toEqual([V.c2, V.c1]);
    expect(ids(g, 'p1', 'deck')).toEqual([V.c3]);
  });

  it('[On Play] with 1 card in the deck trashes just that card (no loss for an empty deck)', () => {
    const g = mine({ leader: OTHER_LEADER, hand: [ID], deck: [V.c1] });
    play(g, ID);
    expect(ids(g, 'p1', 'deck')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual([V.c1]);
  });

  it("instead of K.O. by the opponent's effect: 3 trash cards go to the bottom of the deck and the Character stays", () => {
    const g = setup([ID]);
    koNow(g, 'p1', ID, 'p2');
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [
      g.find('p1', 'trash', V.c1),
      g.find('p1', 'trash', V.c2),
      g.find('p1', 'trash', V.c3),
    ]);
    settle(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(ids(g, 'p1', 'trash')).toEqual([V.c4]);
    expect(ids(g, 'p1', 'deck').slice(-3).sort()).toEqual([V.c1, V.c2, V.c3].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(13);
  });

  it('protects another black Character with a base cost of 5 or less', () => {
    const g = setup([ID, BLACK5]);
    koNow(g, 'p1', BLACK5, 'p2');
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [
      g.find('p1', 'trash', V.c1),
      g.find('p1', 'trash', V.c2),
      g.find('p1', 'trash', V.c3),
    ]);
    settle(g);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([ID, BLACK5].sort());
  });

  it('boundary: base cost 6 is not protected, and a non-black Character is not protected', () => {
    const g = setup([ID, BLACK6, V.c3]);
    koNow(g, 'p1', BLACK6, 'p2');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p1', 'characters').sort()).toEqual([ID, V.c3].sort());
    koNow(g, 'p1', V.c3, 'p2');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('the limit is the base cost: a black cost 5 Character raised to cost 7 is still protected', () => {
    const g = setup([ID, BLACK5]);
    plant(g, 'p1', {
      cost: {
        target: { from: 'characters', owner: 'you', filter: { name: 'Inazuma' } },
        amount: 2,
        duration: 'thisTurn',
      },
    });
    expect(g.card(g.find('p1', 'characters', BLACK5)).cost).toBe(7);
    koNow(g, 'p1', BLACK5, 'p2');
    expectDecision(g, 'optional', 'p1');
    decline(g);
  });

  it('only the opponent effects: an effect of your own that K.O.s your Character is not replaced', () => {
    const g = setup([ID, BLACK1]);
    koNow(g, 'p1', BLACK1, 'p1');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('declining the replacement lets the K.O. happen; the trash is untouched', () => {
    const g = setup([ID]);
    koNow(g, 'p1', ID, 'p2');
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toHaveLength(5);
  });

  it('with fewer than 3 cards in the trash the replacement cannot be used', () => {
    const g = setup([ID], [V.c1, V.c2]);
    koNow(g, 'p1', ID, 'p2');
    if (dec(g)?.kind === 'optional') {
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
    }
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Once Per Turn]: a second K.O. by an opposing effect in the same turn is not replaced', () => {
    const g = setup([ID, BLACK5], rep(8, V.c1));
    koNow(g, 'p1', BLACK5, 'p2');
    accept(g);
    pick(g, [
      g.find('p1', 'trash', V.c1, 0),
      g.find('p1', 'trash', V.c1, 1),
      g.find('p1', 'trash', V.c1, 2),
    ]);
    settle(g);
    koNow(g, 'p1', ID, 'p2');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([BLACK5]);
  });
});
