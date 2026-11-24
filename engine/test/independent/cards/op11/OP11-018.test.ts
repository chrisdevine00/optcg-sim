/**
 * OP11-018 Honesty Impact (Event, Red, cost 6, {Navy}/{SWORD}).
 *
 * Card text: "[Main] Give up to 1 of your opponent's Characters −4000 power during this turn. Then,
 * K.O. up to 1 of your opponent's Characters with 6000 power or less.
 * [Trigger] K.O. up to 1 of your opponent's Characters with 6000 power or less."
 *
 * Rules: the K.O. candidates are read after the power change (current power, CR 4-12), so a
 * Character just lowered counts. "6000 power or less" includes exactly 6000. "Up to 1" may choose
 * none (CR 8-4-4-1). A [Trigger] resolves when the Life card is taken as damage and is optional.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  chr,
  endEmptyIfAsked,
  endTurn,
  fill,
  hitLeader,
  ids,
  kind,
  L11,
  mine,
  N11,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  theirs,
  trash,
  canPlayCard,
  activateTrigger,
  declineTrigger,
} from './kit-op11a.ts';

const HI = 'OP11-018';

function main(p2: string[], don = 10) {
  return mine(L11.luffy, { hand: [HI], costArea: { active: don, rested: 0 } }, { characters: p2 });
}

describe('OP11-018 Honesty Impact: [Main] -4000, then K.O. a Character with 6000 power or less', () => {
  it('printed value: cost 6; unplayable with only 5 active DON!!', () => {
    const g = main([N11.marco], 5);
    expect(g.card(at(g, 'p1', 'hand', HI)).cost).toBe(6);
    expect(canPlayCard(g, at(g, 'p1', 'hand', HI))).toBe(false);
  });

  it('lowers the chosen Character by 4000 and may K.O. it when that brings it to 6000 or less', () => {
    const g = main([N11.thatch]);
    playRaw(g, HI);
    pickInst(g, [chr(g, 'p2', N11.thatch)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.thatch]);
    pickInst(g, [chr(g, 'p2', N11.thatch)]);
    expect(ids(g, 'p2', 'characters')).toEqual([]);
    expect(ids(g, 'p2', 'trash')).toEqual([N11.thatch]);
    expect(trash(g)).toEqual([HI]);
  });

  it('boundary: exactly 6000 is a candidate, 7000 is not (without the reduction)', () => {
    const g = main([N11.marco, N11.hajrudin, N11.kingdew, N11.thatch]);
    playRaw(g, HI);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.marco, N11.hajrudin].sort());
  });

  it('a 7000 Character lowered to 3000 becomes a candidate; the 8000 one stays out', () => {
    const g = main([N11.kingdew, N11.thatch]);
    playRaw(g, HI);
    pickInst(g, [chr(g, 'p2', N11.kingdew)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.kingdew]);
  });

  it('may K.O. a different Character than the one lowered', () => {
    const g = main([N11.marco, N11.thatch]);
    playRaw(g, HI);
    pickInst(g, [chr(g, 'p2', N11.thatch)]);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    expect(ids(g, 'p2', 'characters')).toEqual([N11.thatch]);
    expect(g.power(chr(g, 'p2', N11.thatch))).toBe(4000);
  });

  it('"up to 1": may K.O. no one; the lowered Character stays', () => {
    const g = main([N11.marco]);
    playRaw(g, HI);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    need(g, 'choose', 'p1');
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([N11.marco]);
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(1000);
  });

  it('the -4000 lasts this turn only', () => {
    const g = main([N11.thatch, N11.kingdew]);
    playRaw(g, HI);
    pickInst(g, [chr(g, 'p2', N11.thatch)]);
    none(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p2', N11.thatch))).toBe(8000);
  });

  it('with no opposing Character nothing happens', () => {
    const g = main([]);
    playRaw(g, HI);
    endEmptyIfAsked(g);
    endEmptyIfAsked(g);
    need(g, 'main', 'p1');
  });
});

describe('OP11-018 Honesty Impact: [Trigger] K.O. a Character with 6000 power or less', () => {
  function triggered(p1chars: string[]) {
    // p2's Characters are the targets of p1's Trigger.
    const g = theirs(L11.luffy, { life: [HI, ...fill(BLUE, 3)] }, { characters: p1chars });
    hitLeader(g);
    return g;
  }

  it('offers exactly the opposing Characters with 6000 power or less and K.O.s the chosen one', () => {
    const g = triggered([N11.marco, N11.hajrudin, N11.kingdew]);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.marco, N11.hajrudin].sort());
    pickInst(g, [chr(g, 'p2', N11.hajrudin)]);
    expect(ids(g, 'p2', 'characters')).toEqual([N11.kingdew, N11.marco].sort());
  });

  it('the Trigger has no power reduction first: a 7000 Character is untouched', () => {
    const g = triggered([N11.kingdew]);
    activateTrigger(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(ids(g, 'p2', 'characters')).toEqual([N11.kingdew]);
    expect(g.power(chr(g, 'p2', N11.kingdew))).toBe(7000);
  });

  it('may be declined: no K.O.', () => {
    const g = triggered([N11.marco]);
    declineTrigger(g);
    expect(ids(g, 'p2', 'characters')).toEqual([N11.marco]);
  });
});
