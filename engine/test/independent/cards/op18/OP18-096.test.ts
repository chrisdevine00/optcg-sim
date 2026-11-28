/**
 * OP18-096 I'll Make the Call (Black Event, cost 1, {Celestial Dragons}/{Holy Knights of God}).
 *
 * Card text: "[Main] You may rest 3 of your DON!! cards: Play up to 1 {Holy Knights of God} type
 *             Character card with a cost of 6 or less from your trash.
 *             [Counter] If you have 10 or more cards in your trash, up to 1 of your Leader or
 *             Characters gains +4000 power during this battle."
 *
 * Reading: the Event is trashed first (CR 8-4-2), so it is already one of the cards in the trash
 * when the [Counter] condition is read (9 other cards + the Event = 10). The 3 DON!! are rested
 * as the cost, in addition to the Event's own cost 1. Printed cost on the card in the trash is
 * what the cost-6 limit reads.
 * Scenery: OP18-085 Cerberus (HKG, cost 1), OP18-088 Saint Sommers (HKG, cost 6; its [On Play]
 * needs 6 DON!! on the field, so tests keep fewer), OP18-119 Shamrock (HKG, cost 8), OP03-082
 * Kumadori (CP9, cost 4), OP02-060 Mohji, OP02-006 Kingdew (7000 attacker).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  at,
  attack,
  atMain,
  canCounterNow,
  cardIds,
  donOf,
  kind,
  mayChooseNone,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickCards,
  pickInst,
  play,
  unusable,
  yes,
  LDR,
  CH,
} from './kit-e.ts';
import { mineE, theirsE, X } from './kit-e.ts';

const EV = 'OP18-096';
const CERB = X.cerberus;
const SOMM = X.sommers;
const SHAM = X.shamrock;
const KUMA = X.cp4;
const MISS = 'OP02-060';

function main(trash: string[], don = { active: 4, rested: 0 }) {
  const g = mineE(LDR.luffy, { hand: [EV], trash, costArea: don });
  play(g, at(g, 'p1', 'hand', EV));
  return g;
}

describe('OP18-096 I’ll Make the Call: [Main] rest 3 DON!!: play up to 1 {Holy Knights of God} cost <= 6 from trash', () => {
  it('pays 3 DON!! (on top of the Event cost 1); only {HKG} Characters with cost <= 6 are offered; the pick is played', () => {
    const g = main([SHAM, CERB, KUMA, SOMM, MISS]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CERB, SOMM].sort());
    pickCards(g, [CERB]);
    expect(atMain(g, 'p1')).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([CERB]);
    expect(cardIds(g, 'p1', 'trash')).not.toContain(CERB);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 4 });
  });

  it('cost boundary: cost 6 (Sommers) is playable; cost 8 (Shamrock) is not offered', () => {
    const g = main([SHAM, SOMM]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SOMM]);
    pickCards(g, [SOMM]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SOMM]);
  });

  it('declining the cost: no DON!! rested beyond the Event cost and nothing is played', () => {
    const g = main([CERB]);
    expect(kind(g)).toBe('optional');
    act(g, { type: 'optional', accept: false });
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 1 });
  });

  it('"up to 1": after paying the cost the pick may be empty; the cost stays paid', () => {
    const g = main([CERB]);
    yes(g, 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(donOf(g, 'p1').rested).toBe(4);
  });

  it('the cost needs 3 DON!! still active after the Event cost: with 3 active in total it is unusable', () => {
    const g = main([CERB], { active: 3, rested: 0 });
    unusable(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('a {Holy Knights of God} Character that is not a Character card (an Event with the type) is not offered; only Characters', () => {
    const g = main(['OP18-095', 'OP18-096', MISS]);
    yes(g, 'p1');
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });
});

describe('OP18-096 I’ll Make the Call: [Counter] if you have 10 or more cards in your trash, +4000 power', () => {
  const T = (n: number) => Array.from({ length: n }, () => MISS);
  function defend(trash: string[]) {
    const g = theirsE(
      LDR.luffy,
      { hand: [EV], trash, costArea: { active: 3, rested: 0 } },
      { characters: [CH.kingdew5] },
    );
    attack(g, at(g, 'p2', 'characters', CH.kingdew5), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    return g;
  }

  it('with 10+ cards in the trash the Leader gains +4000 and survives a 7000 attack', () => {
    const g = defend(T(10));
    activateCounter(g, at(g, 'p1', 'hand', EV));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: 9 cards plus the Event itself (trashed first) make 10: the bonus applies', () => {
    const g = defend(T(9));
    activateCounter(g, at(g, 'p1', 'hand', EV));
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('boundary: 8 cards plus the Event is 9: no bonus, the attack connects', () => {
    const g = defend(T(8));
    activateCounter(g, at(g, 'p1', 'hand', EV));
    if (kind(g) === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('the bonus can go on a Character, and ends with the battle', () => {
    const g = theirsE(
      LDR.luffy,
      {
        hand: [EV],
        trash: T(10),
        characters: [{ card: CH.hajrudin4, rested: true }],
        costArea: { active: 3, rested: 0 },
      },
      { characters: [CH.kingdew5] },
    );
    const h = at(g, 'p1', 'characters', CH.hajrudin4);
    attack(g, at(g, 'p2', 'characters', CH.kingdew5), h);
    passBlock(g);
    activateCounter(g, at(g, 'p1', 'hand', EV));
    pickInst(g, [h]);
    expect(g.power(h)).toBe(10000);
    passCounter(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([CH.hajrudin4]);
    expect(g.power(h)).toBe(6000);
  });

  it('is only a [Counter]: the Event cannot be used from hand in the Counter Step when nothing is attacking', () => {
    const g = mineE(LDR.luffy, { hand: [EV], trash: T(10) });
    expect(kind(g)).toBe('main');
    expect(canCounterNow(g, at(g, 'p1', 'hand', EV))).toBe(false);
  });
});
