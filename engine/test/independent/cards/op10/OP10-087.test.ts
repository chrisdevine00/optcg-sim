/**
 * OP10-087 Tony Tony.Chopper (Character, Black, cost 2, 0 power, Counter +1000, {Animal}/
 * {Straw Hat Crew}/{Dressrosa}).
 *
 * Card text: "[Activate: Main] You may rest this Character and 1 of your "Dressrosa" type Leader or
 * Stage cards: If your opponent has 5 or more cards in their hand, your opponent trashes 1 card
 * from their hand. Then, trash 2 cards from the top of your deck."
 *
 * Rules: the opponent chooses the card they trash; a "Then" after a failed "If" does not resolve
 * (M4b-5, CR 4-10-1); a player with no cards in the deck is defeated (CR 9-2-1-2).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  choices,
  deck,
  kind,
  LD10,
  mine,
  need,
  offeredAbility,
  payRestDress,
  rawActivate,
  RED,
  result,
  SC14,
  trash,
  zoneIds,
  act,
} from './kit-op10c.ts';

const ID = 'OP10-087';
const STAGE = 'OP04-096';
const HANDS: Record<number, string[]> = {
  3: [RED, RED, SC14.c1],
  4: [RED, RED, RED, SC14.c1],
  5: [RED, RED, RED, RED, SC14.c1],
  6: [RED, RED, RED, RED, RED, SC14.c1],
};

function game(
  hand: number,
  o: {
    leader?: string | { card: string; rested: boolean };
    stage?: boolean;
    self?: string | { card: string; rested: boolean };
    deckSize?: number;
  } = {},
) {
  return mine(
    o.leader ?? LD10.dress,
    {
      characters: [o.self ?? ID],
      deck: [SC14.c2, SC14.c3, BLUE, BLUE, BLUE].slice(0, o.deckSize ?? 5),
      ...(o.stage ? { stage: STAGE } : {}),
    },
    { hand: HANDS[hand]! },
  );
}

function use(g: ReturnType<typeof game>, which: 'leader' | 'stage' = 'leader') {
  rawActivate(g, at(g, 'p1', 'characters', ID));
  payRestDress(g, which);
}

describe('OP10-087 Chopper [Activate: Main] rest self + Dressrosa: opponent with 5+ cards trashes 1; then trash 2 of mine', () => {
  it('opponent with 5 cards chooses 1 to trash, then my top 2 cards are trashed', () => {
    const g = game(5);
    use(g);
    need(g, 'choose', 'p2');
    const target = g.find('p2', 'hand', SC14.c1);
    expect(choices(g)).toContain(target);
    act(g, { type: 'pick', choice: target });
    need(g, 'main', 'p1');
    expect(trash(g, 'p2')).toEqual([SC14.c1]);
    expect(g.zone('p2', 'hand')).toHaveLength(4);
    expect(trash(g)).toEqual([SC14.c2, SC14.c3].sort());
    expect(deck(g)).toEqual([BLUE, BLUE, BLUE]);
  });

  it('the opponent (not me) decides which card goes', () => {
    const g = game(5);
    use(g);
    expect(kind(g)).toBe('choose');
    need(g, 'choose', 'p2');
    expect(choices(g)).toHaveLength(5);
  });

  it('boundary: with 4 cards in their hand nothing is trashed, and the "Then" does not resolve', () => {
    const g = game(4);
    use(g);
    need(g, 'main', 'p1');
    expect(g.zone('p2', 'hand')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([]);
    expect(deck(g)).toHaveLength(5);
    expect(trash(g)).toEqual([]);
  });

  it('with 6 cards in their hand only 1 is trashed', () => {
    const g = game(6);
    use(g);
    need(g, 'choose', 'p2');
    act(g, { type: 'pick', choice: g.find('p2', 'hand', SC14.c1) });
    need(g, 'main', 'p1');
    expect(g.zone('p2', 'hand')).toHaveLength(5);
    expect(trash(g)).toHaveLength(2);
  });

  it('the cost is paid even when the condition fails: Chopper and the Leader are rested', () => {
    const g = game(3);
    use(g);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('a Dressrosa Stage can pay instead of the Leader', () => {
    const g = game(5, { leader: LD10.plain, stage: true });
    use(g, 'stage');
    need(g, 'choose', 'p2');
    act(g, { type: 'pick', choice: g.find('p2', 'hand', RED) });
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(trash(g)).toHaveLength(2);
  });

  it('without a {Dressrosa} Leader or Stage it cannot be used', () => {
    const g = game(5, { leader: LD10.plain });
    expect(offeredAbility(g, at(g, 'p1', 'characters', ID))).toBe(false);
  });

  it('a rested Chopper or a rested Leader cannot pay the cost', () => {
    const a = game(5, { self: { card: ID, rested: true } });
    expect(offeredAbility(a, at(a, 'p1', 'characters', ID))).toBe(false);
    const b = game(5, { leader: { card: LD10.dress, rested: true } });
    expect(offeredAbility(b, at(b, 'p1', 'characters', ID))).toBe(false);
  });

  it('trashing the last cards of my deck defeats me', () => {
    const g = game(5, { deckSize: 2 });
    use(g);
    need(g, 'choose', 'p2');
    act(g, { type: 'pick', choice: g.find('p2', 'hand', RED) });
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it("only the opponent's hand is checked: my own hand size is irrelevant", () => {
    const g = mine(
      LD10.dress,
      { characters: [ID], hand: Array(6).fill(BLUE), deck: [SC14.c2, SC14.c3, BLUE, BLUE] },
      { hand: HANDS[4]! },
    );
    use(g);
    need(g, 'main', 'p1');
    expect(zoneIds(g, 'p2', 'hand')).toHaveLength(4);
    expect(deck(g)).toHaveLength(4);
  });
});
