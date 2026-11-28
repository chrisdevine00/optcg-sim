/**
 * OP18-026 Sanji (Character, Green, cost 2, 2000, Counter +2000, {Water Seven}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "If your {Straw Hat Crew} type Character would be removed from the field by your opponent's
 *    effect, you may trash this Character instead."
 *
 * Rules: an optional replacement (CR 8-1-3-4, 8-1-3-4-1; RL-31: "may" is optional). "Removed from
 * the field" covers K.O., return to hand and placing in the deck (CR 4-11-2). A K.O. in battle is
 * not an effect, and p1's own effects are not "your opponent's effect". Text works only on the
 * field (CR 2-8-2). The replacement cannot apply twice to the same event (CR 8-1-3-4-3).
 *
 * Opponent removal: OP09-077 Gum-Gum Lightning ("[Main] DON!! -2: K.O. up to 1 of your opponent's
 * Characters with 6000 power or less", cost 2) and OP17-046 Gloriosa (On Play: place up to 1
 * Character with cost 5 or less at the bottom of the owner's deck).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { attack, noDefence, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  AKP,
  BLUE,
  choose,
  CH,
  count,
  decline,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  ROCKS,
  side,
  sortedIds,
  theirTurn,
} from './kit-ga.ts';

const SANJI = 'OP18-026';

/** p2's turn: p2 (Kaido Leader) holds Gum-Gum Lightning; p1 has Sanji and `chars` on the field. */
function threatened(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return theirTurn(
    side(LEAD.luffy, RED, { characters: [SANJI, CH.usopp3], ...p1 }),
    side(LEAD.kaido, PURPLE, { hand: [AKP.lightning], costArea: { active: 4, rested: 0 }, ...p2 }),
  );
}

/** p2 plays Gum-Gum Lightning, pays DON!! -2 and targets `target`. */
function lightning(g: TestGame, target: string, nth = 0) {
  play(g, g.find('p2', 'hand', AKP.lightning, nth));
  if (offered(g, 'p2')) accept(g);
  payDon(g, 2);
  choose(g, [target]);
}

describe('OP18-026 Sanji: trash this Character instead of a {Straw Hat Crew} Character removed by the opponent’s effect', () => {
  it('happy path: an opponent’s K.O. on another {Straw Hat Crew} Character; accepting trashes Sanji and the Character stays', () => {
    const g = threatened();
    const usopp = g.find('p1', 'characters', CH.usopp3);
    lightning(g, usopp);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(g.card(usopp).zone).toBe('characters');
    expect(sortedIds(g, 'p1', 'characters')).toEqual([CH.usopp3]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([SANJI]);
  });

  it('CR 8-1-3-4-1: declining lets the K.O. happen and Sanji stays', () => {
    const g = threatened();
    lightning(g, g.find('p1', 'characters', CH.usopp3));
    decline(g);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.usopp3]);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([SANJI]);
  });

  it('works while Sanji is rested', () => {
    const g = threatened({ characters: [{ card: SANJI, rested: true }, CH.usopp3] });
    lightning(g, g.find('p1', 'characters', CH.usopp3));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([CH.usopp3]);
  });

  it('"{Straw Hat Crew} type": a Character without that type (Marco) gets no offer and is K.O.’d', () => {
    const g = threatened({ characters: [SANJI, CH.marco3] });
    lightning(g, g.find('p1', 'characters', CH.marco3));
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.marco3]);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([SANJI]);
  });

  it('"removed from the field" includes placing at the bottom of the deck (opponent’s Gloriosa)', () => {
    const g = theirTurn(
      side(LEAD.luffy, RED, { characters: [SANJI, CH.usopp3] }),
      side(LEAD.rocks, BLUE, { hand: [ROCKS.gloriosa], costArea: { active: 4, rested: 0 } }),
    );
    const usopp = g.find('p1', 'characters', CH.usopp3);
    play(g, g.find('p2', 'hand', ROCKS.gloriosa));
    choose(g, [usopp]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(g.card(usopp).zone).toBe('characters');
    expect(sortedIds(g, 'p1', 'trash')).toEqual([SANJI]);
  });

  it('CR 10-2-1-1: a K.O. in battle is not an effect: no offer', () => {
    // p2's OP02-007 Thatch (8000) attacks the rested Usopp (5000).
    const g = threatened(
      { characters: [SANJI, { card: CH.usopp3, rested: true }] },
      { characters: [CH.thatch6] },
    );
    attack(g, g.find('p2', 'characters', CH.thatch6), g.find('p1', 'characters', CH.usopp3));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.usopp3]);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([SANJI]);
  });

  it('p1’s own effect is not "your opponent’s effect": p1’s Gloriosa bottom-decks p1’s Usopp with no offer', () => {
    const g = myTurn(
      side(LEAD.rocks, BLUE, {
        characters: [SANJI, CH.usopp3],
        hand: [ROCKS.gloriosa],
        costArea: { active: 4, rested: 0 },
      }),
      side(LEAD.luffy, RED),
    );
    const usopp = g.find('p1', 'characters', CH.usopp3);
    play(g, g.find('p1', 'hand', ROCKS.gloriosa));
    choose(g, [usopp]);
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([SANJI, ROCKS.gloriosa].sort());
  });

  it('CR 2-8-2: Sanji in hand (not on the field) does nothing', () => {
    const g = threatened({ characters: [CH.usopp3], hand: [SANJI] });
    lightning(g, g.find('p1', 'characters', CH.usopp3));
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([CH.usopp3]);
  });

  it('no [Once Per Turn]: a second Sanji replaces a second removal in the same turn', () => {
    const g = threatened(
      { characters: [SANJI, SANJI, CH.usopp3, CH.zoro4] },
      { hand: [AKP.lightning, AKP.lightning], costArea: { active: 8, rested: 0 } },
    );
    lightning(g, g.find('p1', 'characters', CH.usopp3));
    accept(g);
    lightning(g, g.find('p1', 'characters', CH.zoro4));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([CH.usopp3, CH.zoro4].sort());
    expect(count(g, 'p1', 'trash')).toBe(2);
  });

  it('with no other Sanji copy left, the last one removed is just removed (nothing replaces it)', () => {
    const g = threatened({ characters: [SANJI] });
    lightning(g, g.find('p1', 'characters', SANJI));
    // Sanji himself is the only candidate: the outcome is that Sanji is gone either way.
    if (offered(g, 'p1')) accept(g);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([SANJI]);
  });
});
