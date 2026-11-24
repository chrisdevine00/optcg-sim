/** ST32-001 Kin'emon. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  option,
  pick,
  play,
  PLAIN_BLUE,
  trash,
} from './helpers.ts';
import { donArea, NONSLASH_LEADER, SLASH_LEADER } from './helpers-stg1.ts';

const ID = 'ST32-001';

const start = (leader: string, active: number, leaderRested = false) =>
  game(
    {
      leader: { card: leader, rested: leaderRested },
      hand: [ID],
      deck: [BLUE, BLUE, BLUE, BLUE],
      ...donArea(active),
    },
    { leader: PLAIN_BLUE },
  );
/** Draw 2, then trash 1 (the choice is asked). */
const finish = (g: ReturnType<typeof start>) => {
  expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
  expectDecision(g, 'choose', 'p1');
  pick(g, [g.find('p1', 'hand', BLUE)]);
  expect(hand(g, 'p1')).toEqual([BLUE]);
  expect(trash(g, 'p1')).toEqual([BLUE]);
};

describe("ST32-001 Kin'emon", () => {
  it('[On Play]: you may rest your <Slash> Leader: draw 2 cards and trash 1 card from your hand', () => {
    const g = start(SLASH_LEADER, 1 + 1);
    play(g, ID);
    accept(g);
    option(g, '0'); // rest the Leader
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1 }); // only the play cost
    finish(g);
  });

  it('or 1 of your DON!! cards: the Leader stays active', () => {
    const g = start(SLASH_LEADER, 1 + 1);
    play(g, ID);
    accept(g);
    option(g, '1'); // rest 1 DON!!
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2 });
    finish(g);
  });

  it('a Leader without the <Slash> attribute cannot pay: only the DON!! alternative is left', () => {
    const g = start(NONSLASH_LEADER, 1 + 1);
    play(g, ID);
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2 });
    finish(g);
  });

  it('a rested <Slash> Leader cannot pay, and with no active DON!! left nothing can: the cost is not payable', () => {
    const g = start(SLASH_LEADER, 1, true);
    play(g, ID);
    expectDecision(g, 'main', 'p1'); // the optional cost is not even offered
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('with an active <Slash> Leader and no active DON!! the Leader pays; declining pays nothing and draws nothing', () => {
    const g = start(SLASH_LEADER, 1);
    play(g, ID);
    accept(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    finish(g);
    const d = start(SLASH_LEADER, 2);
    play(d, ID);
    decline(d);
    expect(d.card(d.leader('p1')).rested).toBe(false);
    expect(hand(d, 'p1')).toEqual([]);
  });
});
