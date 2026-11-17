/**
 * OP15-067 Shura (Character, Purple, cost 1, 2000, Counter +1000, {Sky Island}/{Vassals}).
 *
 * Card text:
 *   "If you have 6 or less DON!! cards on your field, this Character gains [Rush].
 *    [On Play] DON!! −1: Draw 1 card."
 *
 * Rules: CR 8-1-3-3 (permanent effect, re-checked continuously); CR 10-1-1-1 ([Rush]);
 * CR 3-7-4 (summoning sickness without Rush); RL-24 (DON!! on the field includes given DON!! and
 * rested ones); CR 8-3-1-6 (DON!! −1 shrinks the count at once).
 */
import { describe, expect, it } from 'vitest';
import { canAttack } from '../../helpers.ts';
import { donOf, myTurn } from '../kit.ts';
import { C, drive, fieldDon, FILLER, leaderDon, playCard, side } from './kit-c.ts';

const ID = 'OP15-067';

function game(active: number, characters: string[] = []) {
  return myTurn(
    side(C.shanks, FILLER, { hand: [ID], costArea: { active, rested: 0 }, characters }),
    side(C.luffy, FILLER),
  );
}

describe('OP15-067 Shura: [Rush] while you have 6 or less DON!! on your field', () => {
  it('with 3 DON!! on the field Shura can attack the turn it is played (Rush)', () => {
    const g = game(3);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    const s = g.find('p1', 'characters', ID);
    expect(canAttack(g, s, g.leader('p2'))).toBe(true);
  });

  it('boundary: exactly 6 DON!! on the field still gives Rush', () => {
    const g = game(6);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(fieldDon(g, 'p1')).toBe(6);
    expect(canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });

  it('with 7 DON!! on the field (declining DON!! −1) there is no Rush: Shura cannot attack', () => {
    const g = game(7);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(fieldDon(g, 'p1')).toBe(7);
    expect(canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(false);
  });

  it('with 8 DON!!, DON!! −1 leaves 7: still no Rush', () => {
    const g = game(8);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: true, don: 'costRested' });
    expect(fieldDon(g, 'p1')).toBe(7);
    expect(canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(false);
  });

  it('with 7 DON!!, paying DON!! −1 brings the count to 6 and Shura gains Rush at once', () => {
    const g = game(7);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: true, don: 'costRested' });
    expect(fieldDon(g, 'p1')).toBe(6);
    expect(canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });

  it('given DON!! count toward the 7: 5 in the cost area + 2 given to the Leader → no Rush', () => {
    const g = myTurn(
      leaderDon(side(C.shanks, FILLER, { hand: [ID], costArea: { active: 5, rested: 0 } }), 2),
      side(C.luffy, FILLER),
    );
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(fieldDon(g, 'p1')).toBe(7);
    expect(canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(false);
  });
});

describe('OP15-067 Shura: [On Play] DON!! −1 → draw 1', () => {
  it('happy path: returns 1 DON!! and draws 1', () => {
    const g = game(3);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { don: 'costRested' });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(donOf(g, 'p1').deck).toBe(8);
  });

  it('declining draws nothing and returns nothing', () => {
    const g = game(3);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(donOf(g, 'p1').deck).toBe(7);
  });
});
