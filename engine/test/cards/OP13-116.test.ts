/** OP13-116 The One Who Is the Most Free Is the Pirate King!!! */
import { describe, expect, it } from 'vitest';
import { BLUE, hand, none, pick, play, PLAIN_PURPLE, PURPLE, V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import { canPick, mine, names, orderAll, SUPERNOVA } from './helpers-op13g4.ts';

const ID = 'OP13-116';

const run = (deck: string[]) => {
  const g = mine({ leader: PLAIN_PURPLE, hand: [ID], deck }, {}, 1);
  play(g, ID);
  return g;
};

describe('OP13-116 The One Who Is the Most Free Is the Pirate King!!!', () => {
  it('[Main] takes 1 {Supernovas} Character from the top 5; the rest go to the bottom in an order you pick', () => {
    const deck = [BLUE, V.c1, SUPERNOVA, V.c2, V.c3, 'OP10-101', V.c4];
    const g = run(deck);
    pick(g, [g.find('p1', 'deck', SUPERNOVA)]);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([SUPERNOVA]);
    const d = names(g, 'p1', 'deck');
    expect(d).toHaveLength(6);
    expect(d[0]).toBe('OP10-101');
    expect(d.slice(1).sort()).toEqual([BLUE, V.c1, V.c2, V.c3, V.c4].sort());
  });

  it('only {Supernovas} Characters are offered', () => {
    const g = run([V.c1, SUPERNOVA, BLUE, V.c2, V.c3, V.c4]);
    expect(canPick(g, g.find('p1', 'deck', SUPERNOVA))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    none(g);
  });

  it('"up to 1": may take nothing, all 5 go to the bottom', () => {
    const g = run([SUPERNOVA, V.c1, V.c2, V.c3, V.c4, BLUE]);
    none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(names(g, 'p1', 'deck')[0]).toBe(BLUE);
    expect(names(g, 'p1', 'deck')).toHaveLength(6);
  });

  it('the 6th card is not looked at', () => {
    const g = run([V.c1, V.c2, V.c3, V.c4, BLUE, SUPERNOVA]);
    expect(canPick(g, g.find('p1', 'deck', SUPERNOVA))).toBe(false);
    none(g);
  });

  it('[Trigger] activates the [Main] effect', () => {
    const g = damageWith(ID, {
      leader: PLAIN_PURPLE,
      deck: [PURPLE, SUPERNOVA, BLUE, V.c1, V.c2, V.c3],
    });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'deck', SUPERNOVA)]);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([SUPERNOVA]);
  });
});
