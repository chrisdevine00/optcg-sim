/**
 * OP11-020 X Calibur (Event, Red, cost 2, {Drake Pirates}/{Navy}/{SWORD}).
 *
 * Card text: "[Main] Give up to 2 of your opponent's Characters −2000 power during this turn. Then, up
 * to 1 of your "Navy" type Characters gains +1000 power during this turn.
 * [Trigger] K.O. up to 1 of your opponent's Characters with 4000 power or less."
 *
 * Rules: "up to 2" lets the player pick 0, 1 or 2 different Characters (CR 8-4-4-1). Only Characters
 * of the stated type are candidates for the boost (a Leader is not a Character). Power changes last
 * this turn. A [Trigger] resolves when the Life card is taken as damage and is optional.
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
  activateTrigger,
  declineTrigger,
} from './kit-op11a.ts';

const XC = 'OP11-020';

function main(p2: string[], p1chars: string[] = [N11.navy3, N11.fish3]) {
  return mine(L11.koby, { hand: [XC], characters: p1chars }, { characters: p2 });
}

describe('OP11-020 X Calibur: [Main] -2000 to up to 2, then a Navy Character +1000', () => {
  it('printed value: cost 2', () => {
    const g = main([]);
    expect(g.card(at(g, 'p1', 'hand', XC)).cost).toBe(2);
  });

  it('lowers two chosen opposing Characters by 2000 each', () => {
    const g = main([N11.marco, N11.thatch, N11.sai]);
    playRaw(g, XC);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', N11.marco), chr(g, 'p2', N11.thatch)]);
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(3000);
    expect(g.power(chr(g, 'p2', N11.thatch))).toBe(6000);
    expect(g.power(chr(g, 'p2', N11.sai))).toBe(4000);
  });

  it('"up to 2": one Character is enough, and none is allowed', () => {
    const a = main([N11.marco, N11.thatch]);
    playRaw(a, XC);
    need(a, 'choose', 'p1');
    pickInst(a, [chr(a, 'p2', N11.marco)]);
    expect(a.power(chr(a, 'p2', N11.marco))).toBe(3000);
    expect(a.power(chr(a, 'p2', N11.thatch))).toBe(8000);
    const b = main([N11.marco]);
    playRaw(b, XC);
    need(b, 'choose', 'p1');
    none(b);
    expect(b.power(chr(b, 'p2', N11.marco))).toBe(5000);
  });

  it('never more than 2 Characters, and never the same one twice', () => {
    const g = main([N11.marco, N11.thatch, N11.sai]);
    playRaw(g, XC);
    need(g, 'choose', 'p1');
    const [a, b, c] = [chr(g, 'p2', N11.marco), chr(g, 'p2', N11.thatch), chr(g, 'p2', N11.sai)];
    g.act({ type: 'pick', choice: [a, b, c].sort()[0]!, player: 'p1' });
    g.act({ type: 'pick', choice: [a, b, c].sort()[1]!, player: 'p1' });
    // Two are chosen: the engine must not still be asking for a third target of this step.
    if (kind(g) === 'choose') expect(offeredIds(g)).not.toContain(N11.sai);
  });

  it('then gives one of my Navy Characters +1000, offering Navy Characters only', () => {
    const g = main([N11.marco]);
    playRaw(g, XC);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.navy3]);
    pickInst(g, [chr(g, 'p1', N11.navy3)]);
    expect(g.power(chr(g, 'p1', N11.navy3))).toBe(6000);
    expect(g.power(chr(g, 'p1', N11.fish3))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with no Navy Character of mine the boost has no candidate', () => {
    const g = main([N11.marco], [N11.fish3]);
    playRaw(g, XC);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      endEmptyIfAsked(g);
    }
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(3000);
    expect(g.power(chr(g, 'p1', N11.fish3))).toBe(5000);
  });

  it('both effects end with the turn', () => {
    const g = main([N11.marco]);
    playRaw(g, XC);
    pickInst(g, [chr(g, 'p2', N11.marco)]);
    pickInst(g, [chr(g, 'p1', N11.navy3)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p2', N11.marco))).toBe(5000);
    expect(g.power(chr(g, 'p1', N11.navy3))).toBe(5000);
  });
});

describe('OP11-020 X Calibur: [Trigger] K.O. a Character with 4000 power or less', () => {
  function triggered(p2: string[]) {
    const g = theirs(L11.koby, { life: [XC, ...fill(BLUE, 3)] }, { characters: p2 });
    hitLeader(g);
    return g;
  }

  it('offers exactly the Characters with 4000 or less (boundary) and K.O.s the chosen one', () => {
    const g = triggered([N11.sai, N11.marco, N11.komachiyo]);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.sai, N11.komachiyo].sort());
    pickInst(g, [chr(g, 'p2', N11.sai)]);
    expect(ids(g, 'p2', 'characters')).toEqual([N11.komachiyo, N11.marco].sort());
  });

  it('may be declined', () => {
    const g = triggered([N11.sai]);
    declineTrigger(g);
    expect(ids(g, 'p2', 'characters')).toEqual([N11.sai]);
  });
});
