/**
 * OP10-088 Nami (Character, Black, cost 2, 0 power, Counter +1000, {Straw Hat Crew}/{Dressrosa}).
 *
 * Card text: "[Activate: Main] You may rest this Character and 1 of your "Dressrosa" type Leader or
 * Stage cards: Draw 1 card. Then, trash 2 cards from the top of your deck."
 *
 * Rules: the draw takes the top card; the trash then takes the next two; a player whose deck
 * reaches 0 cards is defeated (CR 9-2-1-2); a rested card cannot be rested again.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  deck,
  hand,
  LD10,
  mine,
  need,
  offeredAbility,
  payRestDress,
  rawActivate,
  result,
  SC10,
  SC14,
  trash,
} from './kit-op10c.ts';

const ID = 'OP10-088';
const STAGE = 'OP04-096';

function game(
  o: {
    leader?: string | { card: string; rested: boolean };
    stage?: boolean;
    self?: string | { card: string; rested: boolean };
    cards?: string[];
  } = {},
) {
  return mine(o.leader ?? LD10.dress, {
    characters: [o.self ?? ID],
    deck: o.cards ?? [SC14.c1, SC14.c2, SC14.c3, BLUE, BLUE],
    ...(o.stage ? { stage: STAGE } : {}),
  });
}

function use(g: ReturnType<typeof game>, which: 'leader' | 'stage' = 'leader') {
  rawActivate(g, at(g, 'p1', 'characters', ID));
  payRestDress(g, which);
}

describe('OP10-088 Nami [Activate: Main] rest self + Dressrosa: draw 1, then trash 2 from the deck', () => {
  it('draws the top card, then trashes the next two', () => {
    const g = game();
    use(g);
    need(g, 'main', 'p1');
    expect(hand(g)).toEqual([SC14.c1]);
    expect(trash(g)).toEqual([SC14.c2, SC14.c3].sort());
    expect(deck(g)).toEqual([BLUE, BLUE]);
  });

  it('rests Nami and the Dressrosa Leader', () => {
    const g = game();
    use(g);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('a Dressrosa Stage can pay instead of the Leader', () => {
    const g = game({ leader: LD10.plain, stage: true });
    use(g, 'stage');
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(hand(g)).toEqual([SC14.c1]);
  });

  it('with a Leader and a Stage both Dressrosa, only one of them is rested', () => {
    const g = game({ stage: true });
    use(g, 'stage');
    expect(g.zone('p1', 'stage')[0]!.rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('without a {Dressrosa} Leader or Stage it cannot be used', () => {
    const g = game({ leader: LD10.plain });
    expect(offeredAbility(g, at(g, 'p1', 'characters', ID))).toBe(false);
  });

  it('a rested Nami or a rested Leader cannot pay', () => {
    const a = game({ self: { card: ID, rested: true } });
    expect(offeredAbility(a, at(a, 'p1', 'characters', ID))).toBe(false);
    const b = game({ leader: { card: LD10.dress, rested: true } });
    expect(offeredAbility(b, at(b, 'p1', 'characters', ID))).toBe(false);
  });

  it('with exactly 3 cards in the deck the draw and the trash empty it and I lose', () => {
    const g = game({ cards: [SC14.c1, SC14.c2, SC14.c3] });
    use(g);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('with 4 cards in the deck one card remains and the game goes on', () => {
    const g = game({ cards: [SC14.c1, SC14.c2, SC14.c3, SC10.dr2] });
    use(g);
    need(g, 'main', 'p1');
    expect(deck(g)).toEqual([SC10.dr2]);
    expect(result(g)).toBeNull();
  });

  it('cannot be used twice in a turn: Nami is rested after the first use', () => {
    const g = game();
    use(g);
    expect(offeredAbility(g, at(g, 'p1', 'characters', ID))).toBe(false);
  });

  it("does not touch the opponent's deck, hand or trash", () => {
    const g = game();
    use(g);
    expect(g.zone('p2', 'deck')).toHaveLength(15);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });
});
