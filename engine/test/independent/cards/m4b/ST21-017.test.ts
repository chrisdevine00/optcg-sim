/**
 * ST21-017 Gum-Gum Mole Pistol (Event, Red, cost 4; Straw Hat Crew / The Four Emperors).
 *
 * Card text (cards/data):
 *   "[Main] Give up to 1 of your opponent's Characters −5000 power during this turn. Then, if you
 *    have a Character with 6000 power or more, K.O. up to 1 of your opponent's Characters with 2000
 *    power or less.
 *    [Trigger] Activate this card's [Main] effect."
 *
 * Reading: "power" is current power (printed power, DON!! on your turn, modifiers), so the −5000
 * counts for the "2000 power or less" check (a 7000 Character reaches exactly 2000) and a 5000
 * Character holding a DON!! is a 6000-power Character on your turn (CR 4-9-2 gives "base power"
 * its own wording). "If" gates the K.O. (CR 4-10-1). [Trigger] pays no printed cost (digest Q8).
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
  sortedIds,
  theirTurn,
} from './kit-b.ts';
import type { PlayerSpec } from '@optcg/engine';

function mainGame(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LB.redShc, F.red, {
      hand: [EV.mole],
      costArea: { active: 4, rested: 0 },
      characters: [CH.franky4],
      ...p1,
    }),
    side(LB.opp, F.red, { characters: [CH.kingdew, CH.marco, CH.thatch], ...p2 }),
  );
}

describe('ST21-017 [Main]: −5000 to an opponent’s Character during this turn', () => {
  it('happy path: Kingdew 7000 → 2000, then it is K.O.’d (2000 or less) because Franky (6000) is yours; the Event is trashed', () => {
    const g = mainGame();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    mainEvent(g, g.find('p1', 'hand', EV.mole), { picks: [[kingdew], [kingdew]] });
    expect(sortedIds(g, 'p2', 'trash')).toEqual([CH.kingdew]);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([CH.marco, CH.thatch].sort());
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.mole]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 4 });
  });

  it('the −5000 candidates are the opponent’s Characters only (not yours)', () => {
    const g = mainGame();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', EV.mole) });
    expect(choiceCards(g)).toEqual([CH.kingdew, CH.marco, CH.thatch].sort());
  });

  it('the K.O. check uses power after the −5000: Marco 5000 → 0 can be K.O.’d', () => {
    const g = mainGame();
    const marco = g.find('p2', 'characters', CH.marco);
    mainEvent(g, g.find('p1', 'hand', EV.mole), { picks: [[marco], [marco]] });
    expect(sortedIds(g, 'p2', 'trash')).toEqual([CH.marco]);
  });

  it('only Characters at 2000 or less are K.O. candidates: Thatch 8000 → 3000 is not, Kingdew 2000 would be', () => {
    const g = mainGame();
    const thatch = g.find('p2', 'characters', CH.thatch);
    act(g, { type: 'playCard', card: g.find('p1', 'hand', EV.mole) });
    drive(g, 'p1', { picks: [[thatch]] });
    // The K.O. step offered nothing for Thatch (3000), so nothing was K.O.'d and Thatch has −5000.
    expect(sortedIds(g, 'p2', 'trash')).toEqual([]);
    expect(g.power(thatch)).toBe(3000);
  });

  it('the K.O. is "up to 1": declining it leaves the debuffed Character on the field', () => {
    const g = mainGame();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    mainEvent(g, g.find('p1', 'hand', EV.mole), { picks: [[kingdew], []] });
    expect(g.power(kingdew)).toBe(2000);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('"during this turn": the −5000 is gone in the next turn', () => {
    const g = mainGame();
    const thatch = g.find('p2', 'characters', CH.thatch);
    mainEvent(g, g.find('p1', 'hand', EV.mole), { picks: [[thatch]] });
    expect(g.power(thatch)).toBe(3000);
    endTurn(g);
    expect(g.power(thatch)).toBe(8000);
  });

  it('"up to 1": choosing no target for the −5000 is allowed and nothing is K.O.’d', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.mole), { picks: [[]] });
    expect(sortedIds(g, 'p2', 'trash')).toEqual([]);
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
  });
});

describe('ST21-017: the K.O. needs a Character with 6000 power or more', () => {
  it('a 5000 Character (Robin) does not qualify: the −5000 applies but nothing can be K.O.’d', () => {
    const g = mainGame({ characters: [CH.robin] });
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    mainEvent(g, g.find('p1', 'hand', EV.mole), { picks: [[kingdew], [kingdew]] });
    expect(g.power(kingdew)).toBe(2000);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('exactly 6000 counts (Hajrudin)', () => {
    const g = mainGame({ characters: [CH.hajrudin] });
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    mainEvent(g, g.find('p1', 'hand', EV.mole), { picks: [[kingdew], [kingdew]] });
    expect(sortedIds(g, 'p2', 'trash')).toEqual([CH.kingdew]);
  });

  it('power, not base power: a 5000 Character holding 1 DON!! is 6000 on your turn and qualifies', () => {
    const g = mainGame({
      characters: [{ card: CH.robin, don: 1 }],
      costArea: { active: 4, rested: 0 },
    });
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    mainEvent(g, g.find('p1', 'hand', EV.mole), { picks: [[kingdew], [kingdew]] });
    expect(sortedIds(g, 'p2', 'trash')).toEqual([CH.kingdew]);
  });

  it('the Leader does not count (only Characters): with no Characters the K.O. is not available', () => {
    const g = mainGame({ characters: [] });
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    mainEvent(g, g.find('p1', 'hand', EV.mole), { picks: [[kingdew], [kingdew]] });
    expect(g.power(kingdew)).toBe(2000);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('the opponent’s 6000+ Characters do not count', () => {
    const g = mainGame({ characters: [CH.robin] });
    const marco = g.find('p2', 'characters', CH.marco);
    mainEvent(g, g.find('p1', 'hand', EV.mole), { picks: [[marco], [marco]] });
    expect(sortedIds(g, 'p2', 'trash')).toEqual([]);
  });
});

describe('ST21-017 [Trigger]: activate this card’s [Main] effect', () => {
  function triggerGame(p1Chars: string[] = [CH.franky4]) {
    return theirTurn(
      side(LB.redShc, F.red, {
        life: [EV.mole, F.red, F.red, F.red],
        characters: p1Chars,
      }),
      side(LB.opp, F.red, { characters: [CH.kingdew, CH.marco] }),
    );
  }

  it('happy path: −5000 on the attacker’s side (Kingdew 7000 → 2000) and, with Franky (6000), it is K.O.’d; no DON!! paid', () => {
    const g = triggerGame();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    drive(g, 'p1', { picks: [[kingdew], [kingdew]] });
    expect(sortedIds(g, 'p2', 'trash')).toEqual([CH.kingdew]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.mole]);
    expect(donOf(g, 'p1').rested).toBe(0);
  });

  it('without a 6000+ Character the trigger only gives −5000', () => {
    const g = triggerGame([CH.robin]);
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    drive(g, 'p1', { picks: [[kingdew], [kingdew]] });
    expect(g.power(kingdew)).toBe(2000);
    expect(sortedIds(g, 'p2', 'characters')).toContain(CH.kingdew);
  });

  it('declined: no −5000, no K.O.; the card goes to hand', () => {
    const g = triggerGame();
    hitAndTrigger(g, g.leader('p2'), g.leader('p1'), false);
    expect(g.power(g.find('p2', 'characters', CH.kingdew))).toBe(7000);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([EV.mole]);
  });
});
