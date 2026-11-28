/**
 * OP18-054 Mr.8 & Ms. Monday (Character, Blue, cost 2, 3000, Counter +2000, {Baroque Works}).
 *
 * Card text (cards/data):
 *   "[DON!! x1] This Character gains +1000 power.
 *    [Opponent's Turn] [Once Per Turn] If your Character with a type including "Baroque Works"
 *    would be removed from the field by your opponent's effect, you may trash 1 card from your hand
 *    instead."
 *
 * Rules: an optional replacement effect (CR 8-1-3-4): only during the opponent's turn, only for the
 * opponent's EFFECTS (a battle K.O. is not an effect), for Characters whose type line includes
 * "Baroque Works" (this Character included, M6b-Q4), once per turn; it needs a card in hand to pay;
 * declining lets the removal happen.
 *
 * Opponent removal: OP09-077 Gum-Gum Lightning (K.O. up to 1 Character with 6000 power or less).
 * Scenery: OP18-043 Accelegator (Blue, cost 4, 6000, {Baroque Works}); OP01-018 Hajrudin (cost 4,
 * 6000, no type); OP01-012 Sai / OP01-023 Marco (hand fodder).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, noDefence } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  BW,
  cardIds,
  CH,
  choose,
  decline,
  describeDonPlus,
  KO_EVENT,
  LDR,
  LEAD,
  lightningKo,
  myTurn,
  need,
  offered,
  PURPLE,
  RED,
  side,
  theirTurn,
  VAN,
  play,
  kind,
} from './kit-d.ts';

const MR8 = 'OP18-054';
const CROC = 'ST03-001';

describeDonPlus(MR8, 3000);

/** p2's turn: p2 holds two Gum-Gum Lightnings; p1 has Mr.8, `chars` and a hand of 2 fodder cards. */
function threatened(
  chars: string[],
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  return theirTurn(
    side(CROC, 'OP02-060', { characters: [MR8, ...chars], hand: [VAN.sai, VAN.marco], ...p1 }),
    side(LEAD.kaido, PURPLE, {
      hand: [KO_EVENT, KO_EVENT],
      costArea: { active: 10, rested: 0 },
      ...p2,
    }),
  );
}

describe('OP18-054 Mr.8 & Ms. Monday: [Opponent’s Turn] [Once Per Turn] trash 1 card from hand instead of a Baroque Works Character being removed', () => {
  it('accepting: the opponent’s K.O. on another Baroque Works Character is replaced; I trash 1 card from hand', () => {
    const g = threatened([BW.accel4]);
    lightningKo(g, g.find('p1', 'characters', BW.accel4));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([BW.accel4, MR8].sort());
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.marco]);
  });

  it('declining: the Character is K.O.’d and no card is trashed from hand', () => {
    const g = threatened([BW.accel4]);
    lightningKo(g, g.find('p1', 'characters', BW.accel4));
    decline(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([MR8]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([BW.accel4]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
  });

  it('it covers Mr.8 himself (this Character is a Baroque Works Character): the K.O. on him is replaced', () => {
    const g = threatened([]);
    lightningKo(g, g.find('p1', 'characters', MR8));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.marco) });
    expect(cardIds(g, 'p1', 'characters')).toEqual([MR8]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.marco]);
  });

  it('only Baroque Works Characters: a Character without that type gets no offer and is K.O.’d', () => {
    const g = threatened([CH.hajrudin4]);
    lightningKo(g, g.find('p1', 'characters', CH.hajrudin4));
    expect(offered(g, 'p1')).toBe(false);
    expect(cardIds(g, 'p1', 'trash')).toEqual([CH.hajrudin4]);
    expect(cardIds(g, 'p1', 'hand')).toHaveLength(2);
  });

  it('[Once Per Turn]: a second removal in the same turn is not offered', () => {
    const g = threatened([BW.accel4, BW.bw2]);
    lightningKo(g, g.find('p1', 'characters', BW.accel4));
    accept(g);
    act(g, { type: 'pick', choice: g.find('p1', 'hand', VAN.sai) });
    expect(kind(g)).toBe('main');
    lightningKo(g, g.find('p1', 'characters', BW.bw2));
    expect(offered(g, 'p1')).toBe(false);
    expect(cardIds(g, 'p1', 'trash').sort()).toEqual([VAN.sai, BW.bw2].sort());
  });

  it('a K.O. in battle is not an opponent’s effect: no offer', () => {
    const g = theirTurn(
      side(CROC, 'OP02-060', {
        characters: [MR8, { card: BW.accel4, rested: true }],
        hand: [VAN.sai],
      }),
      side(LDR.luffy, RED, { characters: [CH.kingdew5] }),
    );
    attack(g, g.find('p2', 'characters', CH.kingdew5), g.find('p1', 'characters', BW.accel4));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(cardIds(g, 'p1', 'trash')).toEqual([BW.accel4]);
  });

  it('it needs a card in hand: with an empty hand the K.O. simply happens', () => {
    const g = threatened([BW.accel4], { hand: [] });
    lightningKo(g, g.find('p1', 'characters', BW.accel4));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'trash')).toEqual([BW.accel4]);
  });

  it('"[Opponent’s Turn]" and "your opponent’s effect": on my own turn my own effect gets no offer', () => {
    // p1's OP17-046 Gloriosa ([On Play]: place up to 1 Character with a cost of 5 or less at the bottom of its owner's deck).
    const g = myTurn(
      side(LEAD.rocks, 'OP02-060', {
        characters: [MR8, BW.accel4],
        hand: ['OP17-046', VAN.sai],
        costArea: { active: 4, rested: 0 },
      }),
      side(LDR.luffy, RED),
    );
    play(g, g.find('p1', 'hand', 'OP17-046'));
    choose(g, [g.find('p1', 'characters', BW.accel4)]);
    expect(offered(g, 'p1')).toBe(false);
    expect(cardIds(g, 'p1', 'characters')).toContain(MR8);
    expect(cardIds(g, 'p1', 'characters')).not.toContain(BW.accel4);
    expect(cardIds(g, 'p1', 'deck').slice(-1)).toEqual([BW.accel4]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
  });
});
