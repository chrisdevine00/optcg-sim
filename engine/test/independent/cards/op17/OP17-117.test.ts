/**
 * OP17-117 Maser Saber (Event, Yellow, cost 1, {The Four Emperors}/{Big Mom Pirates}).
 *
 * Card text: "[Counter] Up to 1 of your [Charlotte Linlin] gains +3000 power during this battle.
 * [Trigger] Your opponent may trash 3 cards from their hand. If they do not, K.O. up to 1 of your
 * opponent's Characters with a cost of 6 or less."
 *
 * Reading (M6b-Q14, proposed): the opponent decides before the target is picked; with fewer than 3
 * cards they cannot trash, so the K.O. happens. Rules: CR 8-1-2 ("may"), CR 8-3-1-3 / RD 120 (a
 * cost that cannot be paid), CR 10-1-5 ([Trigger]; the Event is trashed afterwards), CR 8-4-4-1
 * ("up to"), CR 2-1-2 ([Name]), RL-08.
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  activateTrigger,
  act,
  at,
  attack,
  BLUE,
  choices,
  declineTrigger,
  decision,
  fill,
  hand,
  hitLeader,
  kind,
  LD,
  lifeCards,
  mayChooseNone,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickCards,
  pickInst,
  RED,
  SCN,
  side,
  theirs,
  theirTurn,
  trash,
  cardIds,
} from './kit-op17b.ts';

const EVENT = 'OP17-117';
const TRASH3 = { option: '0' }; // "Trash 3 cards from your hand"
const NO_TRASH = { option: '1' }; // "Do not trash: ... K.O. up to 1 ... cost 6 or less"
const LINLIN_CHAR = 'ST34-004'; // Purple Character named [Charlotte Linlin] ([On Play] only)

function hit(p2hand: string[], p2chars: string[] = [SCN.c5, SCN.c7]) {
  const g = theirs(
    LD.bmp,
    { life: [EVENT, ...fill(BLUE, 3)] },
    { hand: p2hand, characters: p2chars },
  );
  hitLeader(g);
  return g;
}

describe('OP17-117 Maser Saber [Trigger]: the opponent may trash 3 cards; if not, K.O. up to 1 cost-6-or-less Character', () => {
  it("the OPPONENT decides: choosing to trash 3 trashes 3 of their own cards and nothing is K.O.'d", () => {
    const g = hit([SCN.c2, SCN.c3, SCN.c4, SCN.c5]);
    activateTrigger(g);
    need(g, 'choose', 'p2');
    expect(decision(g)?.purpose).toBe('mode');
    act(g, { type: 'pick', choice: TRASH3 });
    need(g, 'choose', 'p2');
    pickCards(g, [SCN.c2, SCN.c3, SCN.c4]);
    expect(trash(g, 'p2')).toEqual([SCN.c2, SCN.c3, SCN.c4].sort());
    expect(hand(g, 'p2')).toEqual([SCN.c5]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(g.eventsOfType('KO')).toHaveLength(0);
  });

  it("choosing not to trash: I K.O. the cost-6-or-less Character of my choice, and the opponent's hand is untouched", () => {
    const g = hit([SCN.c2, SCN.c3, SCN.c4]);
    activateTrigger(g);
    act(g, { type: 'pick', choice: NO_TRASH });
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c5]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c7]);
    expect(trash(g, 'p2')).toEqual([SCN.c5]);
    expect(hand(g, 'p2')).toEqual([SCN.c2, SCN.c3, SCN.c4].sort());
  });

  it('boundary: only a cost-6-or-less Character is a K.O. candidate (cost 7 is not)', () => {
    const g = hit([SCN.c2, SCN.c3, SCN.c4], [SCN.c6, SCN.c7]);
    activateTrigger(g);
    act(g, { type: 'pick', choice: NO_TRASH });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c6]);
  });

  it('"up to 1": when the opponent declines to trash, I may still choose no Character', () => {
    const g = hit([SCN.c2, SCN.c3, SCN.c4]);
    activateTrigger(g);
    act(g, { type: 'pick', choice: NO_TRASH });
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('with fewer than 3 cards in hand the opponent cannot trash 3: they may not choose it and the K.O. happens', () => {
    const g = hit([SCN.c2, SCN.c3]);
    activateTrigger(g);
    if (decision(g)?.player === 'p2' && kind(g) === 'choose') {
      expect(
        g
          .legal()
          .some((a) => a.type === 'pick' && JSON.stringify(a.choice) === JSON.stringify(TRASH3)),
      ).toBe(false);
      act(g, { type: 'pick', choice: NO_TRASH });
    }
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c5]);
    expect(trash(g, 'p2')).toEqual([SCN.c5]);
    expect(hand(g, 'p2')).toEqual([SCN.c2, SCN.c3].sort());
  });

  it('with exactly 3 cards in hand (boundary) trashing is possible and empties the hand', () => {
    const g = hit([SCN.c2, SCN.c3, SCN.c4]);
    activateTrigger(g);
    act(g, { type: 'pick', choice: TRASH3 });
    pickCards(g, [SCN.c2, SCN.c3, SCN.c4]);
    expect(hand(g, 'p2')).toEqual([]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('the Event goes to the trash after the [Trigger] resolves (it is not added to hand)', () => {
    const g = hit([SCN.c2, SCN.c3, SCN.c4]);
    activateTrigger(g);
    act(g, { type: 'pick', choice: NO_TRASH });
    none(g);
    expect(trash(g)).toEqual([EVENT]);
    expect(hand(g)).toEqual([]);
    expect(lifeCards(g)).toHaveLength(3);
  });

  it('declining the [Trigger]: the Event goes to my hand and nothing else happens', () => {
    const g = hit([SCN.c2, SCN.c3, SCN.c4]);
    declineTrigger(g);
    expect(hand(g)).toEqual([EVENT]);
    expect(trash(g, 'p2')).toEqual([]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it("only opposing Characters can be K.O.'d (not mine)", () => {
    const g = theirs(
      LD.bmp,
      { life: [EVENT, ...fill(BLUE, 3)], characters: [SCN.c2] },
      { hand: [SCN.c3, SCN.c4, SCN.c5], characters: [SCN.c5] },
    );
    hitLeader(g);
    activateTrigger(g);
    act(g, { type: 'pick', choice: NO_TRASH });
    expect(offeredIds(g)).toEqual([SCN.c5]);
    expect(choices(g)).not.toContain(g.leader('p1'));
  });
});

describe('OP17-117 Maser Saber [Counter]: up to 1 of my [Charlotte Linlin] +3000 during this battle', () => {
  function counterStep(leader: string, chars: string[] = []) {
    const g = theirTurn(
      side(leader, BLUE, { hand: [EVENT], characters: chars, costArea: { active: 1, rested: 0 } }),
      side(LD.luffy, RED, { costArea: { active: 10, rested: 0 } }),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('boosts my [Charlotte Linlin] Leader by 3000 for the battle only (5000 -> 8000)', () => {
    const g = counterStep(LD.linlin);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a [Charlotte Linlin] Character is a target; other Characters and other Leaders are not', () => {
    const g = counterStep(LD.bmp, [LINLIN_CHAR, SCN.c3]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    need(g, 'choose');
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).toEqual([LINLIN_CHAR]);
    pickCards(g, [LINLIN_CHAR]);
    expect(g.power(at(g, 'p1', 'characters', LINLIN_CHAR))).toBe(15000);
  });

  it('"up to 1": the target may be skipped', () => {
    const g = counterStep(LD.linlin);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
