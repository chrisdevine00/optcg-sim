/**
 * OP16-029 Antlerkov (Character, Green, cost 2, 3000, Counter +2000, {Impel Down}, Ranged).
 *
 * Card text: "[When Attacking] If you have [Bunkov], play up to 1 Character card with a cost of 2 or
 * less from your hand."
 *
 * Rules: CR 10-2-5 ([When Attacking]), "if you have" checks my own field (active or rested),
 * playing by an effect pays no cost (CR 8-5-1), "up to 1" (CR 8-4-4-1). Scenery: OP16-025 Bunkov.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  charIds,
  describePartnerAttack,
  mine,
  kind,
  need,
  noDefence,
  OL,
  offeredIds,
  pickInst,
  restedChar,
} from './kit-op16a.ts';

const ANTLERKOV = 'OP16-029';
const BUNKOV = 'OP16-025';

describePartnerAttack({
  id: ANTLERKOV,
  partner: BUNKOV,
  board: (chars, hand, p2chars = []) =>
    mine(OL.luffy, { characters: chars, hand }, { characters: p2chars }),
});

describe('OP16-029 Antlerkov: further checks', () => {
  it('the played Character enters active and may not attack this turn', () => {
    const g = mine(OL.luffy, { characters: [ANTLERKOV, BUNKOV], hand: ['OP01-012'] });
    attack(g, at(g, 'p1', 'characters', ANTLERKOV), g.leader('p2'));
    pickInst(g, [g.find('p1', 'hand', 'OP01-012')]);
    noDefence(g);
    expect(restedChar(g, 'p1', 'OP01-012')).toBe(false);
    expect(
      g
        .legal()
        .some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', 'OP01-012')),
    ).toBe(false);
  });

  it('a played Character with its own [On Play] and cost 2 (OP16-037) is offered and played; its false condition asks nothing', () => {
    const g = mine(OL.luffy, { characters: [ANTLERKOV, BUNKOV], hand: ['OP16-037'] });
    attack(g, at(g, 'p1', 'characters', ANTLERKOV), g.leader('p2'));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual(['OP16-037']);
    pickInst(g, [g.find('p1', 'hand', 'OP16-037')]);
    expect(charIds(g, 'p1')).toEqual([ANTLERKOV, BUNKOV, 'OP16-037'].sort());
    expect(kind(g)).toBe('block');
  });
});
