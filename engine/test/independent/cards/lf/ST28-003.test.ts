/**
 * ST28-003 Kin'emon (Character, Yellow, cost 4, 5000, Counter +2000, {Land of Wano}/{The Akazaya Nine}).
 *
 * Card text: (no main text)
 * [Trigger] If your Leader has the "Land of Wano" type and your opponent has 3 or less Life cards,
 * play this card.
 *
 * An activated [Trigger] whose condition fails sends the card to the trash (DECISIONS 2026-11-25).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  chars,
  declineTrigger,
  fill,
  hand,
  hitLeader,
  kind,
  mine,
  theirs,
  trash,
} from '../op17/kit-op17b.ts';
import { RED } from '../kit.ts';
import { LC, playRaw } from './kit-lfc.ts';

const KIN = 'ST28-003';

/** p1 defends with Kin'emon on top of its Life; p2 (the attacker) has `oppLife` Life cards. */
function hit(leader: string, oppLife: number) {
  const g = theirs(
    leader,
    { life: [KIN, BLUE, BLUE, BLUE], hand: [] },
    { life: fill(RED, oppLife), costArea: { active: 2, rested: 0 } },
  );
  hitLeader(g);
  return g;
}

describe('ST28-003 Kin\'emon: [Trigger] with a "Land of Wano" Leader and an opponent with 3 or less Life, play this card', () => {
  it('is offered as a [Trigger] when it is the Life card taken, and activating plays it (Wano Leader, opponent at 3 Life)', () => {
    const g = hit(LC.wano, 3);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(chars(g)).toEqual([KIN]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(g.life('p1')).toBe(3);
  });

  it('boundary: with the opponent at 4 Life the condition fails and the card is not played (it goes to the trash)', () => {
    const g = hit(LC.wano, 4);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([KIN]);
    expect(hand(g)).toEqual([]);
  });

  it('with the opponent at 1 Life ("3 or less") it is played', () => {
    const g = hit(LC.wano, 1);
    activateTrigger(g);
    expect(chars(g)).toEqual([KIN]);
  });

  it('with a Leader without the "Land of Wano" type the condition fails: not played, trashed', () => {
    const g = hit(LC.plain, 2);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([KIN]);
  });

  it('declining the [Trigger] adds the card to the hand as usual', () => {
    const g = hit(LC.wano, 3);
    declineTrigger(g);
    expect(hand(g)).toEqual([KIN]);
    expect(chars(g)).toEqual([]);
  });

  it('played from hand it has no effect: the main text is empty (no prompt, no Life check)', () => {
    const g = mine(
      LC.wano,
      { hand: [KIN], deck: fill(BLUE, 4), costArea: { active: 4, rested: 0 } },
      { life: fill(RED, 3) },
    );
    playRaw(g, KIN);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([KIN]);
  });

  it('the opponent life that counts is the attacker side: my own Life count does not matter', () => {
    // p1 has 4 Life (more than 3) and the opponent 3: the condition is on the opponent only.
    const g = hit(LC.wano, 3);
    activateTrigger(g);
    expect(chars(g)).toEqual([KIN]);
  });

  it('the condition is checked when the [Trigger] resolves, so it does not play at 5 Life either', () => {
    const g = hit(LC.wano, 5);
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
  });
});
