/**
 * OP18-041 Ms. All Sunday (Leader, Blue, 5000, 5 Life, {Baroque Works}).
 *
 * Card text (cards/data):
 *   "When your Character with a type including "Baroque Works" and 3000 base power or more is
 *    K.O.'d, draw 1 card, and your opponent trashes 1 card from their hand."
 *
 * Rules: an automatic effect of the Leader triggered by a K.O. (battle or effect). "Type including"
 * is a substring match on the type line ({Former Baroque Works} qualifies). "Base power" is the
 * printed power. "Your Character" means the Leader owner's own. The opponent picks the card they
 * trash. No "once per turn", no "you may".
 *
 * Scenery: p2 attacks with OP02-006 Kingdew (7000) or plays OP09-077 Gum-Gum Lightning (K.O. up to
 * 1 Character with 6000 power or less).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { BW, CH, KO_EVENT, lightningKo, strike } from './kit-d.ts';
import {
  cardIds,
  choose,
  choices,
  LEAD,
  LDR,
  myTurn,
  need,
  PURPLE,
  RED,
  side,
  theirTurn,
  VAN,
} from './kit-d.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SUNDAY = 'OP18-041';
const BLUE_FILL = 'OP02-060';

/** p2's turn: p2 attacks p1's rested Character with Kingdew (7000). p1 has 3 cards in hand, p2 has 2. */
function battle(
  target: string,
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  return theirTurn(
    side(SUNDAY, BLUE_FILL, {
      characters: [{ card: target, rested: true }],
      hand: [VAN.sai, VAN.marco, VAN.thatch],
      deck: [VAN.komachiyo, ...Array.from({ length: 14 }, () => BLUE_FILL)],
      ...p1,
    }),
    side(LDR.luffy, RED, { characters: [CH.kingdew5], hand: [VAN.gordon, VAN.sunny], ...p2 }),
  );
}

describe('OP18-041 Ms. All Sunday: a Baroque Works Character with 3000+ base power is K.O.’d', () => {
  it('K.O. in battle: p1 draws 1 and p2 trashes 1 card they choose from hand', () => {
    const g = battle(BW.accel4);
    strike(g, g.find('p2', 'characters', CH.kingdew5), g.find('p1', 'characters', BW.accel4));
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(4);
    expect(cardIds(g, 'p1', 'hand')).toContain(VAN.komachiyo);
    need(g, 'choose', 'p2');
    expect(choices(g)).toHaveLength(2);
    choose(g, [g.find('p2', 'hand', VAN.sunny)]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([VAN.sunny]);
    expect(cardIds(g, 'p2', 'hand')).toEqual([VAN.gordon]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([BW.accel4]);
  });

  it('K.O. by an opponent’s effect also triggers it', () => {
    const g = theirTurn(
      side(SUNDAY, BLUE_FILL, {
        characters: [BW.accel4],
        deck: [VAN.komachiyo, ...Array.from({ length: 14 }, () => BLUE_FILL)],
      }),
      side(LEAD.kaido, PURPLE, {
        hand: [KO_EVENT, VAN.gordon],
        costArea: { active: 4, rested: 0 },
      }),
    );
    lightningKo(g, g.find('p1', 'characters', BW.accel4));
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.komachiyo]);
    need(g, 'choose', 'p2');
    choose(g, [g.find('p2', 'hand', VAN.gordon)]);
    expect(cardIds(g, 'p2', 'trash').sort()).toEqual([KO_EVENT, VAN.gordon].sort());
  });

  it('boundary: a Baroque Works Character with exactly 3000 base power qualifies', () => {
    const g = battle(BW.bw2);
    strike(g, g.find('p2', 'characters', CH.kingdew5), g.find('p1', 'characters', BW.bw2));
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(4);
    need(g, 'choose', 'p2');
  });

  it('boundary: a Baroque Works Character with 2000 base power does not qualify', () => {
    const g = battle(BW.bw2weak);
    strike(g, g.find('p2', 'characters', CH.kingdew5), g.find('p1', 'characters', BW.bw2weak));
    expect(cardIds(g, 'p1', 'trash')).toEqual([BW.bw2weak]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3);
    expect(cardIds(g, 'p2', 'hand')).toHaveLength(2);
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('"type including": {Former Baroque Works} qualifies', () => {
    const g = battle(BW.formerBw5);
    strike(g, g.find('p2', 'characters', CH.kingdew5), g.find('p1', 'characters', BW.formerBw5));
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(4);
    need(g, 'choose', 'p2');
  });

  it('a Character without a Baroque Works type (6000 base) does not trigger it', () => {
    const g = battle(VAN.hajrudin);
    strike(g, g.find('p2', 'characters', CH.kingdew5), g.find('p1', 'characters', VAN.hajrudin));
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.hajrudin]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(3);
    expect(cardIds(g, 'p2', 'hand')).toHaveLength(2);
  });

  it('"your Character": the opponent’s Baroque Works Character being K.O.’d does not trigger it', () => {
    const g = myTurn(
      side(SUNDAY, BLUE_FILL, { characters: [CH.kingdew5], hand: [VAN.sai] }),
      side(LDR.luffy, RED, { characters: [{ card: BW.accel4, rested: true }], hand: [VAN.gordon] }),
    );
    strike(g, g.find('p1', 'characters', CH.kingdew5), g.find('p2', 'characters', BW.accel4));
    expect(cardIds(g, 'p2', 'trash')).toEqual([BW.accel4]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    expect(cardIds(g, 'p2', 'hand')).toEqual([VAN.gordon]);
  });

  it('the opponent with an empty hand trashes nothing; p1 still draws', () => {
    const g = battle(BW.accel4, {}, { hand: [] });
    strike(g, g.find('p2', 'characters', CH.kingdew5), g.find('p1', 'characters', BW.accel4));
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(4);
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
  });
});
