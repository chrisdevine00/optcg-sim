/**
 * OP17-087 Nico Robin (Character, Black, cost 2, 2000, Counter +1000, {Straw Hat Crew}/{Elbaph}).
 *
 * Card text (override patch fixes the "poser" typo):
 *   "If there is a Character with a cost of 12 or more, this Character gains +3000 power.
 *    [On Play] If there is a Character with a cost of 12 or more, give up to 1 of your
 *    opponent's Characters −3000 power during this turn."
 *
 * Rules: CR 4-10-1; CR 8-1-3-3 (either player's Character with current cost 12+ counts, RL-43);
 * CR 8-4-4-1 ("up to"); CR 6-6-1-3 ("during this turn").
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import { kind, myTurn } from '../kit.ts';
import { C, drive, FILLER, offeredCards, playCard, side, sorted, V } from './kit-c.ts';

const ID = 'OP17-087';

function game(mine: string[], theirs: string[]) {
  return myTurn(
    side(C.luffy, FILLER, { hand: [ID], characters: mine, costArea: { active: 2, rested: 0 } }),
    side(C.shanks, FILLER, { characters: [V.kingdew, ...theirs] }),
  );
}

describe('OP17-087 Robin: +3000 power with a cost 12+ Character', () => {
  it.each([
    ['own Saul', [ID, C.saul], [], 5000],
    ['opponent Saul', [ID], [C.saul], 5000],
    ['none (cost 10 is not enough)', [ID, C.cost10], [], 2000],
  ])('%s → %i', (_n, mine, theirs, power) => {
    const g = myTurn(
      side(C.luffy, FILLER, { characters: mine as string[] }),
      side(C.shanks, FILLER, { characters: theirs as string[] }),
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(power);
  });
});

describe('OP17-087 Robin: [On Play] with a cost 12+ Character → opponent Character −3000 this turn', () => {
  it('own Saul: the chosen opponent Character is 7000 − 3000', () => {
    const g = game([C.saul], []);
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(4000);
  });

  it("opponent's Saul also enables it", () => {
    const g = game([], [C.saul]);
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(4000);
  });

  it('CR 4-10-1: without a cost 12+ Character nothing happens', () => {
    const g = game([C.cost10], []);
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(7000);
  });

  it("only opponent Characters are offered (Saul on the opponent's side is a candidate; my Characters are not)", () => {
    const g = game([C.saul], [C.cost10]);
    playCard(g, 'p1', ID);
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([V.kingdew, C.cost10]));
  });

  it('"up to 1": may choose nobody', () => {
    const g = game([C.saul], []);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [] });
    expect(g.power(g.find('p2', 'characters', V.kingdew))).toBe(7000);
  });

  it('only one Character is affected', () => {
    const g = game([C.saul], [V.sai]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [g.find('p2', 'characters', V.kingdew), g.find('p2', 'characters', V.sai)],
    });
    expect(
      g.power(g.find('p2', 'characters', V.kingdew))! + g.power(g.find('p2', 'characters', V.sai))!,
    ).toBe(8000);
  });

  it('"during this turn": the −3000 is gone on the opponent\'s turn', () => {
    const g = game([C.saul], []);
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t] });
    endTurn(g);
    expect(g.power(t)).toBe(7000);
  });

  it("Robin's own cost 2 does not satisfy the condition by itself", () => {
    const g = game([], []);
    const t = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(7000);
  });
});
