/**
 * OP17-086 Nami (Character, Black, cost 1, 2000, Counter +1000, {Elbaph}/{Straw Hat Crew}).
 *
 * Card text:
 *   "[On Play] You may trash 1 {Elbaph} type card from your hand: Draw 2 cards."
 *
 * Rules: CR 8-3-1-3 (a cost that cannot be paid is not paid); CR 8-3-1-4 (skipping a "may" cost
 * means no effect); the cost card must be an {Elbaph} type card of any category.
 */
import { describe, expect, it } from 'vitest';
import { kind, myTurn } from '../kit.ts';
import { C, drive, FILLER, ids, offeredCards, playCard, side, sorted, V } from './kit-c.ts';

const ID = 'OP17-086';

function game(hand: string[]) {
  return myTurn(
    side(C.luffy, FILLER, { hand: [ID, ...hand], costArea: { active: 1, rested: 0 } }),
    side(C.shanks, FILLER),
  );
}

describe('OP17-086 Nami: [On Play] you may trash 1 {Elbaph} card from hand → draw 2', () => {
  it('happy path: trashes the {Elbaph} card and draws 2', () => {
    const g = game([C.elbaphChar, V.sai]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'hand', C.elbaphChar)] });
    expect(ids(g, 'p1', 'trash')).toEqual([C.elbaphChar]);
    expect(g.zone('p1', 'hand')).toHaveLength(3);
    expect(ids(g, 'p1', 'hand')).toContain(V.sai);
    expect(g.zone('p1', 'deck')).toHaveLength(13);
  });

  it('only {Elbaph} cards can be trashed for the cost (an {Elbaph} Event too, not Sai)', () => {
    const g = game([C.elbaphChar, C.elbaphEvent, V.sai]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: true }, 1);
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([C.elbaphChar, C.elbaphEvent]));
  });

  it('an {Elbaph} Event pays the cost', () => {
    const g = game([C.elbaphEvent]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'hand', C.elbaphEvent)] });
    expect(ids(g, 'p1', 'trash')).toEqual([C.elbaphEvent]);
    expect(g.zone('p1', 'hand')).toHaveLength(2);
  });

  it('CR 8-3-1-3: no {Elbaph} card in hand → the cost cannot be paid, nothing is drawn', () => {
    const g = game([V.sai, V.marco]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(g.zone('p1', 'hand')).toHaveLength(2);
    expect(g.zone('p1', 'deck')).toHaveLength(15);
  });

  it('CR 8-3-1-4: declining keeps the {Elbaph} card and draws nothing', () => {
    const g = game([C.elbaphChar]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(ids(g, 'p1', 'hand')).toEqual([C.elbaphChar]);
    expect(g.zone('p1', 'deck')).toHaveLength(15);
  });

  it('Nami herself is not an eligible cost card (she is on the field)', () => {
    const g = game([]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
  });
});
