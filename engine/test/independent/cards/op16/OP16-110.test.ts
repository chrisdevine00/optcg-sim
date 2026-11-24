/**
 * OP16-110 Vasco Shot (Character, Yellow, cost 1, 2000, Counter +1000, {Blackbeard Pirates}/{Impel Down}).
 *
 * Card text: "[On K.O.] Draw 1 card and rest up to 1 of your opponent's Characters with a cost of 6 or
 * less. [Trigger] Activate this card's [On K.O.] effect."
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
  SCN,
  theirs,
  theyKo,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-110';

function koed(o: { leader?: string; opp?: (string | { card: string; rested?: boolean })[] } = {}) {
  const g = theirs(
    o.leader ?? LD16.wano,
    { characters: [{ card: ID, rested: true }], deck: deckOf([SCN.c3]) },
    { characters: o.opp ?? [SCN.c6, SCN.c7] },
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

describe('OP16-110 Vasco Shot: [On K.O.] draw 1 and rest up to 1 opposing Character with cost 6 or less', () => {
  it("K.O.'d: draws 1 and rests the chosen cost-6 Character", () => {
    const g = koed();
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c6]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SCN.c3]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).rested).toBe(true);
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: cost 6 is offered, cost 7 is not', () => {
    const g = koed();
    expect(offeredIds(g)).toEqual([SCN.c6]);
  });

  it('the Leader is not a candidate (Characters only); nor are my own Characters', () => {
    const g = koed();
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('"up to 1": may rest nobody; the draw still happens', () => {
    const g = koed();
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual([SCN.c3]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).rested).toBe(false);
  });

  it('rests at most one of two eligible Characters', () => {
    const g = koed({ opp: [SCN.c6, SCN.c5] });
    pickCards(g, [SCN.c5]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c5)).rested).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).rested).toBe(false);
  });

  it('there is no Leader condition: it works with a Leader that is not {Blackbeard Pirates}', () => {
    const g = koed({ leader: LD16.plain });
    expect(kind(g)).toBe('choose');
    pickCards(g, [SCN.c6]);
    expect(hand(g)).toEqual([SCN.c3]);
  });

  it('with no cost-6-or-less Character only the draw happens', () => {
    const g = koed({ opp: [SCN.c7] });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(hand(g)).toEqual([SCN.c3]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c7)).rested).toBe(false);
  });

  it('an already rested Character stays rested (and is still a legal choice)', () => {
    const g = koed({ opp: [{ card: SCN.c6, rested: true }] });
    expect(offeredIds(g)).toEqual([SCN.c6]);
    pickCards(g, [SCN.c6]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).rested).toBe(true);
  });

  it('[Trigger]: activating runs the [On K.O.] effect and Vasco Shot is trashed', () => {
    const g = theirs(
      LD16.wano,
      { life: [ID, BLUE, BLUE, BLUE], deck: deckOf([SCN.c3]) },
      { characters: [SCN.c6] },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    pickCards(g, [SCN.c6]);
    expect(hand(g)).toEqual([SCN.c3]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).rested).toBe(true);
    expect(trash(g)).toEqual([ID]);
  });

  it('[Trigger] declined: Vasco Shot goes to my hand, nothing drawn or rested', () => {
    const g = theirs(LD16.wano, { life: [ID, BLUE, BLUE, BLUE] }, { characters: [SCN.c6] });
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).rested).toBe(false);
  });
});
