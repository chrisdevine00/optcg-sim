/**
 * OP08-036 Electrical Luna (Event, Green, cost 3; Minks).
 *
 * Card text (cards/data):
 *   "[Main] All of your opponent's rested Characters with a cost of 7 or less will not become active
 *    in your opponent's next Refresh Phase.
 *    [Trigger] Rest up to 1 of your opponent's Characters."
 *
 * Rules: "all" - no choice; only Characters that are rested when the Event resolves, with cost 7 or
 * less; only the next Refresh Phase is skipped (CR 6-2-4); the opponent's Leader is not a
 * Character; [Trigger] has no cost limit and pays no printed cost.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  CH,
  choiceCards,
  donOf,
  drive,
  endTurn,
  EV,
  F,
  hitAndTrigger,
  LB,
  mainEvent,
  myTurn,
  side,
  sideL,
  sortedIds,
  theirTurn,
} from './kit-b.ts';

function mainGame(opp: Partial<Parameters<typeof side>[2]> = {}) {
  return myTurn(
    side(LB.greenKid, F.green, { hand: [EV.luna], costArea: { active: 3, rested: 0 } }),
    side(LB.opp, F.red, {
      characters: [
        { card: CH.kingdew, rested: true }, // cost 5
        { card: CH.zoroG7, rested: true }, // cost 7, the boundary
        { card: CH.accino8, rested: true }, // cost 8
        CH.marco, // active
      ],
      ...opp,
    }),
  );
}

const restedNow = (g: ReturnType<typeof mainGame>, c: string) =>
  g.card(g.find('p2', 'characters', c)).rested;

describe('OP08-036 [Main]: the opponent’s rested Characters with cost ≤7 skip their next Refresh', () => {
  it('happy path (no choice is asked): rested ≤7 Characters stay rested through the opponent’s next Refresh', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.luna));
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    endTurn(g); // p2 turn 4
    expect(restedNow(g, CH.kingdew)).toBe(true);
    expect(restedNow(g, CH.zoroG7)).toBe(true);
  });

  it('boundary: cost 8 untaps normally; the active Character is unaffected', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.luna));
    endTurn(g);
    expect(restedNow(g, CH.accino8)).toBe(false);
    expect(restedNow(g, CH.marco)).toBe(false);
  });

  it('only the next Refresh: they untap in the Refresh after', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.luna));
    endTurn(g);
    endTurn(g);
    endTurn(g); // p2 turn 6
    expect(restedNow(g, CH.kingdew)).toBe(false);
    expect(restedNow(g, CH.zoroG7)).toBe(false);
  });

  it('control: without the Event all of them untap at the next Refresh', () => {
    const g = mainGame();
    endTurn(g);
    expect(restedNow(g, CH.kingdew)).toBe(false);
    expect(restedNow(g, CH.zoroG7)).toBe(false);
  });

  it('a rested opponent Leader is not a Character: it untaps normally', () => {
    const g = myTurn(
      side(LB.greenKid, F.green, { hand: [EV.luna], costArea: { active: 3, rested: 0 } }),
      sideL({ card: LB.opp, rested: true }, F.red, {
        characters: [{ card: CH.kingdew, rested: true }],
      }),
    );
    mainEvent(g, g.find('p1', 'hand', EV.luna));
    endTurn(g);
    expect(g.card(g.leader('p2')).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).rested).toBe(true);
  });

  it('only Characters rested at resolution count: one that is active now and rests later still untaps', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.luna));
    expect(restedNow(g, CH.marco)).toBe(false);
    endTurn(g);
    expect(restedNow(g, CH.marco)).toBe(false);
  });

  it('with no rested Characters the Event does nothing (and can still be played)', () => {
    const g = mainGame({ characters: [CH.marco] });
    mainEvent(g, g.find('p1', 'hand', EV.luna));
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.luna]);
  });
});

describe('OP08-036 [Trigger]: rest up to 1 of the opponent’s Characters', () => {
  function triggerGame() {
    return theirTurn(
      side(LB.greenKid, F.green, { life: [EV.luna, F.green, F.green, F.green] }),
      side(LB.opp, F.red, { characters: [CH.accino8, CH.sunny] }),
    );
  }

  it('any cost: the cost-8 Character is a candidate; the Leader is not', () => {
    const g = triggerGame();
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    expect(choiceCards(g)).toEqual([CH.accino8, CH.sunny].sort());
  });

  it('happy path: the chosen Character is rested; the other is not; the printed cost 3 is not paid', () => {
    const g = triggerGame();
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    drive(g, 'p1', { picks: [[g.find('p2', 'characters', CH.accino8)]] });
    expect(g.card(g.find('p2', 'characters', CH.accino8)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', CH.sunny)).rested).toBe(false);
  });

  it('declined: nothing is rested', () => {
    const g = triggerGame();
    hitAndTrigger(g, g.leader('p2'), g.leader('p1'), false);
    expect(g.card(g.find('p2', 'characters', CH.accino8)).rested).toBe(false);
  });
});
