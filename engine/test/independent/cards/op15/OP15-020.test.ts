/**
 * OP15-020 Fire Fist (Event, Red, cost 7, {Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "[Main] Your Leader gains +3000 power during this turn and give up to 1 of your
 * opponent's Characters -8000 power until the end of your opponent's next End Phase. Then, you may
 * trash 2 cards from your hand. If you do, K.O. up to 1 of your opponent's Characters with 0 power
 * or less."
 *
 * Rules: CR 8-4-2 (durations), CR 8-3-1 (a cost that cannot be paid; the hidden-hand "you may" is
 * offered with accept illegal), CR 8-4-4-1 ("up to"), a Character at 0 power stays on the field.
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from './kit-op15a.ts';
import {
  at,
  chr,
  chars,
  hand,
  LD15,
  leaderPower,
  mine,
  need,
  no,
  none,
  offeredIds,
  pickCards,
  pickInst,
  playRaw,
  S15,
  SCN,
  trash,
  unusable,
  yes,
} from './kit-op15a.ts';

const FIRE_FIST = 'OP15-020';
const FODDER_A = SCN.c1;
const FODDER_B = SCN.c2;
const FODDER_C = SCN.c3;

/** p1's Main with Fire Fist and three other cards in hand; p2's Characters as given. Stops at the -8000 target prompt. */
function start(p2chars: string[], opts: { hand?: string[]; mychars?: string[] } = {}) {
  const g = mine(
    LD15.luffy,
    {
      hand: [FIRE_FIST, ...(opts.hand ?? [FODDER_A, FODDER_B, FODDER_C])],
      characters: opts.mychars ?? [],
    },
    { characters: p2chars },
  );
  playRaw(g, FIRE_FIST);
  need(g, 'choose', 'p1');
  return g;
}

describe('OP15-020 Fire Fist: Leader +3000, -8000 until the end of the opponent next End Phase', () => {
  it('my Leader gains +3000 this turn (8000) and loses it at the end of the turn', () => {
    const g = start([SCN.c6]);
    expect(leaderPower(g, 'p1')).toBe(8000);
    none(g);
    no(g);
    need(g, 'main', 'p1');
    expect(leaderPower(g, 'p1')).toBe(8000);
    endTurn(g);
    expect(leaderPower(g, 'p1')).toBe(5000);
  });

  it('the -8000 hits only the chosen opposing Character; only opposing Characters are offered', () => {
    const g = start([SCN.c6, SCN.c5], { mychars: [SCN.c3] });
    expect(offeredIds(g)).toEqual([SCN.c5, SCN.c6].sort());
    pickInst(g, [chr(g, 'p2', SCN.c5)]);
    no(g);
    expect(g.power(chr(g, 'p2', SCN.c5))).toBe(-1000);
    expect(g.power(chr(g, 'p2', SCN.c6))).toBe(8000);
    expect(g.power(at(g, 'p1', 'characters', SCN.c3))).toBe(5000);
  });

  it('the -8000 lasts through the opponent turn and is gone after its End Phase', () => {
    const g = start([SCN.c6]);
    pickInst(g, [chr(g, 'p2', SCN.c6)]);
    no(g);
    expect(g.power(chr(g, 'p2', SCN.c6))).toBe(0);
    expect(chars(g, 'p2')).toEqual([SCN.c6]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p2', SCN.c6))).toBe(0);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p2', SCN.c6))).toBe(8000);
  });

  it('trashing 2 cards K.O.s a Character at exactly 0 power (8000 - 8000), and the cards are trashed', () => {
    const g = start([SCN.c6]);
    pickInst(g, [chr(g, 'p2', SCN.c6)]);
    yes(g, 'p1');
    pickCards(g, [FODDER_A, FODDER_B]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c6]);
    pickInst(g, [chr(g, 'p2', SCN.c6)]);
    need(g, 'main', 'p1');
    expect(chars(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SCN.c6]);
    expect(trash(g).sort()).toEqual([FIRE_FIST, FODDER_A, FODDER_B].sort());
    expect(hand(g)).toEqual([FODDER_C]);
  });

  it('boundary: a Character left at 1000 power (9000 - 8000) is not a K.O. candidate', () => {
    const g = start([SCN.c7]);
    pickInst(g, [chr(g, 'p2', SCN.c7)]);
    yes(g, 'p1');
    pickCards(g, [FODDER_A, FODDER_B]);
    // Nothing qualifies: either no prompt, or an empty "up to" choice.
    if (g.legal().some((a) => a.type === 'done')) {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    need(g, 'main', 'p1');
    expect(chars(g, 'p2')).toEqual([SCN.c7]);
  });

  it('a Character with 0 power before any debuff (Cobra) is a K.O. candidate even if no -8000 target is chosen', () => {
    const g = start([S15.cobra0, SCN.c6]);
    none(g);
    yes(g, 'p1');
    pickCards(g, [FODDER_A, FODDER_B]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S15.cobra0]);
    pickInst(g, [chr(g, 'p2', S15.cobra0)]);
    expect(chars(g, 'p2')).toEqual([SCN.c6]);
  });

  it('declining the trash: nothing is K.O.d even with a Character at 0 power', () => {
    const g = start([SCN.c6]);
    pickInst(g, [chr(g, 'p2', SCN.c6)]);
    no(g, 'p1');
    need(g, 'main', 'p1');
    expect(chars(g, 'p2')).toEqual([SCN.c6]);
    expect(hand(g).sort()).toEqual([FODDER_A, FODDER_B, FODDER_C].sort());
  });

  it('with fewer than 2 cards left in hand the trash cannot be paid: no K.O.', () => {
    const g = start([SCN.c6], { hand: [FODDER_A] });
    pickInst(g, [chr(g, 'p2', SCN.c6)]);
    unusable(g, 'p1');
    need(g, 'main', 'p1');
    expect(chars(g, 'p2')).toEqual([SCN.c6]);
    expect(hand(g)).toEqual([FODDER_A]);
  });

  it('"up to 1": with two Characters at 0 power only one is K.O.d', () => {
    const g = start([SCN.c6, S15.cobra0]);
    pickInst(g, [chr(g, 'p2', SCN.c6)]);
    yes(g, 'p1');
    pickCards(g, [FODDER_A, FODDER_B]);
    expect(offeredIds(g)).toEqual([S15.cobra0, SCN.c6].sort());
    pickInst(g, [chr(g, 'p2', S15.cobra0)]);
    need(g, 'main', 'p1');
    expect(chars(g, 'p2')).toEqual([SCN.c6]);
  });

  it('only opposing Characters can be K.O.d: my own 0 power Character is never offered', () => {
    const g = start([SCN.c6], { mychars: [S15.cobra0] });
    pickInst(g, [chr(g, 'p2', SCN.c6)]);
    yes(g, 'p1');
    pickCards(g, [FODDER_A, FODDER_B]);
    expect(offeredIds(g)).toEqual([SCN.c6]);
  });
});
