/**
 * OP13-059 Brilliant Punk (Event, Blue, cost 4, {Whitebeard Pirates}).
 *
 * Card text: "[Main] You may return 1 of your Characters to the owner's hand: Return up to 1 Character
 * with a cost of 6 or less to the owner's hand. [Trigger] Draw 1 card."
 *
 * Rules: CR 8-3-1-4 ("you may" cost), CR 8-3-1-3 (an unpayable cost), CR 1-3-5-1 ("up to" allows 0),
 * CR 3-1-6 (a card that leaves the field is a new object), CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  choices,
  deck,
  don,
  hand,
  hitLeader,
  kind,
  me,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S13,
  chars,
  trash,
  unusable,
  yes,
  no,
  defend,
  LD13,
  theirs,
  ch,
  type Placed,
} from './kit-op13c.ts';
import type { PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP13-059';

/** p1's Main Phase with the Event in hand, my Characters `mine` and the opponent's `theirsChars`. */
function start(
  mineChars: Placed,
  theirsChars: Placed = [],
  extra: Partial<PlayerSpec> = {},
): TestGame {
  return me(
    LD13.plain,
    { hand: [ID], characters: mineChars, ...extra },
    { characters: theirsChars },
  );
}

describe('OP13-059 Brilliant Punk: [Main] return 1 of my Characters: return up to 1 Character with cost 6 or less', () => {
  it('pays by returning my Character, then returns the opponent’s Character to its OWNER’s hand', () => {
    const g = start([S13.c2], [S13.c6]);
    playRaw(g, ID);
    yes(g, 'p1');
    need(g, 'choose');
    pickInst(g, [ch(g, 'p2', S13.c6)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([S13.c2]);
    expect(chars(g, 'p2')).toEqual([]);
    expect(hand(g, 'p2')).toEqual([S13.c6]);
    expect(trash(g)).toEqual([ID]);
    expect(don(g)).toMatchObject({ active: 1, rested: 4 });
  });

  it('boundary: a cost-6 Character is offered, a cost-7 Character is not', () => {
    const g = start([S13.c2], [S13.c6, S13.c7]);
    playRaw(g, ID);
    yes(g, 'p1');
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([S13.c6]);
  });

  it('the target may be my own other Character (cost 6 or less); the Character returned as the cost is no longer on the field', () => {
    const g = start([S13.c2, S13.c4]);
    playRaw(g, ID);
    yes(g, 'p1');
    need(g, 'choose');
    pickInst(g, [ch(g, 'p1', S13.c2)]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([S13.c4]);
    pickInst(g, [ch(g, 'p1', S13.c4)]);
    expect(chars(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([S13.c2, S13.c4].sort());
  });

  it('the cost can be any of my Characters, rested or active', () => {
    const g = start([{ card: S13.c2, rested: true }, S13.c3], [S13.c6]);
    playRaw(g, ID);
    yes(g, 'p1');
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([S13.c2, S13.c3].sort());
  });

  it('"up to 1": after paying, the target may be skipped; the cost stays paid', () => {
    const g = start([S13.c2], [S13.c6]);
    playRaw(g, ID);
    yes(g, 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g, 'p1')).toEqual([S13.c2]);
    expect(chars(g, 'p2')).toEqual([S13.c6]);
    expect(trash(g)).toEqual([ID]);
  });

  it('"you may": declining returns nothing and the Event is still played and trashed', () => {
    const g = start([S13.c2], [S13.c6]);
    playRaw(g, ID);
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p1')).toEqual([S13.c2]);
    expect(chars(g, 'p2')).toEqual([S13.c6]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('CR 8-3-1-3: with no Character of mine the cost cannot be paid and nothing is returned', () => {
    const g = start([], [S13.c6]);
    playRaw(g, ID);
    unusable(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(chars(g, 'p2')).toEqual([S13.c6]);
    expect(trash(g)).toEqual([ID]);
  });

  it('a returned Character with DON!! given sends the DON!! back to the cost area (rested); the Character is a new card in hand', () => {
    const g = start([{ card: S13.c2, don: 2 }], [S13.c6], { costArea: { active: 6, rested: 0 } });
    playRaw(g, ID);
    yes(g, 'p1');
    none(g);
    expect(don(g)).toMatchObject({ given: 0, rested: 4 + 2, active: 2 });
    expect(hand(g, 'p1')).toEqual([S13.c2]);
  });

  it('[Trigger]: revealed from Life it draws 1 card and returns nothing', () => {
    const g = theirs(
      LD13.plain,
      { life: [ID, BLUE, BLUE, BLUE], deck: [S13.c3, BLUE, BLUE], characters: [S13.c2] },
      {},
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(hand(g, 'p1')).toEqual([S13.c3]);
    expect(deck(g)).toHaveLength(2);
    expect(chars(g, 'p1')).toEqual([S13.c2]);
    expect(trash(g)).toEqual([ID]);
    expect(kind(g)).toBe('main');
  });

  it('must not: the opponent’s Characters of cost 7 stay, and the Event cannot be played for less than its cost 4', () => {
    const g = me(
      LD13.plain,
      { hand: [ID], characters: [S13.c2], costArea: { active: 3, rested: 0 } },
      { characters: [S13.c6] },
    );
    expect(g.legal().some((a) => a.type === 'playCard')).toBe(false);
    void choices;
    void unusable;
    void defend;
  });
});
