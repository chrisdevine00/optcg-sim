/**
 * EB04-038 Rosinante & Law (Character, Purple, cost 6, 8000; Donquixote Pirates / Navy).
 *
 * Card text:
 *   "Under the rules of this game, also treat this card's name as [Trafalgar Law] and [Donquixote
 *    Rosinante]. [Blocker]
 *    [On Play] If the number of DON!! cards on your field is equal to or less than the number on your
 *    opponent's field, draw 1 card. Then, add up to 1 DON!! card from your DON!! deck and set it as
 *    active."
 *
 * Rules: "DON!! cards on your field" counts the cost area (active and rested) and given DON!! (RL-24 /
 * QA-OP01 OP01-091); paying the 6-cost rests DON!! that stay on the field; CR 4-10-1: when the "if"
 * fails, the "Then" clause that follows cannot resolve either (the printed text is one effect, so I
 * read the whole effect as conditional; this is the one reading judgement here); CR 10-1-4 [Blocker].
 * The name treatment (CR 2-1-2) is tested in OP12-061 / OP12-108 / OP12-115.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  attack,
  blockers,
  BLUE,
  donOf,
  kind,
  LD,
  LEAD,
  myTurn,
  playFromHand,
  RED,
  rep,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from './kit-d.ts';

const CARD = 'EB04-038';

function game(
  p1Don: number,
  p2Don: number,
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
) {
  return myTurn(
    side(LD.navy, BLUE, {
      hand: [CARD],
      deck: [VAN.sai, ...rep(BLUE, 12)],
      costArea: { active: p1Don, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED, { costArea: { active: p2Don, rested: 0 }, ...p2 }),
  );
}

describe('EB04-038 [On Play]: if your DON!! on the field are equal to or fewer than the opponent’s, draw 1, then add 1 active DON!!', () => {
  it('equal (6 vs 6): draws the top card, then adds 1 DON!! from the deck as ACTIVE', () => {
    const g = game(6, 6);
    const deckBefore = donOf(g, 'p1').deck;
    playFromHand(g, CARD);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 6, deck: deckBefore - 1 });
    expect(kind(g)).toBe('main');
  });

  it('fewer (6 vs 9): both parts resolve', () => {
    const g = game(6, 9);
    playFromHand(g, CARD);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(donOf(g, 'p1').active).toBe(1);
  });

  it('more (6 vs 5): nothing is drawn and no DON!! is added', () => {
    const g = game(6, 5);
    const deckBefore = donOf(g, 'p1').deck;
    playFromHand(g, CARD);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 6, deck: deckBefore });
    expect(g.zone('p1', 'deck')).toHaveLength(13);
  });

  it('DON!! given to a Character count as on your field: 6 + 1 given = 7 > 6, so nothing', () => {
    const g = game(6, 6, { leader: { card: LD.navy, don: 1 } });
    playFromHand(g, CARD);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('the opponent’s given DON!! count on their field: 3 active + 3 given = 6 vs 6 is equal', () => {
    const g = game(6, 3, {}, { leader: { card: LEAD.luffy, don: 3 } });
    playFromHand(g, CARD);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
  });
});

describe('EB04-038: [Blocker]', () => {
  it('it can block on the opponent’s turn', () => {
    const g = theirTurn(side(LD.navy, BLUE, { characters: [CARD] }), side(LEAD.luffy, RED));
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', CARD)]);
  });
});
