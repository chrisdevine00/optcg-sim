/**
 * OP05-077 Gamma Knife (Event, Purple, cost 2, {Heart Pirates}).
 *
 * Card text:
 *   "[Main] DON!! −1 (You may return the specified number of DON!! cards from your field to your
 *    DON!! deck.): Give up to 1 of your opponent's Characters −5000 power during this turn.
 *    [Trigger] Add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules: CR 2-7-3 / 8-4-2 (the Event's cost is paid and the card trashed before the effect);
 * CR 8-3-1-6 (DON!! −X may return rested DON!!, including the ones just rested for the cost);
 * CR 8-3-1-4 (a skipped "may" cost means no effect); CR 8-4-4-1 ("up to" allows 0);
 * CR 6-6-1-3 ("during this turn" ends in the End Phase); CR 4-6-3 / 10-1-5 (Trigger).
 */
import { describe, expect, it } from 'vitest';
import { act, endTurn, noDefence } from '../../helpers.ts';
import { attack, passBlock } from '../../helpers.ts';
import { donOf, kind, myTurn, theirTurn } from '../kit.ts';
import { C, deckOf, drive, FILLER, ids, offeredCards, playCard, side, V } from './kit-c.ts';

const ID = 'OP05-077';

function game(p1: Parameters<typeof side>[2] = {}, p2: Parameters<typeof side>[2] = {}) {
  return myTurn(
    side(C.shanks, FILLER, { hand: [ID], costArea: { active: 3, rested: 0 }, ...p1 }),
    side(C.luffy, FILLER, { characters: [V.kingdew, V.sunny], ...p2 }),
  );
}

describe('OP05-077 Gamma Knife: [Main] DON!! −1 → opponent Character −5000 this turn', () => {
  it('happy path: pays 2, returns 1 DON!!, the chosen Character is 7000 − 5000', () => {
    const g = game();
    const target = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [target], don: 'costRested' });
    expect(g.power(target)).toBe(2000);
    expect(donOf(g, 'p1')).toMatchObject({ deck: 8, active: 1, rested: 1 });
    expect(ids(g, 'p1', 'trash')).toContain(ID);
    expect(g.power(g.find('p2', 'characters', V.sunny))).toBe(3000);
  });

  it("only the opponent's Characters can be chosen (not their Leader, not my own Characters)", () => {
    const g = game({ characters: [V.marco] });
    playCard(g, 'p1', ID);
    // Walk through the optional / cost until the target choice is open.
    while (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
    drive(g, 'p1', { accept: true, targets: [] }, 0);
    // Pay the DON!! cost if it is asked as a pick.
    for (let i = 0; i < 3 && kind(g) === 'choose' && offeredCards(g).length === 0; i++) {
      const pick = g.legal().find((a) => a.type === 'pick');
      if (!pick) break;
      g.act(pick);
    }
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual([V.kingdew, V.sunny].sort());
  });

  it('CR 8-3-1-6: with exactly the 2 DON!! that pay for the Event, a rested one can be returned', () => {
    const g = game({ costArea: { active: 2, rested: 0 } });
    const target = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [target], don: 'costRested' });
    expect(g.power(target)).toBe(2000);
    expect(donOf(g, 'p1')).toMatchObject({ deck: 9, rested: 1, active: 0 });
  });

  it('CR 8-3-1-4: declining the DON!! −1 returns nothing and gives no −5000 (the Event is still spent)', () => {
    const g = game();
    const target = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false, targets: [target] });
    expect(g.power(target)).toBe(7000);
    expect(donOf(g, 'p1').deck).toBe(7);
    expect(ids(g, 'p1', 'trash')).toContain(ID);
  });

  it('"up to 1": the target may be left empty; the DON!! is still returned', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [], don: 'costRested' });
    expect(g.power(g.find('p2', 'characters', V.kingdew))).toBe(7000);
    expect(donOf(g, 'p1').deck).toBe(8);
  });

  it('"during this turn": the −5000 is gone on the opponent\'s turn', () => {
    const g = game();
    const target = g.find('p2', 'characters', V.kingdew);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [target], don: 'costRested' });
    expect(g.power(target)).toBe(2000);
    endTurn(g);
    expect(g.power(target)).toBe(7000);
  });

  it('with no opponent Characters the Event can still be played and does nothing', () => {
    const g = game({}, { characters: [] });
    playCard(g, 'p1', ID);
    drive(g, 'p1', { don: 'costRested' });
    expect(ids(g, 'p1', 'trash')).toContain(ID);
    expect(kind(g)).toBe('main');
  });
});

describe('OP05-077 Gamma Knife: [Trigger] add up to 1 DON!! from the DON!! deck, set active', () => {
  function defending(p1Hand: string[] = []) {
    return theirTurn(
      side(C.shanks, FILLER, {
        life: [ID, FILLER, FILLER, FILLER],
        hand: p1Hand,
        deck: deckOf([]),
        costArea: { active: 2, rested: 0 },
      }),
      side(C.luffy, FILLER, { characters: [V.kingdew] }),
    );
  }

  it('activating the Trigger adds 1 ACTIVE DON!! and the card goes to the trash', () => {
    const g = defending();
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(kind(g)).toBe('trigger');
    act(g, { type: 'trigger', activate: true });
    drive(g, 'p1', {});
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, deck: 7 });
    expect(ids(g, 'p1', 'trash')).toContain(ID);
    expect(ids(g, 'p1', 'hand')).not.toContain(ID);
  });

  it('declining the Trigger adds the card to hand and no DON!!', () => {
    const g = defending();
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: false });
    expect(ids(g, 'p1', 'hand')).toContain(ID);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
  });

  it('the [Main] effect is not what a Trigger resolves: no power change happens', () => {
    const g = defending();
    const atk = g.find('p2', 'characters', V.kingdew);
    attack(g, atk, g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    act(g, { type: 'trigger', activate: true });
    drive(g, 'p1', {});
    expect(g.power(atk)).toBe(7000);
    noDefence(g);
  });
});
