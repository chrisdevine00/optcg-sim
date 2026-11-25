/**
 * OP09-107 Nico Robin (Character, Yellow, cost 6, 6000, Counter +1000, {Straw Hat Crew}, Strike).
 *
 * Card text: "[On Play] If your opponent has 3 or more Life cards, trash up to 1 card from the top of
 * your opponent's Life cards.
 * [Trigger] Play up to 1 yellow Character card with a cost of 3 or less from your hand."
 *
 * Rules: Life is public (CR 3-1-4), so the Life check may gate a prompt. A Life card trashed by an
 * effect goes to its owner's trash and never activates its [Trigger] (CR 4-6-3, rules-digest 104).
 * "Up to 1" may be 0. The hand is hidden: the [Trigger] pick is asked even when nothing qualifies.
 * The Life card being resolved is in no area; the [Trigger] card is trashed afterwards.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  askedEmpty,
  atMain,
  hand,
  kind,
  LD9,
  lifeCards,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  offeredIds,
  onField,
  pickCards,
  playRaw,
  SC9,
  trash,
  triggerGame,
  yes,
} from './kit-op09c.ts';

const ROBIN = 'OP09-107';
const OPP_LIFE = [SC9.c1, SC9.c2, SC9.c3, SC9.c4];

function viaPlay(p2Life: string[]) {
  const g = mine(LD9.luffy, { hand: [ROBIN] }, { life: p2Life });
  playRaw(g, ROBIN);
  return g;
}

describe('OP09-107 Nico Robin: [On Play] trash 1 of the top Life of an opponent with 3+; [Trigger] play a yellow Character cost 3 or less', () => {
  it('printed values: cost 6, 6000, Counter +1000', () => {
    const g = viaPlay(OPP_LIFE);
    no(g);
    const c = g.zone('p1', 'characters')[0]!;
    expect(c.cost).toBe(6);
    expect(c.power).toBe(6000);
    expect(c.counter).toBe(1000);
  });

  it("[On Play] with 4 opponent Life cards: trashes the TOP one into the opponent's trash", () => {
    const g = viaPlay(OPP_LIFE);
    yes(g);
    expect(atMain(g)).toBe(true);
    expect(lifeCards(g, 'p2')).toEqual([SC9.c2, SC9.c3, SC9.c4]);
    expect(trash(g, 'p2')).toEqual([SC9.c1]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('boundary: exactly 3 Life cards still qualifies', () => {
    const g = viaPlay([SC9.c1, SC9.c2, SC9.c3]);
    yes(g);
    expect(g.life('p2')).toBe(2);
    expect(trash(g, 'p2')).toEqual([SC9.c1]);
  });

  it('boundary: with 2 Life cards nothing is asked or trashed', () => {
    const g = viaPlay([SC9.c1, SC9.c2]);
    expect(atMain(g)).toBe(true);
    expect(g.life('p2')).toBe(2);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('"up to 1": the Life trash may be declined', () => {
    const g = viaPlay(OPP_LIFE);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(g.life('p2')).toBe(4);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('at most one card is trashed even with a large Life', () => {
    const g = viaPlay([SC9.c1, SC9.c2, SC9.c3, SC9.c4, SC9.c5]);
    yes(g);
    expect(g.life('p2')).toBe(4);
    expect(atMain(g)).toBe(true);
  });

  it('a Life card with a [Trigger] on top is trashed without activating the [Trigger]', () => {
    const g = viaPlay([SC9.triggerSpeed, SC9.c2, SC9.c3]);
    yes(g);
    expect(kind(g)).not.toBe('trigger');
    expect(trash(g, 'p2')).toEqual([SC9.triggerSpeed]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it("only the opponent's Life is trashed: my own Life is unchanged", () => {
    const g = viaPlay(OPP_LIFE);
    yes(g);
    expect(g.life('p1')).toBe(4);
    expect(trash(g, 'p1')).toEqual([]);
  });

  // [Trigger]
  const YT = [SC9.yc1, SC9.yc2, SC9.yc3, SC9.yc4, SC9.yc5, SC9.c1, SC9.c3];

  it('[Trigger] offers exactly the yellow Characters of cost 3 or less in my hand', () => {
    const g = triggerGame(ROBIN, { hand: YT });
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC9.yc1, SC9.yc2, SC9.yc3].sort());
  });

  it('[Trigger] cost boundary: cost 3 qualifies, cost 4 does not', () => {
    const g = triggerGame(ROBIN, { hand: [SC9.yc3, SC9.yc4] });
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([SC9.yc3]);
  });

  it('[Trigger] the colour must be yellow: red and other-colour Characters of cost 3 or less are not offered', () => {
    const g = triggerGame(ROBIN, { hand: [SC9.c1, SC9.c3, SC9.ra2, SC9.yc1] });
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([SC9.yc1]);
  });

  it('[Trigger] the chosen Character is played (active) for no cost, and Robin is trashed', () => {
    const g = triggerGame(ROBIN, { hand: YT });
    activateTrigger(g);
    pickCards(g, [SC9.yc2]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(onField(g, SC9.yc2)).toBe(true);
    expect(g.zone('p1', 'characters')[0]!.rested).toBe(false);
    expect(hand(g)).not.toContain(SC9.yc2);
    expect(trash(g)).toEqual([ROBIN]);
  });

  it('[Trigger] "up to 1": may play nothing; the card is still trashed', () => {
    const g = triggerGame(ROBIN, { hand: YT });
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([ROBIN]);
  });

  it('[Trigger] with no candidate in hand the (hidden-hand) pick is still asked, empty', () => {
    const g = triggerGame(ROBIN, { hand: [SC9.c1, SC9.yc4] });
    activateTrigger(g);
    askedEmpty(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('[Trigger] declining: Robin goes to my hand and nothing is played', () => {
    const g = triggerGame(ROBIN, { hand: YT });
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toContain(ROBIN);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('[Trigger] has no Leader condition: any Leader may use it', () => {
    const g = triggerGame(ROBIN, { leader: LD9.luffy, hand: [SC9.yc1] });
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([SC9.yc1]);
  });
});
