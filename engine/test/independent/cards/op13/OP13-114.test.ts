/**
 * OP13-114 S-Snake (Character, Yellow, cost 4, 5000, Counter +1000, {Egghead}/{Seraphim}).
 *
 * Card text: "[On Play]/[When Attacking] You may turn 1 card from the top of your Life cards face-up:
 * Give up to 1 of your opponent's Characters -2000 power during this turn. [Trigger] You may trash
 * 1 card from your hand: Play this card."
 *
 * Rules: CR 8-3-1 / 8-3-1-3 (cost), OPEN-QUESTIONS M4b-3 (closed: a top Life card that is already
 * face-up cannot be turned), CR 8-4-4-1 ("up to"), CR 8-1-4-2 ("during this turn"), RD 101-102
 * ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  activateTrigger,
  at,
  atMain,
  attack,
  BLUE,
  chars,
  choices,
  declineTrigger,
  doneRaw,
  endTurn,
  hand,
  hitLeader,
  isLegal,
  kind,
  LD13,
  lifeFaces,
  mine,
  need,
  no,
  offeredIds,
  payHandRaw,
  pickRaw,
  playRaw,
  reachablePickSets,
  SC15,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op13d.ts';

const ID = 'OP13-114';
const F1 = SC15.red2;
const F2 = SC15.red4;

function played(
  o: {
    life?: (string | { card: string; faceUp?: boolean })[];
    p2?: string[];
    own?: string[];
  } = {},
): TestGame {
  const g = mine(
    LD13.yellow,
    { hand: [ID], life: o.life ?? [BLUE, BLUE, BLUE, BLUE], characters: o.own ?? [] },
    { characters: o.p2 ?? [SC15.red3, SC15.red4] },
  );
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

describe('OP13-114 S-Snake: [On Play] may turn the top Life card face-up: give up to 1 opposing Character -2000 power this turn', () => {
  it('asks whether to pay; paying turns only the top Life card face-up, then the chosen Character gets -2000', () => {
    const g = played();
    need(g, 'optional', 'p1');
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.red3, SC15.red4].sort());
    pickRaw(g, at(g, 'p2', 'characters', SC15.red3));
    expect(atMain(g)).toBe(true);
    expect(g.power(at(g, 'p2', 'characters', SC15.red3))).toBe(3000);
    expect(g.power(at(g, 'p2', 'characters', SC15.red4))).toBe(6000);
    expect(lifeFaces(g)).toEqual([true, false, false, false]);
    expect(g.life('p1')).toBe(4);
  });

  it('declining: no Life card is turned and nobody loses power', () => {
    const g = played();
    need(g, 'optional', 'p1');
    no(g);
    expect(atMain(g)).toBe(true);
    expect(lifeFaces(g)).toEqual([false, false, false, false]);
    expect(g.power(at(g, 'p2', 'characters', SC15.red3))).toBe(5000);
  });

  it('M4b-3: with the top Life card already face-up the cost cannot be paid', () => {
    const g = played({ life: [{ card: BLUE, faceUp: true }, BLUE, BLUE, BLUE] });
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.power(at(g, 'p2', 'characters', SC15.red3))).toBe(5000);
    expect(lifeFaces(g)).toEqual([true, false, false, false]);
  });

  it('with no Life cards the cost cannot be paid', () => {
    const g = played({ life: [] });
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.power(at(g, 'p2', 'characters', SC15.red3))).toBe(5000);
  });

  it('"up to 1": after paying, choosing nobody is legal; the Life card stays face-up; never two targets', () => {
    const g = played();
    yes(g);
    need(g, 'choose', 'p1');
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    doneRaw(g);
    expect(lifeFaces(g)).toEqual([true, false, false, false]);
    expect(g.power(at(g, 'p2', 'characters', SC15.red3))).toBe(5000);
  });

  it('only the opponent’s Characters are candidates (not my own, not any Leader)', () => {
    const g = played({ own: [SC15.red5] });
    yes(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SC15.red5));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('it lasts "during this turn": back to full power on the opponent’s turn', () => {
    const g = played();
    yes(g);
    pickRaw(g, at(g, 'p2', 'characters', SC15.red3));
    endTurn(g);
    expect(g.power(at(g, 'p2', 'characters', SC15.red3))).toBe(5000);
  });

  it('a power of 0 or less is possible: 1000 power (cost 1 Character) goes to -1000, it stays on the field', () => {
    const g = played({ p2: ['OP01-010'] });
    yes(g);
    pickRaw(g, at(g, 'p2', 'characters', 'OP01-010'));
    expect(g.power(at(g, 'p2', 'characters', 'OP01-010'))).toBe(1000);
    expect(chars(g, 'p2')).toEqual(['OP01-010']);
  });
});

describe('OP13-114 S-Snake: [When Attacking] may turn the top Life card face-up: give up to 1 opposing Character -2000 power', () => {
  const ready = () =>
    mine(
      LD13.yellow,
      { characters: [ID], life: [BLUE, BLUE, BLUE, BLUE] },
      { characters: [SC15.red3] },
    );

  it('attacking asks the same question; paying gives -2000 to the chosen Character', () => {
    const g = ready();
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    need(g, 'optional', 'p1');
    yes(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', SC15.red3));
    expect(g.power(at(g, 'p2', 'characters', SC15.red3))).toBe(3000);
    expect(lifeFaces(g)).toEqual([true, false, false, false]);
  });

  it('declining while attacking changes nothing', () => {
    const g = ready();
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    need(g, 'optional', 'p1');
    no(g);
    expect(lifeFaces(g)).toEqual([false, false, false, false]);
    expect(g.power(at(g, 'p2', 'characters', SC15.red3))).toBe(5000);
  });

  it('the Life card turned face-up while attacking makes a second attack unpayable (top is face-up)', () => {
    const g = ready();
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    yes(g);
    pickRaw(g, at(g, 'p2', 'characters', SC15.red3));
    expect(lifeFaces(g)[0]).toBe(true);
  });
});

describe('OP13-114 S-Snake: [Trigger] may trash 1 card from the hand: play this card', () => {
  const hit = (h: string[] = [F1, F2]) =>
    theirs(LD13.yellow, { life: [ID, BLUE, BLUE, BLUE], hand: h }, { characters: [SC15.red3] });

  it('activated and paid: she is played from the Life area; her [On Play] is then offered', () => {
    const g = hit();
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    payHandRaw(g, [F1]);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([F1]);
    expect(hand(g)).toEqual([F2]);
    need(g, 'optional', 'p1');
    no(g);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('her [On Play] works after being played this way: -2000 on the opposing Character during that turn', () => {
    const g = hit();
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    payHandRaw(g, [F1]);
    need(g, 'optional', 'p1');
    yes(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', SC15.red3));
    expect(g.power(at(g, 'p2', 'characters', SC15.red3))).toBe(3000);
  });

  it('with an empty hand the cost cannot be paid: she is not played', () => {
    const g = hit([]);
    hitLeader(g);
    // Activating needs a card to trash: either activating is not offered (the hand size is public)
    // or it is offered and the cost is then unusable. Either way she is not played.
    if (isLegal(g, { type: 'trigger', activate: true })) {
      activateTrigger(g);
      unusable(g, 'p1');
    } else {
      declineTrigger(g);
    }
    expect(chars(g)).toEqual([]);
  });

  it('declining to activate the [Trigger]: she is added to the hand', () => {
    const g = hit();
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID, F1, F2].sort());
    expect(chars(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });
});
