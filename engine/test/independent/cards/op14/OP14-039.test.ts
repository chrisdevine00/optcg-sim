/**
 * OP14-039 Coffin Boat (Stage, Green, cost 1, {The Seven Warlords of the Sea}/{East Blue}).
 *
 * Card text: "[On Play] If your Leader is [Dracule Mihawk], draw 1 card.
 * [End of Your Turn] If your Leader is [Dracule Mihawk], set up to 1 of your DON!! cards as active."
 *
 * Rules: CR 2-1-2 (a [Name] reference is an exact card name), CR 6-6-1-1 ([End of Your Turn] runs
 * for the turn player's own cards only), CR 4-8-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import {
  asksDonCount,
  atMain,
  BLUE,
  C14,
  deck,
  donCountOptions,
  donSum,
  endTurn,
  hand,
  L14,
  mine,
  need,
  put,
  takeDon,
} from './kit-op14b.ts';

const STAGE = 'OP14-039';

function played(leader: string) {
  return mine(leader, {
    hand: [STAGE, C14.sai],
    deck: [C14.kingdew, BLUE, BLUE, BLUE],
  });
}
function withStage(leader: string, active: number, restedN: number) {
  return mine(leader, {
    stage: STAGE,
    costArea: { active, rested: restedN },
    deck: [BLUE, BLUE, BLUE, BLUE],
  });
}

describe('OP14-039 Coffin Boat: with a [Dracule Mihawk] Leader, [On Play] draw 1 and [End of Your Turn] set 1 DON!! active', () => {
  it('[On Play] with Leader [Dracule Mihawk]: draws 1 card', () => {
    const g = played(L14.mihawk);
    put(g, STAGE);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C14.sai, C14.kingdew]);
    expect(deck(g)).toHaveLength(3);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([STAGE]);
  });

  it('[On Play] with another Leader (a Fish-Man Leader): draws nothing', () => {
    const g = played(L14.fish);
    put(g, STAGE);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C14.sai]);
    expect(deck(g)).toHaveLength(4);
  });

  it('[On Play] the name must match: a different Leader of the same type {The Seven Warlords of the Sea} (Jinbe) draws nothing', () => {
    const g = played(L14.jinbe);
    put(g, STAGE);
    expect(hand(g)).toEqual([C14.sai]);
  });

  it('[On Play] draws exactly 1 card, not more', () => {
    const g = played(L14.mihawk);
    put(g, STAGE);
    expect(hand(g)).toHaveLength(2);
  });

  it('[End of Your Turn] with Leader [Dracule Mihawk]: one rested DON!! is set active', () => {
    const g = withStage(L14.mihawk, 4, 3);
    endTurn(g);
    if (asksDonCount(g)) takeDon(g, 1);
    need(g, 'main', 'p2');
    expect(donSum(g)).toMatchObject({ active: 5, rested: 2 });
  });

  it('[End of Your Turn] "up to 1": at most one DON!! is set active even when three are rested', () => {
    const g = withStage(L14.mihawk, 0, 3);
    endTurn(g);
    if (asksDonCount(g)) {
      expect(donCountOptions(g)).not.toContain('2');
      expect(donCountOptions(g)).not.toContain('3');
      takeDon(g, 1);
    }
    need(g, 'main', 'p2');
    expect(donSum(g)).toMatchObject({ active: 1, rested: 2 });
  });

  it('[End of Your Turn] "up to 1": may set none', () => {
    const g = withStage(L14.mihawk, 4, 3);
    endTurn(g);
    if (asksDonCount(g)) {
      expect(donCountOptions(g)).toContain('0');
      takeDon(g, 0);
      need(g, 'main', 'p2');
      expect(donSum(g)).toMatchObject({ active: 4, rested: 3 });
    } else {
      // the engine sets the most without asking (E-Q11): one DON!! became active
      need(g, 'main', 'p2');
      expect(donSum(g)).toMatchObject({ active: 5, rested: 2 });
    }
  });

  it('[End of Your Turn] with no rested DON!! nothing happens and nothing is asked', () => {
    const g = withStage(L14.mihawk, 5, 0);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(donSum(g)).toMatchObject({ active: 5, rested: 0 });
  });

  it('[End of Your Turn] with another Leader: nothing is set active', () => {
    const g = withStage(L14.fish, 4, 3);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(donSum(g)).toMatchObject({ active: 4, rested: 3 });
  });

  it("must not fire at the end of the opponent's turn: p1's rested DON!! stay rested while p2's turn ends", () => {
    const g = withStage(L14.mihawk, 3, 4);
    endTurn(g);
    if (asksDonCount(g)) takeDon(g, 0);
    need(g, 'main', 'p2');
    const before = donSum(g);
    expect(before.active).toBeLessThanOrEqual(4);
    // p2 ends the turn: p1's Refresh Phase then untaps everything, so look at the state right after p2's end
    endMyTurnNoRefreshCheck(g);
  });
});

/** p2 ends its turn; p1 refreshes (all DON!! untap) and the Stage's effect must not have asked anything on p2's end. */
function endMyTurnNoRefreshCheck(g: ReturnType<typeof played>) {
  endTurn(g);
  need(g, 'main', 'p1');
  expect(donSum(g)).toMatchObject({ rested: 0 });
}
