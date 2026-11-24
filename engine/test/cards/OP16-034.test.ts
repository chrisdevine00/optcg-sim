/** OP16-034 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, dec, hand, none, pick, play, V } from './helpers.ts';
import { IMPEL_LEADER, BLUE_LEADER, mine, MR2_G, MR3_G, PRISONER } from './helpers-op16g2.ts';
import { game } from './helpers.ts';

const ID = 'OP16-034';

describe('OP16-034 Monkey.D.Luffy', () => {
  const board = (chars: { card: string; don?: number }[], p1 = {}) =>
    game(
      { leader: IMPEL_LEADER, characters: chars, ...p1 },
      { leader: BLUE_LEADER, characters: [V.c1, V.c2] },
    );

  it('[DON!! x1] [Your Turn] +1000 power per Character with a different name (itself included)', () => {
    const g = board([{ card: ID, don: 1 }, { card: MR2_G }, { card: MR3_G }]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(3000 + 0 + 1000); // 3 names + the DON!!
  });

  it('Characters sharing a name count once', () => {
    const g = board([{ card: ID, don: 1 }, { card: PRISONER }, { card: PRISONER }]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(2000 + 1000);
  });

  it('with no DON!! given it has no bonus', () => {
    const g = board([{ card: ID }, { card: MR2_G }, { card: MR3_G }]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(0);
  });

  it("not on the opponent's turn", () => {
    const g = game(
      { leader: IMPEL_LEADER, characters: [{ card: ID, don: 1 }, { card: MR2_G }] },
      { leader: BLUE_LEADER },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(0); // no bonus off your turn
  });

  it('[On Play] looks at 3, reveals up to 1 {Impel Down} card into your hand, the rest to the bottom', () => {
    const g = mine({ hand: [ID], deck: [PURPLE, PRISONER, PURPLE, BLUE, BLUE] });
    play(g, ID);
    pick(g, [g.find('p1', 'deck', PRISONER)]);
    const order = dec(g);
    if (order?.kind === 'choose')
      while (dec(g)?.kind === 'choose') g.act(g.legal().find((a) => a.type !== 'concede')!);
    expect(hand(g, 'p1')).toEqual([PRISONER]);
    expect(g.zone('p1', 'deck')).toHaveLength(4);
  });

  it('"up to 1": may take none; a card below the top 3 is out of reach', () => {
    const g = mine({ hand: [ID], deck: [PURPLE, PURPLE, BLUE, PRISONER, BLUE] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    while (dec(g)?.kind === 'choose') g.act(g.legal().find((a) => a.type !== 'concede')!);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
