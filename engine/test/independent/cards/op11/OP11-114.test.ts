/**
 * OP11-114 Gum-Gum Fire-Fist Pistol Red Hawk (Event, Yellow, cost 1, {Straw Hat Crew}).
 *
 * Card text: "[Main] You may rest 3 of your DON!! cards: If you and your opponent have a total of 5 or
 * more Life cards, K.O. up to 1 of your opponent's Characters with a base cost of 5 or less.
 * [Counter] Up to 1 of your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1-4 (cost; unpaid = no effect), CR 8-3-2 (If checked on resolution; the cost stays
 * paid when the condition is false), CR 2-5 (only active DON!! can be rested), CR 8-4-4 ("up to").
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  at,
  attack,
  chars,
  cnt,
  dn,
  kind,
  LD11,
  mayChooseNone,
  me,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  passCounter,
  payDonIfAsked,
  pickInst,
  playRaw,
  SC11,
  them,
  trash,
  unusable,
  yes,
  many,
  lifeCards,
} from './kit-op11c.ts';

const ID = 'OP11-114';

function start(
  o: { p1Life?: number; p2Life?: number; active?: number; rested?: number; foe?: string[] } = {},
) {
  const g = me(
    LD11.plain,
    {
      hand: [ID],
      life: many(SC11.r1, o.p1Life ?? 1),
      costArea: { active: o.active ?? 5, rested: o.rested ?? 0 },
    },
    { life: many(SC11.r2, o.p2Life ?? 4), characters: o.foe ?? [SC11.r5, SC11.r6, SC11.r3] },
  );
  playRaw(g, ID);
  return g;
}

describe('OP11-114 Red Hawk [Main]: rest 3 DON!!, with 5+ total Life K.O. a Character of base cost 5 or less', () => {
  it('printed effect: pay 3 DON!!, 1 + 4 = 5 Life in total, K.O. the chosen cost-5 Character', () => {
    const g = start();
    yes(g, 'p1');
    payDonIfAsked(g, 3);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r5)]);
    expect(chars(g, 'p2')).toEqual([SC11.r3, SC11.r6].sort());
    expect(trash(g, 'p2')).toEqual([SC11.r5]);
    expect(kind(g)).toBe('main');
  });

  it('boundary: a total of 4 Life cards is not enough, but the DON!! cost has been paid', () => {
    const g = start({ p1Life: 0, p2Life: 4 });
    yes(g, 'p1');
    payDonIfAsked(g, 3);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(cnt(g, 'p2', 'characters')).toBe(3);
    expect(dn(g).rested).toBe(4);
  });

  it('the total counts both players: 2 of mine + 3 of theirs is 5', () => {
    const g = start({ p1Life: 2, p2Life: 3 });
    yes(g, 'p1');
    payDonIfAsked(g, 3);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r3)]);
    expect(cnt(g, 'p2', 'characters')).toBe(2);
  });

  it('the total counts my Life too: 0 of mine + 5 of theirs is 5, and 4 of mine + 0 of theirs is not', () => {
    const a = start({ p1Life: 0, p2Life: 5 });
    yes(a, 'p1');
    payDonIfAsked(a, 3);
    need(a, 'choose', 'p1');
    const b = start({ p1Life: 4, p2Life: 0 });
    yes(b, 'p1');
    payDonIfAsked(b, 3);
    if (kind(b) === 'choose') none(b);
    expect(cnt(b, 'p2', 'characters')).toBe(3);
  });

  it('base cost boundary: cost 5 and 3 are offered, cost 6 is not', () => {
    const g = start();
    yes(g, 'p1');
    payDonIfAsked(g, 3);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([SC11.r3, SC11.r5].sort());
  });

  it('"base cost": a printed cost-6 Character whose current cost was lowered to 2 is still not offered', () => {
    // ST06-008 Hina (Black, cost 3): "[On Play] Give up to 1 of your opponent's Characters −4 cost during this turn."
    const g = me(
      LD11.plain,
      { hand: ['ST06-008', ID], life: many(SC11.r1, 1), costArea: { active: 10, rested: 0 } },
      { life: many(SC11.r2, 4), characters: [SC11.r6, SC11.r5] },
    );
    playRaw(g, 'ST06-008');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r6)]);
    expect(g.card(at(g, 'p2', 'characters', SC11.r6)).cost).toBe(2);
    playRaw(g, ID);
    yes(g, 'p1');
    payDonIfAsked(g, 3);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC11.r5]);
  });

  it('"you may": declining rests no DON!! and K.O.s nothing', () => {
    const g = start();
    no(g, 'p1');
    expect(dn(g).rested).toBe(1);
    expect(cnt(g, 'p2', 'characters')).toBe(3);
  });

  it('"up to 1": after paying I may K.O. nobody', () => {
    const g = start();
    yes(g, 'p1');
    payDonIfAsked(g, 3);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cnt(g, 'p2', 'characters')).toBe(3);
  });

  it('unpayable: 3 active DON!! only (the Event costs 1): the 3 DON!! cannot be rested', () => {
    const g = start({ active: 3 });
    unusable(g, 'p1');
    expect(cnt(g, 'p2', 'characters')).toBe(3);
  });

  it('rested DON!! cannot pay: 2 active + 6 rested DON!! after the Event is played', () => {
    const g = start({ active: 3, rested: 6 });
    unusable(g, 'p1');
    expect(cnt(g, 'p2', 'characters')).toBe(3);
  });

  it('4 active DON!! is exactly enough (1 for the Event, 3 rested)', () => {
    const g = start({ active: 4 });
    yes(g, 'p1');
    payDonIfAsked(g, 3);
    need(g, 'choose', 'p1');
    expect(dn(g).active).toBe(0);
  });
});

describe('OP11-114 Red Hawk [Counter]: my Leader gains +3000 power during this battle', () => {
  function attacked() {
    const g = them(
      LD11.plain,
      { hand: [ID], costArea: { active: 1, rested: 0 }, characters: [SC11.r1] },
      { characters: [SC11.r5] },
    );
    attack(g, at(g, 'p2', 'characters', SC11.r5), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    return g;
  }

  it('printed effect: 8000 holds against 7000 and the boost is gone afterwards', () => {
    const g = attacked();
    activateCounter(g, at(g, 'p1', 'hand', ID));
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: g.leader('p1') });
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    expect(lifeCards(g)).toHaveLength(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only my Leader is a target, never a Character', () => {
    const g = attacked();
    activateCounter(g, at(g, 'p1', 'hand', ID));
    for (const a of g.legal()) if (a.type === 'pick') expect(a.choice).toBe(g.leader('p1'));
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: g.leader('p1') });
    expect(g.power(at(g, 'p1', 'characters', SC11.r1))).toBe(3000);
  });

  it('control: without it the same 7000 attack lands', () => {
    const g = attacked();
    passCounter(g);
    expect(cnt(g, 'p1', 'life')).toBe(3);
  });
});
