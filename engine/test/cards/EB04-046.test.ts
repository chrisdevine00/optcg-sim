/** EB04-046 Doll: [Blocker]; [Opponent's Turn] all of your {Navy} type Characters gain +2 cost. */
import { describe, expect, it } from 'vitest';
import { game, PLAIN_BLUE, V } from './helpers.ts';
import { BLACK1, NAVY_LEADER, mine } from './helpers-eb04g2.ts';

const ID = 'EB04-046';

const oppTurn = (chars: string[]) =>
  game(
    { leader: NAVY_LEADER, characters: chars },
    { leader: PLAIN_BLUE },
    { turn: 4, activePlayer: 'p2' },
  );

describe('EB04-046 Doll', () => {
  it('has [Blocker]', () => {
    const g = mine({ leader: NAVY_LEADER, characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("on your opponent's turn every {Navy} Character gains +2 cost, Doll included", () => {
    const g = oppTurn([ID, BLACK1, V.c3]);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(4);
    expect(g.card(g.find('p1', 'characters', BLACK1)).cost).toBe(3);
  });

  it('a Character that is not {Navy} gains nothing', () => {
    const g = oppTurn([ID, V.c3]);
    expect(g.card(g.find('p1', 'characters', V.c3)).cost).toBe(3);
  });

  it('on your own turn costs are unchanged', () => {
    const g = mine({ leader: NAVY_LEADER, characters: [ID, BLACK1] });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(2);
    expect(g.card(g.find('p1', 'characters', BLACK1)).cost).toBe(1);
  });

  it("the opponent's {Navy} Characters are not raised", () => {
    const g = game(
      { leader: NAVY_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [BLACK1] },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(g.card(g.find('p2', 'characters', BLACK1)).cost).toBe(1);
  });

  it('two Dolls do not stack with themselves beyond +2 each (each Doll adds +2)', () => {
    const g = oppTurn([ID, ID, BLACK1]);
    expect(g.card(g.find('p1', 'characters', BLACK1)).cost).toBe(5);
  });
});
