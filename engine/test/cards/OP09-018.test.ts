/** OP09-018 Get Out of Here! */
import { describe, expect, it } from 'vitest';
import { none, pick, play, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { boost, canPick, game, pickableCards, TEN } from './helpers-w6c1.ts';

const ID = 'OP09-018';
const P1000 = 'OP13-007';
const P2000 = 'OP08-104';

describe('OP09-018 Get Out of Here!', () => {
  const mk = (oppChars: string[]) =>
    game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: TEN },
      { leader: PLAIN_BLUE, characters: oppChars },
    );
  const left = (g: ReturnType<typeof mk>) => g.zone('p2', 'characters').map((c) => c.card);

  it('[Main]: K.O.s up to 2 of the opponent’s Characters with a total power of 4000 or less (2000 + 2000, exactly 4000)', () => {
    const g = mk([P2000, P2000, V.c3]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', P2000, 0), g.find('p2', 'characters', P2000, 1)]);
    expect(left(g)).toEqual([V.c3]);
  });

  it('after one Character, the second must fit the remaining total: 3000 then only 1000 or less', () => {
    const g = mk([V.c1, P1000, P2000, V.c2]);
    play(g, ID);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c1) });
    // 3000 chosen: 1000 left. The 1000-power Character is offered; the 2000 and 4000 ones are not.
    expect(pickableCards(g)).toEqual([P1000]);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', P1000) });
    expect(left(g)).toEqual([P2000, V.c2]);
  });

  it('a single Character of exactly 4000 may be K.O.’d; 5000 is never offered', () => {
    const g = mk([V.c2, V.c3]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(left(g)).toEqual([V.c3]);
  });

  it('two Characters at 2000 + 3000 = 5000 cannot both be chosen', () => {
    const g = mk([P2000, V.c1]);
    play(g, ID);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c1) });
    // 3000 chosen, 1000 left: the 2000 Character cannot be added.
    expect(pickableCards(g)).toEqual([]);
    g.act({ type: 'done' });
    expect(left(g)).toEqual([P2000]);
  });

  it('uses current power: a boosted Character counts for more, a weakened one for less', () => {
    const g = mk([V.c1, V.c3]);
    boost(g, g.find('p2', 'characters', V.c1), 1000); // 3000 -> 4000
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    const h = mk([V.c3]);
    boost(h, h.find('p2', 'characters', V.c3), -1000); // 5000 -> 4000
    play(h, ID);
    expect(canPick(h, h.find('p2', 'characters', V.c3))).toBe(true);
  });

  // Official Q&A (qa_op09): "K.O. 1 Character with -2000 power and 1 Character with 6000 power?
  // Yes, you can." Negative power counts as it is (W57-R2), whichever way the candidates list.
  it.each([
    ['the -2000 Character listed first', 0, 1],
    ['the 6000 Character listed first', 1, 0],
  ])('a -2000 and a 6000 Character together make 4000: %s', (_n, neg, pos) => {
    const g = mk([V.c1, V.c1]);
    boost(g, g.find('p2', 'characters', V.c1, neg), -5000); // 3000 -> -2000
    boost(g, g.find('p2', 'characters', V.c1, pos), 3000); // 3000 -> 6000
    play(g, ID);
    const first = g.find('p2', 'characters', V.c1, 0);
    const second = g.find('p2', 'characters', V.c1, 1);
    expect(canPick(g, first)).toBe(true);
    g.act({ type: 'pick', choice: first });
    expect(canPick(g, second)).toBe(true);
    // Done is not offered while the total (6000 alone) is over the bound.
    if (pos === 0) {
      expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    }
    g.act({ type: 'pick', choice: second });
    expect(left(g)).toEqual([]);
  });

  it('a 6000 Character alone is refused (done is not legal over the bound); with a 5000 Character after it nothing fits', () => {
    const g = mk([V.c1, V.c3]);
    boost(g, g.find('p2', 'characters', V.c1), 3000); // 6000, and no negative later
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(false);
  });

  it('"up to 2": may K.O. nothing', () => {
    const g = mk([P2000]);
    play(g, ID);
    none(g);
    expect(left(g)).toEqual([P2000]);
  });
});
