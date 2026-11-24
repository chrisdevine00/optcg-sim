/**
 * OP16-025 Bunkov (Character, Green, cost 2, 3000, Counter +2000, {Impel Down}, Strike).
 *
 * Card text: "[When Attacking] If you have [Antlerkov], play up to 1 Character card with a cost of 2 or
 * less from your hand."
 *
 * Rules: CR 10-2-5 ([When Attacking]), "if you have" checks my own field (active or rested),
 * playing by an effect pays no cost (CR 8-5-1), "up to 1" (CR 8-4-4-1). Scenery: OP16-029 Antlerkov.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  describePartnerAttack,
  mine,
  OL,
  charIds,
  noDefence,
  pickInst,
  need,
  offeredIds,
} from './kit-op16a.ts';

const BUNKOV = 'OP16-025';
const ANTLERKOV = 'OP16-029';

describePartnerAttack({
  id: BUNKOV,
  partner: ANTLERKOV,
  board: (chars, hand, p2chars = []) =>
    mine(OL.luffy, { characters: chars, hand }, { characters: p2chars }),
});

describe('OP16-025 Bunkov: further checks', () => {
  it('works when attacking a rested opposing Character as well as the Leader', () => {
    const g = mine(
      OL.luffy,
      { characters: [BUNKOV, ANTLERKOV], hand: ['OP01-012'] },
      { characters: [{ card: 'OP01-018', rested: true }] },
    );
    attack(g, at(g, 'p1', 'characters', BUNKOV), at(g, 'p2', 'characters', 'OP01-018'));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual(['OP01-012']);
    pickInst(g, [g.find('p1', 'hand', 'OP01-012')]);
    noDefence(g);
    expect(charIds(g, 'p1')).toEqual([ANTLERKOV, BUNKOV, 'OP01-012'].sort());
  });
});
