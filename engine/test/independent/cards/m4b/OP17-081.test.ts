/**
 * OP17-081 Gerd (Character, Black, cost 2, 3000, Counter +2000, {Giant}/{Elbaph}/{New Giant
 * Pirates}).
 *
 * Card text:
 *   "If your Leader has the {Elbaph} type, this Character gains +12 cost.
 *    [On Play] You may trash 1 card from your hand: Add up to 1 Character card with a cost of 8
 *    or less other than [Gerd] from your trash to your hand."
 *
 * Rules: QA-OP17 (self cost boosts apply on the field only); CR 8-3-1-1 / 8-4-1 (the trash cost is
 * paid before the effect resolves, so the card just trashed is a legal target); CR 8-3-1-3 /
 * 8-3-1-4; CR 8-4-4-1 / 8-4-4-2; "other than [Gerd]" excludes any card named Gerd.
 */
import { describe, expect, it } from 'vitest';
import { kind, myTurn } from '../kit.ts';
import { C, drive, FILLER, ids, offeredCards, playCard, side, sorted, V } from './kit-c.ts';

const ID = 'OP17-081';

describe('OP17-081 Gerd: +12 cost with an {Elbaph} Leader', () => {
  it('{Elbaph} Leader: cost 14 on the field; in hand still 2', () => {
    const g = myTurn(
      side(C.elbaphLeader, FILLER, {
        hand: [ID],
        characters: [],
        costArea: { active: 2, rested: 0 },
      }),
      side(C.shanks, FILLER),
    );
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(2);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(14);
  });

  it('non-{Elbaph} Leader: cost stays 2 on the field', () => {
    const g = myTurn(side(C.luffy, FILLER, { characters: [ID] }), side(C.shanks, FILLER));
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(2);
  });

  it('with the +12 he is a "Character with cost 12 or more" (Usopp OP17-080 gets +3000)', () => {
    const g = myTurn(
      side(C.elbaphLeader, FILLER, { characters: [ID, 'OP17-080'] }),
      side(C.shanks, FILLER),
    );
    expect(g.power(g.find('p1', 'characters', 'OP17-080'))).toBe(5000);
  });
});

describe('OP17-081 Gerd: [On Play] may trash 1 → add a Character (cost ≤8, not Gerd) from trash to hand', () => {
  function game(trash: string[], hand: string[] = [ID, V.sai]) {
    return myTurn(
      side(C.luffy, FILLER, { hand, trash, costArea: { active: 2, rested: 0 } }),
      side(C.shanks, FILLER, { trash: [V.kingdew] }),
    );
  }

  it('happy path: trash 1 from hand, add a Character from the trash', () => {
    const g = game([V.marco]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'hand', V.sai)], cards: [V.marco] });
    expect(ids(g, 'p1', 'hand')).toEqual([V.marco]);
    expect(ids(g, 'p1', 'trash')).toEqual([V.sai]);
  });

  it('the card just trashed as the cost is itself a legal target (cost is paid first)', () => {
    const g = game([], [ID, V.thatch]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'hand', V.thatch)], cards: [V.thatch] });
    expect(ids(g, 'p1', 'hand')).toEqual([V.thatch]);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
  });

  it("only Characters with cost 8 or less, not Gerd, not Events, not the opponent's trash are offered", () => {
    const g = game([V.shiki8, C.cost10, C.gerd, C.elbaphEvent, V.marco]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'hand', V.sai)] }, 2);
    // After paying the trash cost the choice of the Character is open.
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([V.shiki8, V.marco, V.sai]));
  });

  it('"up to 1": may add nothing, the cost stays paid', () => {
    const g = game([V.marco]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'hand', V.sai)] });
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(sorted(ids(g, 'p1', 'trash'))).toEqual(sorted([V.sai, V.marco]));
  });

  it('CR 8-3-1-4: declining the trash does nothing', () => {
    const g = game([V.marco]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false, cards: [V.marco] });
    expect(ids(g, 'p1', 'hand')).toEqual([V.sai]);
    expect(ids(g, 'p1', 'trash')).toEqual([V.marco]);
  });

  it('CR 8-3-1-3: with no other card in hand the cost cannot be paid: nothing is added', () => {
    const g = game([V.marco], [ID]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { cards: [V.marco] });
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual([V.marco]);
  });
});
