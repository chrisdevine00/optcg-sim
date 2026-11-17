/**
 * OP06-017 Meteor-Strike of Love (Event, Red, cost 2; FILM / Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[Main] / [Counter] You may add 1 card from the top of your Life cards to your hand: Up to 1 of
 *    your Leader or Character cards gains +3000 power during this turn."
 *
 * Rules: the cost is adding the top Life card to the hand (not damage, so no [Trigger], CR 8-3-1);
 * a "may" cost may be skipped and then nothing happens (CR 8-3-1-4); the boost is "during this
 * turn" in both timings, so even when used as a [Counter] it outlasts the battle and ends in the End
 * Phase (CR 6-6-1-3); the Counter timing exists only in the opponent's Counter Step (CR 7-1-3-1-2).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  canCounter,
  CH,
  choiceCards,
  counterEvent,
  donOf,
  endTurn,
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

const LIFE = [CH.sunny, CH.robin, CH.marco, CH.sai];

function mainGame(p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LB.redShc, F.red, {
      hand: [EV.meteor],
      life: LIFE,
      characters: [CH.hajrudin],
      costArea: { active: 2, rested: 0 },
      ...p1,
    }),
    side(LB.opp, F.red, { characters: [CH.thatch] }),
  );
}

function defending(p1: Partial<PlayerSpec> = {}) {
  const g = theirTurn(
    side(LB.redShc, F.red, {
      hand: [EV.meteor],
      life: LIFE,
      costArea: { active: 2, rested: 0 },
      ...p1,
    }),
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

describe('OP06-017 [Main]: add the top Life card to your hand: +3000 during this turn', () => {
  it('happy path: the top Life card (Sunny, not the next one) goes to hand, the Leader is 8000, the Event is trashed after paying 2', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.meteor), { picks: [[g.leader('p1')]] });
    expect(g.life('p1')).toBe(3);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([CH.sunny]);
    expect(g.zone('p1', 'life')[0]!.card).toBe(CH.robin);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.meteor]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 2 });
  });

  it('a Character can be the target: Hajrudin 6000 → 9000, and it lasts for the whole turn (it can still attack at 9000)', () => {
    const g = mainGame();
    const haj = g.find('p1', 'characters', CH.hajrudin);
    mainEvent(g, g.find('p1', 'hand', EV.meteor), { picks: [[haj]] });
    expect(g.power(haj)).toBe(9000);
    act(g, { type: 'attack', attacker: haj, target: g.leader('p2') });
    expect(g.power(haj)).toBe(9000);
  });

  it('candidates: your Leader and your Characters only (not the opponent’s Character)', () => {
    const g = mainGame();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', EV.meteor) });
    // Accept the "use" question if the engine asks, then read the target candidates.
    if (g.legal().some((a) => a.type === 'optional' && a.accept))
      act(g, { type: 'optional', accept: true });
    expect(choiceCards(g)).toEqual([LB.redShc, CH.hajrudin].sort());
  });

  it('"during this turn": the boost is gone in the opponent’s turn', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.meteor), { picks: [[g.leader('p1')]] });
    endTurn(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-4: declining the Life cost does nothing: Life and hand unchanged, no boost', () => {
    const g = mainGame();
    mainEvent(g, g.find('p1', 'hand', EV.meteor), { use: [false] });
    expect(g.life('p1')).toBe(4);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([EV.meteor]);
  });

  it('with 0 Life cards the cost cannot be paid: no boost', () => {
    const g = mainGame({ life: [] });
    const meteor = g.find('p1', 'hand', EV.meteor);
    if (g.isLegal({ type: 'playCard', card: meteor, player: 'p1' })) {
      mainEvent(g, meteor, { picks: [[g.leader('p1')]] });
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('adding a Life card to the hand is not damage: a Life card with a [Trigger] does not activate', () => {
    const g = mainGame({
      life: ['OP04-016', CH.robin, CH.marco, CH.sai],
      deck: [CH.marco, ...Array(8).fill(F.red)],
    });
    mainEvent(g, g.find('p1', 'hand', EV.meteor), { picks: [[g.leader('p1')]] });
    expect(sortedIds(g, 'p1', 'hand')).toEqual(['OP04-016']);
    expect(g.power(g.find('p2', 'characters', CH.thatch))).toBe(8000);
  });
});

describe('OP06-017 [Counter]: the same effect in the Counter Step', () => {
  it('happy path: +3000 on the Leader (8000) beats a 7000 attacker; the top Life card is added to hand', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.meteor), { picks: [[g.leader('p1')]] });
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.life('p1')).toBe(3);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(3);
  });

  it('printed "during this turn": the +3000 is still there after the battle and ends only with the turn', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.meteor), { picks: [[g.leader('p1')]] });
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endTurn(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining the cost: no boost, the Leader takes the hit', () => {
    const g = defending();
    counterEvent(g, g.find('p1', 'hand', EV.meteor), { use: [false] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(3);
  });

  it('needs 2 active DON!! for the printed cost: with 1 it cannot be used', () => {
    const g = defending({ costArea: { active: 1, rested: 1 } });
    expect(canCounter(g, g.find('p1', 'hand', EV.meteor))).toBe(false);
  });
});
