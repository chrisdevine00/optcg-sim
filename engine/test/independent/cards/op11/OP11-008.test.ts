/**
 * OP11-008 Doll (Character, Red, cost 4, 1000, Counter +1000, {Navy}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] You may trash 1 card from your hand: If your Leader has the "Navy"
 * type, give up to 1 of your opponent's Characters −6000 power during this turn."
 *
 * Rules: the trash is a cost (CR 8-3-1); it needs a card in hand; the "If" is checked after the
 * cost. A Character at 0 power or less stays on the field (only K.O. effects remove it). The power
 * change lasts this turn. [Blocker] lets Doll become the new target of an attack (CR 10-1-1).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  chr,
  endTurn,
  hand,
  ids,
  kind,
  L11,
  mine,
  N11,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickInst,
  playRaw,
  theirs,
  trash,
  unusable,
  yes,
  attack,
  blockers,
} from './kit-op11a.ts';

const DOLL = 'OP11-008';
const FODDER = N11.marco;

function game(leader: string, handCards: string[] = [DOLL, FODDER, BLUE]) {
  return mine(leader, { hand: handCards }, { characters: [N11.thatch, N11.sai] });
}

describe('OP11-008 Doll: [On Play] may trash 1 card, Navy Leader: -6000 power', () => {
  it('printed values: cost 4, 1000, Counter +1000, [Blocker]', () => {
    const g = game(L11.koby);
    const d = at(g, 'p1', 'hand', DOLL);
    expect(g.card(d).cost).toBe(4);
    expect(g.power(d)).toBe(1000);
    expect(g.card(d).counter).toBe(1000);
    expect(g.card(d).keywords).toContain('Blocker');
  });

  it('trash 1 card, Navy Leader: the chosen opposing Character gets -6000', () => {
    const g = game(L11.koby);
    playRaw(g, DOLL);
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [FODDER]);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', N11.thatch)]);
    expect(g.power(chr(g, 'p2', N11.thatch))).toBe(2000);
    expect(trash(g)).toEqual([FODDER]);
    expect(hand(g)).toEqual([BLUE]);
  });

  it('may be declined: nothing is trashed and no power changes', () => {
    const g = game(L11.koby);
    playRaw(g, DOLL);
    need(g, 'optional', 'p1');
    no(g);
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toHaveLength(2);
    expect(g.power(chr(g, 'p2', N11.thatch))).toBe(8000);
  });

  it('offers only opposing Characters as targets', () => {
    const g = mine(
      L11.koby,
      { hand: [DOLL, FODDER], characters: [N11.navy3] },
      { characters: [N11.thatch, N11.sai] },
    );
    playRaw(g, DOLL);
    yes(g);
    payHand(g, [FODDER]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([N11.sai, N11.thatch].sort());
  });

  it('with a non-Navy Leader the target loses no power', () => {
    const g = game(L11.luffy);
    playRaw(g, DOLL);
    if (kind(g) === 'optional') {
      yes(g);
      if (kind(g) === 'choose') payHand(g, [FODDER]);
    }
    if (kind(g) === 'choose') none(g);
    expect(g.power(chr(g, 'p2', N11.thatch))).toBe(8000);
    expect(g.power(chr(g, 'p2', N11.sai))).toBe(4000);
  });

  it('with an empty hand the cost cannot be paid: no power loss', () => {
    const g = game(L11.koby, [DOLL]);
    playRaw(g, DOLL);
    unusable(g, 'p1');
    expect(g.power(chr(g, 'p2', N11.thatch))).toBe(8000);
  });

  it('a Character lowered to 0 or less stays on the field', () => {
    const g = game(L11.koby);
    playRaw(g, DOLL);
    yes(g);
    payHand(g, [FODDER]);
    pickInst(g, [chr(g, 'p2', N11.sai)]);
    expect(g.power(chr(g, 'p2', N11.sai))).toBeLessThanOrEqual(0);
    expect(ids(g, 'p2', 'characters')).toEqual([N11.sai, N11.thatch].sort());
  });

  it('the -6000 lasts this turn only', () => {
    const g = game(L11.koby);
    playRaw(g, DOLL);
    yes(g);
    payHand(g, [FODDER]);
    pickInst(g, [chr(g, 'p2', N11.thatch)]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p2', N11.thatch))).toBe(8000);
  });

  it('[Blocker]: Doll can block an attack on my Leader', () => {
    const g = theirs(L11.koby, { characters: [DOLL] }, { characters: [N11.marco] });
    attack(g, chr(g, 'p2', N11.marco), g.leader('p1'));
    expect(blockers(g)).toEqual([chr(g, 'p1', DOLL)]);
  });
});
