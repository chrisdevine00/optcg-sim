/**
 * OP15-100 Kamakiri (Character, Yellow, cost 5, 6000, Counter +1000, {Sky Island}/{Shandian Warrior}).
 *
 * Card text: "[On Play] You may trash this Character and add 1 card from the top of your Life cards to your
 * hand: K.O. up to 1 of your opponent's Characters with a cost of 6 or less."
 *
 * Rules relied on: CR 8-3-1 / RD 120 (a cost that cannot be paid cannot be paid at all; paid costs stay
 * paid when the effect finds no target), RL-15 (trash is not a K.O.), RD 104 (Life moved outside damage
 * never activates [Trigger]), "up to" may choose nothing, K.O. on a Character that is not the controller's.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  BLUE,
  chars,
  choices,
  hand,
  kind,
  LD15,
  lifeCards,
  mayChooseNone,
  mine,
  need,
  no,
  offeredIds,
  pickCards,
  playIt,
  reachablePickSets,
  SC15,
  skipChoice,
  trash,
  unusable,
  yes,
} from './kit-op15c.ts';

const KAM = 'OP15-100';

function start(o: { life?: string[]; p2?: string[]; mine?: string[]; leader?: string } = {}) {
  const g = mine(
    o.leader ?? LD15.sky,
    {
      hand: [KAM],
      characters: o.mine ?? [],
      ...(o.life ? { life: o.life } : {}),
    },
    { characters: o.p2 ?? [SC15.red4, SC15.red6, SC15.red7] },
  );
  playIt(g, KAM);
  return g;
}

describe('OP15-100 Kamakiri [On Play]', () => {
  it('is a "you may" cost: it is asked and can be used (Life cards are available)', () => {
    const g = start();
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
  });

  it('yes: Kamakiri is trashed, the top Life card goes to hand, and a cost-6 Character is K.O.’d', () => {
    const g = start();
    yes(g, 'p1');
    pickCards(g, [SC15.red6]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([KAM]);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([BLUE]);
    expect(trash(g, 'p2')).toEqual([SC15.red6]);
  });

  it('boundary: cost 6 is offered, cost 7 is not (and the cost-4 Character is)', () => {
    const g = start();
    yes(g, 'p1');
    expect(offeredIds(g)).toEqual([SC15.red4, SC15.red6].sort());
  });

  it('only the opponent’s Characters can be K.O.’d, not mine', () => {
    const g = start({ mine: [SC15.red2] });
    yes(g, 'p1');
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SC15.red2));
    expect(offeredIds(g)).toEqual([SC15.red4, SC15.red6].sort());
  });

  it('declining the cost: Kamakiri stays on the field, Life and the opponent’s board are untouched', () => {
    const g = start();
    no(g, 'p1');
    expect(chars(g)).toEqual([KAM]);
    expect(g.life('p1')).toBe(4);
    expect(trash(g, 'p2')).toEqual([]);
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": after paying I may choose no target; the cost stays paid', () => {
    const g = start();
    yes(g, 'p1');
    expect(mayChooseNone(g)).toBe(true);
    skipChoice(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([KAM]);
    expect(g.life('p1')).toBe(3);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('with 0 Life cards the cost cannot be paid: the effect is not usable and Kamakiri stays', () => {
    const g = start({ life: [] });
    unusable(g, 'p1');
    expect(chars(g)).toEqual([KAM]);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('the Life card taken is the top one and a [Trigger] on it does not activate', () => {
    const g = start({ life: [SC15.speed, BLUE, BLUE, BLUE] });
    yes(g, 'p1');
    pickCards(g, [SC15.red4]);
    expect(hand(g)).toEqual([SC15.speed]);
    expect(chars(g)).toEqual([]);
    expect(lifeCards(g)).toEqual([BLUE, BLUE, BLUE]);
  });

  it('at most one Character is K.O.’d even when two qualify', () => {
    const g = start();
    yes(g, 'p1');
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('trashing Kamakiri itself is not an opponent’s removal: with OP15-098 as Leader no replacement is offered', () => {
    const g = start({ leader: LD15.skyShc });
    yes(g, 'p1');
    expect(kind(g)).toBe('choose');
    pickCards(g, [SC15.red6]);
    expect(trash(g)).toEqual([KAM]);
    expect(atMain(g)).toBe(true);
  });
});
