/**
 * OP12-037 Demon Aura Nine Sword Style Asura Blades Drawn Dead Man's Game (Event, Green, cost 1;
 * Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[Main] You may rest 3 of your DON!! cards: Rest up to a total of 2 of your opponent's
 *    Characters or DON!! cards.
 *    [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: the activation cost (rest 3 active DON!!) is paid after the printed cost 1 and may be
 * skipped (CR 8-3-1-4, 8-3-1-5); "a total of 2" counts Characters and DON!! together, in any mix,
 * and "up to" allows fewer (CR 8-4-4-1); only active DON!! can be rested; the Counter timing
 * exists in the opponent's Counter Step only (CR 7-1-3-1-2), and "during this battle" ends with
 * the battle (CR 7-1-5-3).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  CH,
  choiceCards,
  counterEvent,
  donOf,
  EV,
  F,
  LB,
  mainEvent,
  myTurn,
  passBlock,
  side,
  sortedIds,
  takeDamage,
  theirTurn,
} from './kit-b.ts';

function mainGame(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LB.greenKid, F.green, {
      hand: [EV.asura],
      costArea: { active: 5, rested: 0 },
      characters: [CH.alvida],
      ...p1,
    }),
    side(LB.opp, F.red, {
      characters: [CH.kingdew, CH.marco],
      costArea: { active: 3, rested: 0 },
      ...p2,
    }),
  );
}

describe('OP12-037 [Main]: rest 3 DON!!: rest up to a total of 2 of the opponent’s Characters or DON!! cards', () => {
  it('two Characters: both are rested; 1 + 3 of your DON!! are rested', () => {
    const g = mainGame();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    const marco = g.find('p2', 'characters', CH.marco);
    mainEvent(g, g.find('p1', 'hand', EV.asura), { picks: [[kingdew, marco]] });
    expect(g.card(kingdew).rested).toBe(true);
    expect(g.card(marco).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
    expect(donOf(g, 'p2')).toMatchObject({ active: 3, rested: 0 });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.asura]);
  });

  it('a mix: 1 Character and 1 opponent DON!! (the total is 2)', () => {
    const g = mainGame();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    mainEvent(g, g.find('p1', 'hand', EV.asura), { picks: [[kingdew, 'DON']] });
    expect(g.card(kingdew).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', CH.marco)).rested).toBe(false);
    expect(donOf(g, 'p2')).toMatchObject({ active: 2, rested: 1 });
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
  });

  it('two opponent DON!! cards and no Character', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.asura), { picks: [['DON', 'DON']] });
    expect(donOf(g, 'p2')).toMatchObject({ active: 1, rested: 2 });
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).rested).toBe(false);
  });

  it('candidates are the opponent’s Characters (and DON!!), never your own Character', () => {
    const g = mainGame();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', EV.asura) });
    act(g, { type: 'optional', accept: true });
    expect(choiceCards(g)).toEqual([CH.kingdew, CH.marco].sort());
  });

  it('"a total of 2": no third target is offered once two are chosen', () => {
    const g = mainGame({}, { characters: [CH.kingdew, CH.marco, CH.thatch] });
    mainEvent(g, g.find('p1', 'hand', EV.asura), {
      picks: [[g.find('p2', 'characters', CH.kingdew), g.find('p2', 'characters', CH.marco)]],
    });
    expect(g.card(g.find('p2', 'characters', CH.thatch)).rested).toBe(false);
    expect(donOf(g, 'p2')).toMatchObject({ active: 3, rested: 0 });
  });

  it('"up to": resting 1 Character only is allowed', () => {
    const g = mainGame();
    const kingdew = g.find('p2', 'characters', CH.kingdew);
    mainEvent(g, g.find('p1', 'hand', EV.asura), { picks: [[kingdew]] });
    expect(g.card(kingdew).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', CH.marco)).rested).toBe(false);
  });

  it('"up to": choosing nothing still pays the cost', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.asura), { picks: [[]] });
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).rested).toBe(false);
  });

  it('CR 8-3-1-4: declining the "you may rest 3" cost: nothing is rested; only the printed 1 is paid', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.asura), { use: [false] });
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 1 });
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).rested).toBe(false);
    expect(donOf(g, 'p2').rested).toBe(0);
  });

  it('CR 8-3-1-5: with 3 active DON!! (1 pays the card, 2 are left) the rest-3 cost cannot be paid', () => {
    const g = mainGame({ costArea: { active: 3, rested: 0 } });
    const asura = g.find('p1', 'hand', EV.asura);
    if (g.isLegal({ type: 'playCard', card: asura, player: 'p1' }))
      mainEvent(g, asura, { picks: [[g.find('p2', 'characters', CH.kingdew)]] });
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).rested).toBe(false);
  });

  it('already rested DON!! cannot pay: with 4 active + 3 rested, the cost rests 3 of the 3 active left after the printed cost', () => {
    const g = mainGame({ costArea: { active: 4, rested: 3 } });
    mainEvent(g, g.find('p1', 'hand', EV.asura), {
      picks: [[g.find('p2', 'characters', CH.kingdew)]],
    });
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).rested).toBe(true);
  });
});

describe('OP12-037 [Counter]: your Leader gains +3000 during this battle', () => {
  function defending() {
    const g = theirTurn(
      side(LB.greenKid, F.green, { hand: [EV.asura], costArea: { active: 1, rested: 0 } }),
      side(LB.opp, F.red, { characters: [CH.kingdew] }),
    );
    act(g, {
      type: 'attack',
      attacker: g.find('p2', 'characters', CH.kingdew),
      target: g.leader('p1'),
    });
    passBlock(g);
    return g;
  }

  it('happy path: Leader 5000 → 8000 stops the 7000 attacker; only the printed cost 1 is paid (no rest-3 is asked)', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.asura));
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
  });

  it('"during this battle": back to 5000 afterwards, and the opponent’s Characters were not rested', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.asura));
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(donOf(g, 'p2').rested).toBe(0);
  });
});
