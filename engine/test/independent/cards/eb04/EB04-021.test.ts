/**
 * EB04-021 Igaram (Character, cost 3, 4000, Counter +1000, {Alabasta}).
 *
 * Card text: "[On Play] If your Leader is [Nefeltari Vivi], draw 2 cards and trash 1 card from your hand.
 * [Activate: Main] [Once Per Turn] You may trash 1 card from your hand: Give up to 1 rested DON!!
 * card to your Leader or 1 of your Characters."
 *
 * Rules: "[Nefeltari Vivi]" is a card name (every Leader named so counts: OP04-001, EB03-001);
 * CR 8-3-1-3/-4 (the optional hand cost); only RESTED DON!! can be given; "up to 1" (CR 8-4-4-1);
 * CR 10-2-13 ([Once Per Turn]); a failed condition ends the whole effect.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  cardIds,
  choices,
  don,
  endTurn,
  hand,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  playRaw,
  SN,
  trash,
  useAbility,
} from './kit-eb04a.ts';

const IGARAM = 'EB04-021';
const DECK = [SN.c3, SN.c4, SN.c5, SN.c6, SN.c7];

/** Trash this hand card in the pending "trash 1 card from your hand" pick. */
function trashHand(g: ReturnType<typeof mine>, card: string) {
  need(g, 'choose');
  act(g, { type: 'pick', choice: choices(g).find((i) => g.card(i).card === card)! });
}

describe('EB04-021 Igaram [On Play]: with [Nefeltari Vivi] as Leader, draw 2 and trash 1', () => {
  it('printed values: cost 3, 4000, Counter +1000', () => {
    const g = mine(LE.vivi, { hand: [IGARAM] }, {});
    const c = g.card(g.find('p1', 'hand', IGARAM));
    expect(c.cost).toBe(3);
    expect(c.power).toBe(4000);
    expect(c.counter).toBe(1000);
  });

  it('Leader [Nefeltari Vivi] (OP04-001): draws 2 from the top, then trashes 1 card of my choice', () => {
    const g = mine(LE.vivi, { hand: [IGARAM, SN.c1], deck: DECK }, {});
    playRaw(g, IGARAM);
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual([SN.c1, DECK[0], DECK[1]].sort());
    trashHand(g, DECK[0]!);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SN.c1, DECK[1]].sort());
    expect(trash(g)).toEqual([DECK[0]]);
    expect(cardIds(g, 'p1', 'deck')).toEqual(DECK.slice(2));
  });

  it('the other Leader named [Nefeltari Vivi] (EB03-001) counts too', () => {
    const g = mine('EB03-001', { hand: [IGARAM, SN.c1], deck: DECK }, {});
    playRaw(g, IGARAM);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3);
    trashHand(g, SN.c1);
    expect(hand(g)).toEqual([DECK[0], DECK[1]].sort());
  });

  it('must not happen: any other Leader (even {Alabasta}-less) draws and trashes nothing', () => {
    const g = mine(LE.luffy, { hand: [IGARAM, SN.c1], deck: DECK }, {});
    playRaw(g, IGARAM);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SN.c1]);
    expect(cardIds(g, 'p1', 'deck')).toEqual(DECK);
  });

  it('must not happen: the Character [Nefeltari Vivi] (ST01-009) is not a Leader and does not satisfy the condition', () => {
    const g = mine(LE.luffy, { hand: [IGARAM], characters: [SN.viviChar], deck: DECK }, {});
    playRaw(g, IGARAM);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'deck')).toEqual(DECK);
  });
});

describe('EB04-021 Igaram [Activate: Main] [Once Per Turn]: trash 1 card from hand: give up to 1 rested DON!! to Leader or a Character', () => {
  function field(p1: Parameters<typeof mine>[1] = {}) {
    return mine(
      LE.vivi,
      {
        characters: [IGARAM, SN.c2],
        hand: [SN.c1, SN.c3],
        costArea: { active: 5, rested: 3 },
        ...p1,
      },
      {},
    );
  }
  const igaram = (g: ReturnType<typeof field>) => at(g, 'p1', 'characters', IGARAM);

  it('trashes the chosen hand card and gives 1 rested DON!! to my Leader', () => {
    const g = field();
    useAbility(g, igaram(g));
    trashHand(g, SN.c1);
    need(g, 'choose');
    expect(choices(g)).toContain(g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    expect(trash(g)).toEqual([SN.c1]);
    expect(hand(g)).toEqual([SN.c3]);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 2, given: 1 });
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('may instead give it to one of my Characters (any, Igaram included)', () => {
    const g = field();
    useAbility(g, igaram(g));
    trashHand(g, SN.c3);
    need(g, 'choose');
    expect(offeredIds(g)).toContain(SN.c2);
    expect(offeredIds(g)).toContain(IGARAM);
    pickInst(g, [at(g, 'p1', 'characters', SN.c2)]);
    expect(g.card(at(g, 'p1', 'characters', SN.c2)).don).toBe(1);
    expect(g.power(at(g, 'p1', 'characters', SN.c2))).toBe(5000);
  });

  it('"up to 1": the DON!! may be left (the card is already trashed)', () => {
    const g = field();
    useAbility(g, igaram(g));
    trashHand(g, SN.c1);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(trash(g)).toEqual([SN.c1]);
    expect(don(g, 'p1')).toMatchObject({ rested: 3, given: 0 });
  });

  it('only RESTED DON!! count: with every DON!! active nothing is given', () => {
    const g = field({ costArea: { active: 8, rested: 0 } });
    useAbility(g, igaram(g));
    trashHand(g, SN.c1);
    if (kind(g) === 'choose') none(g);
    expect(kind(g)).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 8, rested: 0, given: 0 });
  });

  it('empty hand: the cost cannot be paid, so nothing is trashed and no DON!! is given', () => {
    const g = field({ hand: [] });
    if (offeredAbilities(g, igaram(g)).length) {
      useAbility(g, igaram(g));
      if (kind(g) === 'optional') act(g, { type: 'optional', accept: false });
    }
    expect(kind(g)).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ rested: 3, given: 0 });
    expect(trash(g)).toEqual([]);
  });

  it('[Once Per Turn]: not offered again this turn, offered again next turn', () => {
    const g = field();
    useAbility(g, igaram(g));
    trashHand(g, SN.c1);
    pickInst(g, [g.leader('p1')]);
    expect(offeredAbilities(g, igaram(g))).toEqual([]);
    endTurn(g);
    endTurn(g);
    expect(offeredAbilities(g, igaram(g)).length).toBe(1);
  });
});
