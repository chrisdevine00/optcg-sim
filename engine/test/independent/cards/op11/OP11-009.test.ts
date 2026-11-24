/**
 * OP11-009 Nico Robin (Character, Red, cost 3, 4000, Counter +1000, {Straw Hat Crew}).
 *
 * Card text: "[DON!! x2] [When Attacking] Give up to 1 of your opponent's Characters −2000 power until
 * the end of your opponent's next turn."
 *
 * Rules: [DON!! x2] needs two DON!! given to this card (CR 8-3-2-3: two or more is fine). [When
 * Attacking] fires when this card declares an attack (CR 10-2-2). "Until the end of your opponent's
 * next turn" covers the opponent's whole next turn (rules-digest duration table, RL-8).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chr,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  noDefence,
  offeredIds,
  pickInst,
} from './kit-op11a.ts';
import { act } from '../../helpers.ts';

const ROBIN = 'OP11-009';

function board(
  don: number,
  p2: (string | { card: string; rested?: boolean })[] = [N11.marco, N11.dadan],
) {
  return mine(
    L11.luffy,
    { characters: [{ card: ROBIN, don }], costArea: { active: 7, rested: 0 } },
    { characters: p2 },
  );
}

function swing(g: ReturnType<typeof board>, target = g.leader('p2')) {
  act(g, { type: 'attack', attacker: at(g, 'p1', 'characters', ROBIN), target });
}

describe('OP11-009 Nico Robin: [DON!! x2][When Attacking] -2000 until the end of the opponent’s next turn', () => {
  it('printed values: cost 3, 4000, Counter +1000', () => {
    const g = board(0);
    const r = chr(g, 'p1', ROBIN);
    expect(g.card(r).cost).toBe(3);
    expect(g.power(r)).toBe(4000);
    expect(g.card(r).counter).toBe(1000);
  });

  it('with 2 DON!! given, attacking lets me lower an opposing Character by 2000', () => {
    const g = board(2);
    swing(g);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(3000);
    noDefence(g);
  });

  it('with only 1 DON!! given (boundary) nothing triggers', () => {
    const g = board(1);
    swing(g);
    expect(kind(g)).not.toBe('choose');
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(5000);
  });

  it('with 3 DON!! given it still triggers', () => {
    const g = board(3);
    swing(g);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', N11.dadan)]);
    expect(g.power(chr(g, 'p2', N11.dadan))).toBe(0);
  });

  it('offers only opposing Characters', () => {
    const g = board(2);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.dadan, N11.marco].sort());
  });

  it('"up to 1": may lower no one', () => {
    const g = board(2);
    swing(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(5000);
    expect(g.power(chr(g, 'p2', N11.dadan))).toBe(2000);
  });

  it('also triggers when attacking a rested Character', () => {
    const g = board(2, [{ card: N11.sai, rested: true }, N11.marco]);
    swing(g, chr(g, 'p2', N11.sai));
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(3000);
  });

  it('the loss lasts through the opponent’s next turn and ends at its end', () => {
    const g = board(2);
    swing(g);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    noDefence(g);
    need(g, 'main', 'p1');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(3000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(5000);
  });

  it('a Character lowered to 0 stays on the field', () => {
    const g = board(2);
    swing(g);
    pickInst(g, [chr(g, 'p2', N11.dadan)]);
    noDefence(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });
});
