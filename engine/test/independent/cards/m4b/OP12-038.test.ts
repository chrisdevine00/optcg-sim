/**
 * OP12-038 Two-Sword Style Rashomon (Event, Green, cost 1; Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[Main] You may rest 2 of your DON!! cards: K.O. up to 2 of your opponent's rested Characters
 *    with a base cost of 4 or less.
 *    [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: only rested Characters, base cost 4 or less; "up to 2" allows 0-2 (CR 8-4-4-1); K.O.'d
 * cards go to their owner's trash (CR 9-?); the "may" cost may be declined (CR 8-3-1-4).
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

function mainGame(p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LB.greenKid, F.green, { hand: [EV.rashomon], costArea: { active: 3, rested: 0 } }),
    side(LB.opp, F.red, {
      characters: [
        { card: CH.hajrudin, rested: true }, // cost 4
        { card: CH.sai, rested: true }, // cost 2
        { card: CH.kingdew, rested: true }, // cost 5
        CH.marco, // cost 3, active
      ],
      ...p2,
    }),
  );
}

describe('OP12-038 [Main]: rest 2 DON!!: K.O. up to 2 rested Characters with base cost 4 or less', () => {
  it('candidates: rested Characters with cost ≤4 (Hajrudin 4, Sai 2); not Kingdew (5), not the active Marco', () => {
    const g = mainGame();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', EV.rashomon) });
    act(g, { type: 'optional', accept: true });
    expect(choiceCards(g)).toEqual([CH.hajrudin, CH.sai].sort());
  });

  it('happy path: both are K.O.’d into the opponent’s trash; 1 + 2 DON!! are rested; the others stay', () => {
    const g = mainGame();
    const haj = g.find('p2', 'characters', CH.hajrudin);
    const sai = g.find('p2', 'characters', CH.sai);
    mainEvent(g, g.find('p1', 'hand', EV.rashomon), { picks: [[haj, sai]] });
    expect(sortedIds(g, 'p2', 'trash')).toEqual([CH.hajrudin, CH.sai].sort());
    expect(sortedIds(g, 'p2', 'characters')).toEqual([CH.kingdew, CH.marco].sort());
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.rashomon]);
  });

  it('"up to 2": one K.O. is allowed', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.rashomon), {
      picks: [[g.find('p2', 'characters', CH.sai)]],
    });
    expect(sortedIds(g, 'p2', 'trash')).toEqual([CH.sai]);
    expect(sortedIds(g, 'p2', 'characters')).toContain(CH.hajrudin);
  });

  it('"up to 2": none is allowed, and the cost is still paid', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.rashomon), { picks: [[]] });
    expect(sortedIds(g, 'p2', 'trash')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
  });

  it('active Characters are never candidates: with only an active cost-3 Character there is nothing to K.O.', () => {
    const g = mainGame({ characters: [CH.marco] });
    const rashomon = g.find('p1', 'hand', EV.rashomon);
    mainEvent(g, rashomon);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([CH.marco]);
  });

  it('CR 8-3-1-4: declining the rest-2 cost does nothing: no K.O., only the printed 1 DON!! is rested', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.rashomon), { use: [false] });
    expect(sortedIds(g, 'p2', 'trash')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('with only 2 active DON!! (1 pays the card) the rest-2 cost cannot be paid: no K.O.', () => {
    const g = mainGame();
    const h = myTurn(
      side(LB.greenKid, F.green, { hand: [EV.rashomon], costArea: { active: 2, rested: 0 } }),
      side(LB.opp, F.red, { characters: [{ card: CH.sai, rested: true }] }),
    );
    const card = h.find('p1', 'hand', EV.rashomon);
    if (h.isLegal({ type: 'playCard', card, player: 'p1' }))
      mainEvent(h, card, { picks: [[h.find('p2', 'characters', CH.sai)]] });
    expect(sortedIds(h, 'p2', 'characters')).toEqual([CH.sai]);
    expect(g.zone('p2', 'characters')).toHaveLength(4);
  });
});

describe('OP12-038 [Counter]: your Leader gains +3000 during this battle', () => {
  it('Leader 5000 → 8000 stops a 7000 attacker; no K.O. is asked in the Counter timing', () => {
    const g = theirTurn(
      side(LB.greenKid, F.green, {
        hand: [EV.rashomon],
        costArea: { active: 1, rested: 0 },
        characters: [{ card: CH.alvida, rested: true }],
      }),
      side(LB.opp, F.red, { characters: [CH.kingdew, { card: CH.sai, rested: true }] }),
    );
    act(g, {
      type: 'attack',
      attacker: g.find('p2', 'characters', CH.kingdew),
      target: g.leader('p1'),
    });
    passBlock(g);
    counterEvent(g, g.find('p1', 'hand', EV.rashomon));
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([CH.kingdew, CH.sai].sort());
  });
});
