/**
 * OP15-088 Pirates Docking Six (Character, Black, cost 5, 7000, {Straw Hat Crew}).
 *
 * Card text:
 *   "This Character gains +6 cost.
 *    [On Play] You may trash 3 cards from the top of your deck: Play up to 1 {Straw Hat Crew}
 *    type Character card with a cost of 2 or less from your trash."
 *
 * Rules: QA-OP17 OP17-085 / OP17-089 (self "+N cost" applies on the field only, not in hand);
 * CR 8-3-1-1 / 8-4-1 (the cost is paid before the effect resolves, so the cards just trashed are
 * in the trash when the target is chosen); CR 8-3-1-3 (a cost that cannot be paid is not paid);
 * CR 8-3-1-4; CR 8-4-4-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import { donOf, kind, myTurn } from '../kit.ts';
import { result } from '../../helpers.ts';
import { C, deckOf, drive, FILLER, ids, offeredCards, playCard, side, sorted, V } from './kit-c.ts';

const ID = 'OP15-088';

function game(trash: string[], deck: string[] = deckOf([])) {
  return myTurn(
    side(C.luffy, FILLER, { hand: [ID], trash, deck, costArea: { active: 5, rested: 0 } }),
    side(C.shanks, FILLER),
  );
}

describe('OP15-088 Pirates Docking Six: +6 cost on the field only', () => {
  it('printed cost 5 in hand (paid 5), cost 11 on the field', () => {
    const g = game([]);
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(5);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(11);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 5 });
  });
});

describe('OP15-088 Pirates Docking Six: [On Play] may trash 3 from the deck top → play a SHC Character (cost ≤2) from trash', () => {
  it('happy path: 3 cards trashed from the top, then a {Straw Hat Crew} cost-1 Character from the trash is played', () => {
    const g = game([C.shc1]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'trash', C.shc1)] });
    expect(sorted(ids(g, 'p1', 'characters'))).toEqual(sorted([ID, C.shc1]));
    expect(g.zone('p1', 'deck')).toHaveLength(12);
    // 3 trashed from the deck; the played one left the trash.
    expect(g.zone('p1', 'trash')).toHaveLength(3);
  });

  it('the cost is paid first: a card trashed from the top of the deck can itself be the one played', () => {
    const g = game([], deckOf([C.shc2, V.marco, V.sai]));
    playCard(g, 'p1', ID);
    drive(g, 'p1', { cards: [C.shc2] });
    expect(ids(g, 'p1', 'characters')).toContain(C.shc2);
    expect(sorted(ids(g, 'p1', 'trash'))).toEqual(sorted([V.marco, V.sai]));
  });

  it('only {Straw Hat Crew} Characters with cost 2 or less are offered (boundary 2 yes; cost 3, non-SHC, Events no)', () => {
    const g = game([C.shc1, C.shc2, C.shc3, 'OP02-060', C.redEvent3]);
    playCard(g, 'p1', ID);
    for (let i = 0; i < 3 && kind(g) === 'optional'; i++) g.act({ type: 'optional', accept: true });
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([C.shc1, C.shc2]));
  });

  it('"up to 1": may play nothing (the 3 cards are still trashed)', () => {
    const g = game([C.shc1]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [] });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.zone('p1', 'trash')).toHaveLength(4);
  });

  it('CR 8-3-1-4: declining the cost trashes nothing and plays nothing', () => {
    const g = game([C.shc1]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false, targets: [g.find('p1', 'trash', C.shc1)] });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.zone('p1', 'deck')).toHaveLength(15);
    expect(ids(g, 'p1', 'trash')).toEqual([C.shc1]);
  });

  it('CR 8-3-1-3: with only 2 cards in the deck the cost cannot be paid: nothing is trashed or played', () => {
    const g = game([C.shc1], [V.sai, V.marco]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'trash', C.shc1)] });
    expect(g.zone('p1', 'deck')).toHaveLength(2);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('exactly 4 cards in the deck: the cost can be paid and 1 card is left', () => {
    const g = game([C.shc1], [V.sai, V.marco, V.hajrudin, V.kingdew]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'trash', C.shc1)] });
    expect(g.zone('p1', 'deck')).toHaveLength(1);
    expect(ids(g, 'p1', 'characters')).toContain(C.shc1);
  });

  it('CR 9-2-1-2: paying the cost with exactly 3 cards in the deck empties it, and the player loses at once', () => {
    const g = game([C.shc1], [V.sai, V.marco, V.hajrudin]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'trash', C.shc1)] });
    expect(g.zone('p1', 'deck')).toHaveLength(0);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });
});
