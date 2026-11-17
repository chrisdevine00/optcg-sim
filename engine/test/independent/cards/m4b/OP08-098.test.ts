/**
 * OP08-098 Kalgara (Leader, Yellow, 5000, 5 Life, {Sky Island}/{Shandian Warrior}/{Jaya}).
 *
 * Card text: "[DON!! x1] [When Attacking] Play up to 1 {Shandian Warrior} type Character card from your
 * hand with a cost equal to or less than the number of DON!! cards on your field. If you do, add 1
 * card from the top of your Life cards to your hand."
 *
 * Rulings: RL-48 (usable at 0 Life: the play still happens, the Life part does nothing; "DON!! cards on
 * your field" counts the cost area, active and rested, plus DON!! given to cards; "if you do" needs the
 * play; taking Life is not damage, so no [Trigger] and no defeat).
 * Rules: CR 8-3-2-3 ([DON!! x1] needs 1 DON!! given to this card), CR 3-7-4 (summoning sickness).
 */
import { describe, expect, it } from 'vitest';
import { attack, canAttack, noDefence } from '../../helpers.ts';
import {
  BLUE,
  chars,
  chooseCards,
  chooseNone,
  choiceCards,
  hand,
  kind,
  lifeCards,
  mine,
  SC,
  settleYes,
  YL,
} from './kit-a.ts';

const HAND = [SC.genbo, SC.seto, SC.bobbin, SC.kalgara6]; // costs 3, 5, 2 (not Shandian), 6

function attacking(o: {
  given?: number;
  active?: number;
  rested?: number;
  handCards?: string[];
  life?: string[];
}) {
  const g = mine(
    { card: YL.shandian, don: o.given ?? 1 },
    {
      hand: o.handCards ?? HAND,
      costArea: { active: o.active ?? 3, rested: o.rested ?? 0 },
      life: o.life ?? [SC.speed, BLUE, BLUE, BLUE],
    },
  );
  attack(g, g.leader('p1'), g.leader('p2'));
  return g;
}

describe('OP08-098 Kalgara: [DON!! x1] [When Attacking] play a {Shandian Warrior} Character, if you do add 1 Life card to hand', () => {
  it('candidates: {Shandian Warrior} Characters in hand with cost <= DON!! on the field (1 given + 3 active = 4)', () => {
    const g = attacking({});
    expect(kind(g)).toBe('choose');
    // Genbo (3) qualifies; Seto (5) and Kalgara (6) cost too much; Bobbin is not a Shandian Warrior.
    expect(choiceCards(g)).toEqual([SC.genbo]);
  });

  it('playing it puts the Character on the field, then the top Life card goes to hand ("if you do")', () => {
    const g = attacking({});
    chooseCards(g, [SC.genbo]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([SC.genbo]);
    expect(hand(g)).toEqual([SC.bobbin, SC.kalgara6, SC.seto, SC.speed].sort());
    expect(lifeCards(g)).toEqual([BLUE, BLUE, BLUE]);
  });

  it('RL-48: a Life card with [Trigger] taken this way is just added to hand: no [Trigger] decision', () => {
    const g = attacking({});
    chooseCards(g, [SC.genbo]);
    settleYes(g, 'p1');
    expect(hand(g)).toContain(SC.speed);
    expect(chars(g)).toEqual([SC.genbo]);
  });

  it('RL-48: DON!! on the field counts rested DON!! and given DON!!: 1 given + 3 rested + 1 active = 5 allows Seto (cost 5)', () => {
    const g = attacking({ given: 1, active: 1, rested: 3 });
    expect(choiceCards(g).sort()).toEqual([SC.genbo, SC.seto].sort());
  });

  it('boundary: cost equal to the DON!! count qualifies, one more does not (4 DON!!: Genbo yes, Seto no)', () => {
    const g = attacking({ given: 1, active: 3 });
    expect(choiceCards(g)).toEqual([SC.genbo]);
  });

  it('"up to 1": may play nothing, and then no Life card is added', () => {
    const g = attacking({});
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(lifeCards(g)).toHaveLength(4);
    expect(hand(g)).toHaveLength(4);
  });

  it('"if you do": with no playable card nothing happens and no Life card is added', () => {
    const g = attacking({ handCards: [SC.seto, SC.bobbin] });
    if (kind(g) === 'choose') chooseNone(g);
    settleYes(g, 'p1');
    expect(lifeCards(g)).toHaveLength(4);
    expect(chars(g)).toEqual([]);
  });

  it('RL-48: at 0 Life the Character is still played and the Life part does nothing (no defeat)', () => {
    const g = attacking({ life: [] });
    chooseCards(g, [SC.genbo]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([SC.genbo]);
    expect(g.life('p1')).toBe(0);
    noDefence(g);
    expect(kind(g)).toBe('main');
  });

  it('[DON!! x1]: with no DON!! given to the Leader the ability does not activate', () => {
    const g = attacking({ given: 0, active: 4 });
    // The attack proceeds straight to the defender's Block Step or beyond: no choice for p1.
    expect(kind(g)).not.toBe('choose');
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([]);
    expect(lifeCards(g)).toHaveLength(4);
  });

  it('the Character played by the effect cannot attack this turn (no [Rush])', () => {
    const g = attacking({});
    chooseCards(g, [SC.genbo]);
    settleYes(g, 'p1');
    noDefence(g);
    expect(kind(g)).toBe('main');
    expect(canAttack(g, g.find('p1', 'characters', SC.genbo), g.leader('p2'))).toBe(false);
  });
});
