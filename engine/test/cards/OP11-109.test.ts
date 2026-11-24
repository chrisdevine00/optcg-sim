/** OP11-109 Pappag. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, pick, play, PLAIN_BLUE, trash, V } from './helpers.ts';
import { CAMIE, FMI_CAMIE } from './helpers-op11g3.ts';

const ID = 'OP11-109';

describe('OP11-109 Pappag', () => {
  const start = (characters: string[] = [CAMIE], extraHand: string[] = [V.c1]) =>
    game(
      {
        leader: PLAIN_BLUE,
        hand: [ID, ...extraHand],
        characters,
        deck: [V.c2, V.c3, V.c4],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: with [Camie], draw 2 cards and trash 2 cards from your hand', () => {
    const g = start();
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2, V.c3]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c3)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c3].sort());
    expectDecision(g, 'main', 'p1');
  });

  it('any card named [Camie] counts', () => {
    const g = start([FMI_CAMIE]);
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('without [Camie] nothing is drawn or trashed', () => {
    const g = start([V.c3]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('a [Camie] in your hand does not count', () => {
    const g = start([], [CAMIE]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([CAMIE]);
  });

  it("the opponent's [Camie] does not count", () => {
    const g = game(
      {
        leader: PLAIN_BLUE,
        hand: [ID],
        deck: [V.c2, V.c3, V.c4],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [CAMIE] },
    );
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('with only 2 cards in hand after drawing, both are trashed', () => {
    const g = start([CAMIE], []);
    play(g, ID);
    // Hand is exactly the 2 drawn cards: they are the only choice.
    while (g.legal().some((a) => a.type === 'pick'))
      g.act(g.legal().find((a) => a.type === 'pick')!);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toHaveLength(2);
  });
});
