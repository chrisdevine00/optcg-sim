/**
 * OP14-090 Mr.1(Daz.Bonez) (Character, Black, cost 5, 6000, Counter +1000, {Baroque Works}).
 *
 * Card text: "If there is a Character with a cost of 0 or with a cost of 8 or more, this Character can
 * attack Characters on the turn in which it is played.
 * [On Play] Rest up to 1 of your opponent's Characters with a cost of 0."
 *
 * Rules: CR 3-7-4 (a played Character cannot attack that turn), CR 10-1-6 ([Rush: Character]-like
 * permission: attack Characters only), CR 6-5-6 (only rested Characters can be attacked), M4b-7
 * ("a Character" is on either side, current cost, the card itself included).
 * Cost 0 is made with OP17-097 (every opposing Character -1 cost this turn): a cost-1 Mohji.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  canHit,
  LD14,
  makeCostZero,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playId,
  SC14,
  skipEmptyChoose,
} from './kit-op14d.ts';

const ID = 'OP14-090';

function setup(
  o: {
    mine?: string[];
    theirs?: (string | { card: string; rested?: boolean })[];
    hand?: string[];
  } = {},
) {
  return mine(
    LD14.bw,
    { hand: [ID, ...(o.hand ?? [])], characters: o.mine ?? [] },
    { characters: o.theirs ?? [] },
  );
}

describe('OP14-090 Mr.1(Daz.Bonez): can attack Characters the turn it is played if a Character has cost 0 or 8+', () => {
  it('an opposing cost-8 Character: Mr.1 can attack a rested opposing Character on the turn it is played', () => {
    const g = setup({ theirs: [SC14.c8, { card: SC14.c2, rested: true }] });
    playId(g, ID);
    skipEmptyChoose(g);
    expect(canHit(g, at(g, 'p1', 'characters', ID), g.find('p2', 'characters', SC14.c2))).toBe(
      true,
    );
  });

  it('it still cannot attack the Leader that turn (only Characters)', () => {
    const g = setup({ theirs: [SC14.c8] });
    playId(g, ID);
    skipEmptyChoose(g);
    expect(canHit(g, at(g, 'p1', 'characters', ID), g.leader('p2'))).toBe(false);
  });

  it('with no Character of cost 0 or 8+, it cannot attack at all on the turn it is played', () => {
    const g = setup({ theirs: [SC14.c7, { card: SC14.c2, rested: true }] });
    playId(g, ID);
    skipEmptyChoose(g);
    expect(canHit(g, at(g, 'p1', 'characters', ID), g.find('p2', 'characters', SC14.c2))).toBe(
      false,
    );
  });

  it('boundary: cost 7 does not enable it, cost 8 does (own Character counts too)', () => {
    const g7 = setup({ mine: [SC14.c7], theirs: [{ card: SC14.c2, rested: true }] });
    playId(g7, ID);
    skipEmptyChoose(g7);
    expect(canHit(g7, at(g7, 'p1', 'characters', ID), g7.find('p2', 'characters', SC14.c2))).toBe(
      false,
    );
    const g8 = setup({ mine: [SC14.c8], theirs: [{ card: SC14.c2, rested: true }] });
    playId(g8, ID);
    skipEmptyChoose(g8);
    expect(canHit(g8, at(g8, 'p1', 'characters', ID), g8.find('p2', 'characters', SC14.c2))).toBe(
      true,
    );
  });

  it('cost 9 also enables it ("8 or more"), and the next turn it attacks the Leader like any Character', () => {
    const g = setup({ theirs: [SC14.c9, { card: SC14.c2, rested: true }] });
    playId(g, ID);
    skipEmptyChoose(g);
    expect(canHit(g, at(g, 'p1', 'characters', ID), g.find('p2', 'characters', SC14.c2))).toBe(
      true,
    );
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(canHit(g, at(g, 'p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });

  it('a Character of cost 0 enables it too', () => {
    const g = setup({
      hand: [SC14.shrink],
      theirs: [
        { card: SC14.c1, rested: true },
        { card: SC14.c2, rested: true },
      ],
    });
    makeCostZero(g, g.find('p2', 'characters', SC14.c1));
    playId(g, ID);
    need(g, 'choose', 'p1');
    none(g);
    expect(canHit(g, at(g, 'p1', 'characters', ID), g.find('p2', 'characters', SC14.c2))).toBe(
      true,
    );
  });
});

describe('OP14-090 Mr.1(Daz.Bonez): [On Play] rest up to 1 opposing Character with cost 0', () => {
  function withZero() {
    const g = setup({ hand: [SC14.shrink], theirs: [SC14.c1, SC14.c2] });
    makeCostZero(g, g.find('p2', 'characters', SC14.c1));
    playId(g, ID);
    return g;
  }

  it('offers only the cost-0 Character (a cost-1 one, after the -1, is not offered) and rests it', () => {
    const g = withZero();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c1]);
    pickCards(g, [SC14.c1]);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p2', 'characters', SC14.c1)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', SC14.c2)).rested).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = withZero();
    none(g);
    expect(g.card(g.find('p2', 'characters', SC14.c1)).rested).toBe(false);
  });

  it('with no cost-0 Character nothing is asked and nothing is rested', () => {
    const g = setup({ theirs: [SC14.c1, SC14.c2] });
    playId(g, ID);
    skipEmptyChoose(g);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });
});
