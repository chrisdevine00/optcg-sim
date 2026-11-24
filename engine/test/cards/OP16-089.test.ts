/** OP16-089 Dracule Mihawk. */
import { describe, expect, it } from 'vitest';
import { BLUE, game, hand, none, pick, play, PLAIN_BLUE, PURPLE, trash, V } from './helpers.ts';
import { NOT_NAVY } from './helpers-op16g3.ts';

const ID = 'OP16-089';
const start = () =>
  game(
    { leader: NOT_NAVY, hand: [ID, PURPLE, V.c1], costArea: { active: 6, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [V.c7, V.c1] },
  );

describe('OP16-089 Dracule Mihawk', () => {
  it('has [Rush: Character]', () => {
    const g = start();
    play(g, ID);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush: Character');
  });

  it('[On Play] draws 2, trashes 2, then gives an opponent Character -4 cost this turn', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'hand', PURPLE), g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
    expect(trash(g, 'p1').sort()).toEqual([PURPLE, V.c1].sort());
    expect(g.card(g.find('p2', 'characters', V.c7)).cost).toBe(3);
    expect(g.card(g.find('p2', 'characters', V.c1)).cost).toBe(1);
  });

  it('"up to 1": may choose no Character; the draw and trash still happen', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'hand', BLUE, 0), g.find('p1', 'hand', BLUE, 1)]);
    none(g);
    expect(hand(g, 'p1').sort()).toEqual([PURPLE, V.c1].sort());
    expect(g.card(g.find('p2', 'characters', V.c7)).cost).toBe(7);
  });

  it('a cost 3 Character drops to 0 at the floor, not below', () => {
    const g = game(
      { leader: NOT_NAVY, hand: [ID, PURPLE, V.c1], costArea: { active: 6, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    play(g, ID);
    pick(g, [g.find('p1', 'hand', PURPLE), g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).cost).toBe(0);
  });
});
