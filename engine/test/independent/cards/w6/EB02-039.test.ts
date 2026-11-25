/**
 * EB02-039 GERMA 66 (Event, Purple, cost 4, {The Vinsmoke Family}/{GERMA 66}).
 *
 * Card text: "[Main] You may trash 1 "GERMA 66" type Character card with 4000 power or less from your
 * hand: If the number of DON!! cards on your field is equal to or less than the number on your
 * opponent's field, play up to 1 Character card with 5000 to 7000 power and the same card name as
 * the trashed card from your trash."
 *
 * Rules: CR 8-3-1 (the cost is paid before the condition is looked at; a cost that was paid stays
 * paid when the condition then fails), CR 2-4-3 ("GERMA 66" type, exact), CR 4-8-1 ("up to"), DON!!
 * on the field = cost area (active and rested) plus DON!! given to cards.
 *
 * Scenery (printed): OP06-060 Vinsmoke Ichiji 4000 {GERMA 66}; OP11-043 Ichiji 7000 {GERMA 66};
 * OP06-064 Vinsmoke Niji 3000 {GERMA 66}; OP11-045 Niji 6000 vanilla {GERMA 66}; OP06-066 Vinsmoke
 * Yonji 2000 {GERMA 66}; OP11-046 Yonji 5000 {GERMA 66}; OP06-068 Vinsmoke Reiju 2000 {GERMA 66};
 * OP07-062 Vinsmoke Reiju 2000 {Kingdom of GERMA} (not "GERMA 66"); OP06-062 Vinsmoke Judge 8000.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { decision } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  BLUE,
  canUse,
  isChoose,
  LW,
  mayEnd,
  need,
  none,
  offeredCards,
  ofZone,
  payHand,
  pickCards,
  put,
  RED,
  restedOf,
  SC6,
  unusable,
  yes,
  no,
} from './kit-w6a.ts';

const ID = 'EB02-039';
const ICHIJI_4 = 'OP06-060';
const ICHIJI_7 = 'OP11-043';
const NIJI_3 = 'OP06-064';
const NIJI_6 = 'OP11-045';
const YONJI_2 = 'OP06-066';
const YONJI_5 = 'OP11-046';
const REIJU_2 = 'OP06-068';
const REIJU_KOG = 'OP07-062';
const JUDGE_8 = 'OP06-062';

/**
 * p1 (turn 3) holds the Event (cost 4: 4 active DON!! become rested, so p1 has `mine` DON!! on the
 * field) and `hand`; `trash` is p1's trash. p2 has `theirs` active DON!! in the cost area.
 */
function start(
  o: {
    hand?: CardId[];
    trash?: CardId[];
    mine?: number;
    theirs?: number;
    chars?: PlayerSpec['characters'];
    theirChars?: PlayerSpec['characters'];
  } = {},
) {
  return myTurn(
    side(LW.luffy, BLUE, {
      hand: [ID, ...(o.hand ?? [])],
      trash: o.trash ?? [],
      costArea: { active: o.mine ?? 4, rested: 0 },
      characters: o.chars ?? [],
    }),
    side(LW.luffy, RED, {
      costArea: { active: o.theirs ?? 4, rested: 0 },
      characters: o.theirChars ?? [],
    }),
  );
}

/** Play the Event, accept the "you may trash" cost and pay it with `card` if a pick is asked. */
function playAndTrash(g: ReturnType<typeof start>, card: CardId) {
  put(g, ID);
  yes(g);
  if (isChoose(g)) payHand(g, [card]);
}

describe('EB02-039 GERMA 66: [Main] you may trash a GERMA 66 Character (4000-): with DON!! <= opponent, play a same-name 5000-7000 from trash', () => {
  it('trashes Ichiji (4000), then plays the 7000 Ichiji from the trash; the Event goes to the trash', () => {
    const g = start({ hand: [ICHIJI_4, NIJI_3], trash: [ICHIJI_7] });
    playAndTrash(g, ICHIJI_4);
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([ICHIJI_7]);
    pickCards(g, [ICHIJI_7]);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([ICHIJI_7]);
    expect(restedOf(g, 'p1', ICHIJI_7)).toEqual([false]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([NIJI_3]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([ICHIJI_4, ID].sort());
  });

  it('the played card must have the trashed card name: a different name with legal power is not offered', () => {
    const g = start({ hand: [YONJI_2, NIJI_3], trash: [YONJI_5, NIJI_6] });
    playAndTrash(g, YONJI_2);
    expect(offeredCards(g)).toEqual([YONJI_5]);
    pickCards(g, [YONJI_5]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([NIJI_6, YONJI_2, ID].sort());
  });

  it('power range is 5000 to 7000 inclusive: 5000 offered; 4000 (the trashed copy and another) and 8000 are not', () => {
    const g = start({ hand: [ICHIJI_4], trash: [ICHIJI_4, ICHIJI_7] });
    playAndTrash(g, ICHIJI_4);
    // Trash now holds two 4000 Ichiji and the 7000 one.
    expect(offeredCards(g)).toEqual([ICHIJI_7]);
    none(g);
    const h = start({ hand: [YONJI_2], trash: [YONJI_5] });
    playAndTrash(h, YONJI_2);
    expect(offeredCards(h)).toEqual([YONJI_5]);
    const j = start({ hand: [ICHIJI_4], trash: [JUDGE_8] });
    playAndTrash(j, ICHIJI_4);
    // An 8000 Judge has another name; nothing qualifies. The trash is public, so the engine may
    // either ask an empty pick or move on; either way nothing is played.
    if (isChoose(j)) none(j);
    expect(decision(j)?.kind).toBe('main');
    expect(ofZone(j, 'p1', 'characters')).toEqual([]);
  });

  it('cost filter: a GERMA 66 Character above 4000 power (Niji 6000) cannot be trashed; the effect is unusable with only it', () => {
    const g = start({ hand: [NIJI_6], trash: [NIJI_6] });
    put(g, ID);
    // Either no question, or the question with "use" unavailable.
    expect(canUse(g)).toBe(false);
    unusable(g, 'p1');
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'hand')).toEqual([NIJI_6]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
  });

  it('cost filter: a {Kingdom of GERMA} Character is not a "GERMA 66" type card (exact type)', () => {
    const g = start({ hand: [REIJU_KOG], trash: [REIJU_2] });
    put(g, ID);
    expect(canUse(g)).toBe(false);
    unusable(g, 'p1');
    expect(ofZone(g, 'p1', 'hand')).toEqual([REIJU_KOG]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
  });

  it('cost filter: a non-GERMA Character and a non-Character card in hand do not make it payable', () => {
    const g = start({ hand: [SC6.c3k, 'OP02-022'], trash: [ICHIJI_7] });
    put(g, ID);
    expect(canUse(g)).toBe(false);
    unusable(g, 'p1');
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
  });

  it('which card is trashed is asked when two qualify, and only that one is trashed', () => {
    const g = start({ hand: [ICHIJI_4, NIJI_3], trash: [ICHIJI_7, NIJI_6] });
    put(g, ID);
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([ICHIJI_4, NIJI_3].sort());
    payHand(g, [NIJI_3]);
    // Niji 6000 in the trash is the only same-name card in 5000-7000.
    expect(offeredCards(g)).toEqual([NIJI_6]);
    pickCards(g, [NIJI_6]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([ICHIJI_4]);
  });

  it('DON!! condition, boundary: equal numbers (4 and 4) play the card', () => {
    const g = start({ hand: [ICHIJI_4], trash: [ICHIJI_7], mine: 4, theirs: 4 });
    playAndTrash(g, ICHIJI_4);
    expect(isChoose(g)).toBe(true);
    pickCards(g, [ICHIJI_7]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([ICHIJI_7]);
  });

  it('DON!! condition: fewer of mine than theirs plays the card', () => {
    const g = start({ hand: [ICHIJI_4], trash: [ICHIJI_7], mine: 4, theirs: 7 });
    playAndTrash(g, ICHIJI_4);
    expect(isChoose(g)).toBe(true);
    pickCards(g, [ICHIJI_7]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([ICHIJI_7]);
  });

  it('DON!! condition: one more of mine than theirs fails; the cost stays paid and nothing is played', () => {
    const g = start({ hand: [ICHIJI_4], trash: [ICHIJI_7], mine: 4, theirs: 3 });
    playAndTrash(g, ICHIJI_4);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([ICHIJI_4, ICHIJI_7, ID].sort());
    expect(ofZone(g, 'p1', 'hand')).toEqual([]);
  });

  it('DON!! given to Characters count on the field: mine 4 + 1 given (5) against 4 fails', () => {
    const g = start({
      hand: [ICHIJI_4],
      trash: [ICHIJI_7],
      mine: 4,
      theirs: 4,
      chars: [{ card: SC6.c5k, don: 1 }],
    });
    playAndTrash(g, ICHIJI_4);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([SC6.c5k]);
  });

  it("the opponent's given DON!! count too: their 3 in the cost area + 2 given (5) against my 5 plays", () => {
    const g = start({
      hand: [ICHIJI_4],
      trash: [ICHIJI_7],
      mine: 4,
      theirs: 3,
      chars: [{ card: SC6.c5k, don: 1 }],
      theirChars: [{ card: SC6.c5k, don: 2 }],
    });
    playAndTrash(g, ICHIJI_4);
    expect(isChoose(g)).toBe(true);
    pickCards(g, [ICHIJI_7]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([ICHIJI_7, SC6.c5k].sort());
  });

  it('"up to 1": the pick can end with nothing; the trashed card stays in the trash', () => {
    const g = start({ hand: [ICHIJI_4], trash: [ICHIJI_7] });
    playAndTrash(g, ICHIJI_4);
    expect(mayEnd(g)).toBe(true);
    expect(decision(g)?.max).toBe(1);
    none(g);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([ICHIJI_4, ICHIJI_7, ID].sort());
  });

  it('declining the cost: nothing is trashed or played, the Event is still used up', () => {
    const g = start({ hand: [ICHIJI_4], trash: [ICHIJI_7] });
    put(g, ID);
    no(g);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'hand')).toEqual([ICHIJI_4]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([ID, ICHIJI_7].sort());
  });

  it('the Character is played from the trash even when the field is full: one of the five is trashed to make room', () => {
    const g = start({
      hand: [ICHIJI_4],
      trash: [ICHIJI_7],
      chars: [SC6.c3k, SC6.c3k, SC6.c3k, SC6.c3k, SC6.c3k],
    });
    playAndTrash(g, ICHIJI_4);
    pickCards(g, [ICHIJI_7]);
    // The engine asks which of the five to trash (a pick of own Characters).
    if (isChoose(g)) pickCards(g, [SC6.c3k]);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual(
      [ICHIJI_7, SC6.c3k, SC6.c3k, SC6.c3k, SC6.c3k].sort(),
    );
  });
});
