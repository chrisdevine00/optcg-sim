/**
 * EB04-007 Roronoa Zoro (Character, Red, cost 7, 9000, {Straw Hat Crew}/{Egghead}).
 *
 * Card text:
 *   "[On Play] Your Leader gains +2000 power until the end of your opponent's next End Phase.
 *    [Activate: Main] [Once Per Turn] If your opponent has a Character with 8000 power or more,
 *    this Character gains [Rush: Character] during this turn."
 *
 * Rules: CR 6-6-1-2 ("until the end of … End Phase"); CR 10-2-13 (once per turn); CR 10-1-6-1
 * ([Rush: Character] attacks Characters, not the Leader, on the turn it is played); CR 7-1-1-2
 * (only rested Characters can be attacked); CR 4-10-1 (failed "if").
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { canAttack, endTurn } from '../../helpers.ts';
import { activate, canActivate, donOf, myTurn } from '../kit.ts';
import { C, drive, FILLER, playCard, side, V } from './kit-c.ts';

const ID = 'EB04-007';

describe("EB04-007 Roronoa Zoro: [On Play] Leader +2000 until the end of the opponent's next End Phase", () => {
  function game() {
    return myTurn(
      side(C.luffy, FILLER, {
        hand: [ID],
        characters: [V.marco],
        costArea: { active: 7, rested: 0 },
      }),
      side(C.shanks, FILLER),
    );
  }

  it('the Leader is 5000 + 2000 now', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
  });

  it('only the Leader gets the boost, not Characters', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(g.power(g.find('p1', 'characters', V.marco))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(9000);
  });

  it("it lasts through the opponent's turn and is gone when their End Phase is over", () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    endTurn(g); // opponent's turn
    expect(g.power(g.leader('p1'))).toBe(7000);
    endTurn(g); // back to me: the opponent's End Phase is over
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describe('EB04-007 Roronoa Zoro: [Activate: Main] [Once Per Turn] opponent has 8000+ → [Rush: Character]', () => {
  function game(oppChars: NonNullable<Partial<PlayerSpec>['characters']>) {
    return myTurn(
      side(C.luffy, FILLER, { characters: [{ card: ID, playedThisTurn: true }] }),
      side(C.shanks, FILLER, { characters: oppChars }),
    );
  }

  it('without the ability, a Zoro played this turn cannot attack (control)', () => {
    const g = game([{ card: V.thatch, rested: true }]);
    expect(canAttack(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', V.thatch))).toBe(
      false,
    );
  });

  it('opponent Character with exactly 8000 (boundary): Zoro can then attack a rested Character this turn', () => {
    const g = game([{ card: V.thatch, rested: true }]);
    const zoro = g.find('p1', 'characters', ID);
    expect(canActivate(g, zoro)).toBe(true);
    activate(g, zoro);
    drive(g, 'p1', {});
    expect(canAttack(g, zoro, g.find('p2', 'characters', V.thatch))).toBe(true);
  });

  it('[Rush: Character] does not allow attacking the Leader on the turn it is played', () => {
    const g = game([{ card: V.thatch, rested: true }]);
    const zoro = g.find('p1', 'characters', ID);
    activate(g, zoro);
    drive(g, 'p1', {});
    expect(canAttack(g, zoro, g.leader('p2'))).toBe(false);
  });

  it("opponent's strongest Character has 7000 (one short): no Rush: Character is gained", () => {
    const g = game([{ card: V.kingdew, rested: true }]);
    const zoro = g.find('p1', 'characters', ID);
    if (canActivate(g, zoro)) {
      activate(g, zoro);
      drive(g, 'p1', {});
    }
    expect(canAttack(g, zoro, g.find('p2', 'characters', V.kingdew))).toBe(false);
  });

  it('[Once Per Turn]: after one use it is not offered again', () => {
    const g = game([{ card: V.thatch, rested: true }]);
    const zoro = g.find('p1', 'characters', ID);
    activate(g, zoro);
    drive(g, 'p1', {});
    expect(canActivate(g, zoro)).toBe(false);
  });

  it('"during this turn": on the next turn a Zoro that was not just played needs no Rush anyway, but the keyword is gone', () => {
    const g = game([{ card: V.thatch, rested: true }]);
    const zoro = g.find('p1', 'characters', ID);
    activate(g, zoro);
    drive(g, 'p1', {});
    expect(g.card(zoro).keywords).toContain('Rush: Character');
    endTurn(g);
    expect(g.card(zoro).keywords).not.toContain('Rush: Character');
  });

  it('[Once Per Turn] resets on my next turn: it can be used again then', () => {
    const g = game([{ card: V.thatch, rested: true }]);
    const zoro = g.find('p1', 'characters', ID);
    activate(g, zoro);
    drive(g, 'p1', {});
    expect(canActivate(g, zoro)).toBe(false);
    endTurn(g);
    endTurn(g);
    expect(canActivate(g, zoro)).toBe(true);
  });
});
