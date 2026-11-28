/**
 * OP18-095 I'm Late, I'm Very Late!! (Black Event, cost 1, {Celestial Dragons}/{Holy Knights of God}).
 *
 * Card text: "[Main] If your Leader has the {Celestial Dragons} type, look at 5 cards from the top of
 *             your deck; reveal up to 1 [Sleeptids] or {Holy Knights of God} type card and add it to
 *             your hand. Then, place the rest at the bottom of your deck in any order.
 *             [Trigger] Activate this card's [Main] effect."
 *
 * Reading: the Leader condition is checked as the effect resolves; "[Sleeptids]" names a card
 * (an {Elbaph}-only Character), "{Holy Knights of God}" a type. OP18-060 (the only {Celestial
 * Dragons} Leader, abilities removed) is the qualifying Leader; ST01-001 Luffy the other.
 * Scenery: OP18-085 Cerberus and OP18-119 Shamrock ({Holy Knights of God}), OP18-093 Sleeptids,
 * OP18-092 Zoro ({Elbaph} only), OP13-085 Saint Jalmac ({Celestial Dragons} only), Mohji.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  atMain,
  cardIds,
  need,
  none,
  offeredIds,
  passBlock,
  pickCards,
  play,
  settleOrders,
  kind,
  LDR,
} from './kit-e.ts';
import { LE, mineE, theirsE, X } from './kit-e.ts';

const EV = 'OP18-095';
const MISS = 'OP02-060';
const CERB = X.cerberus;
const SHAM = X.shamrock;
const SLEEP = X.sleeptids;
const ZORO = X.zoro;
const JALMAC = X.cd2;

function look(top: string[], leader: string = LE.cd) {
  const deck = [...top, ...Array.from({ length: 10 }, () => MISS)];
  const g = mineE(leader, { hand: [EV], deck });
  play(g, at(g, 'p1', 'hand', EV));
  return g;
}

describe('OP18-095 I’m Late, I’m Very Late!!: [Main] with a {Celestial Dragons} Leader', () => {
  it('offers [Sleeptids] and {Holy Knights of God} cards of the top 5, nothing else; the pick goes to hand', () => {
    const g = look([ZORO, CERB, JALMAC, SLEEP, SHAM]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CERB, SHAM, SLEEP].sort());
    pickCards(g, [SLEEP]);
    settleOrders(g);
    expect(atMain(g, 'p1')).toBe(true);
    expect(cardIds(g, 'p1', 'hand')).toEqual([SLEEP]);
    const d = cardIds(g, 'p1', 'deck');
    expect(d).toHaveLength(14);
    expect(d.slice(-4).sort()).toEqual([ZORO, CERB, JALMAC, SHAM].sort());
  });

  it('a {Celestial Dragons}-only or {Elbaph}-only card is not offered (type must be {Holy Knights of God})', () => {
    const g = look([ZORO, JALMAC, MISS, MISS, MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    settleOrders(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });

  it('"up to 1": may take nothing; all five go to the bottom', () => {
    const g = look([CERB, SHAM, SLEEP, MISS, MISS]);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'deck').slice(-5).sort()).toEqual(
      [CERB, SHAM, SLEEP, MISS, MISS].sort(),
    );
  });

  it('adds at most 1 even when several qualify', () => {
    const g = look([CERB, SHAM, SLEEP, MISS, MISS]);
    pickCards(g, [CERB]);
    settleOrders(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([CERB]);
  });

  it('only the top 5 are looked at: a qualifying card 6th from the top is not offered', () => {
    const g = look([MISS, MISS, MISS, MISS, MISS, CERB]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(CERB);
  });

  it('must not happen: with a Leader that is not {Celestial Dragons} nothing is looked at and the deck is unchanged', () => {
    const g = look([CERB, SHAM, SLEEP, MISS, MISS], LDR.luffy);
    expect(atMain(g, 'p1')).toBe(true);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(CERB);
    expect(cardIds(g, 'p1', 'trash')).toEqual([EV]);
  });
});

describe('OP18-095 I’m Late, I’m Very Late!!: [Trigger] activate this card’s [Main] effect', () => {
  function hit(leader: string) {
    const deck = [CERB, ZORO, MISS, MISS, MISS, MISS, MISS, MISS];
    const g = theirsE(leader, { life: [EV, MISS, MISS, MISS], deck });
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('with a {Celestial Dragons} Leader the Trigger looks at 5 and adds a [Holy Knights of God] card', () => {
    const g = hit(LE.cd);
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CERB]);
    pickCards(g, [CERB]);
    settleOrders(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([CERB]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([EV]);
  });

  it('with another Leader the Trigger resolves to nothing: the deck is unchanged', () => {
    const g = hit(LDR.luffy);
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(CERB);
    expect(cardIds(g, 'p1', 'trash')).toEqual([EV]);
  });

  it('declining the Trigger puts the Event in hand', () => {
    const g = hit(LE.cd);
    act(g, { type: 'trigger', activate: false });
    expect(cardIds(g, 'p1', 'hand')).toEqual([EV]);
  });
});
