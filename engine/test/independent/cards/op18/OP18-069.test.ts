/**
 * OP18-069 Sodomu & Gomora (Character, Purple, cost 1, 2000, Counter +2000, {Animal}/{Water Seven}/
 * {The Franky Family}).
 *
 * Card text (cards/data):
 *   "If your {The Franky Family} type Character would be K.O.'d, you may DON!! −1 and rest this
 *    Character instead."
 *
 * Rules: an optional replacement effect (CR 8-1-3-4) on either player's turn, for a K.O. by battle
 * or by effect. The replacement cost is DON!! −1 AND resting this Character: all parts must be
 * payable (CR 8-1-3-4-5: an impossible replacement is not applied), so a rested Sodomu cannot do it.
 * It protects any {The Franky Family} Character, Sodomu himself included (M6b-Q4).
 *
 * Scenery: OP03-061 Kiwi & Mozu (Purple, cost 2, 4000, {Water Seven}/{The Franky Family}, vanilla);
 * OP01-012 Sai (no relevant type); OP02-007 Thatch (8000) attacks; OP09-077 Gum-Gum Lightning.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  cardIds,
  CH,
  decline,
  donOf,
  KO_EVENT,
  kind,
  LDR,
  LEAD,
  lightningKo,
  offered,
  PURPLE,
  RED,
  side,
  strike,
  theirTurn,
  VAN,
} from './kit-d.ts';

const SODOMU = 'OP18-069';
const KIWI = 'OP03-061';

/** p2's turn: Thatch (8000) is about to attack. p1 has `chars` on the field and 2 active DON!!. */
function game(
  chars: (string | { card: string; rested?: boolean })[],
  p1: Partial<PlayerSpec> = {},
): TestGame {
  return theirTurn(
    side(LDR.luffy, RED, { characters: chars, costArea: { active: 2, rested: 0 }, ...p1 }),
    side(LDR.luffy, RED, { characters: [CH.thatch6] }),
  );
}

const hit = (g: TestGame, target: string) =>
  strike(g, g.find('p2', 'characters', CH.thatch6), g.find('p1', 'characters', target));

describe('OP18-069 Sodomu & Gomora: if your {The Franky Family} Character would be K.O.’d, you may DON!! −1 and rest this Character instead', () => {
  it('accepting: another {The Franky Family} Character survives, Sodomu is rested, 1 DON!! returns', () => {
    const g = game([SODOMU, { card: KIWI, rested: true }]);
    hit(g, KIWI);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: { from: 'costActive' } });
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([KIWI, SODOMU].sort());
    expect(g.card(g.find('p1', 'characters', SODOMU)).rested).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, deck: 9 });
    expect(cardIds(g, 'p1', 'trash')).toEqual([]);
  });

  it('declining: the Character is K.O.’d, Sodomu stays active and no DON!! returns', () => {
    const g = game([SODOMU, { card: KIWI, rested: true }]);
    hit(g, KIWI);
    decline(g);
    expect(cardIds(g, 'p1', 'trash')).toEqual([KIWI]);
    expect(g.card(g.find('p1', 'characters', SODOMU)).rested).toBe(false);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
  });

  it('only {The Franky Family} Characters: a Character without that type is K.O.’d with no offer', () => {
    const g = game([SODOMU, { card: VAN.sai, rested: true }]);
    hit(g, VAN.sai);
    expect(offered(g, 'p1')).toBe(false);
    expect(cardIds(g, 'p1', 'trash')).toEqual([VAN.sai]);
  });

  it('a rested Sodomu cannot pay "rest this Character": no offer', () => {
    const g = game([
      { card: SODOMU, rested: true },
      { card: KIWI, rested: true },
    ]);
    hit(g, KIWI);
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'trash')).toEqual([KIWI]);
  });

  it('with no DON!! on the field the DON!! −1 cannot be paid: no offer', () => {
    const g = game([SODOMU, { card: KIWI, rested: true }], { costArea: { active: 0, rested: 0 } });
    hit(g, KIWI);
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'trash')).toEqual([KIWI]);
  });

  it('a K.O. by an opponent’s effect is replaced too (Gum-Gum Lightning on Kiwi)', () => {
    const g = theirTurn(
      side(LDR.luffy, RED, { characters: [SODOMU, KIWI], costArea: { active: 2, rested: 0 } }),
      side(LEAD.kaido, PURPLE, { hand: [KO_EVENT], costArea: { active: 4, rested: 0 } }),
    );
    lightningKo(g, g.find('p1', 'characters', KIWI));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: { from: 'costActive' } });
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([KIWI, SODOMU].sort());
    expect(g.card(g.find('p1', 'characters', SODOMU)).rested).toBe(true);
  });

  it('Sodomu himself is the K.O. target of an effect: the replacement (DON!! −1, rest himself) is offered', () => {
    const g = theirTurn(
      side(LDR.luffy, RED, { characters: [SODOMU], costArea: { active: 2, rested: 0 } }),
      side(LEAD.kaido, PURPLE, { hand: [KO_EVENT], costArea: { active: 4, rested: 0 } }),
    );
    lightningKo(g, g.find('p1', 'characters', SODOMU));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: { from: 'costActive' } });
    expect(cardIds(g, 'p1', 'characters')).toEqual([SODOMU]);
    expect(g.card(g.find('p1', 'characters', SODOMU)).rested).toBe(true);
  });
});
