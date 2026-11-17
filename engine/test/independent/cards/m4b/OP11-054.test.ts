/**
 * OP11-054 Nami (Character, Blue, cost 5, 6000, Counter +1000; Straw Hat Crew).
 *
 * Card text:
 *   "[Blocker]
 *    [On Play] If your Leader is multicolored, draw 3 cards and place 2 cards from your hand at the
 *    top or bottom of your deck in any order."
 *
 * Rules: CR 10-1-4 [Blocker]; CR 4-10-1 a false "if" resolves nothing; "place 2 cards from your hand"
 * is exact (CR 8-4-4-1: as many as possible), each at the top or bottom, in any order the player
 * chooses. Leaders: OP01-002 Law (Green/Red, multicolored), ST06-001 (Black only).
 * Deck: five distinct cards A..E then fillers, so what is drawn and placed is observable.
 */
import { describe, expect, it } from 'vitest';
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
  theirTurn,
  VAN,
  zoneCards,
  kind,
} from './kit-d.ts';

const NAMI = 'OP11-054';
const A = VAN.komachiyo;
const B = VAN.sai;
const C = VAN.marco;
const D = VAN.kingdew;
const E = VAN.thatch;

function game(leader: string) {
  return myTurn(
    side(leader, BLUE, {
      hand: [NAMI],
      costArea: { active: 5, rested: 0 },
      deck: [A, B, C, D, E, ...rep(BLUE, 10)],
    }),
    side(LEAD.luffy, RED),
  );
}

describe('OP11-054 Nami: [On Play] with a multicolored Leader, draw 3 and place 2 hand cards on top or bottom', () => {
  it('multicolored Leader: draws 3 then places 2; hand ends at 1 card, deck at 14', () => {
    const g = game(LD.supernova);
    playFromHand(g, NAMI);
    // Whatever order the engine asks in, collect every reachable final position.
    const ends = outcomes(
      g,
      'p1',
      (x) => `${zoneCards(x, 'p1', 'hand').join(',')}|${x.zone('p1', 'deck').length}|${kind(x)}`,
      16,
    );
    expect(ends.size).toBeGreaterThan(0);
    for (const e of ends) {
      const [hand, deck, k] = e.split('|');
      expect(k).toBe('main');
      expect(hand!.split(',')).toHaveLength(1);
      expect(deck).toBe('14');
      // The kept card is one of the three drawn (A, B or C).
      expect([A, B, C]).toContain(hand);
    }
  });

  it('the player can put cards on the top AND on the bottom (both reachable), never both lost', () => {
    const g = game(LD.supernova);
    playFromHand(g, NAMI);
    const ends = outcomes(
      g,
      'p1',
      (x) => {
        const deck = zoneCards(x, 'p1', 'deck');
        return `${deck[0]}|${deck[deck.length - 1]}|${deck.length}`;
      },
      16,
    );
    const tops = new Set([...ends].map((e) => e.split('|')[0]));
    const bottoms = new Set([...ends].map((e) => e.split('|')[1]));
    // Top card is D (nothing placed on top) or one of the drawn cards (placed on top).
    expect(tops.has(D)).toBe(true);
    expect([A, B, C].some((c) => tops.has(c))).toBe(true);
    // Bottom card is a filler (nothing placed at the bottom) or one of the drawn cards.
    expect([A, B, C].some((c) => bottoms.has(c))).toBe(true);
    for (const e of ends) expect(e.endsWith('|14')).toBe(true);
  });

  it('the 2 placed cards cannot be split between top and bottom (QA-OP17 OP17-050: same wording)', () => {
    const g = game(LD.supernova);
    playFromHand(g, NAMI);
    const ends = outcomes(
      g,
      'p1',
      (x) => {
        const deck = zoneCards(x, 'p1', 'deck');
        const hand = zoneCards(x, 'p1', 'hand');
        const placed = [A, B, C].filter((c) => !hand.includes(c));
        const top = placed.filter((c) => deck.slice(0, 5).includes(c)).length;
        const bottom = placed.filter((c) => deck.slice(-5).includes(c)).length;
        return `${placed.length}:${top}:${bottom}`;
      },
      16,
    );
    // Two cards left the hand; they are either both near the top or both near the bottom.
    for (const e of ends) expect(['2:2:0', '2:0:2']).toContain(e);
  });

  it('CR 4-10-1: a single-colour Leader draws nothing and places nothing', () => {
    const g = game(LD.navy);
    playFromHand(g, NAMI);
    expect(kind(g)).toBe('main');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p1', 'deck')).toHaveLength(15);
    expect(zoneCards(g, 'p1', 'deck').slice(0, 5)).toEqual([A, B, C, D, E]);
  });
});

describe('OP11-054 Nami: [Blocker]', () => {
  it('on the opponent’s turn she can block an attack on the Leader', () => {
    const g = theirTurn(side(LD.navy, BLUE, { characters: [NAMI] }), side(LEAD.luffy, RED));
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', NAMI)]);
  });
});
