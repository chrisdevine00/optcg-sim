/**
 * ST24-003 Basil Hawkins (Character, Green, cost 4, 4000, Counter +2000, {Hawkins Pirates}/{Supernovas}).
 *
 * Card text: [End of Your Turn] Set up to 1 of your DON!! cards as active.
 *
 * "Set up to N DON!!" asks a count (most first) in the current engine; tests answer that question
 * when it is asked and assert the outcome.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import { atMain, mine, need, theirs } from '../op17/kit-op17b.ts';
import { countIfAsked, LC, SCL, donSum, asksDonCount, settleOrders } from './kit-lfc.ts';

const HAWK = 'ST24-003';

function game(
  chars: (string | { card: string; rested?: boolean; playedThisTurn?: boolean })[],
  rested: number,
  active = 0,
) {
  return mine(LC.plain, { characters: chars, costArea: { active, rested } }, {});
}

/** End p1's turn and answer the DON!! count questions of p1 with `n` each. */
function endMyTurn(g: ReturnType<typeof game>, n = 1) {
  act(g, { type: 'endTurn' });
  for (let i = 0; i < 4; i++) {
    settleOrders(g);
    if (!countIfAsked(g, n)) break;
  }
}

describe('ST24-003 Basil Hawkins: [End of Your Turn] set up to 1 of your DON!! as active', () => {
  it('at the end of my turn one rested DON!! becomes active (the other rested ones stay rested)', () => {
    const g = game([HAWK], 3);
    endMyTurn(g);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
  });

  it('"up to 1": the owner may choose 0 and nothing is set active', () => {
    const g = game([HAWK], 3);
    act(g, { type: 'endTurn' });
    settleOrders(g);
    expect(asksDonCount(g)).toBe(true);
    expect(countIfAsked(g, 0)).toBe(true);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
  });

  it('with no rested DON!! it changes nothing', () => {
    const g = game([HAWK], 0, 4);
    endMyTurn(g);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 4, rested: 0 });
  });

  it('sets at most 1 even with many rested DON!!', () => {
    const g = game([HAWK], 7, 1);
    endMyTurn(g, 1);
    expect(donSum(g, 'p1')).toMatchObject({ active: 2, rested: 6 });
  });

  it('two Hawkins each set one DON!! active (2 in total)', () => {
    const g = game([HAWK, HAWK], 4);
    endMyTurn(g);
    need(g, 'main', 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 2, rested: 2 });
  });

  it('works while Hawkins is rested', () => {
    const g = game([{ card: HAWK, rested: true }], 2);
    endMyTurn(g);
    expect(donSum(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
  });

  it('works on the turn it was played (no summoning-sickness restriction on an auto effect)', () => {
    const g = game([{ card: HAWK, playedThisTurn: true }, SCL.c2], 2);
    endMyTurn(g);
    expect(donSum(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
  });

  it('does not trigger at the end of the opponent turn: no question is asked and the Main Phase of p1 follows', () => {
    const g = theirs(
      LC.plain,
      { characters: [HAWK], costArea: { active: 0, rested: 3 } },
      { costArea: { active: 2, rested: 0 } },
    );
    act(g, { type: 'endTurn' });
    expect(atMain(g, 'p1')).toBe(true);
  });
});
