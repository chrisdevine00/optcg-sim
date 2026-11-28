/** OP18-080 Van Augur. */
import { describe, expect, it } from 'vitest';
import { BLUE, hand, pick, V } from './helpers.ts';
import { koByEffect } from './helpers-a10g1.ts';
import { GUNKO_L, mine, TEACH_L } from './helpers-op18-g3.ts';
import { withAbilities, type Ability } from '../../src/testing.ts';

const ID = 'OP18-080';

/** The Teach Leader gets a stand-in [Activate: Main] whose cost trashes 1 card from the hand (OP09-081 is not scripted). */
const teach = (chars: string[], handCards = [BLUE, V.c1, V.c2]) => {
  const g = mine({ leader: TEACH_L, characters: chars, hand: handCards }, {});
  g.state = withAbilities(g.state, TEACH_L, [
    {
      id: 'planted',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [{ do: { draw: 0 } }],
    } as unknown as Ability,
  ]);
  return g;
};
const trashOne = (g: ReturnType<typeof teach>, card = BLUE) => {
  g.act({ type: 'activate', card: g.leader('p1'), ability: 'planted' });
  pick(g, [g.find('p1', 'hand', card)]);
};

describe('OP18-080 Van Augur', () => {
  it("when your [Marshall.D.Teach] Leader's effect trashes a card from your hand and you have no other [Van Augur], draw 1", () => {
    const g = teach([ID]);
    trashOne(g);
    expect(hand(g, 'p1')).toHaveLength(3); // 3 - 1 trashed + 1 drawn
  });

  it('with another [Van Augur] on your field it does nothing', () => {
    const g = teach([ID, ID]);
    trashOne(g);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it("a card trashed by another Leader's effect does not count", () => {
    const g = mine({ leader: GUNKO_L, characters: [ID, V.c6], hand: [BLUE, V.c1] }, {});
    g.act({ type: 'activate', card: g.leader('p1'), ability: 'add-don' });
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('Once Per Turn: a second trash in the same turn draws nothing', () => {
    const g = teach([ID]);
    trashOne(g);
    expect(hand(g, 'p1')).toHaveLength(3);
    trashOne(g, V.c1);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('[On K.O.] draw 1 card', () => {
    const g = mine({ characters: [ID], hand: [BLUE] }, {});
    koByEffect(g, 'p1', ID);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });
});
