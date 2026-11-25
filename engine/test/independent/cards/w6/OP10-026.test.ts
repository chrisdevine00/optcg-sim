/**
 * OP10-026 Kin'emon (Character, Green, cost 2, 1000, Counter +1000, Slash, {Land of Wano}/{The
 * Akazaya Nine}/{Punk Hazard}).
 *
 * Card text: "[Activate: Main] You may place this Character and 1 [Kin'emon] with 0 power from your
 * trash at the bottom of your deck in any order: Play up to 1 [Kin'emon] with a cost of 6 from your
 * hand."
 *
 * Rules: CR 8-3-1 (the cost is paid by choosing to activate; it needs both cards: this Character
 * on the field and a matching card in the trash), CR 2-3 (a card name is the text in brackets), CR
 * 4-8-1 ("up to"), CR 3-1-6 (cards that move are new cards), the Character limit of 5 is checked when
 * a Character is played (the cost has already removed this Character).
 * Open M6b-Q73 (the order of the two cards at the bottom): only the set of the bottom 2 is asserted.
 * An "up to" pick over the hand with a filter is asked (max 0 when nothing matches).
 *
 * Scenery (printed): OP10-027 Kin'emon (cost 2, 0 power, [Activate: Main]); OP12-025 Kin'emon (cost
 * 6, 8000, no text); OP04-102 Kin'emon (Yellow, cost 6, 6000, [Activate: Main] with a DON!! cost,
 * inert); OP14-024 Kin'emon (cost 4); OP02-007 Thatch (cost 6, not Kin'emon); EB03-009 Makino (0 power,
 * not Kin'emon).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { decision } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  BLUE,
  isChoose,
  LW,
  mayEnd,
  need,
  none,
  offeredAbilities,
  offeredCards,
  ofZone,
  payHand,
  pickCards,
  RED,
  restedOf,
  SC6,
  settleOrders,
  useAbility,
} from './kit-w6a.ts';

const ID = 'OP10-026';
const K0 = 'OP10-027';
const K6 = 'OP12-025';
const K6_YELLOW = 'OP04-102';
const K4 = 'OP14-024';
const MAKINO = 'EB03-009';

function start(o: { hand?: CardId[]; trash?: CardId[]; chars?: PlayerSpec['characters'] } = {}) {
  return myTurn(
    side(LW.luffy, BLUE, {
      characters: o.chars ?? [ID],
      hand: o.hand ?? [],
      trash: o.trash ?? [],
      costArea: { active: 2, rested: 0 },
    }),
    side(LW.luffy, RED, { costArea: { active: 3, rested: 0 } }),
  );
}

/** Activate and answer whatever question the cost asks (an order, a pick among several 0-power cards). */
function activate(g: ReturnType<typeof start>) {
  useAbility(g, g.find('p1', 'characters', ID));
  settleOrders(g);
}

describe("OP10-026 Kin'emon: [Activate: Main] place this Character and a 0-power [Kin'emon] from trash at the bottom of the deck: play a cost-6 [Kin'emon] from hand", () => {
  it("printed effect: both cards go to the bottom of the deck and the cost-6 Kin'emon is played active", () => {
    const g = start({ hand: [K6], trash: [K0] });
    const deckBefore = g.zone('p1', 'deck').length;
    activate(g);
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([]);
    const deck = g.zone('p1', 'deck');
    expect(deck).toHaveLength(deckBefore + 2);
    expect(
      deck
        .slice(-2)
        .map((c) => c.card)
        .sort(),
    ).toEqual([ID, K0].sort());
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([K6]);
    pickCards(g, [K6]);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([K6]);
    expect(restedOf(g, 'p1', K6)).toEqual([false]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([]);
  });

  it("cost needs a [Kin'emon] with 0 power in the trash: with an empty trash the ability is not offered", () => {
    const g = start({ hand: [K6], trash: [] });
    expect(offeredAbilities(g, g.find('p1', 'characters', ID))).toEqual([]);
  });

  it("a 1000-power [Kin'emon] in the trash (another copy of this card) does not satisfy the cost", () => {
    const g = start({ hand: [K6], trash: [ID] });
    expect(offeredAbilities(g, g.find('p1', 'characters', ID))).toEqual([]);
  });

  it('a 0-power card with another name (Makino) in the trash does not satisfy the cost', () => {
    const g = start({ hand: [K6], trash: [MAKINO] });
    expect(offeredAbilities(g, g.find('p1', 'characters', ID))).toEqual([]);
  });

  it("a [Kin'emon] with another power (8000) in the trash does not satisfy the cost either", () => {
    const g = start({ hand: [K6], trash: [K6] });
    expect(offeredAbilities(g, g.find('p1', 'characters', ID))).toEqual([]);
  });

  it("with two 0-power [Kin'emon] in the trash exactly one is placed at the bottom", () => {
    const g = start({ hand: [K6], trash: [K0, K0] });
    useAbility(g, g.find('p1', 'characters', ID));
    // Two identical candidates: the cost asks which one (a pick of cards in the trash).
    need(g, 'choose', 'p1');
    expect(decision(g)?.purpose).toBe('cost');
    expect(offeredCards(g)).toEqual([K0, K0]);
    payHand(g, [K0]);
    settleOrders(g);
    expect(ofZone(g, 'p1', 'trash')).toEqual([K0]);
    expect(
      g
        .zone('p1', 'deck')
        .slice(-2)
        .map((c) => c.card)
        .sort(),
    ).toEqual([ID, K0].sort());
  });

  it("hand filter: a cost-6 [Kin'emon] of any text is offered; a cost-4 [Kin'emon] and a cost-6 Character of another name are not", () => {
    const g = start({ hand: [K6, K6_YELLOW, K4, SC6.c8k], trash: [K0] });
    activate(g);
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([K6, K6_YELLOW].sort());
  });

  it('"up to 1": the play may be skipped; the cost stays paid', () => {
    const g = start({ hand: [K6], trash: [K0] });
    activate(g);
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    expect(decision(g)?.max).toBe(1);
    none(g);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(ofZone(g, 'p1', 'hand')).toEqual([K6]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([]);
  });

  it('with nothing playable in hand the pick is still asked (empty), and the cost has been paid', () => {
    const g = start({ hand: [K4, SC6.c8k], trash: [K0] });
    activate(g);
    expect(isChoose(g)).toBe(true);
    expect(offeredCards(g)).toEqual([]);
    expect(decision(g)?.max).toBe(0);
    none(g);
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([]);
  });

  it('the cost removes this Character first: with 5 Characters the new one fits without trashing another', () => {
    const g = start({
      hand: [K6],
      trash: [K0],
      chars: [ID, SC6.c3k, SC6.c3k, SC6.c3k, SC6.c3k],
    });
    activate(g);
    pickCards(g, [K6]);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([K6, SC6.c3k, SC6.c3k, SC6.c3k, SC6.c3k].sort());
    expect(ofZone(g, 'p1', 'trash')).toEqual([]);
  });

  it('can be used the turn it was played (no attack is involved)', () => {
    const g = start({ hand: [K6], trash: [K0], chars: [{ card: ID, playedThisTurn: true }] });
    expect(offeredAbilities(g, g.find('p1', 'characters', ID))).toHaveLength(1);
  });

  it("a [Kin'emon] placed from the trash is no longer in the trash and not a Character on the field", () => {
    const g = start({ hand: [K6], trash: [K0, SC6.c3k] });
    activate(g);
    pickCards(g, [K6]);
    expect(ofZone(g, 'p1', 'trash')).toEqual([SC6.c3k]);
    expect(ofZone(g, 'p1', 'characters')).toEqual([K6]);
  });
});
