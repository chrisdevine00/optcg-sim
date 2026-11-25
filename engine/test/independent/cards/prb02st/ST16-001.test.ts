/**
 * ST16-001 Uta (Character, cost 4, 6000, no Counter, {FILM}, [Blocker]).
 *
 * Card text: "[Blocker] [Activate: Main] [Once Per Turn] You may trash 1 "FILM" type card from your hand:
 * Give up to 1 rested DON!! card to your Leader or 1 of your Characters."
 *
 * Rules: the text before the colon is the cost (CR 8-3): one card with the type "FILM" (alone or
 * among several types) trashed from the hand. Once Per Turn (CR 8-3-?). The effect gives a rested
 * DON!! card from the cost area to the target; it stays attached and gives +1000 power during its
 * owner's turn. "Up to 1" may be answered with nothing; the cost stays paid.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMainOf,
  branch,
  choices,
  donStr,
  hand,
  kind,
  kw,
  LDP,
  leadPow,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  payHand,
  pickInst,
  SP,
  toMyNextMain,
  trash,
  useAbility,
  decision,
} from './kit-prb02sta.ts';

const UT = 'ST16-001';
const HAND = [SP.filmChar, SP.filmCheap, SP.c1p3, SP.event];

function board(hnd: string[] = HAND, active = 4, rested = 6) {
  return mine(LDP.neutral, { characters: [UT, SP.c3p5], hand: hnd, costArea: { active, rested } });
}

describe('ST16-001 Uta: [Blocker]; [Activate: Main] [Once Per Turn] trash a "FILM" card: give 1 rested DON!!', () => {
  it('printed values: cost 4, 6000 power, no Counter, [Blocker]', () => {
    const g = board();
    const i = at(g, 'p1', 'characters', UT);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([4, 6000, null]);
    expect(kw(g, i)).toContain('Blocker');
  });

  it('the cost offers exactly the "FILM" type cards in hand (a card with several types counts), not other cards', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', UT));
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('cost');
    expect(offeredIds(g)).toEqual([SP.filmChar, SP.filmCheap].sort());
  });

  it('paying: the FILM card is trashed and 1 rested DON!! goes to the chosen Leader (+1000)', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', UT));
    payHand(g, [SP.filmChar]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(trash(g)).toEqual([SP.filmChar]);
    expect(hand(g)).toEqual([SP.filmCheap, SP.c1p3, SP.event].sort());
    expect(donStr(g, 'p1')).toBe('4/5/1');
    expect(leadPow(g)).toBe(6000);
    expect(atMainOf(g)).toBe(true);
  });

  it('the DON!! can go to a Character instead: it gets +1000 and the Leader does not', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', UT));
    payHand(g, [SP.filmCheap]);
    pickInst(g, [at(g, 'p1', 'characters', SP.c3p5)]);
    expect(g.power(at(g, 'p1', 'characters', SP.c3p5))).toBe(6000);
    expect(leadPow(g)).toBe(5000);
  });

  it('the target pick offers only my Leader and my Characters (Uta herself included)', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', UT));
    payHand(g, [SP.filmChar]);
    need(g, 'choose', 'p1');
    expect([...choices(g)].sort()).toEqual(
      [g.leader('p1'), at(g, 'p1', 'characters', UT), at(g, 'p1', 'characters', SP.c3p5)].sort(),
    );
  });

  it('only 1 DON!! is given', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', UT));
    payHand(g, [SP.filmChar]);
    pickInst(g, [g.leader('p1')]);
    expect(donStr(g, 'p1')).toBe('4/5/1');
    expect(atMainOf(g)).toBe(true);
  });

  it('[Once Per Turn]: after one use it is not offered again this turn', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', UT));
    payHand(g, [SP.filmChar]);
    pickInst(g, [g.leader('p1')]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', UT))).toEqual([]);
  });

  it('[Once Per Turn] resets: it is offered again on my next turn', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', UT));
    payHand(g, [SP.filmChar]);
    pickInst(g, [g.leader('p1')]);
    toMyNextMain(g);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', UT))).toHaveLength(1);
  });

  it('"up to 1": choosing nothing gives no DON!!, but the card stays trashed and the use is spent', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', UT));
    payHand(g, [SP.filmChar]);
    need(g, 'choose', 'p1');
    none(g);
    expect(donStr(g, 'p1')).toBe('4/6/0');
    expect(trash(g)).toEqual([SP.filmChar]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', UT))).toEqual([]);
  });

  it('no "FILM" card in hand: the cost cannot be paid and nothing is trashed or given', () => {
    const g = board([SP.c1p3, SP.event, SP.c5p7]);
    const probe = branch(g);
    const offered = offeredAbilities(probe, at(probe, 'p1', 'characters', UT)).length > 0;
    if (offered) {
      useAbility(probe, at(probe, 'p1', 'characters', UT));
      const d = decision(probe);
      expect(d?.kind).toBe('choose');
      expect(choices(probe)).toEqual([]);
    }
    expect(trash(g)).toEqual([]);
    expect(donStr(g, 'p1')).toBe('4/6/0');
    expect(kind(g)).toBe('main');
  });

  it('with no rested DON!! the effect has nothing to give (all DON!! active)', () => {
    const g = board(HAND, 10, 0);
    useAbility(g, at(g, 'p1', 'characters', UT));
    payHand(g, [SP.filmChar]);
    if (kind(g) === 'choose') none(g);
    expect(donStr(g, 'p1')).toBe('10/0/0');
    expect(trash(g)).toEqual([SP.filmChar]);
  });
});
