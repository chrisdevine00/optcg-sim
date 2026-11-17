/** OP15-088 Pirates Docking Six. QA-OP17 OP17-089 via RL-43 for the self-cost boost. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  trash,
  V,
} from './helpers.ts';
import { ELBAPH } from './helpers-sabo.ts';

const PDS = 'OP15-088';
/** {Straw Hat Crew} vanilla Characters: Sanji (cost 1) and Franky (cost 5). */
const SHC2 = 'OP04-007';
const SHC5 = 'OP15-089';

describe('OP15-088 Pirates Docking Six', () => {
  it('has +6 cost on the field (11) and its printed cost 5 in hand', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [PDS], hand: [PDS] },
      { leader: PLAIN_BLUE },
    );
    expect(g.card(g.find('p1', 'characters', PDS)).cost).toBe(11);
    expect(g.card(g.find('p1', 'hand', PDS)).cost).toBe(5);
  });

  const setup = (deck: string[], trashCards: string[] = []) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: [PDS],
        deck,
        trash: trashCards,
        costArea: { active: 5, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: trash 3 from the top of the deck, then play a {Straw Hat Crew} Character with a cost of 2 or less from the trash', () => {
    const g = setup([BLUE, V.c1, BLUE, V.c2], [SHC2, SHC5, ELBAPH]);
    play(g, PDS);
    accept(g);
    expect(trash(g, 'p1')).toHaveLength(6);
    // Candidates: Sanji only (Franky costs 5, Rodo is not {Straw Hat Crew}).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'trash', SHC2)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([PDS, SHC2].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });

  it('[On Play]: a card trashed as the cost may be the one played', () => {
    const g = setup([SHC2, BLUE, BLUE, V.c2]);
    play(g, PDS);
    accept(g);
    pick(g, [g.find('p1', 'trash', SHC2)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(SHC2);
  });

  it('[On Play]: the cost may be declined; the deck is untouched', () => {
    const g = setup([BLUE, V.c1, BLUE, V.c2], [SHC2]);
    play(g, PDS);
    decline(g);
    expect(g.zone('p1', 'deck')).toHaveLength(4);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([PDS]);
  });

  it('[On Play]: "up to 1" may play nothing (the 3 cards stay trashed)', () => {
    const g = setup([BLUE, V.c1, BLUE, V.c2], [SHC2]);
    play(g, PDS);
    accept(g);
    none(g);
    expect(trash(g, 'p1')).toHaveLength(4);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([PDS]);
  });

  it('[On Play]: with no valid Character the cards are still trashed', () => {
    const g = setup([BLUE, V.c1, BLUE, V.c2], [SHC5, ELBAPH]);
    play(g, PDS);
    accept(g);
    if (g.legal().some((a) => a.type === 'done')) g.act({ type: 'done' });
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toHaveLength(5);
  });

  it('[On Play]: cannot be paid with fewer than 3 cards in the deck', () => {
    const g = setup([BLUE, V.c1]);
    play(g, PDS);
    // The deck size is public: an ability whose cost cannot be paid simply does not activate.
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'deck')).toHaveLength(2);
  });
});
