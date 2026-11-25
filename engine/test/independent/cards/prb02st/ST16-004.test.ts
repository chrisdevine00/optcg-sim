/**
 * ST16-004 Shanks (Character, cost 9, 11000, no Counter, {FILM}/{The Four Emperors}/{Red-Haired
 * Pirates}).
 *
 * Card text: "[On Play] K.O. up to 1 of your opponent's rested Characters."
 *
 * Rules: only a rested Character of the opponent is a candidate, whatever its power or cost; the
 * opponent's Leader and my own Characters are not. "Up to 1" may be answered with nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMainOf,
  choices,
  chr,
  kind,
  LDP,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SP,
  sorted,
  trash,
} from './kit-prb02sta.ts';

const SK = 'ST16-004';

type P = string | { card: string; rested?: boolean };

function play(p2chars: P[], mineChars: P[] = [], p2leader?: unknown) {
  const g = mine(LDP.neutral, { hand: [SK], characters: mineChars }, {
    characters: p2chars,
    ...(p2leader ? { leader: p2leader } : {}),
  } as never);
  playRaw(g, SK);
  return g;
}

describe("ST16-004 Shanks: [On Play] K.O. up to 1 of the opponent's rested Characters", () => {
  it('printed values: cost 9, 11000 power, no Counter', () => {
    const g = mine(LDP.neutral, { characters: [SK] });
    const i = at(g, 'p1', 'characters', SK);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([9, 11000, null]);
  });

  it('offers exactly the opposing RESTED Characters (an active one is not offered)', () => {
    const g = play([{ card: SP.c1p3, rested: true }, SP.c2p4, { card: SP.c3p5, rested: true }]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c1p3, SP.c3p5].sort());
  });

  it("K.O.s the chosen rested Character (to its owner's trash) and leaves the others", () => {
    const g = play([{ card: SP.c1p3, rested: true }, SP.c2p4, { card: SP.c3p5, rested: true }]);
    pickInst(g, [chr(g, 'p2', SP.c3p5)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c1p3, SP.c2p4].sort());
    expect(trash(g, 'p2')).toEqual([SP.c3p5]);
    expect(atMainOf(g)).toBe(true);
  });

  it('K.O.s only 1 even when two are rested', () => {
    const g = play([
      { card: SP.c1p3, rested: true },
      { card: SP.c3p5, rested: true },
    ]);
    pickInst(g, [chr(g, 'p2', SP.c1p3)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c3p5]);
    expect(kind(g)).toBe('main');
  });

  it('"up to 1": choosing nothing K.O.s nothing', () => {
    const g = play([{ card: SP.c1p3, rested: true }]);
    need(g, 'choose', 'p1');
    none(g);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c1p3]);
    expect(atMainOf(g)).toBe(true);
  });

  it('no limit on power or cost: a rested 10000-power Character can be K.O.d', () => {
    const g = play([{ card: SP.c8p10, rested: true }]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c8p10]);
    pickInst(g, [chr(g, 'p2', SP.c8p10)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([]);
  });

  it('only active Characters on the other side: nothing can be K.O.d (an empty pick or none at all)', () => {
    const g = play([SP.c1p3, SP.c2p4]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c1p3, SP.c2p4].sort());
  });

  it('my own rested Characters are never offered', () => {
    const g = play([{ card: SP.c1p3, rested: true }], [{ card: SP.c2p4, rested: true }]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c1p3]);
  });

  it("the opponent's rested Leader is not a candidate (Characters only)", () => {
    const g = play([{ card: SP.c1p3, rested: true }], [], { card: LDP.neutral, rested: true });
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toEqual([SP.c1p3]);
  });

  it('nothing happens when Shanks is already on the field: no K.O. without playing him', () => {
    const g = mine(
      LDP.neutral,
      { characters: [SK] },
      { characters: [{ card: SP.c1p3, rested: true }] },
    );
    expect(kind(g)).toBe('main');
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c1p3]);
  });
});
