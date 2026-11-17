/** OP17-112 Charlotte Linlin: [Your Turn] [Trigger] 4000-base Characters have 8000 base power; [On Play] draw 1, then choose one. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, game, hand, play, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { BMP, ENEL, ids, TRIG, TRIG5 } from './helpers-robin.ts';

const LINLIN = 'OP17-112';

describe('OP17-112 Charlotte Linlin', () => {
  const board = (activePlayer: 'p1' | 'p2') =>
    game(
      { leader: ENEL, characters: [LINLIN, TRIG, BMP, TRIG5] },
      { leader: PLAIN_BLUE, characters: [TRIG] },
      { activePlayer, turn: activePlayer === 'p1' ? 3 : 4 },
    );

  it('[Your Turn] base power 4000 with a [Trigger] becomes 8000; others are unchanged', () => {
    const g = board('p1');
    expect(g.power(g.find('p1', 'characters', TRIG))).toBe(8000);
    expect(g.power(g.find('p1', 'characters', BMP))).toBe(4000); // no [Trigger]
    expect(g.power(g.find('p1', 'characters', TRIG5))).toBe(5000); // base 5000
    expect(g.power(g.find('p1', 'characters', LINLIN))).toBe(12000);
  });

  it('only your own Characters: the opponent has none changed', () => {
    const g = board('p1');
    expect(g.power(g.find('p2', 'characters', TRIG))).toBe(4000);
  });

  it("not on the opponent's turn", () => {
    const g = board('p2');
    expect(g.power(g.find('p1', 'characters', TRIG))).toBe(4000);
  });

  const onPlay = () =>
    game(
      {
        leader: ENEL,
        hand: [LINLIN],
        deck: [PURPLE, BLUE, BLUE, BLUE],
        costArea: { active: 10, rested: 0 },
      },
      { leader: PLAIN_BLUE, life: [V.c1, PURPLE, BLUE] },
    );

  const mode = (g: ReturnType<typeof onPlay>, index: number) => {
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.prompt).toContain('Linlin');
    const opts = g.legal().filter((a) => a.type === 'pick');
    expect(opts).toHaveLength(2);
    g.act(opts[index]!);
  };

  it('[On Play] draw 1, then add the top card of your deck to your Life', () => {
    const g = onPlay();
    play(g, LINLIN);
    mode(g, 0);
    if (dec(g)?.kind === 'optional') g.act({ type: 'optional', accept: true });
    expect(hand(g, 'p1')).toEqual([PURPLE]);
    expect(g.life('p1')).toBe(4);
    expect(ids(g, 'p1', 'life')[0]).toBe(BLUE);
  });

  it("[On Play] draw 1, then add the top of your opponent's Life to their hand", () => {
    const g = onPlay();
    play(g, LINLIN);
    mode(g, 1);
    if (dec(g)?.kind === 'optional') g.act({ type: 'optional', accept: true });
    expect(hand(g, 'p1')).toEqual([PURPLE]);
    expect(g.life('p1')).toBe(3);
    expect(g.life('p2')).toBe(2);
    expect(ids(g, 'p2', 'hand')).toEqual([V.c1]);
  });
});
