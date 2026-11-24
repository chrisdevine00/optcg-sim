/**
 * OP16-114 Laffitte (Character, Yellow, cost 1, 2000, Counter +1000, {Blackbeard Pirates}).
 *
 * Card text: "[On K.O.] K.O. up to 1 of your opponent's Characters with a cost of 4 or less.
 * [Trigger] Activate this card's [On K.O.] effect."
 *
 * Rules: CR 10-2-1 ([On K.O.]), CR 8-4-4-1 ("up to"), RD 101-102 ([Trigger]). There is no Leader
 * condition on this card.
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
  hand,
  hitLeader,
  kind,
  LD16,
  mayChooseNone,
  need,
  none,
  offeredIds,
  pickCards,
  SCN,
  theirs,
  theyKo,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-114';

function koed(o: { leader?: string; opp?: (string | { card: string; rested?: boolean })[] } = {}) {
  const g = theirs(
    o.leader ?? LD16.wano,
    { characters: [{ card: ID, rested: true }] },
    { characters: o.opp ?? [SCN.c4, SCN.c5] },
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

describe('OP16-114 Laffitte: [On K.O.] K.O. up to 1 opposing Character with cost 4 or less', () => {
  it("K.O.'d: K.O.s the chosen cost-4 Character", () => {
    const g = koed();
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c4]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c5]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([SCN.c4]);
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: cost 4 is offered, cost 5 is not', () => {
    const g = koed();
    expect(offeredIds(g)).toEqual([SCN.c4]);
  });

  it('a rested Character is a candidate too', () => {
    const g = koed({ opp: [{ card: SCN.c4, rested: true }] });
    expect(offeredIds(g)).toEqual([SCN.c4]);
  });

  it("only the opponent's Characters: not the Leader, not mine", () => {
    const g = koed();
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('"up to 1": may K.O. nobody', () => {
    const g = koed();
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('K.O.s at most one of two eligible Characters', () => {
    const g = koed({ opp: [SCN.c4, SCN.c3] });
    pickCards(g, [SCN.c3]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c4]);
  });

  it('there is no Leader condition and no draw: works with any Leader, hand stays empty', () => {
    const g = koed({ leader: LD16.plain });
    expect(kind(g)).toBe('choose');
    pickCards(g, [SCN.c4]);
    expect(hand(g)).toEqual([]);
  });

  it('with no cost-4-or-less Character nothing happens', () => {
    const g = koed({ opp: [SCN.c5] });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c5]);
  });

  it('[Trigger]: activating runs the [On K.O.] effect and Laffitte is trashed', () => {
    const g = theirs(LD16.wano, { life: [ID, BLUE, BLUE, BLUE] }, { characters: [SCN.c4] });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    pickCards(g, [SCN.c4]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it("[Trigger] declined: Laffitte goes to my hand and nothing is K.O.'d", () => {
    const g = theirs(LD16.wano, { life: [ID, BLUE, BLUE, BLUE] }, { characters: [SCN.c4] });
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c4]);
  });
});
