/**
 * OP17-054 Miss Buckingham Stussy (Character, Blue, cost 3, 5000, no Counter, type Rocks Pirates).
 *
 * Card text (cards/data):
 *   "[On Play] Up to 1 of your opponent's Characters with a base cost of 6 or less cannot attack
 *    until the end of your opponent's next End Phase.
 *    [Activate:Main] You may rest 3 of your DON!! cards and this Character: Up to 1 of your
 *    opponent's Characters cannot attack until the end of your opponent's next End Phase."
 *
 * Rulings: RL-11: "until the end of your opponent's next End Phase" covers the opponent's next turn
 * and ends in that End Phase (step 6-6-1-2 (2)), so the Character can attack again on the turn after.
 * "Base cost" is the printed cost (CR 4-9-2). Resting this Character is a cost that a rested card
 * cannot pay (CR 1-3-2-1, 8-3-1-3); summoning sickness does not stop it (CR 3-7-4). Resting DON!!
 * means active cost-area DON!! (CR 8-3-1-5).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { endTurn, play, turn as turnOf } from '../helpers.ts';
import {
  activate,
  BLUE,
  canActivate,
  canAttackAny,
  choiceCards,
  choose,
  chooseNone,
  donOf,
  LEAD,
  myTurn,
  payDon,
  RED,
  ROCKS,
  side,
  VAN,
} from './kit.ts';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LEAD.rocks, BLUE, { hand: [ROCKS.stussy], costArea: { active: 3, rested: 0 }, ...p1 }),
    side(LEAD.luffy, RED, { characters: [VAN.hajrudin, VAN.thatch, VAN.littleOars], ...p2 }),
  );
}

describe('OP17-054 Miss Buckingham Stussy: [On Play] base cost 6 or less cannot attack', () => {
  it('target restriction: only the opponent’s Characters with base cost 6 or less', () => {
    // p2: Hajrudin (cost 4), Thatch (cost 6), LittleOars Jr. (cost 7). p1: Mohji.
    const g = game({ characters: [VAN.mohji] });
    play(g, g.find('p1', 'hand', ROCKS.stussy));
    expect(choiceCards(g)).toEqual([VAN.hajrudin, VAN.thatch].sort());
  });

  it('happy path + RL-11: the chosen Character cannot attack on the opponent’s next turn; others can', () => {
    const g = game();
    play(g, g.find('p1', 'hand', ROCKS.stussy));
    const thatch = g.find('p2', 'characters', VAN.thatch);
    choose(g, [thatch]);
    endTurn(g);
    expect(turnOf(g)).toMatchObject({ number: 4, activePlayer: 'p2' });
    expect(canAttackAny(g, thatch)).toBe(false);
    expect(canAttackAny(g, g.find('p2', 'characters', VAN.littleOars))).toBe(true);
  });

  it('RL-11: the restriction ends in that End Phase: the Character attacks again on its following turn', () => {
    const g = game();
    play(g, g.find('p1', 'hand', ROCKS.stussy));
    const thatch = g.find('p2', 'characters', VAN.thatch);
    choose(g, [thatch]);
    endTurn(g); // turn 4 (p2)
    endTurn(g); // turn 5 (p1)
    endTurn(g); // turn 6 (p2)
    expect(turnOf(g)).toMatchObject({ number: 6, activePlayer: 'p2' });
    expect(canAttackAny(g, thatch)).toBe(true);
  });

  it('CR 8-4-4-1: choosing none restricts nobody', () => {
    const g = game();
    play(g, g.find('p1', 'hand', ROCKS.stussy));
    chooseNone(g);
    endTurn(g);
    expect(canAttackAny(g, g.find('p2', 'characters', VAN.thatch))).toBe(true);
  });
});

describe('OP17-054 Miss Buckingham Stussy: [Activate: Main] rest 3 DON!! and this Character', () => {
  function onField(p1: Partial<PlayerSpec> = {}) {
    return game({ hand: [], characters: [ROCKS.stussy], ...p1 });
  }

  it('happy path: rests 3 DON!! and Stussy; any opponent’s Character (no cost limit) cannot attack next turn', () => {
    const g = onField();
    const stussy = g.find('p1', 'characters', ROCKS.stussy);
    expect(canActivate(g, stussy)).toBe(true);
    activate(g, stussy);
    payDon(g, 3);
    expect(choiceCards(g)).toEqual([VAN.hajrudin, VAN.thatch, VAN.littleOars].sort());
    const oars = g.find('p2', 'characters', VAN.littleOars);
    choose(g, [oars]);
    expect(g.card(stussy).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    endTurn(g);
    expect(canAttackAny(g, oars)).toBe(false);
  });

  it('CR 8-3-1-3: with only 2 active DON!! the cost cannot be paid, so it is not offered', () => {
    const g = onField({ costArea: { active: 2, rested: 3 } });
    expect(canActivate(g, g.find('p1', 'characters', ROCKS.stussy))).toBe(false);
  });

  it('CR 1-3-2-1: a rested Stussy cannot pay "rest this Character"', () => {
    const g = onField({ characters: [{ card: ROCKS.stussy, rested: true }] });
    expect(canActivate(g, g.find('p1', 'characters', ROCKS.stussy))).toBe(false);
  });

  it('CR 3-7-4: Stussy played this turn may activate it (it is a rest cost, not an attack)', () => {
    const g = game({ costArea: { active: 6, rested: 0 } });
    play(g, g.find('p1', 'hand', ROCKS.stussy));
    chooseNone(g);
    expect(canActivate(g, g.find('p1', 'characters', ROCKS.stussy))).toBe(true);
  });

  it('it is not offered on the opponent’s turn (CR 8-1-3-2)', () => {
    const g = onField();
    endTurn(g);
    expect(canActivate(g, g.find('p1', 'characters', ROCKS.stussy))).toBe(false);
  });
});
