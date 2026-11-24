/**
 * OP13-032 Nico Robin (Character, Green, cost 7, 7000, Counter +1000, {FILM}/{Straw Hat Crew}).
 *
 * Card text: "[On Play] Up to 1 of your opponent's Characters with a cost of 8 or less cannot be
 * rested until the end of your opponent's next End Phase."
 *
 * Rules: digest 57 ("cannot be rested": cannot attack, cannot rest by any effect), digest 72
 * (End Phase expiry tiers), CR 8-4-4-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  canHit,
  choices,
  dons,
  endTurn,
  mine,
  need,
  offeredIds,
  pickInst,
  playRaw,
  isMain,
  WL,
  WV,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import type { InstanceId } from '@optcg/engine';

const ROBIN = 'OP13-032';
const GUN = 'OP13-038';

function board(oppChars: string[], hand: string[] = [ROBIN], mineChars: string[] = []): TestGame {
  return mine(WL.luffy, { hand, characters: mineChars }, { characters: oppChars });
}

/** Play Gum-Gum Elephant Gun (a rest effect of mine); target it at `t` if the engine offers it. */
function gunAt(g: TestGame, t: InstanceId): void {
  playRaw(g, GUN);
  need(g, 'choose', 'p1');
  if (choices(g).includes(t)) pickInst(g, [t]);
  else act(g, { type: 'done' });
}

describe('OP13-032 Nico Robin: [On Play] an opposing Character (cost 8 or less) cannot be rested', () => {
  it('offers exactly the opposing Characters with cost 8 or less (8 yes, 9 no)', () => {
    const g = board([WV.shiki, WV.mihawk, WV.thatch]);
    playRaw(g, ROBIN);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([WV.thatch, WV.shiki].sort());
  });

  it('my own Characters are never offered', () => {
    const g = board([WV.marco], [ROBIN], [WV.mohji]);
    playRaw(g, ROBIN);
    expect(offeredIds(g)).toEqual([WV.marco]);
  });

  it('the chosen Character cannot be rested by a rest effect of mine this turn; an unchosen one can', () => {
    const g = board([WV.marco, WV.sai], [ROBIN, GUN]);
    playRaw(g, ROBIN);
    pickInst(g, [g.find('p2', 'characters', WV.marco)]);
    expect(isMain(g)).toBe(true);
    gunAt(g, g.find('p2', 'characters', WV.marco));
    expect(g.card(g.find('p2', 'characters', WV.marco)).rested).toBe(false);
    // control: the same effect does rest the other Character
    const h = board([WV.marco, WV.sai], [ROBIN, GUN]);
    playRaw(h, ROBIN);
    pickInst(h, [h.find('p2', 'characters', WV.marco)]);
    gunAt(h, h.find('p2', 'characters', WV.sai));
    expect(h.card(h.find('p2', 'characters', WV.sai)).rested).toBe(true);
  });

  it('"up to": choosing nothing leaves every Character free to be rested', () => {
    const g = board([WV.marco], [ROBIN, GUN]);
    playRaw(g, ROBIN);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    gunAt(g, g.find('p2', 'characters', WV.marco));
    expect(g.card(g.find('p2', 'characters', WV.marco)).rested).toBe(true);
  });

  it('on the opponent turn the chosen Character cannot attack, the other one can', () => {
    const g = board([WV.marco, WV.sai]);
    playRaw(g, ROBIN);
    pickInst(g, [g.find('p2', 'characters', WV.marco)]);
    endTurn(g);
    need(g, 'main', 'p2');
    const leader = g.leader('p1');
    expect(canHit(g, g.find('p2', 'characters', WV.marco), leader)).toBe(false);
    expect(canHit(g, g.find('p2', 'characters', WV.sai), leader)).toBe(true);
  });

  it('the effect runs out after the opponent next End Phase: I can rest it on my next turn', () => {
    const g = board([WV.marco], [ROBIN, GUN]);
    playRaw(g, ROBIN);
    pickInst(g, [g.find('p2', 'characters', WV.marco)]);
    endTurn(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    gunAt(g, g.find('p2', 'characters', WV.marco));
    expect(g.card(g.find('p2', 'characters', WV.marco)).rested).toBe(true);
  });

  it('still in force when the opponent turn starts (the Refresh Phase does not end it)', () => {
    const g = board([WV.marco]);
    playRaw(g, ROBIN);
    pickInst(g, [g.find('p2', 'characters', WV.marco)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canHit(g, g.find('p2', 'characters', WV.marco), g.leader('p1'))).toBe(false);
  });

  it('a protected Blocker cannot block (it cannot be rested, digest 57); an unprotected one can', () => {
    const FRANKY_BLOCKER = 'OP09-072'; // Purple, cost 4, 5000, [Blocker]
    const g = board([FRANKY_BLOCKER]);
    playRaw(g, ROBIN);
    pickInst(g, [g.find('p2', 'characters', FRANKY_BLOCKER)]);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
    const h = board([FRANKY_BLOCKER]);
    playRaw(h, ROBIN);
    need(h, 'choose', 'p1');
    act(h, { type: 'done' });
    attack(h, h.leader('p1'), h.leader('p2'));
    expect(blockers(h)).toEqual([h.find('p2', 'characters', FRANKY_BLOCKER)]);
  });

  it('an already rested Character may be chosen; it still stands up in its Refresh Phase', () => {
    const g = mine(WL.luffy, { hand: [ROBIN] }, { characters: [{ card: WV.shiki, rested: true }] });
    playRaw(g, ROBIN);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', WV.shiki)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(g.find('p2', 'characters', WV.shiki)).rested).toBe(false);
    expect(canHit(g, g.find('p2', 'characters', WV.shiki), g.leader('p1'))).toBe(false);
  });

  it('with no opposing Character the effect does nothing and the game goes on', () => {
    const g = board([]);
    playRaw(g, ROBIN);
    // an empty "up to" pick may be asked (and finished) or skipped
    if (!isMain(g)) {
      need(g, 'choose', 'p1');
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(isMain(g)).toBe(true);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ROBIN]);
  });

  it('Robin costs 7 (7 DON!! rested) and has 7000 power', () => {
    const g = board([WV.marco]);
    playRaw(g, ROBIN);
    need(g, 'choose', 'p1');
    expect(dons(g).rested).toBe(7);
    expect(g.power(g.find('p1', 'characters', ROBIN))).toBe(7000);
  });
});
