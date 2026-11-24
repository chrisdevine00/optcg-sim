/**
 * OP17-101 Caribou (Character, Yellow, cost 5, 6000, Counter +1000, {Supernovas}/{Caribou Pirates}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may add 1 card from the top of your Life cards to
 * your hand: Give up to 1 of your opponent's Characters −3000 power during this turn.
 * [Trigger] You may trash 1 card from your hand: K.O. up to 1 of your opponent's Characters with a
 * cost of 5 or less."
 *
 * Rules: CR 8-3-1-3 (cost), CR 10-2-13 ([Once Per Turn]), RD 104 (moving Life by an effect never
 * activates [Trigger]), CR 10-1-5 / RD 101-102 ([Trigger]; the card is in no area, then trashed),
 * CR 6-6-1-3 ("during this turn"), CR 1-3-6-1 (negative power is allowed).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  activateTrigger,
  BLUE,
  chars,
  cardIds,
  declineTrigger,
  fill,
  hand,
  hitLeader,
  kind,
  LD,
  lifeCards,
  mine,
  mayChooseNone,
  need,
  none,
  offeredAbilities,
  offeredIds,
  payHand,
  pickCards,
  SCN,
  theirs,
  toMyNextMain,
  trash,
  useAbility,
  choices,
  isLegal,
} from './kit-op17b.ts';

const CARIBOU = 'OP17-101';
const WHO = 'OP17-071'; // a Life card with a [Trigger]; moving it to hand must not activate it

function board(life: string[] = fill(BLUE, 3), opp: string[] = [SCN.c4]) {
  return mine(LD.bmp, { characters: [CARIBOU], life }, { characters: opp });
}

describe('OP17-101 Caribou: [Activate: Main] [Once Per Turn] Life to hand: opposing Character -3000', () => {
  it('adds the top Life card to my hand and gives the chosen opposing Character -3000 this turn', () => {
    const g = board([SCN.c8, BLUE, BLUE]);
    useAbility(g, at(g, 'p1', 'characters', CARIBOU));
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c4]);
    expect(atMain(g)).toBe(true);
    expect(g.life('p1')).toBe(2);
    expect(hand(g)).toEqual([SCN.c8]);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(3000);
  });

  it('the penalty lasts this turn only', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', CARIBOU));
    pickCards(g, [SCN.c4]);
    toMyNextMain(g);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });

  it('the cost is the TOP Life card only, exactly 1', () => {
    const g = board([SCN.c8, SCN.c7, BLUE]);
    useAbility(g, at(g, 'p1', 'characters', CARIBOU));
    pickCards(g, [SCN.c4]);
    expect(lifeCards(g)).toEqual([SCN.c7, BLUE]);
    expect(hand(g)).toEqual([SCN.c8]);
  });

  it('"up to 1": after paying the Life cost the target may be skipped (the card stays in hand)', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', CARIBOU));
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.life('p1')).toBe(2);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });

  it('only opposing Characters are candidates (no Leader, none of mine)', () => {
    const g = mine(
      LD.bmp,
      { characters: [CARIBOU, SCN.c2], life: fill(BLUE, 3) },
      { characters: [SCN.c4] },
    );
    useAbility(g, at(g, 'p1', 'characters', CARIBOU));
    expect(offeredIds(g)).toEqual([SCN.c4]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('with 0 Life the cost cannot be paid: the ability is not usable', () => {
    const g = board([]);
    const c = at(g, 'p1', 'characters', CARIBOU);
    if (offeredAbilities(g, c).length) {
      useAbility(g, c);
      expect(kind(g)).not.toBe('choose');
    }
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
    expect(hand(g)).toEqual([]);
  });

  it('[Once Per Turn]: not offered a second time', () => {
    const g = board();
    const c = at(g, 'p1', 'characters', CARIBOU);
    useAbility(g, c);
    pickCards(g, [SCN.c4]);
    expect(offeredAbilities(g, c)).toHaveLength(0);
    expect(g.life('p1')).toBe(2);
  });

  it('RD 104: a Life card with a [Trigger] moved to hand by the cost does not activate its [Trigger]', () => {
    const g = board([WHO, BLUE, BLUE]);
    useAbility(g, at(g, 'p1', 'characters', CARIBOU));
    expect(kind(g)).toBe('choose');
    pickCards(g, [SCN.c4]);
    expect(hand(g)).toEqual([WHO]);
    expect(chars(g)).toEqual([CARIBOU]);
  });
});

describe('OP17-101 Caribou: [Trigger] trash 1 card from hand: K.O. up to 1 opposing Character with cost 5 or less', () => {
  function hit(handCards: string[], opp: string[] = [SCN.c5, SCN.c6]) {
    const g = theirs(
      LD.bmp,
      { life: [CARIBOU, ...fill(BLUE, 3)], hand: handCards },
      { characters: opp },
    );
    hitLeader(g);
    return g;
  }

  it('activating: trash 1 card from hand, then K.O. a cost-5 Character; Caribou itself is trashed afterwards', () => {
    const g = hit([SCN.c2, BLUE]);
    need(g, 'trigger', 'p1');
    expect(isLegal(g, { type: 'trigger', activate: true })).toBe(true);
    activateTrigger(g);
    payHand(g, [SCN.c2]); // activating the [Trigger] is choosing to pay: no separate "use?" question
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c5]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(cardIds(g, 'p2', 'trash')).toEqual([SCN.c5]);
    expect(trash(g).sort()).toEqual([CARIBOU, SCN.c2].sort());
  });

  it('boundary: only cost 5 or less is a candidate (cost 6 is not)', () => {
    const g = hit([SCN.c2]);
    activateTrigger(g);
    payHand(g, [SCN.c2]);
    expect(offeredIds(g)).toEqual([SCN.c5]);
  });

  it('"up to 1": the K.O. may be skipped after the trash cost was paid', () => {
    const g = hit([SCN.c2]);
    activateTrigger(g);
    payHand(g, [SCN.c2]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('the cost is exactly 1 card of my choice from hand, and it cannot be skipped', () => {
    const g = hit([SCN.c2, SCN.c3]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it("declining the whole [Trigger]: Caribou goes to my hand and nothing is K.O.'d", () => {
    const g = hit([SCN.c2]);
    declineTrigger(g);
    expect(hand(g)).toEqual([CARIBOU, SCN.c2].sort());
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('CR 8-3-1-3: with an empty hand the "trash 1 card" cost cannot be paid, so the [Trigger] cannot be activated', () => {
    const g = hit([]);
    need(g, 'trigger', 'p1');
    expect(isLegal(g, { type: 'trigger', activate: true })).toBe(false);
    declineTrigger(g);
    expect(hand(g)).toEqual([CARIBOU]);
  });
});
