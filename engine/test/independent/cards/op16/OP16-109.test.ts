/**
 * OP16-109 Doc Q (Character, Yellow, cost 1, 0 power, Counter +2000, {Blackbeard Pirates}).
 *
 * Card text: "[On K.O.] If your Leader has the {Blackbeard Pirates} type, draw 1 card and K.O. up to 2
 * of your opponent's Characters with a cost of 1 or less. [Trigger] Activate this card's [On K.O.]
 * effect."
 *
 * Rules: CR 10-2-1 ([On K.O.]), CR 8-4-4-1 ("up to"), RD 122 (a failed "If" ends the effect),
 * RD 101-102 ([Trigger]), CR 1-3-6-2 (cost reads as 0 at the lowest).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  cardIds,
  choices,
  declineTrigger,
  deckOf,
  hand,
  hitLeader,
  kind,
  LD16,
  mayChooseNone,
  need,
  none,
  offeredIds,
  pickCards,
  reachablePickSets,
  SCN,
  theirs,
  theyKo,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-109';

function koed(o: { leader?: string; opp?: string[] } = {}) {
  const g = theirs(
    o.leader ?? LD16.teach,
    { characters: [{ card: ID, rested: true }], deck: deckOf([SCN.c3]) },
    { characters: o.opp ?? [SCN.c1, SCN.c1, SCN.c2] },
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

describe('OP16-109 Doc Q: [On K.O.] draw 1 and K.O. up to 2 opposing Characters with cost 1 or less', () => {
  it("K.O.'d: draws 1 and K.O.s the two chosen cost-1 Characters", () => {
    const g = koed();
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c1, SCN.c1]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SCN.c3]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c2]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([SCN.c1, SCN.c1]);
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: cost 1 is offered, cost 2 is not', () => {
    const g = koed();
    expect(offeredIds(g)).toEqual([SCN.c1, SCN.c1]);
  });

  it('"up to 2": one target is allowed', () => {
    const g = koed();
    pickCards(g, [SCN.c1]);
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([SCN.c1, SCN.c2].sort());
  });

  it('"up to 2": none is allowed; the draw still happens', () => {
    const g = koed();
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual([SCN.c3]);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('never more than 2 even with three eligible Characters', () => {
    const g = koed({ opp: [SCN.c1, SCN.c1, SCN.c1] });
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect(sets.has([SCN.c1, SCN.c1].join('+'))).toBe(true);
    expect(sets.has([SCN.c1, SCN.c1, SCN.c1].join('+'))).toBe(false);
  });

  it("only the opponent's Characters are candidates (not their Leader, not my Characters)", () => {
    const g = koed();
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it("condition: with a Leader that is not {Blackbeard Pirates} nothing is drawn and nothing is K.O.'d", () => {
    const g = koed({ leader: LD16.wano });
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('with no cost-1 Character on the opposing field only the draw happens', () => {
    const g = koed({ opp: [SCN.c4] });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(hand(g)).toEqual([SCN.c3]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c4]);
  });

  it('[Trigger]: activating runs the [On K.O.] effect and Doc Q is trashed', () => {
    const g = theirs(
      LD16.teach,
      { life: [ID, BLUE, BLUE, BLUE], deck: deckOf([SCN.c3]) },
      { characters: [SCN.c1, SCN.c1] },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    pickCards(g, [SCN.c1, SCN.c1]);
    expect(hand(g)).toEqual([SCN.c3]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it("[Trigger] declined: Doc Q goes to my hand and nothing is K.O.'d", () => {
    const g = theirs(LD16.teach, { life: [ID, BLUE, BLUE, BLUE] }, { characters: [SCN.c1] });
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c1]);
  });
});
