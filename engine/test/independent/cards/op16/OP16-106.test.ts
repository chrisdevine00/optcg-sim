/**
 * OP16-106 Sanjuan.Wolf (Character, Yellow, cost 4, 5000, Counter +1000, {Blackbeard Pirates}/{Giant}/{Impel Down}).
 *
 * Card text: "[On K.O.] If your Leader has the {Blackbeard Pirates} type, draw 1 card, then up to 1 of
 * your Leader or Character cards' base power becomes 7000 during this turn. [Trigger] Activate this
 * card's [On K.O.] effect."
 *
 * Rules: CR 10-2-1 ([On K.O.]), CR 8-4-4-1 ("up to"), CR 6-6-1-3 ("during this turn"), RD 122
 * (a failed "If" ends the effect), RD 101-102 ([Trigger]). Leader OP16-080 Teach ({Blackbeard
 * Pirates}); its own [On your Opponent's Attack] needs a [Trigger] card in hand (never held here).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  choices,
  declineTrigger,
  deckOf,
  hand,
  hitLeader,
  LD16,
  mayChooseNone,
  need,
  none,
  offeredIds,
  pickCards,
  pickInst,
  SC16,
  SCN,
  theirs,
  theyKo,
  trash,
  chars,
} from './kit-op16c.ts';

const ID = 'OP16-106';

function koed(o: { leader?: string; field?: string[] } = {}) {
  const g = theirs(
    o.leader ?? LD16.teach,
    {
      characters: [{ card: ID, rested: true }, ...(o.field ?? [SCN.c4])],
      deck: deckOf([SCN.c1]),
    },
    {},
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

describe("OP16-106 Sanjuan.Wolf: [On K.O.] draw 1, then a Leader or Character's base power becomes 7000 this turn", () => {
  it("K.O.'d with a {Blackbeard Pirates} Leader: draws 1 and my Leader's base power becomes 7000", () => {
    const g = koed();
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SCN.c1]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(trash(g)).toEqual([ID]);
  });

  it('a Character may be chosen instead (6000 -> 7000)', () => {
    const g = koed();
    pickCards(g, [SCN.c4]);
    expect(g.power(at(g, 'p1', 'characters', SCN.c4))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it is a base-power SET, not an addition: a 9000 Character becomes 7000', () => {
    const g = koed({ field: [SCN.c7] });
    pickCards(g, [SCN.c7]);
    expect(g.power(at(g, 'p1', 'characters', SCN.c7))).toBe(7000);
  });

  it("candidates: my own Leader and Characters only (not the opponent's Leader)", () => {
    const g = koed();
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toEqual([SCN.c4, LD16.teach].sort());
  });

  it('"up to 1": nobody may be chosen; the card is still drawn', () => {
    const g = koed();
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual([SCN.c1]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only one card is changed', () => {
    const g = koed();
    pickCards(g, [SCN.c4]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('condition: a Leader that is not {Blackbeard Pirates} draws nothing and changes nothing', () => {
    const g = koed({ leader: LD16.wano });
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(chars(g)).toEqual([SCN.c4]);
  });

  it('the base power returns to normal when the turn ends', () => {
    const g = koed();
    pickInst(g, [g.leader('p1')]);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Trigger]: activating runs the [On K.O.] effect and Sanjuan.Wolf is trashed', () => {
    const g = theirs(LD16.teach, { life: [ID, BLUE, BLUE, BLUE], deck: deckOf([SCN.c1]) }, {});
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    pickInst(g, [g.leader('p1')]);
    expect(hand(g)).toEqual([SCN.c1]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(trash(g)).toEqual([ID]);
  });

  it('[Trigger] declined: Sanjuan.Wolf goes to my hand and nothing changes', () => {
    const g = theirs(LD16.teach, { life: [ID, BLUE, BLUE, BLUE], deck: deckOf([SCN.c1]) }, {});
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(SC16.wano1).toBeTruthy();
  });
});
