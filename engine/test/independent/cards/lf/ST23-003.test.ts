/**
 * ST23-003 Benn.Beckman (Character, Red, cost 4, 5000, Counter +1000, {Red-Haired Pirates}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: If your Leader has the "Red-Haired
 * Pirates" type, K.O. up to 1 of your opponent's Characters with 4000 base power or less."
 *
 * Rules: CR 8-3-1-4 (optional cost), an "If" after the colon is an effect condition (the cost is
 * still paid), base power ignores buffs and debuffs.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  canFinish,
  chars,
  choices,
  hand,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredAbilities,
  offeredIds,
  payHand,
  pickInst,
  playRaw,
  SL,
  trash,
  unusable,
  yes,
} from './kit-lfb.ts';

const ID = 'ST23-003';
const HONGO = 'OP09-011';
const FODDER = SL.c4;
const T4000 = SL.c2; // Sai: base 4000
const T3000 = SL.miss; // Mohji: base 3000
const T5000 = SL.former3; // Marco: base 5000

function play(leader: string, o: { hand?: string[]; theirs?: string[]; mine?: string[] } = {}) {
  const g = mine(
    leader,
    { hand: [ID, ...(o.hand ?? [FODDER])], characters: o.mine ?? [] },
    { characters: o.theirs ?? [T4000] },
  );
  playRaw(g, ID);
  return g;
}

describe('ST23-003 Benn.Beckman: [On Play] you may trash 1 card: if Red-Haired Pirates Leader, K.O. a 4000-base-power-or-less Character', () => {
  it('yes: trash 1 card, then K.O. the opposing Character (4000 power, the boundary)', () => {
    const g = play(LB.rhp);
    yes(g, 'p1');
    payHand(g, [FODDER]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', T4000)]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([T4000]);
    expect(trash(g)).toEqual([FODDER]);
    expect(hand(g)).toEqual([]);
  });

  it('cost boundary: 3000 and 4000 base power are offered, 5000 is not', () => {
    const g = play(LB.rhp, { theirs: [T3000, T4000, T5000] });
    yes(g, 'p1');
    payHand(g, [FODDER]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([T3000, T4000].sort());
  });

  it("only the opponent's Characters are candidates, not mine", () => {
    const g = play(LB.rhp, { mine: [SL.c1], theirs: [T4000] });
    yes(g, 'p1');
    payHand(g, [FODDER]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([g.find('p2', 'characters', T4000)]);
  });

  it('"up to 1": the K.O. may be skipped; the card stays trashed', () => {
    const g = play(LB.rhp);
    yes(g, 'p1');
    payHand(g, [FODDER]);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(trash(g)).toEqual([FODDER]);
  });

  it('it is base power: a 6000 Character lowered to 4000 is not a legal target', () => {
    const g = mine(LB.rhp, { hand: [ID, FODDER], characters: [HONGO] }, { characters: [SL.c4] });
    const hongo = at(g, 'p1', 'characters', HONGO);
    const [ability] = offeredAbilities(g, hongo);
    act(g, { type: 'activate', card: hongo, ability: ability! });
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', SL.c4)]);
    expect(g.power(g.find('p2', 'characters', SL.c4))).toBe(4000);
    playRaw(g, ID);
    yes(g, 'p1');
    payHand(g, [FODDER]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('declining ("you may"): nothing is trashed and nothing is K.O.d', () => {
    const g = play(LB.rhp);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([FODDER]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('with an empty hand the cost cannot be paid: no K.O.', () => {
    const g = play(LB.rhp, { hand: [] });
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('a Leader without the Red-Haired Pirates type: the cost may still be paid, but nothing is K.O.d', () => {
    const g = play(LB.luffy);
    yes(g, 'p1');
    payHand(g, [FODDER]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(trash(g)).toEqual([FODDER]);
  });

  it('the trash is exactly 1 card, chosen from the hand', () => {
    const g = play(LB.rhp, { hand: [FODDER, SL.c1] });
    yes(g, 'p1');
    payHand(g, [SL.c1]);
    expect(trash(g)).toEqual([SL.c1]);
    expect(hand(g)).toEqual([FODDER]);
    expect(chars(g)).toEqual([ID]);
  });
});
