/**
 * OP11-012 Franky (Character, Red, cost 4, 4000, Counter +2000; Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[Your Turn] [Once Per Turn] When your opponent activates an Event, all of your Characters gain
 *    +2000 power during this turn."
 *
 * Rules: [Your Turn] limits it to the turn of Franky's controller (CR 10-2-?); the only Events an
 * opponent can activate on your turn are [Counter] Events in your Counter Step (CR 7-1-3-1-2)
 * (and [Trigger] Events); [Once Per Turn] limits it to one activation each turn (CR 10-2-13);
 * "all of your Characters" excludes the Leader; "during this turn" ends in the End Phase
 * (CR 6-6-1-3). A Character [Counter] is not an Event activation.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  CH,
  counterEvent,
  endTurn,
  EV,
  F,
  LB,
  mainEvent,
  myTurn,
  passBlock,
  side,
  takeDamage,
  theirTurn,
} from './kit-b.ts';

const FRANKY = 'OP11-012';

function attacking(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  const g = myTurn(
    side(LB.redShc, F.red, { characters: [FRANKY, CH.robin], ...p1 }),
    side(LB.greenKid, F.green, {
      hand: [EV.asura, EV.rashomon],
      costArea: { active: 3, rested: 0 },
      ...p2,
    }),
  );
  act(g, {
    type: 'attack',
    attacker: g.find('p1', 'characters', CH.robin),
    target: g.leader('p2'),
  });
  passBlock(g);
  return g;
}

const powers = (g: ReturnType<typeof attacking>) => ({
  franky: g.power(g.find('p1', 'characters', FRANKY)),
  robin: g.power(g.find('p1', 'characters', CH.robin)),
  leader: g.power(g.leader('p1')),
});

describe('OP11-012 Franky: [Your Turn] [Once Per Turn] when the opponent activates an Event, all your Characters +2000', () => {
  it('the opponent’s [Counter] Event on your turn: Franky (6000) and Robin (7000) gain +2000; your Leader does not', () => {
    const g = attacking();
    expect(powers(g)).toEqual({ franky: 4000, robin: 5000, leader: 5000 });
    counterEvent(g, g.find('p2', 'hand', EV.asura));
    expect(powers(g)).toEqual({ franky: 6000, robin: 7000, leader: 5000 });
  });

  it('"during this turn": the boost outlasts the battle and ends with the turn', () => {
    const g = attacking();
    counterEvent(g, g.find('p2', 'hand', EV.asura));
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(powers(g).robin).toBe(7000);
    endTurn(g);
    expect(powers(g)).toEqual({ franky: 4000, robin: 5000, leader: 5000 });
  });

  it('the opponent’s own Characters get nothing', () => {
    const g = attacking({}, { characters: [CH.alvida] });
    counterEvent(g, g.find('p2', 'hand', EV.asura));
    expect(g.power(g.find('p2', 'characters', CH.alvida))).toBe(3000);
  });

  it('CR 10-2-13 [Once Per Turn]: a second Event in the same turn gives no further +2000', () => {
    const g = attacking();
    counterEvent(g, g.find('p2', 'hand', EV.asura));
    expect(powers(g).robin).toBe(7000);
    // A second battle later in the same turn, with a second Event.
    act(g, { type: 'endCounter' });
    takeDamage(g);
    const franky = g.find('p1', 'characters', FRANKY);
    act(g, { type: 'attack', attacker: franky, target: g.leader('p2') });
    passBlock(g);
    counterEvent(g, g.find('p2', 'hand', EV.rashomon));
    expect(g.power(franky)).toBe(6000);
  });

  it('control: when p1 itself activates an Event in its Main Phase nothing is boosted ("your opponent" only)', () => {
    const g = myTurn(
      side(LB.redShc, F.red, {
        hand: [EV.luna],
        characters: [FRANKY, CH.robin],
        costArea: { active: 3, rested: 0 },
      }),
      side(LB.opp, F.red),
    );
    mainEvent(g, g.find('p1', 'hand', EV.luna));
    expect(g.power(g.find('p1', 'characters', FRANKY))).toBe(4000);
    expect(g.power(g.find('p1', 'characters', CH.robin))).toBe(5000);
  });

  it('[Your Turn]: when the opponent plays an Event in its own turn, Franky’s controller gets nothing', () => {
    const g = theirTurn(
      side(LB.redShc, F.red, { characters: [FRANKY, CH.robin] }),
      side(LB.greenKid, F.green, { hand: [EV.luna], costArea: { active: 3, rested: 0 } }),
    );
    mainEvent(g, g.find('p2', 'hand', EV.luna));
    expect(g.power(g.find('p1', 'characters', FRANKY))).toBe(4000);
    expect(g.power(g.find('p1', 'characters', CH.robin))).toBe(5000);
  });

  it('a Character [Counter] (trashing a Character card from hand) is not an Event: no boost', () => {
    const g = myTurn(
      side(LB.redShc, F.red, { characters: [FRANKY, CH.robin] }),
      side(LB.greenKid, F.green, { hand: [CH.marco] }),
    );
    act(g, {
      type: 'attack',
      attacker: g.find('p1', 'characters', CH.robin),
      target: g.leader('p2'),
    });
    passBlock(g);
    act(g, { type: 'counter', card: g.find('p2', 'hand', CH.marco), target: g.leader('p2') });
    expect(g.power(g.find('p1', 'characters', FRANKY))).toBe(4000);
    expect(g.power(g.find('p1', 'characters', CH.robin))).toBe(5000);
  });

  it('the Event must be activated: with Event activation impossible (no DON!!) nothing happens', () => {
    const g = attacking({}, { costArea: { active: 0, rested: 3 } });
    expect(
      g
        .legal()
        .some(
          (a) =>
            (a.type === 'activate' || a.type === 'counter') &&
            a.card === g.find('p2', 'hand', EV.asura),
        ),
    ).toBe(false);
    expect(powers(g).robin).toBe(5000);
  });
});
