/**
 * OP17-082 Sanji (Character, Black, cost 2, 2000, Counter +1000, {Straw Hat Crew}/{Elbaph}).
 *
 * Card text:
 *   "If there is a Character with a cost of 12 or more, this Character gains +3000 power.
 *    [On Play] Draw 2 cards and trash 2 cards from your hand."
 *
 * Rules: CR 4-5-3 (draw X); the trash is not optional (CR 8-1-2) and is chosen from the whole
 * hand, drawn cards included; CR 4-10-2 ("and"/"then" still resolves); the +3000 condition counts
 * either player's Characters (current cost, RL-43).
 */
import { describe, expect, it } from 'vitest';
import { myTurn } from '../kit.ts';
import { C, deckCards, deckOf, drive, FILLER, ids, playCard, side, V } from './kit-c.ts';

const ID = 'OP17-082';

describe('OP17-082 Sanji: +3000 power while a Character with cost 12+ exists', () => {
  it.each([
    ['own Saul', [ID, C.saul], [], 5000],
    ['opponent Saul', [ID], [C.saul], 5000],
    ['no cost 12+ Character (cost 10 does not count)', [ID, C.cost10], [], 2000],
  ])('%s → %i', (_name, mine, theirs, power) => {
    const g = myTurn(
      side(C.luffy, FILLER, { characters: mine as string[] }),
      side(C.shanks, FILLER, { characters: theirs as string[] }),
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(power);
  });
});

describe('OP17-082 Sanji: [On Play] draw 2, then trash 2 cards from your hand', () => {
  function game(hand: string[], deck: string[] = deckOf([V.hajrudin, V.kingdew, V.thatch])) {
    return myTurn(
      side(C.luffy, FILLER, { hand: [ID, ...hand], costArea: { active: 2, rested: 0 }, deck }),
      side(C.shanks, FILLER),
    );
  }

  it("draws 2 from the top, then trashes 2 cards of the player's choice from the hand (net hand −0 with 2 in hand)", () => {
    const g = game([V.sai, V.marco]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'hand', V.sai), g.find('p1', 'hand', V.marco)] });
    expect(ids(g, 'p1', 'trash').sort()).toEqual([V.marco, V.sai].sort());
    expect(ids(g, 'p1', 'hand').sort()).toEqual([V.hajrudin, V.kingdew].sort());
    expect(deckCards(g, 'p1')[0]).toBe(V.thatch);
  });

  it('a card just drawn may be trashed', () => {
    const g = game([V.sai]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { cards: [V.hajrudin, V.kingdew] });
    expect(ids(g, 'p1', 'trash').sort()).toEqual([V.hajrudin, V.kingdew].sort());
    expect(ids(g, 'p1', 'hand')).toEqual([V.sai]);
  });

  it('with an empty hand besides Sanji: draws 2 and must trash both', () => {
    const g = game([]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toHaveLength(2);
  });

  it('the trash is mandatory: the 2 cards cannot be skipped', () => {
    const g = game([V.sai, V.marco, V.thatch]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(ids(g, 'p1', 'trash')).toHaveLength(2);
    expect(g.zone('p1', 'hand')).toHaveLength(3);
  });

  it('deck loses exactly 2 cards', () => {
    const g = game([V.sai]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(g.zone('p1', 'deck')).toHaveLength(13);
  });
});
