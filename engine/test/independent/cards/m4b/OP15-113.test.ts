/**
 * OP15-113 Roronoa Zoro (Character, Yellow, cost 4, 6000; Straw Hat Crew / Sky Island).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: Add up to 1 card from the top of your deck
 * to the top of your Life cards."
 *
 * Rules: CR 8-3-1-4 optional cost (declining means no effect); CR 8-3-1-3 an unpayable cost is not
 * offered; "up to 1" CR 8-4-4-1; a card added to Life by an effect is face-down (CR 3-10-2).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  accept,
  BLUE,
  chooseNone,
  decline,
  kind,
  LD,
  LEAD,
  myTurn,
  offered,
  payWith,
  playFromHand,
  RED,
  rep,
  settleYes,
  side,
  sortedIds,
  VAN,
  zoneCards,
} from './kit-d.ts';

const ZORO = 'OP15-113';

function game(p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LD.navy, BLUE, {
      hand: [ZORO, VAN.komachiyo],
      deck: [VAN.sai, VAN.marco, ...rep(BLUE, 10)],
      life: [VAN.thatch, VAN.kingdew, VAN.hajrudin, VAN.marco],
      costArea: { active: 4, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
}

describe('OP15-113 Roronoa Zoro [On Play]: you may trash 1 card from hand: deck top to the top of Life', () => {
  it('happy path: hand −1 (trashed), Life +1 with the old deck top on top, face-down', () => {
    const g = game();
    playFromHand(g, ZORO);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    settleYes(g, 'p1');
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.komachiyo]);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.life('p1')).toBe(5);
    expect(zoneCards(g, 'p1', 'life')[0]).toBe(VAN.sai);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(zoneCards(g, 'p1', 'deck')[0]).toBe(VAN.marco);
    expect(g.zone('p1', 'deck')).toHaveLength(11);
    expect(kind(g)).toBe('main');
  });

  it('CR 8-3-1-4: declining the trash changes nothing', () => {
    const g = game();
    playFromHand(g, ZORO);
    decline(g);
    expect(g.life('p1')).toBe(4);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.komachiyo]);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    expect(g.zone('p1', 'deck')).toHaveLength(12);
  });

  it('CR 8-4-4-1: after paying, "up to 1" may add nothing: the card is still trashed', () => {
    const g = game();
    playFromHand(g, ZORO);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.komachiyo)]);
    if (kind(g) === 'choose' || kind(g) === 'optional') {
      if (kind(g) === 'optional') decline(g);
      else chooseNone(g);
    }
    expect(g.life('p1')).toBe(4);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.komachiyo]);
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid: nothing is offered, no Life added', () => {
    const g = game({ hand: [ZORO] });
    playFromHand(g, ZORO);
    expect(offered(g, 'p1')).toBe(false);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(4);
  });

  it('the trashed card is chosen by the player from hand (any card of the hand)', () => {
    const g = game({ hand: [ZORO, VAN.komachiyo, VAN.sai] });
    playFromHand(g, ZORO);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.sai)]);
    settleYes(g, 'p1');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.komachiyo]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
  });
});
