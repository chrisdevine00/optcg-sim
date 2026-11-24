/**
 * OP11-002 Ain (Character, Red, cost 3, 4000, Counter +1000, {FILM}/{Neo Navy}).
 *
 * Card text: "[On Play] Give up to 1 of your opponent's Characters −1000 power during this turn. Then,
 * K.O. up to 1 of your opponent's Characters with 0 power or less."
 *
 * Rules: a power change lasts the stated duration; "0 power or less" reads the CURRENT power at the
 * time the K.O. is chosen (CR 4-12), so the Character just lowered counts. "Up to 1" may choose
 * none (CR 8-4-4-1). Only the opponent's Characters are candidates.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chr,
  endEmptyIfAsked,
  endTurn,
  ids,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  offeredIds,
  onField,
  pickInst,
  playRaw,
} from './kit-op11a.ts';

const AIN = 'OP11-002';

function game(p2chars: string[], p1chars: string[] = []) {
  return mine(L11.luffy, { hand: [AIN], characters: p1chars }, { characters: p2chars });
}

describe('OP11-002 Ain: [On Play] -1000 power, then K.O. a Character with 0 power or less', () => {
  it('printed values: cost 3, 4000, Counter +1000', () => {
    const g = game([]);
    const a = at(g, 'p1', 'hand', AIN);
    expect(g.card(a).cost).toBe(3);
    expect(g.power(a)).toBe(4000);
    expect(g.card(a).counter).toBe(1000);
  });

  it('lowers the chosen Character by 1000 power', () => {
    const g = game([N11.marco]);
    playRaw(g, AIN);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    endEmptyIfAsked(g);
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(4000);
    expect(onField(g, 'p2', chr(g, 'p2', N11.marco))).toBe(true);
  });

  it('the Character just lowered to 0 is K.O.’d (boundary: 1000 - 1000 = 0)', () => {
    const g = game([N11.killer1]);
    playRaw(g, AIN);
    pickInst(g, [chr(g, 'p2', N11.killer1)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.killer1]);
    pickInst(g, [chr(g, 'p2', N11.killer1)]);
    expect(ids(g, 'p2', 'characters')).toEqual([]);
    expect(ids(g, 'p2', 'trash')).toEqual([N11.killer1]);
  });

  it('a Character with 2000 power ends at 1000 and is NOT a K.O. candidate (boundary)', () => {
    const g = game([N11.dadan]);
    playRaw(g, AIN);
    pickInst(g, [chr(g, 'p2', N11.dadan)]);
    endEmptyIfAsked(g);
    expect(g.power(chr(g, 'p2', N11.dadan))).toBe(1000);
    expect(ids(g, 'p2', 'characters')).toEqual([N11.dadan]);
  });

  it('a Character already at 0 power may be K.O.’d while the -1000 goes elsewhere', () => {
    const g = game([N11.cobra, N11.marco]);
    playRaw(g, AIN);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.cobra]);
    pickInst(g, [chr(g, 'p2', N11.cobra)]);
    expect(ids(g, 'p2', 'characters')).toEqual([N11.marco]);
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(4000);
  });

  it('the K.O. step offers every Character at 0 or less, and only those', () => {
    const g = game([N11.cobra, N11.killer1, N11.dadan, N11.marco]);
    playRaw(g, AIN);
    pickInst(g, [chr(g, 'p2', N11.killer1)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.cobra, N11.killer1].sort());
  });

  it('"up to 1" K.O.: may choose none, the Character at 0 stays', () => {
    const g = game([N11.cobra]);
    playRaw(g, AIN);
    if (kind(g) === 'choose' && g.legal().some((a) => a.type === 'done')) none(g);
    if (kind(g) === 'choose') none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([N11.cobra]);
  });

  it('never offers my own Characters, even one at 0 power', () => {
    const g = game([N11.marco], [N11.cobra]);
    playRaw(g, AIN);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.marco]);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    endEmptyIfAsked(g);
    expect(ids(g, 'p1', 'characters')).toEqual([AIN, N11.cobra].sort());
  });

  it('the -1000 lasts this turn only', () => {
    const g = game([N11.marco]);
    playRaw(g, AIN);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    endEmptyIfAsked(g);
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(4000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(5000);
  });

  it('with no opposing Character nothing happens and Ain stays', () => {
    const g = game([]);
    playRaw(g, AIN);
    endEmptyIfAsked(g);
    endEmptyIfAsked(g);
    need(g, 'main', 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([AIN]);
  });
});
