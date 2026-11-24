/** OP03-048 Nojiko. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canPick, cardsIn, mk, NAMI_LEADER } from './helpers-st29old.ts';

const ID = 'OP03-048';

describe('OP03-048 Nojiko', () => {
  it("[On Play]: with a [Nami] Leader, returns up to 1 of the opponent's Characters with a cost of 5 or less to its owner's hand", () => {
    const g = mk({ leader: NAMI_LEADER, hand: [ID] }, { characters: [V.c5, V.c6] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true); // 5 is allowed
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(cardsIn(g, 'p2', 'hand')).toEqual([V.c5]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it('must not do anything with another Leader (nothing is asked)', () => {
    const g = mk({ leader: PLAIN_BLUE, hand: [ID] }, { characters: [V.c3] });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3]);
  });

  it('"up to 1": may return nothing', () => {
    const g = mk({ leader: NAMI_LEADER, hand: [ID] }, { characters: [V.c3] });
    play(g, ID);
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c3]);
  });

  it("only the opponent's Characters are targets, not your own nor a Leader", () => {
    const g = mk({ leader: NAMI_LEADER, hand: [ID], characters: [V.c1] }, { characters: [V.c3] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
  });

  it('the Leader must be named exactly [Nami]: a Nami Character does not count', () => {
    const g = mk(
      { leader: PLAIN_BLUE, hand: [ID], characters: ['EB05-055'] },
      { characters: [V.c3] },
    );
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
  });
});
