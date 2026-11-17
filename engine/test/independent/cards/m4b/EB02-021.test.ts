/**
 * EB02-021 Gum-Gum Giant Pistol (Event, Green, cost 3; Straw Hat Crew / Water Seven).
 *
 * Card text (cards/data):
 *   "[Main] Up to 1 of your "Straw Hat Crew" type Characters gains +6000 power during this turn.
 *    Then, the selected Character will not become active in your next Refresh Phase.
 *    [Trigger] Rest up to 1 of your opponent's Characters with a cost of 4 or less."
 *
 * Rules: candidates are your Characters (not the Leader) with the Straw Hat Crew type; "during this
 * turn" ends in the End Phase (CR 6-6-1-3); the Refresh Phase sets rested cards active (CR 6-2-4),
 * and the selected Character skips exactly the next one; [Trigger] pays no printed cost.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  CH,
  choiceCards,
  chooseNone,
  donOf,
  drive,
  endTurn,
  EV,
  F,
  hitAndTrigger,
  LB,
  mainEvent,
  myTurn,
  noDefence,
  side,
  sortedIds,
  theirTurn,
} from './kit-b.ts';

function mainGame() {
  return myTurn(
    side(LB.greenKid, F.green, {
      hand: [EV.giantPistol],
      costArea: { active: 3, rested: 0 },
      characters: [CH.robin, CH.usoppG3, CH.marco],
    }),
    side(LB.opp, F.red),
  );
}

describe('EB02-021 [Main]: +6000 to a Straw Hat Crew Character this turn; it skips your next Refresh', () => {
  it('candidates: your Straw Hat Crew Characters (Robin, Usopp); not Marco (no type), not your Leader', () => {
    const g = mainGame();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', EV.giantPistol) });
    expect(choiceCards(g)).toEqual([CH.robin, CH.usoppG3].sort());
  });

  it('happy path: Robin 5000 → 11000; the Event is trashed after paying 3', () => {
    const g = mainGame();
    const robin = g.find('p1', 'characters', CH.robin);
    mainEvent(g, g.find('p1', 'hand', EV.giantPistol), { picks: [[robin]] });
    expect(g.power(robin)).toBe(11000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.giantPistol]);
  });

  it('"during this turn": the +6000 is gone on the opponent’s turn', () => {
    const g = mainGame();
    const robin = g.find('p1', 'characters', CH.robin);
    mainEvent(g, g.find('p1', 'hand', EV.giantPistol), { picks: [[robin]] });
    endTurn(g);
    expect(g.power(robin)).toBe(5000);
  });

  it('the selected Character stays rested through your next Refresh, and becomes active in the one after', () => {
    const g = mainGame();
    const robin = g.find('p1', 'characters', CH.robin);
    mainEvent(g, g.find('p1', 'hand', EV.giantPistol), { picks: [[robin]] });
    act(g, { type: 'attack', attacker: robin, target: g.leader('p2') });
    noDefence(g);
    expect(g.card(robin).rested).toBe(true);
    endTurn(g); // p2 turn 4
    endTurn(g); // p1 turn 5: Refresh skipped for Robin
    expect(g.card(robin).rested).toBe(true);
    endTurn(g); // p2 turn 6
    endTurn(g); // p1 turn 7: Refresh
    expect(g.card(robin).rested).toBe(false);
  });

  it('only the selected Character is affected: another rested Straw Hat Crew Character untaps normally', () => {
    const g = mainGame();
    const robin = g.find('p1', 'characters', CH.robin);
    const usopp = g.find('p1', 'characters', CH.usoppG3);
    mainEvent(g, g.find('p1', 'hand', EV.giantPistol), { picks: [[robin]] });
    act(g, { type: 'attack', attacker: robin, target: g.leader('p2') });
    noDefence(g);
    act(g, { type: 'attack', attacker: usopp, target: g.leader('p2') });
    noDefence(g);
    endTurn(g);
    endTurn(g);
    expect(g.card(robin).rested).toBe(true);
    expect(g.card(usopp).rested).toBe(false);
  });

  it('"up to 1": choosing nothing changes nothing; the Event is still used', () => {
    const g = mainGame();
    const robin = g.find('p1', 'characters', CH.robin);
    mainEvent(g, g.find('p1', 'hand', EV.giantPistol), { picks: [[]] });
    expect(g.power(robin)).toBe(5000);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.giantPistol]);
    act(g, { type: 'attack', attacker: robin, target: g.leader('p2') });
    noDefence(g);
    endTurn(g);
    endTurn(g);
    expect(g.card(robin).rested).toBe(false);
  });

  it('with no Straw Hat Crew Character there is no choice and nothing happens', () => {
    const g = myTurn(
      side(LB.greenKid, F.green, {
        hand: [EV.giantPistol],
        costArea: { active: 3, rested: 0 },
        characters: [CH.marco],
      }),
      side(LB.opp, F.red),
    );
    mainEvent(g, g.find('p1', 'hand', EV.giantPistol));
    expect(g.power(g.find('p1', 'characters', CH.marco))).toBe(5000);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.giantPistol]);
  });

  it('chooseNone helper sanity: the choice is optional', () => {
    const g = mainGame();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', EV.giantPistol) });
    chooseNone(g);
    expect(g.power(g.find('p1', 'characters', CH.robin))).toBe(5000);
  });
});

describe('EB02-021 [Trigger]: rest up to 1 of the opponent’s Characters with a cost of 4 or less', () => {
  function triggerGame() {
    return theirTurn(
      side(LB.greenKid, F.green, { life: [EV.giantPistol, F.green, F.green, F.green] }),
      side(LB.opp, F.red, { characters: [CH.hajrudin, CH.kingdew, CH.sunny] }),
    );
  }

  it('candidates: cost ≤4 only (Hajrudin 4, Sunny 1); not Kingdew (5)', () => {
    const g = triggerGame();
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    expect(choiceCards(g)).toEqual([CH.hajrudin, CH.sunny].sort());
  });

  it('happy path: Hajrudin (cost 4, the boundary) is rested; no printed cost is paid', () => {
    const g = triggerGame();
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    drive(g, 'p1', { picks: [[g.find('p2', 'characters', CH.hajrudin)]] });
    expect(g.card(g.find('p2', 'characters', CH.hajrudin)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).rested).toBe(false);
    expect(donOf(g, 'p1').rested).toBe(0);
  });

  it('declining the [Trigger]: nothing is rested', () => {
    const g = triggerGame();
    hitAndTrigger(g, g.leader('p2'), g.leader('p1'), false);
    expect(g.card(g.find('p2', 'characters', CH.hajrudin)).rested).toBe(false);
  });
});
