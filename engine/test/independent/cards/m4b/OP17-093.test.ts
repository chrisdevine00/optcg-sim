/**
 * OP17-093 Monkey.D.Luffy (Character, Black, cost 8, 8000, no Counter, {Straw Hat Crew}/{The Four
 * Emperors}/{Elbaph}).
 *
 * Card text:
 *   "If there is a Character with a cost of 12 or more, this Character gains [Rush].
 *    [On Play] Draw 1 card and play up to 1 Character card with a cost of 2 or less from your
 *    trash."
 *
 * Rules: CR 10-1-1-1 ([Rush]); CR 3-7-4; the condition counts either player's Characters (current
 * cost, RL-43); CR 4-5-3 (draw); CR 8-4-4-1 ("up to"); CR 4-10-2 ("and" part still resolves).
 */
import { describe, expect, it } from 'vitest';
import { canAttack } from '../../helpers.ts';
import { donOf, kind, myTurn } from '../kit.ts';
import {
  C,
  deckCards,
  deckOf,
  drive,
  FILLER,
  ids,
  offeredCards,
  playCard,
  side,
  sorted,
  V,
} from './kit-c.ts';

const ID = 'OP17-093';

describe('OP17-093 Luffy: [Rush] while a Character with cost 12+ exists', () => {
  function placed(mine: string[], theirs: string[]) {
    return myTurn(
      side(C.luffy, FILLER, { characters: [{ card: ID, playedThisTurn: true }, ...mine] }),
      side(C.shanks, FILLER, { characters: theirs }),
    );
  }

  it('own Saul: Luffy, played this turn, can attack the Leader (Rush)', () => {
    const g = placed([C.saul], []);
    expect(canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });

  it("opponent's Saul also grants Rush", () => {
    const g = placed([], [C.saul]);
    expect(canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });

  it('without a cost 12+ Character (cost 10 does not count): no Rush, cannot attack', () => {
    const g = placed([C.cost10], []);
    expect(canAttack(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(false);
  });
});

describe('OP17-093 Luffy: [On Play] draw 1, play up to 1 Character (cost ≤2) from the trash', () => {
  function game(trash: string[]) {
    return myTurn(
      side(C.luffy, FILLER, {
        hand: [ID],
        trash,
        costArea: { active: 8, rested: 0 },
        deck: deckOf([V.hajrudin]),
      }),
      side(C.shanks, FILLER),
    );
  }

  it('happy path: draws the top card and plays a cost-1 Character from the trash', () => {
    const g = game([V.sunny]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'trash', V.sunny)] });
    expect(ids(g, 'p1', 'hand')).toEqual([V.hajrudin]);
    expect(sorted(ids(g, 'p1', 'characters'))).toEqual(sorted([ID, V.sunny]));
    expect(ids(g, 'p1', 'trash')).toEqual([]);
    expect(deckCards(g, 'p1')).toHaveLength(14);
  });

  it('boundary: cost 2 is allowed, cost 3 is not, Events are not', () => {
    const g = game([V.sai, V.marco, C.redEvent3, C.sanjiVanilla]);
    playCard(g, 'p1', ID);
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([V.sai, C.sanjiVanilla]));
  });

  it('"up to 1": may play nothing, the draw still happens', () => {
    const g = game([V.sunny]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [] });
    expect(ids(g, 'p1', 'hand')).toEqual([V.hajrudin]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('with no eligible Character the draw still happens', () => {
    const g = game([V.thatch]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(ids(g, 'p1', 'hand')).toEqual([V.hajrudin]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('only one Character is played', () => {
    const g = game([V.sunny, V.sai]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'trash', V.sunny), g.find('p1', 'trash', V.sai)] });
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    expect(g.zone('p1', 'trash')).toHaveLength(1);
  });

  it('a Character played from the trash by the effect has its own [On Play] resolve (Ohm: DON!! −1 → draw 1)', () => {
    const g = game([C.ohm]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'trash', C.ohm)], don: 'costRested' });
    expect(ids(g, 'p1', 'characters').sort()).toEqual([ID, C.ohm].sort());
    // Luffy drew 1 and Ohm's DON!! −1 drew 1 more.
    expect(g.zone('p1', 'hand')).toHaveLength(2);
    expect(donOf(g, 'p1').deck).toBe(3);
  });
});
