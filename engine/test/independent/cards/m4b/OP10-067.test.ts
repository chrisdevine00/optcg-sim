/**
 * OP10-067 Senor Pink (Character, Purple, cost 5, 6000, {Donquixote Pirates}).
 *
 * Card text:
 *   "[On Play] DON!! −1 (You may return the specified number of DON!! cards from your field to
 *    your DON!! deck.): Add up to 1 purple Event with a cost of 5 or less from your trash to your
 *    hand. Then, set up to 1 of your DON!! cards as active."
 *
 * Rules: CR 2-7-2 (cost paid first, DON!! rested for it stay on the field); CR 8-3-1-6;
 * CR 8-3-1-4 (skipped "may" cost → no effect); CR 8-4-4-1 / 8-4-4-2 (choose none from a hidden
 * area); CR 4-10-2 ("then" still resolves when nothing was added).
 */
import { describe, expect, it } from 'vitest';
import { donOf, myTurn, offered } from '../kit.ts';
import { C, drive, FILLER, ids, offeredCards, playCard, side, sorted } from './kit-c.ts';
import { kind } from '../kit.ts';
import { act } from '../../helpers.ts';

const ID = 'OP10-067';

function game(trash: string[], p1: Parameters<typeof side>[2] = {}) {
  return myTurn(
    side(C.shanks, FILLER, { hand: [ID], trash, costArea: { active: 6, rested: 0 }, ...p1 }),
    side(C.luffy, FILLER, { trash: [C.purpleEvent2] }),
  );
}

/** Play Pink, accept DON!! −1 (returning a rested DON!!) and stop at the first card pick. */
function toPick(g: ReturnType<typeof game>) {
  playCard(g, 'p1', ID);
  if (offered(g, 'p1')) act(g, { type: 'optional', accept: true });
  for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
    const don = g
      .legal()
      .find(
        (a) =>
          a.type === 'pick' &&
          typeof a.choice === 'object' &&
          'from' in a.choice &&
          a.choice.from === 'costRested',
      );
    if (!don) break;
    g.act(don);
  }
}

describe('OP10-067 Senor Pink: [On Play] DON!! −1 → purple Event (cost ≤5) from trash to hand, then set 1 DON!! active', () => {
  it('happy path: the Event returns to hand, 1 DON!! is returned to the DON!! deck, then 1 rested DON!! is set active', () => {
    const g = game([C.purpleEvent2]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'trash', C.purpleEvent2)], don: 'costRested' });
    expect(ids(g, 'p1', 'hand')).toEqual([C.purpleEvent2]);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
    // 6 active, 5 rested for Pink; DON!! −1 returns a rested one (4 rested); then 1 set active.
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 3, deck: 5 });
  });

  it("only PURPLE EVENTS with cost 5 or less are offered (not cost 6, not other colours, not Characters, not the opponent's trash)", () => {
    const g = game([
      C.purpleEvent2,
      C.purpleEvent0,
      C.purpleEvent6,
      C.redEvent3,
      C.cost10,
      'ST04-015',
    ]);
    toPick(g);
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([C.purpleEvent2, C.purpleEvent0]));
  });

  it('"up to 1": only one Event is added even with several eligible', () => {
    const g = game([C.purpleEvent2, C.purpleEvent0]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [g.find('p1', 'trash', C.purpleEvent2), g.find('p1', 'trash', C.purpleEvent0)],
    });
    expect(ids(g, 'p1', 'hand')).toHaveLength(1);
    expect(ids(g, 'p1', 'trash')).toHaveLength(1);
  });

  it('may choose none; the DON!! cost is paid and "then" still sets a DON!! active (CR 4-10-2)', () => {
    const g = game([C.purpleEvent2]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [], don: 'costRested' });
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 3, deck: 5 });
  });

  it('with no eligible Event the DON!! is still set active afterwards', () => {
    const g = game([C.purpleEvent6, C.cost10]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { don: 'costRested' });
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 3, deck: 5 });
  });

  it('CR 8-3-1-4: declining DON!! −1 means nothing is added and no DON!! is returned or set active', () => {
    const g = game([C.purpleEvent2]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false, targets: [g.find('p1', 'trash', C.purpleEvent2)] });
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 5, deck: 4 });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"set up to 1": the set-active step takes a rested DON!! (the one set is not in the DON!! deck)', () => {
    const g = game([], { costArea: { active: 5, rested: 0 } });
    playCard(g, 'p1', ID);
    drive(g, 'p1', { don: 'costRested' });
    // 5 rested for Pink; −1 → 4 rested, deck 6; set 1 active → active 1, rested 3.
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 3, deck: 6 });
  });
});
