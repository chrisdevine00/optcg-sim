/**
 * ST17-004 Boa Hancock (Character, Blue, cost 4, 6000; Kuja Pirates / The Seven Warlords of the Sea).
 *
 * Card text: "[Blocker] [On Play] Look at 3 cards from the top of your deck and place them at the top or
 * bottom of your deck in any order. Then, give up to 1 rested DON!! card to 1 of your "The Seven
 * Warlords of the Sea" type Leader or Character cards."
 *
 * Rules: CR 10-1-4 [Blocker]; only the top 3 are looked at and each is placed on the top or bottom
 * (CR 8-4-3 style), so the deck size never changes; given DON!! come from the RESTED cost-area DON!!
 * (paying the cost rests 4 DON!!); "up to 1" (CR 8-4-4-1); the target must have the SWotS type.
 * Deck (top first): Komachiyo, Sai, Marco (looked at), then Kingdew, Thatch and fillers.
 * Leader ST03-001 Crocodile (SWotS). Characters: OP02-054 Gecko Moria (SWotS), OP01-018 Hajrudin (not).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  attack,
  blockers,
  BLUE,
  LD,
  LEAD,
  myTurn,
  outcomes,
  playFromHand,
  RED,
  rep,
  side,
  sorted,
  theirTurn,
  V,
  VAN,
  zoneCards,
  kind,
} from './kit-d.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const HAN = 'ST17-004';
const LOOKED = [VAN.komachiyo, VAN.sai, VAN.marco];

function game(p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LD.warlord, BLUE, {
      hand: [HAN],
      deck: [...LOOKED, VAN.kingdew, VAN.thatch, ...rep(BLUE, 8)],
      characters: [V.moria4, VAN.hajrudin],
      costArea: { active: 4, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
}

describe('ST17-004 Boa Hancock [On Play]: look at 3 and place them on top or bottom in any order', () => {
  it('only the top 3 are rearranged, each on top or bottom; the deck size and the other cards’ order never change', () => {
    const g = game();
    playFromHand(g, HAN);
    const ends = outcomes(g, 'p1', (x) => zoneCards(x, 'p1', 'deck').join(','), 14);
    expect(ends.size).toBeGreaterThan(1);
    const rest = [VAN.kingdew, VAN.thatch, ...rep(BLUE, 8)];
    for (const e of ends) {
      const deck = e.split(',');
      expect(deck).toHaveLength(13);
      // Remove the three looked-at cards: what is left is the original rest, in the original order.
      const without = [...deck];
      for (const c of LOOKED) without.splice(without.indexOf(c), 1);
      expect(without).toEqual(rest);
    }
  });

  it('placements: all on top and all at the bottom are reachable; the 3 cannot be split (QA-OP17 OP17-050, same wording)', () => {
    const g = game();
    playFromHand(g, HAN);
    const ends = [...outcomes(g, 'p1', (x) => zoneCards(x, 'p1', 'deck').join(','), 14)].map((e) =>
      e.split(','),
    );
    expect(ends.some((d) => LOOKED.every((c) => d.slice(0, 3).includes(c)))).toBe(true); // all on top
    expect(ends.some((d) => LOOKED.every((c) => d.slice(-3).includes(c)))).toBe(true); // all at the bottom
    for (const d of ends) {
      const onTop = LOOKED.every((c) => d.slice(0, 3).includes(c));
      const atBottom = LOOKED.every((c) => d.slice(-3).includes(c));
      expect(onTop || atBottom).toBe(true);
    }
    expect(ends.some((d) => d[0] === VAN.kingdew)).toBe(true);
  });

  it('every order of the cards placed together is reachable (the player chooses the order)', () => {
    const g = game();
    playFromHand(g, HAN);
    const ends = [
      ...outcomes(g, 'p1', (x) => zoneCards(x, 'p1', 'deck').slice(0, 3).join(','), 14),
    ];
    // All three on top in all 6 orders.
    const perms = ends.filter((e) => LOOKED.every((c) => e.split(',').includes(c)));
    expect(new Set(perms).size).toBe(6);
  });
});

describe('ST17-004 Boa Hancock [On Play]: then give up to 1 rested DON!! to a Seven Warlords Leader or Character', () => {
  const holders = (x: TestGame) =>
    [x.leader('p1'), ...x.zone('p1', 'characters').map((c) => c.instance)]
      .filter((i) => x.card(i).don > 0)
      .map((i) => x.card(i).card)
      .sort()
      .join('+');

  it('targets: the Leader, Gecko Moria and Hancock herself (all SWotS); Hajrudin never receives it', () => {
    const g = game();
    playFromHand(g, HAN);
    const ends = outcomes(g, 'p1', holders, 14);
    expect(ends.has(LD.warlord)).toBe(true);
    expect(ends.has(V.moria4)).toBe(true);
    expect(ends.has(HAN)).toBe(true);
    for (const e of ends) expect(e).not.toContain(VAN.hajrudin);
    // "up to 1": never two holders.
    for (const e of ends) expect(e.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  // DISAGREEMENTS-d.md, entry 2: "up to 1 rested DON!!" allows giving none (CR 8-4-4-1); the engine
  // forces a target pick, so no outcome leaves every card without DON!!.
  it('CR 8-4-4-1: "up to 1" allows giving no DON!! at all', () => {
    const g = game();
    playFromHand(g, HAN);
    const ends = outcomes(g, 'p1', (x) => `${holders(x)}|${x.card(x.leader('p1')).don}`, 14);
    expect(ends.has('|0')).toBe(true);
  });

  it('a Leader without the Seven Warlords type is not a target', () => {
    const g = myTurn(
      side(LD.navy, BLUE, {
        hand: [HAN],
        deck: [...LOOKED, ...rep(BLUE, 10)],
        costArea: { active: 4, rested: 0 },
      }),
      side(LEAD.luffy, RED),
    );
    playFromHand(g, HAN);
    const ends = outcomes(g, 'p1', holders, 14);
    expect(ends.has(LD.navy)).toBe(false);
    expect(ends.has(HAN)).toBe(true);
  });
});

describe('ST17-004 Boa Hancock: [Blocker]', () => {
  it('she can block on the opponent’s turn', () => {
    const g = theirTurn(side(LD.warlord, BLUE, { characters: [HAN] }), side(LEAD.luffy, RED));
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', HAN)]);
    expect(kind(g)).toBe('block');
    void sorted;
  });
});
