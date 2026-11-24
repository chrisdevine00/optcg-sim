/**
 * OP16-115 Black Vortex (Event, Yellow, cost 1, {Blackbeard Pirates}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[Main] If your Leader has the {Blackbeard Pirates} type, add up to 1 card with a
 * [Trigger] other than [Black Vortex] from your trash to your hand. [Trigger] Negate the effect of
 * up to 1 of your opponent's Leader or Character cards during this turn."
 *
 * Scenery: OP01-104 Speed (Character with a [Trigger]), OP17-076 (Event with a [Trigger]), OP09-097
 * Black Vortex (another card named [Black Vortex], with a [Trigger]), OP01-012 Sai (no [Trigger]).
 * OP16-082 Kin'emon has a static "+3 cost": negating it shows as the cost dropping from 7 to 4.
 *
 * Rules: CR 8-2 (negation), CR 8-4-4-1 ("up to"), CR 6-6-1-3 ("during this turn"), RD 122 (a failed
 * "If" ends the effect), RD 101-102 ([Trigger]).
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
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  pickInst,
  playCard,
  SCN,
  theirs,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-115';
const SPEED = 'OP01-104';
const WORORO = 'OP17-076';
const OTHER_VORTEX = 'OP09-097';
const KINEMON = 'OP16-082';

function main(tr: string[], leader: string = LD16.teach) {
  return mine(leader, { hand: [ID], trash: tr });
}

describe('OP16-115 Black Vortex: [Main] with a {Blackbeard Pirates} Leader, add a card with a [Trigger] (not [Black Vortex]) from the trash to my hand', () => {
  it('adds the chosen [Trigger] card to hand; the Event goes to the trash', () => {
    const g = main([SPEED, SCN.c2]);
    playCard(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SPEED]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SPEED]);
    expect(trash(g)).toEqual([ID, SCN.c2].sort());
  });

  it('candidates: cards with a [Trigger] of any category; cards without one and any [Black Vortex] are not offered', () => {
    const g = main([SPEED, WORORO, SCN.c2, OTHER_VORTEX, SCN.c5]);
    playCard(g, ID);
    expect(offeredIds(g)).toEqual([SPEED, WORORO].sort());
  });

  it('"up to 1": may add nothing', () => {
    const g = main([SPEED]);
    playCard(g, ID);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, SPEED].sort());
  });

  it('adds at most one card', () => {
    const g = main([SPEED, WORORO]);
    playCard(g, ID);
    pickCards(g, [WORORO]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([WORORO]);
    expect(trash(g)).toEqual([ID, SPEED].sort());
  });

  it('condition: a Leader that is not {Blackbeard Pirates} adds nothing (no prompt)', () => {
    const g = main([SPEED], LD16.wano);
    playCard(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, SPEED].sort());
  });

  it('with no card that has a [Trigger] the effect adds nothing', () => {
    const g = main([SCN.c2, OTHER_VORTEX]);
    playCard(g, ID);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
  });

  it('the Main effect does not negate anything', () => {
    const g = mine(LD16.teach, { hand: [ID], trash: [SPEED] }, { characters: [KINEMON] });
    playCard(g, ID);
    pickCards(g, [SPEED]);
    expect(g.card(at(g, 'p2', 'characters', KINEMON)).cost).toBe(7);
  });
});

describe('OP16-115 Black Vortex: [Trigger] negate the effect of up to 1 opposing Leader or Character this turn', () => {
  function hit(opp: string[] = [KINEMON]) {
    const g = theirs(
      LD16.teach,
      { life: [ID, BLUE, BLUE, BLUE], trash: [SPEED] },
      { characters: opp },
    );
    hitLeader(g);
    return g;
  }

  it("negating Kin'emon removes its +3 cost (7 -> 4); Black Vortex is trashed", () => {
    const g = hit();
    need(g, 'trigger', 'p1');
    expect(g.card(at(g, 'p2', 'characters', KINEMON)).cost).toBe(7);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickCards(g, [KINEMON]);
    expect(g.card(at(g, 'p2', 'characters', KINEMON)).negated).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', KINEMON)).cost).toBe(4);
    expect(trash(g)).toContain(ID);
  });

  it("candidates: the opponent's Leader and Characters (not mine)", () => {
    const g = hit();
    activateTrigger(g);
    expect(choices(g)).toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).toEqual([KINEMON, LD16.plain].sort());
  });

  it('the opposing Leader may be negated', () => {
    const g = hit();
    activateTrigger(g);
    pickInst(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).negated).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', KINEMON)).negated).toBeFalsy();
  });

  it('"up to 1": may negate nobody', () => {
    const g = hit();
    activateTrigger(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.card(at(g, 'p2', 'characters', KINEMON)).cost).toBe(7);
  });

  it('negates only one of two', () => {
    const g = hit([KINEMON, KINEMON]);
    activateTrigger(g);
    pickCards(g, [KINEMON]);
    const costs = cardIds(g, 'p2', 'characters').map(
      (_, i) => g.card(g.zone('p2', 'characters')[i]!.instance).cost,
    );
    expect(costs.sort()).toEqual([4, 7]);
  });

  it('the negation lasts this turn only', () => {
    const g = hit();
    activateTrigger(g);
    pickCards(g, [KINEMON]);
    g.act({ type: 'endTurn' });
    expect(g.card(at(g, 'p2', 'characters', KINEMON)).cost).toBe(7);
  });

  it('the [Trigger] does not add a card from the trash (that is the [Main] effect)', () => {
    const g = hit();
    activateTrigger(g);
    pickCards(g, [KINEMON]);
    expect(hand(g)).toEqual([]);
  });

  it('declined: Black Vortex goes to my hand and nothing is negated', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(g.card(at(g, 'p2', 'characters', KINEMON)).cost).toBe(7);
  });
});
