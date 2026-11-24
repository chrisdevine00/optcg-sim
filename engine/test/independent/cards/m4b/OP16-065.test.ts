/**
 * OP16-065 Sakazuki (Character, Purple, cost 7, 8000; Navy / Admiral).
 *
 * Card text:
 *   "[On Play] DON!! −1: Give up to 1 of your opponent's Characters −6000 power until the end of your
 *    opponent's next End Phase.
 *    [Activate: Main] [Once Per Turn] You may rest 1 of your DON!! cards: If your Leader has the {Navy}
 *    type, add up to 2 DON!! cards from your DON!! deck and set them as active."
 *
 * Rules: DON!! −1 is an optional cost for an auto effect (asked first, CR 8-3-1-4; the engine's
 * "Auto with a cost asks first"); CR 8-3-1-6 DON!! −N returns DON!! to the DON!! deck; "until the end of
 * your opponent's next End Phase" (CR 6-6-1-2): the −6000 lasts through the opponent's next turn, not
 * beyond; CR 4-10-1; "up to 2" adds as many as the DON!! deck allows (CR 8-4-4-1); CR 10-2-13.
 * Targets: OP02-007 Thatch (8000), OP02-020 LittleOars Jr. (9000). Leaders: ST06-001 (Navy), ST03-001.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  accept,
  activate,
  BLUE,
  canActivate,
  choiceCards,
  choose,
  chooseNone,
  decline,
  decider,
  donOf,
  endTurn,
  kind,
  LD,
  LEAD,
  myTurn,
  offered,
  payDon,
  playFromHand,
  RED,
  side,
  VAN,
} from './kit-d.ts';
import { takeMost } from '../../helpers.ts';

const SAKA = 'OP16-065';

describe('OP16-065 Sakazuki [On Play]: DON!! −1: an opposing Character gets −6000 until the end of the opponent’s next End Phase', () => {
  function played(p1: Partial<PlayerSpec> = {}) {
    const g = myTurn(
      side(LD.navy, BLUE, { hand: [SAKA], costArea: { active: 8, rested: 0 }, ...p1 }),
      side(LEAD.luffy, RED, { characters: [VAN.thatch, VAN.littleOars] }),
    );
    playFromHand(g, SAKA);
    return g;
  }

  it('accepting: one DON!! goes back to the DON!! deck and the chosen Character loses 6000', () => {
    const g = played();
    const deckBefore = donOf(g, 'p1').deck;
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 1);
    expect(choiceCards(g)).toEqual([VAN.littleOars, VAN.thatch].sort());
    choose(g, [g.find('p2', 'characters', VAN.thatch)]);
    expect(donOf(g, 'p1').deck).toBe(deckBefore + 1);
    expect(g.power(g.find('p2', 'characters', VAN.thatch))).toBe(2000);
    expect(g.power(g.find('p2', 'characters', VAN.littleOars))).toBe(9000);
  });

  it('the reduction lasts through the opponent’s next turn and ends with its End Phase', () => {
    const g = played();
    accept(g);
    payDon(g, 1);
    choose(g, [g.find('p2', 'characters', VAN.thatch)]);
    endTurn(g);
    expect(decider(g)).toBe('p2');
    expect(g.power(g.find('p2', 'characters', VAN.thatch))).toBe(2000);
    endTurn(g);
    expect(g.power(g.find('p2', 'characters', VAN.thatch))).toBe(8000);
  });

  it('"your opponent’s": only the opponent’s Characters are targets (Sakazuki herself is not)', () => {
    const g = played();
    accept(g);
    payDon(g, 1);
    expect(choiceCards(g)).not.toContain(SAKA);
  });

  it('CR 8-4-4-1: up to 1 may be nobody (the DON!! is still returned)', () => {
    const g = played();
    const deckBefore = donOf(g, 'p1').deck;
    accept(g);
    payDon(g, 1);
    chooseNone(g);
    expect(donOf(g, 'p1').deck).toBe(deckBefore + 1);
    expect(g.power(g.find('p2', 'characters', VAN.thatch))).toBe(8000);
  });

  it('CR 8-3-1-4: declining the DON!! −1 does nothing', () => {
    const g = played();
    const deckBefore = donOf(g, 'p1').deck;
    decline(g);
    expect(donOf(g, 'p1').deck).toBe(deckBefore);
    expect(g.power(g.find('p2', 'characters', VAN.thatch))).toBe(8000);
    expect(kind(g)).toBe('main');
  });
});

describe('OP16-065 Sakazuki [Activate: Main] [Once Per Turn]: rest 1 DON!!: Navy Leader: add up to 2 active DON!!', () => {
  function onField(leader: string, p1: Partial<PlayerSpec> = {}) {
    return myTurn(
      side(leader, BLUE, { characters: [SAKA], costArea: { active: 2, rested: 0 }, ...p1 }),
      side(LEAD.luffy, RED),
    );
  }

  it('Navy Leader: 1 DON!! is rested as the cost, then 2 DON!! come from the deck ACTIVE', () => {
    const g = onField(LD.navy);
    const before = donOf(g, 'p1');
    activate(g, g.find('p1', 'characters', SAKA));
    payDon(g, 1);
    takeMost(g);
    expect(donOf(g, 'p1')).toMatchObject({
      active: before.active - 1 + 2,
      rested: before.rested + 1,
      deck: before.deck - 2,
    });
  });

  it('"up to 2" adds only what the DON!! deck holds: 1 left, 1 added', () => {
    const g = onField(LD.navy, { donDeck: 1, costArea: { active: 2, rested: 7 } });
    activate(g, g.find('p1', 'characters', SAKA));
    payDon(g, 1, 'costActive');
    takeMost(g);
    expect(donOf(g, 'p1')).toMatchObject({ deck: 0 });
    expect(donOf(g, 'p1').active + donOf(g, 'p1').rested).toBe(10);
  });

  it('CR 4-10-1: a Leader without the Navy type: the DON!! is rested (cost) but none is added', () => {
    const g = onField(LD.warlord);
    const before = donOf(g, 'p1');
    activate(g, g.find('p1', 'characters', SAKA));
    payDon(g, 1);
    expect(donOf(g, 'p1')).toMatchObject({
      active: before.active - 1,
      rested: before.rested + 1,
      deck: before.deck,
    });
  });

  it('CR 10-2-13 [Once Per Turn]: a second activation is not offered', () => {
    const g = onField(LD.navy);
    activate(g, g.find('p1', 'characters', SAKA));
    payDon(g, 1);
    takeMost(g);
    expect(kind(g)).toBe('main');
    expect(canActivate(g, g.find('p1', 'characters', SAKA))).toBe(false);
  });

  it('CR 8-3-1-3: with no active DON!! to rest the cost cannot be paid', () => {
    const g = onField(LD.navy, { costArea: { active: 0, rested: 3 } });
    expect(canActivate(g, g.find('p1', 'characters', SAKA))).toBe(false);
  });
});
