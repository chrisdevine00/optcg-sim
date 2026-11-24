/**
 * OP15-043 Kelly Funk (Character, Blue, cost 3, 3000, Counter +1000, {Dressrosa}/{Mogaro
 * Kingdom}).
 *
 * Card text: "[On Play] Play up to 1 [Bobby Funk] from your hand."
 *
 * Rules: CR 3-1-6 (an effect plays a card without paying its cost), CR 8-4-4-1 ("up to"), the name
 * filter is exact. OP15-050 Bobby Funk (cost 3, 3000) gains +3000 while its owner has [Kelly Funk].
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chars,
  choices,
  don,
  hand,
  kind,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SCN,
} from './kit-op15a.ts';

const KELLY = 'OP15-043';
const BOBBY = 'OP15-050';

function board(handCards: string[], chs: string[] = []) {
  return mine(LD15.luffy, { hand: [KELLY, ...handCards], characters: chs });
}

describe('OP15-043 Kelly Funk: [On Play] play up to 1 [Bobby Funk] from my hand', () => {
  it('offers [Bobby Funk] only, not other cost 3 Characters, and plays it for free', () => {
    const g = board([BOBBY, SCN.c3]);
    playRaw(g, KELLY);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BOBBY]);
    pickInst(g, [at(g, 'p1', 'hand', BOBBY)]);
    need(g, 'main', 'p1');
    expect(chars(g)).toEqual([KELLY, BOBBY].sort());
    expect(hand(g)).toEqual([SCN.c3]);
    expect(don(g, 'p1')).toMatchObject({ active: 7, rested: 3 });
  });

  it('[Bobby Funk] benefits from [Kelly Funk] being on the field: 6000 power', () => {
    const g = board([BOBBY]);
    playRaw(g, KELLY);
    pickInst(g, [at(g, 'p1', 'hand', BOBBY)]);
    expect(g.power(at(g, 'p1', 'characters', BOBBY))).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', KELLY))).toBe(3000);
  });

  it('"up to 1": choosing nothing plays nothing', () => {
    const g = board([BOBBY]);
    playRaw(g, KELLY);
    none(g);
    expect(chars(g)).toEqual([KELLY]);
    expect(hand(g)).toEqual([BOBBY]);
  });

  it('plays at most one [Bobby Funk] even with two in hand', () => {
    const g = board([BOBBY, BOBBY]);
    playRaw(g, KELLY);
    pickInst(g, [at(g, 'p1', 'hand', BOBBY)]);
    need(g, 'main', 'p1');
    expect(chars(g)).toEqual([BOBBY, KELLY].sort());
    expect(hand(g)).toEqual([BOBBY]);
  });

  it('with no [Bobby Funk] in hand nothing is offered and Kelly Funk is simply played', () => {
    const g = board([SCN.c3, SCN.c2]);
    playRaw(g, KELLY);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    need(g, 'main', 'p1');
    expect(chars(g)).toEqual([KELLY]);
  });

  it('a [Bobby Funk] already on the field is not a candidate (hand only)', () => {
    const g = board([SCN.c2], [BOBBY]);
    playRaw(g, KELLY);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    expect(chars(g)).toEqual([BOBBY, KELLY].sort());
  });

  it('a sixth Character asks me to trash one (Character limit)', () => {
    const g = board([BOBBY], [SCN.c1, SCN.c2, SCN.c4, SCN.c5]);
    playRaw(g, KELLY);
    // Kelly is the 5th; Bobby would be the 6th.
    if (
      kind(g) === 'choose' &&
      g.legal().some((a) => a.type === 'pick' && a.choice === g.find('p1', 'hand', BOBBY))
    ) {
      pickInst(g, [at(g, 'p1', 'hand', BOBBY)]);
    }
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('characterLimit');
  });
});
