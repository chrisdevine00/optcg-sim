/**
 * OP18-091 Brogy (Black Character, cost 4, 5000, Counter +2000, {Giant}/{Elbaph}/{Giant Pirates}).
 *
 * Card text: "This Character gains +12 cost.
 *             [When Attacking] You may trash 1 card from your hand: Add up to 1 of your Character
 *             cards with a cost of 2 or less from your trash to your hand."
 *
 * Reading: the cost (1 hand card) is paid first, so a Character of cost 2 or less trashed as the
 * cost can itself be taken back. The cost is read on the card in the trash (printed cost; the +12
 * is a field effect), so Goldberg (printed 3) is not eligible. Only Character cards qualify.
 * Scenery: OP02-060 Mohji (cost 1), OP01-012 Sai (cost 2), OP01-023 Marco (cost 3), OP18-085
 * Cerberus (cost 1), OP18-086 Goldberg (cost 3), ST01-014 Guard Point (Event, cost 1).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  cardIds,
  decline,
  need,
  none,
  noDefence,
  offeredIds,
  passBlock,
  passCounter,
  payHand,
  pickCards,
  unusable,
  yes,
  mayChooseNone,
  atMain,
  LDR,
  CH,
} from './kit-e.ts';
import { mineE, X } from './kit-e.ts';

const B = X.brogy;
const MOHJI = 'OP02-060';
const SAI = 'OP01-012';
const MARCO = CH.marco3;
const GUARD = 'ST01-014';

function swing(p1: object = {}) {
  const g = mineE(LDR.luffy, {
    characters: [B],
    hand: [CH.kingdew5, MARCO],
    trash: [MOHJI, SAI, MARCO, X.goldberg, GUARD, X.cerberus],
    ...p1,
  });
  attack(g, at(g, 'p1', 'characters', B), g.leader('p2'));
  return g;
}

describe('OP18-091 Brogy: [When Attacking] trash 1 card: add up to 1 Character with cost 2 or less from trash to hand', () => {
  it('pays 1 hand card; only Characters of cost <= 2 in the trash are offered; the pick goes to hand', () => {
    const g = swing();
    yes(g, 'p1');
    payHand(g, [CH.kingdew5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MOHJI, SAI, X.cerberus].sort());
    pickCards(g, [SAI]);
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([MARCO, SAI].sort());
    expect(cardIds(g, 'p1', 'trash')).toContain(CH.kingdew5);
    expect(cardIds(g, 'p1', 'trash')).not.toContain(SAI);
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('boundary: cost 3 Characters (Marco, Goldberg) and an Event of cost 1 are not offered', () => {
    const g = swing();
    yes(g, 'p1');
    payHand(g, [CH.kingdew5]);
    const o = offeredIds(g);
    expect(o).not.toContain(MARCO);
    expect(o).not.toContain(X.goldberg);
    expect(o).not.toContain(GUARD);
    expect(o).toContain(SAI);
  });

  it('"up to 1": after paying the cost the pick may be empty; the cost is still paid', () => {
    const g = swing();
    yes(g, 'p1');
    payHand(g, [MARCO]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([CH.kingdew5]);
    expect(cardIds(g, 'p1', 'trash')).toHaveLength(7);
  });

  it('adds only one card even when several qualify', () => {
    const g = swing();
    yes(g, 'p1');
    payHand(g, [CH.kingdew5]);
    pickCards(g, [MOHJI]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
    expect(cardIds(g, 'p1', 'trash')).toContain(SAI);
  });

  it('declining the cost leaves hand and trash as they were', () => {
    const g = swing();
    decline(g);
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([CH.kingdew5, MARCO].sort());
    expect(cardIds(g, 'p1', 'trash')).toHaveLength(6);
  });

  it('the card trashed as the cost is already in the trash, so a cheap one can be taken straight back', () => {
    const g = swing({ hand: [SAI], trash: [] });
    yes(g, 'p1');
    payHand(g, [SAI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SAI]);
    pickCards(g, [SAI]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([SAI]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([]);
  });

  it('with an empty hand the cost cannot be paid: nothing is added', () => {
    const g = swing({ hand: [] });
    unusable(g, 'p1');
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    passBlock(g);
    passCounter(g);
  });

  it('does not fire when Brogy does not attack (an ordinary Main Phase offers no prompt)', () => {
    const g = mineE(LDR.luffy, { characters: [B], hand: [MARCO], trash: [MOHJI] });
    expect(atMain(g, 'p1')).toBe(true);
    expect(cardIds(g, 'p1', 'hand')).toEqual([MARCO]);
  });

  it('the cost is +12 on the field: 5000 power, cost 16', () => {
    const g = mineE(LDR.luffy, { characters: [B] });
    expect(g.card(at(g, 'p1', 'characters', B)).cost).toBe(16);
  });
});
