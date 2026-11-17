/**
 * ST10-010 Trafalgar Law (Character, Purple, cost 4, 5000, Counter +1000, {Heart Pirates}).
 *
 * Card text:
 *   "[Blocker]
 *    [On Play] DON!! −1 (You may return the specified number of DON!! cards from your field to
 *    your DON!! deck.): If your opponent has 7 or more cards in their hand, trash 2 cards from
 *    your opponent's hand."
 *
 * Rules: CR 10-1-4 ([Blocker]); CR 8-3-1-6 / 8-3-1-4 (optional DON!! −1); CR 4-10-1 (the "if" is
 * checked when the effect resolves, after the cost was paid); CR 10-2-14 (trash from hand).
 * Who picks the 2 cards is not asserted (the text does not say; the API leaves it to the engine).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import { donOf, myTurn, theirTurn } from '../kit.ts';
import { blockOptions, C, drive, FILLER, ids, playCard, side } from './kit-c.ts';
import { fill } from '../../helpers.ts';

const ID = 'ST10-010';

function game(oppHand: number) {
  return myTurn(
    side(C.shanks, FILLER, { hand: [ID], costArea: { active: 5, rested: 0 } }),
    side(C.luffy, FILLER, { hand: fill('OP01-023', oppHand) }),
  );
}

describe('ST10-010 Trafalgar Law: [On Play] DON!! −1 → if the opponent has 7+ cards in hand, trash 2 of them', () => {
  it('opponent with 7 cards (boundary): returns 1 DON!!, the opponent trashes 2 cards from hand', () => {
    const g = game(7);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { don: 'costRested' });
    drive(g, 'p2', {});
    expect(g.zone('p2', 'hand')).toHaveLength(5);
    expect(ids(g, 'p2', 'trash')).toHaveLength(2);
    expect(donOf(g, 'p1').deck).toBe(6);
  });

  it('opponent with 9 cards: still exactly 2 are trashed', () => {
    const g = game(9);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { don: 'costRested' });
    drive(g, 'p2', {});
    expect(g.zone('p2', 'hand')).toHaveLength(7);
    expect(ids(g, 'p2', 'trash')).toHaveLength(2);
  });

  it('opponent with 6 cards (one short): the DON!! is still returned (cost paid) but nothing is trashed', () => {
    const g = game(6);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { don: 'costRested' });
    drive(g, 'p2', {});
    expect(g.zone('p2', 'hand')).toHaveLength(6);
    expect(ids(g, 'p2', 'trash')).toHaveLength(0);
    expect(donOf(g, 'p1').deck).toBe(6);
  });

  it('CR 8-3-1-4: declining DON!! −1 trashes nothing and returns nothing, even with 8 cards', () => {
    const g = game(8);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(g.zone('p2', 'hand')).toHaveLength(8);
    expect(donOf(g, 'p1').deck).toBe(5);
  });

  it("only the opponent's hand is trashed from, my own hand is untouched", () => {
    const g = myTurn(
      side(C.shanks, FILLER, { hand: [ID, 'OP01-012'], costArea: { active: 5, rested: 0 } }),
      side(C.luffy, FILLER, { hand: fill('OP01-023', 7) }),
    );
    playCard(g, 'p1', ID);
    drive(g, 'p1', { don: 'costRested' });
    drive(g, 'p2', {});
    expect(ids(g, 'p1', 'hand')).toEqual(['OP01-012']);
  });
});

describe('ST10-010 Trafalgar Law: [Blocker]', () => {
  it('an active Law is offered as a blocker against an attack on the Leader', () => {
    const g = theirTurn(
      side(C.shanks, FILLER, { characters: [ID] }),
      side(C.luffy, FILLER, { characters: ['OP02-006'] }),
    );
    attack(g, g.find('p2', 'characters', 'OP02-006'), g.leader('p1'));
    expect(blockOptions(g)).toEqual([g.find('p1', 'characters', ID)]);
  });

  it('a rested Law cannot block', () => {
    const g = theirTurn(
      side(C.shanks, FILLER, { characters: [{ card: ID, rested: true }] }),
      side(C.luffy, FILLER, { characters: ['OP02-006'] }),
    );
    attack(g, g.find('p2', 'characters', 'OP02-006'), g.leader('p1'));
    expect(blockOptions(g)).toEqual([]);
  });
});
