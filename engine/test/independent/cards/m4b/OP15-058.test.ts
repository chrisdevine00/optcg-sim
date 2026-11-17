/**
 * OP15-058 Enel (Leader, Purple, 5000, 5 Life, {Sky Island}).
 *
 * Card text:
 *   "Under the rules of this game, your DON!! deck consists of 6 cards.
 *    [Activate: Main] [Once Per Turn] If it is your second turn or later, add up to 1 DON!! card
 *    from your DON!! deck and set it as active, and add up to 4 additional DON!! cards and rest
 *    them. Then, give up to 4 rested DON!! cards to 1 of your Characters."
 *
 * Rules: RL-24 / RL-40 (QA-OP15 OP15-058: 6 DON!! in all; "second turn or later" counts the
 * player's own turns, so neither player can use it on their first turn); CR 10-2-13 (once per
 * turn); CR 8-4-4-1 ("up to" allows 0); CR 6-5-5-1 (only rested DON!! here; given DON!! stay on
 * the card); CR 4-10-2 ("then" still resolves when the first part did nothing).
 */
import { describe, expect, it } from 'vitest';
import { scenario } from '../../../fixtures/index.ts';
import { act } from '../../helpers.ts';
import { activate, canActivate, donOf, kind, myTurn, outcomes } from '../kit.ts';
import { newGame, startKeepingHands } from '../../setup-game.ts';
import { C, drive, V, side, FILLER } from './kit-c.ts';

function game(p1: Parameters<typeof side>[2] = {}) {
  return myTurn(
    side(C.enel, FILLER, { costArea: { active: 1, rested: 0 }, donDeck: 5, ...p1 }),
    side(C.luffy, FILLER),
  );
}

describe('OP15-058 Enel: [Activate: Main] on your second turn or later', () => {
  it('adds 1 active + 4 rested DON!! from the 6-card DON!! deck and gives the 4 rested to 1 Character', () => {
    const g = game({ characters: [V.sai] });
    const sai = g.find('p1', 'characters', V.sai);
    activate(g, g.leader('p1'));
    drive(g, 'p1', { targets: [sai], don: 'costRested' });
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 0, deck: 0, given: 4 });
    expect(g.card(sai).don).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('"up to 1" / "up to 4": the DON!! deck holds only 3, so 1 active + 2 rested are added; pre-existing rested DON!! can also be given', () => {
    const g = game({ characters: [V.sai], costArea: { active: 1, rested: 2 }, donDeck: 3 });
    const sai = g.find('p1', 'characters', V.sai);
    activate(g, g.leader('p1'));
    drive(g, 'p1', { targets: [sai], don: 'costRested' });
    // 1 active + 1 added active; rested 2 + 2 added = 4, all given (up to 4).
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 0, deck: 0, given: 4 });
  });

  it('with an empty DON!! deck nothing is added, but rested DON!! are still given ("then" still resolves, CR 4-10-2)', () => {
    const g = game({ characters: [V.sai], costArea: { active: 3, rested: 3 }, donDeck: 0 });
    const sai = g.find('p1', 'characters', V.sai);
    activate(g, g.leader('p1'));
    drive(g, 'p1', { targets: [sai], don: 'costRested' });
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 0, given: 3 });
  });

  it('with no Characters the DON!! are still added and none can be given', () => {
    const g = game();
    activate(g, g.leader('p1'));
    drive(g, 'p1', {});
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 4, deck: 0, given: 0 });
  });

  it('only rested DON!! can be given: an active DON!! stays active', () => {
    const g = game({ characters: [V.sai], costArea: { active: 3, rested: 0 }, donDeck: 3 });
    const sai = g.find('p1', 'characters', V.sai);
    activate(g, g.leader('p1'));
    drive(g, 'p1', { targets: [sai], don: 'costRested' });
    // 3 active + 1 added active = 4 active; 2 rested added and given.
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 0, deck: 0, given: 2 });
  });

  it('all given DON!! go to the one chosen Character, not the Leader or another Character', () => {
    const g = game({ characters: [V.sai, V.marco] });
    const marco = g.find('p1', 'characters', V.marco);
    activate(g, g.leader('p1'));
    drive(g, 'p1', { targets: [marco], don: 'costRested' });
    expect(g.card(marco).don).toBe(4);
    expect(g.card(g.find('p1', 'characters', V.sai)).don).toBe(0);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('"up to 1" recipient: the give may be skipped (choose none); the added DON!! stay in the cost area', () => {
    const g = game({ characters: [V.sai] });
    activate(g, g.leader('p1'));
    drive(g, 'p1', { option: '0' }); // the count is asked first: none
    expect(donOf(g, 'p1')).toMatchObject({ deck: 0, active: 2, rested: 4, given: 0 });
  });

  // DISAGREEMENTS-c.md D-1 (fixed in M4b fix round 1): the number given is the player's choice.
  it('"give up to 4": giving fewer than 4 is a legal choice (CR 8-4-4-1)', () => {
    const g = game({ characters: [V.sai] });
    activate(g, g.leader('p1'));
    const reached = outcomes(g, 'p1', (x) => String(donOf(x, 'p1').given));
    expect([...reached].some((n) => n !== '0' && n !== '4')).toBe(true);
  });

  it('[Once Per Turn]: after resolving, it is not offered again this turn', () => {
    const g = game({ characters: [V.sai] });
    activate(g, g.leader('p1'));
    drive(g, 'p1', { targets: [g.find('p1', 'characters', V.sai)] });
    expect(canActivate(g, g.leader('p1'))).toBe(false);
  });
});

/** Either the ability is not offered, or using it adds no DON!! (RL-40: it cannot be used). */
function expectNoEffect(g: ReturnType<typeof game>, p: 'p1' | 'p2') {
  const before = donOf(g, p);
  if (canActivate(g, g.leader(p))) {
    activate(g, g.leader(p));
    drive(g, p, {});
  }
  expect(donOf(g, p)).toEqual(before);
}

describe('OP15-058 Enel: "second turn or later" (QA-OP15 / RL-40)', () => {
  it("is not usable on the first player's first turn (turn 1)", () => {
    const g = scenario({
      turn: 1,
      p1: side(C.enel, FILLER, { costArea: { active: 1, rested: 0 }, donDeck: 5 }),
      p2: side(C.luffy, FILLER),
    });
    expectNoEffect(g, 'p1');
  });

  it("is not usable on the second player's first turn (turn 2), even though it is turn 2 of the game", () => {
    const g = scenario({
      turn: 2,
      activePlayer: 'p2',
      firstPlayer: 'p1',
      p1: side(C.luffy, FILLER),
      p2: side(C.enel, FILLER, { costArea: { active: 1, rested: 0 }, donDeck: 5 }),
    });
    expectNoEffect(g, 'p2');
  });

  it("is usable on the second player's second turn (turn 4)", () => {
    const g = scenario({
      turn: 4,
      activePlayer: 'p2',
      firstPlayer: 'p1',
      p1: side(C.luffy, FILLER),
      p2: side(C.enel, FILLER, { costArea: { active: 1, rested: 0 }, donDeck: 5 }),
    });
    expect(canActivate(g, g.leader('p2'))).toBe(true);
  });

  it("is usable on the first player's second turn (turn 3)", () => {
    const g = game();
    expect(canActivate(g, g.leader('p1'))).toBe(true);
    act(g, { type: 'endTurn' });
  });
});

describe('OP15-058 Enel: "your DON!! deck consists of 6 cards" (QA-OP15)', () => {
  const PURPLE_DECK = [
    ...[
      'ST05-007',
      'OP02-084',
      'OP02-080',
      'OP02-077',
      'OP01-103',
      'OP01-107',
      'OP01-110',
      'OP01-092',
      'OP11-078',
      'OP01-104',
      'OP09-072',
      'ST10-010',
    ].flatMap((id) => [id, id, id, id]),
    'OP12-071',
    'OP12-071',
  ];

  it('a real game starts with 6 DON!! in total for Enel (1 placed on turn 1 leaves 5) and 10 for the opponent', () => {
    const g = newGame({ p1Leader: C.enel, p1Main: PURPLE_DECK });
    startKeepingHands(g, true);
    // Turn 1 (p1 first): 1 DON!! placed. Total = field + deck = 6.
    const d = donOf(g, 'p1');
    expect(d.deck + d.active + d.rested + d.given).toBe(6);
    expect(d.active + d.rested).toBe(1);
    const o = donOf(g, 'p2');
    expect(o.deck + o.active + o.rested + o.given).toBe(10);
  });
});
