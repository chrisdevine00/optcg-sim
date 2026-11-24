/**
 * OP17-071 Who's.Who (Character, Purple, cost 2, 3000, Counter +1000, {Animal Kingdom Pirates}/{Former CP9}).
 *
 * Card text: "[On Play] DON!! −1: K.O. up to 2 of your opponent's Characters with a cost of 2 or less.
 * [Trigger] Play this card."
 *
 * Rules: CR 8-3-1-6 (DON!! −X), RD 112 (an [On Play] cost may be declined), CR 8-4-4-1 ("up to"),
 * CR 10-1-5 / RD 101-102 ([Trigger] plays the card from outside any area), CR 10-2-1 (K.O.),
 * CR 1-3-6-2 (cost as modified).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  cardIds,
  choices,
  don,
  fill,
  hand,
  hitLeader,
  activateTrigger,
  declineTrigger,
  kind,
  LD,
  mine,
  mayChooseNone,
  need,
  no,
  none,
  offeredIds,
  pickCards,
  playCard,
  RED,
  SCN,
  side,
  theirs,
  trash,
  yes,
  unusable,
  BLUE,
  chars,
} from './kit-op17b.ts';

const WHO = 'OP17-071';
const FEED = 'OP17-097'; // Black Event cost 1: [Main] give all of the opponent's Characters -1 cost this turn

function play(opp: (string | { card: string; rested?: boolean })[]) {
  const g = mine(LD.akp, { hand: [WHO], costArea: { active: 2, rested: 0 } }, { characters: opp });
  playCard(g, WHO);
  return g;
}

describe("OP17-071 Who's.Who: [On Play] DON!! −1: K.O. up to 2 cost-2-or-less Characters; [Trigger] play this card", () => {
  it('returns 1 DON!! and K.O.s the two chosen cost-2-or-less opposing Characters', () => {
    const g = play([SCN.c1, SCN.c2]);
    need(g, 'optional', 'p1');
    yes(g);
    expect(don(g)).toMatchObject({ active: 0, rested: 1, deck: 9 });
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c1, SCN.c2]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(trash(g, 'p2')).toEqual([SCN.c1, SCN.c2].sort());
    expect(g.eventsOfType('KO')).toHaveLength(2);
  });

  it('boundary: a cost-2 Character is a candidate, a cost-3 Character is not', () => {
    const g = play([SCN.c2, SCN.c3]);
    yes(g);
    expect(offeredIds(g)).toEqual([SCN.c2]);
  });

  it('"up to 2": one target, or none, is allowed; never more than 2', () => {
    const g = play([SCN.c1, SCN.c2, { card: SCN.c1, rested: true }]);
    yes(g);
    pickCards(g, [SCN.c1]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    const h = play([SCN.c1]);
    yes(h);
    expect(mayChooseNone(h)).toBe(true);
    none(h);
    expect(h.zone('p2', 'characters')).toHaveLength(1);
    const k = play([SCN.c1, SCN.c2, SCN.c1]);
    yes(k);
    pickCards(k, [SCN.c1, SCN.c2]);
    expect(k.zone('p2', 'characters')).toHaveLength(1);
  });

  it("rested and active Characters can both be K.O.'d", () => {
    const g = play([{ card: SCN.c1, rested: true }, SCN.c2]);
    yes(g);
    expect(offeredIds(g)).toEqual([SCN.c1, SCN.c2].sort());
  });

  it('only opposing Characters are candidates', () => {
    const g = mine(
      LD.akp,
      { hand: [WHO], characters: [SCN.c1], costArea: { active: 2, rested: 0 } },
      { characters: [SCN.c2] },
    );
    playCard(g, WHO);
    yes(g);
    expect(offeredIds(g)).toEqual([SCN.c2]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it("declining the DON!! −1: no DON!! returned and nothing is K.O.'d", () => {
    const g = play([SCN.c1]);
    no(g);
    expect(don(g)).toMatchObject({ rested: 2, deck: 8 });
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(chars(g)).toEqual([WHO]);
  });

  it('the current cost counts: a cost-3 Character reduced to 2 this turn is a candidate', () => {
    const g = mine(
      LD.akp,
      { hand: [FEED, WHO], costArea: { active: 3, rested: 0 } },
      { characters: [SCN.c3] },
    );
    act(g, { type: 'playCard', card: g.find('p1', 'hand', FEED) });
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).cost).toBe(2);
    playCard(g, WHO);
    yes(g);
    expect(offeredIds(g)).toEqual([SCN.c3]);
  });

  it('[Trigger]: when revealed from Life and activated it is played, then its [On Play] can be used', () => {
    const g = theirs(
      LD.akp,
      { life: [WHO, ...fill(BLUE, 3)], costArea: { active: 2, rested: 0 } },
      { characters: [] },
    );
    hitLeader(g);
    activateTrigger(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([WHO]);
    expect(hand(g)).toEqual([]);
    expect(g.life('p1')).toBe(3);
    need(g, 'optional', 'p1');
    no(g);
    void side;
    void RED;
  });

  it('[Trigger]: declining it adds the card to hand and plays nothing', () => {
    const g = theirs(
      LD.akp,
      { life: [WHO, ...fill(BLUE, 3)], costArea: { active: 2, rested: 0 } },
      {},
    );
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([WHO]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(kind(g)).not.toBe('optional');
  });

  it("[Trigger]: played with no DON!! on my field, the [On Play] DON!! −1 cannot be paid and nothing is K.O.'d", () => {
    const g = theirs(
      LD.akp,
      { life: [WHO, ...fill(BLUE, 3)], characters: [], costArea: { active: 0, rested: 0 } },
      {},
    );
    hitLeader(g);
    activateTrigger(g);
    unusable(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([WHO]);
  });
});
