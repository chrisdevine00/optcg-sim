/**
 * OP09-072 Franky (Character, Purple, cost 4, 5000, Counter +1000, {Straw Hat Crew}).
 *
 * Card text:
 *   "[Blocker]
 *    [On Play] DON!! −2, You may trash 1 card from your hand: Draw 2 cards."
 *
 * Rules: CR 8-3-1-1 (costs paid in text order); CR 8-3-1-3 (if any part of the cost cannot be
 * paid, none of it is paid); CR 8-3-1-4 (a skipped "may" cost → the effect does not activate);
 * CR 8-3-1-6 (DON!! −2 returns two DON!! from the field, rested ones included); CR 10-1-4.
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import { donOf, myTurn, theirTurn } from '../kit.ts';
import { blockOptions, C, drive, FILLER, ids, playCard, side, V } from './kit-c.ts';

const ID = 'OP09-072';

function game(hand: string[] = [ID, V.sai], active = 5) {
  return myTurn(
    side(C.shanks, FILLER, { hand, costArea: { active, rested: 0 } }),
    side(C.luffy, FILLER),
  );
}

describe('OP09-072 Franky: [On Play] DON!! −2, you may trash 1 → draw 2', () => {
  it('happy path: returns 2 DON!!, trashes the chosen card, draws 2', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'hand', V.sai)], don: 'costRested' });
    expect(ids(g, 'p1', 'trash')).toEqual([V.sai]);
    expect(g.zone('p1', 'hand')).toHaveLength(2);
    expect(g.zone('p1', 'deck')).toHaveLength(13);
    // 5 DON!!: 4 rested for Franky; −2 returns 2 of them.
    expect(donOf(g, 'p1')).toMatchObject({ deck: 7, active: 1, rested: 2 });
  });

  it('draws 2 only after the cost: the trashed card is the old one, not a drawn card', () => {
    const g = game([ID, V.sai, V.marco]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'hand', V.marco)], don: 'costRested' });
    expect(ids(g, 'p1', 'trash')).toEqual([V.marco]);
    expect(ids(g, 'p1', 'hand')).toContain(V.sai);
    expect(g.zone('p1', 'hand')).toHaveLength(3);
  });

  it('CR 8-3-1-3: with no other card in hand the cost cannot be paid: no DON!! returned, no draw', () => {
    const g = game([ID]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { don: 'costRested' });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(donOf(g, 'p1').deck).toBe(5);
    expect(donOf(g, 'p1').rested).toBe(4);
  });

  it('CR 8-3-1-4: declining the optional cost does nothing (hand and DON!! unchanged)', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false, targets: [g.find('p1', 'hand', V.sai)] });
    expect(ids(g, 'p1', 'hand')).toEqual([V.sai]);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
    expect(donOf(g, 'p1').deck).toBe(5);
  });

  it('declining does not stop the Character from being played', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });
});

describe('OP09-072 Franky: [Blocker]', () => {
  it('an active Franky can block an attack on the Leader', () => {
    const g = theirTurn(
      side(C.shanks, FILLER, { characters: [ID] }),
      side(C.luffy, FILLER, { characters: [V.kingdew] }),
    );
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    expect(blockOptions(g)).toEqual([g.find('p1', 'characters', ID)]);
  });

  it('Franky cannot block an attack on itself (CR 10-1-4-1: another card must be attacked)', () => {
    const g = theirTurn(
      side(C.shanks, FILLER, { characters: [{ card: ID, rested: true }] }),
      side(C.luffy, FILLER, { characters: [V.kingdew] }),
    );
    attack(g, g.find('p2', 'characters', V.kingdew), g.find('p1', 'characters', ID));
    expect(blockOptions(g)).toEqual([]);
  });
});
