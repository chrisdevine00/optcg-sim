/**
 * OP12-117 Slam Gibson (Event, Yellow, cost 1, {Kid Pirates}{Supernovas}).
 *
 * Card text: "[Main] You may rest 5 of your DON!! cards: If your Leader has the "Supernovas" type, add
 * up to 1 Character with a cost of 9 or less to the top or bottom of the owner's Life cards
 * face-down. [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules used: "You may" cost is paid on activation and only active DON!! can be rested (CR 8-3-1-5);
 * the "If" after the colon is an effect condition (the cost is spent when it fails, M4b-5); "up to 1"
 * may be none; the Character goes to its OWNER's Life; a Character with DON!! given sends them back
 * (the total DON!! stays 10); a [Counter] Event costs its printed cost and lasts until the end of
 * the battle. Which prompt kinds appear for the end is not fixed by the rules, so the tests read
 * the engine's offered options.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, cardIds, decision, passBlock } from '../../helpers.ts';
import {
  accept,
  canCounterWith,
  choices,
  decline,
  kind,
  optionChoices,
  useCounter,
} from '../kit.ts';
import {
  canAccept,
  dons,
  mine7,
  need,
  now,
  S7,
  theirs7,
  legalText,
  canDone,
  done,
} from './kit-w7b.ts';

const GIBSON = S7.gibson;
const SUPERNOVAS_LEADER = S7.strikeSupernova; // OP01-003
const OTHER_LEADER = S7.crocodile; // ST03-001: {Baroque Works}, not Supernovas

/** p1 plays Gibson in the Main Phase and says yes to the DON!! cost. Stops at the next decision. */
function playAndPay(g: ReturnType<typeof mine7>): void {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', GIBSON) });
  need(g, 'optional', 'p1');
  accept(g);
}

function game(leader: string = SUPERNOVAS_LEADER, p1 = {}, p2 = {}) {
  return mine7(
    leader,
    { hand: [GIBSON], ...p1 },
    { characters: [S7.kingdew], life: ['P-015', 'P-015', 'P-015'], ...p2 },
  );
}

/** Pick a card in the pending target choose, then the end option. */
function target(
  g: ReturnType<typeof mine7>,
  card: string,
  owner: 'p1' | 'p2',
  end: 'top' | 'bottom',
) {
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: g.find(owner, 'characters', card) });
  if (kind(g) === 'choose' && optionChoices(g).length === 0 && canDone(g)) done(g);
  need(g, 'choose', 'p1');
  expect(optionChoices(g).sort()).toEqual(['bottom', 'top']);
  act(g, { type: 'pick', choice: { option: end } });
}

describe("OP12-117 Slam Gibson: rest 5 DON!!; with a {Supernovas} Leader add a Character cost 9 or less to the top or bottom of its owner's Life face-down; [Counter] Leader +3000", () => {
  it('printed values: Event, cost 1', () => {
    const g = game();
    expect(g.card(g.find('p1', 'hand', GIBSON)).cost).toBe(1);
  });

  it("[Main] top: the opponent's Character becomes the top card of the opponent's Life, face-down; 5 DON!! are rested on top of the cost", () => {
    const g = game();
    playAndPay(g);
    target(g, S7.kingdew, 'p2', 'top');
    expect(cardIds(g, 'p2', 'life')).toEqual([S7.kingdew, 'P-015', 'P-015', 'P-015']);
    expect(g.zone('p2', 'life')[0]!.faceUp).toBe(false);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'life').length).toBe(4);
    expect(dons(g)).toMatchObject({ active: 4, rested: 6 });
    expect(cardIds(g, 'p1', 'trash')).toEqual([GIBSON]);
  });

  it("[Main] bottom: the Character becomes the bottom card of its owner's Life", () => {
    const g = game();
    playAndPay(g);
    target(g, S7.kingdew, 'p2', 'bottom');
    expect(cardIds(g, 'p2', 'life')).toEqual(['P-015', 'P-015', 'P-015', S7.kingdew]);
    expect(g.zone('p2', 'life')[3]!.faceUp).toBe(false);
  });

  it("may target one of my own Characters: it goes to MY Life (the owner's), not the opponent's", () => {
    const g = game(SUPERNOVAS_LEADER, { characters: [S7.marco] });
    playAndPay(g);
    target(g, S7.marco, 'p1', 'top');
    expect(cardIds(g, 'p1', 'life')[0]).toBe(S7.marco);
    expect(cardIds(g, 'p1', 'life').length).toBe(5);
    expect(cardIds(g, 'p2', 'life').length).toBe(3);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('boundary: cost 9 may be chosen, cost 10 may not', () => {
    const g = game(SUPERNOVAS_LEADER, {}, { characters: [S7.c9, S7.vanilla10] });
    playAndPay(g);
    need(g, 'choose', 'p1');
    const nine = g.find('p2', 'characters', S7.c9);
    const ten = g.find('p2', 'characters', S7.vanilla10);
    expect(g.card(nine).cost).toBe(9);
    expect(g.card(ten).cost).toBe(10);
    expect(choices(g)).toContain(nine);
    expect(choices(g)).not.toContain(ten);
  });

  it('"up to 1": choosing nothing leaves every Life area and Character area as it was, the cost is still paid', () => {
    const g = game();
    playAndPay(g);
    need(g, 'choose', 'p1');
    expect(canDone(g)).toBe(true);
    done(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([S7.kingdew]);
    expect(cardIds(g, 'p2', 'life').length).toBe(3);
    expect(dons(g)).toMatchObject({ active: 4, rested: 6 });
    expect(kind(g)).toBe('main');
  });

  it('a Leader without the Supernovas type: the DON!! cost is still paid and nothing is added to Life (the "If" is after the colon)', () => {
    const g = game(OTHER_LEADER);
    playAndPay(g);
    expect(kind(g), now(g)).toBe('main');
    expect(cardIds(g, 'p2', 'characters')).toEqual([S7.kingdew]);
    expect(cardIds(g, 'p2', 'life').length).toBe(3);
    expect(dons(g)).toMatchObject({ active: 4, rested: 6 });
  });

  it("declining the optional cost: nothing is rested beyond the Event's cost 1 and nothing moves", () => {
    const g = game();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', GIBSON) });
    need(g, 'optional', 'p1');
    decline(g);
    expect(kind(g), now(g)).toBe('main');
    expect(dons(g)).toMatchObject({ active: 9, rested: 1 });
    expect(cardIds(g, 'p2', 'characters')).toEqual([S7.kingdew]);
  });

  it("with fewer than 5 active DON!! left after the Event's cost the cost cannot be paid: accepting is not legal and nothing moves", () => {
    const g = game(SUPERNOVAS_LEADER, { costArea: { active: 5, rested: 0 } });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', GIBSON) });
    // Either the effect is skipped, or the question is asked with "yes" unavailable.
    if (kind(g) === 'optional') expect(canAccept(g), legalText(g)).toBe(false);
    if (kind(g) === 'optional') decline(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([S7.kingdew]);
    expect(cardIds(g, 'p2', 'life').length).toBe(3);
  });

  it('exactly 5 active DON!! left after the cost (6 in the cost area) is enough', () => {
    const g = game(SUPERNOVAS_LEADER, { costArea: { active: 6, rested: 0 } });
    playAndPay(g);
    target(g, S7.kingdew, 'p2', 'top');
    expect(dons(g)).toMatchObject({ active: 0, rested: 6 });
    expect(cardIds(g, 'p2', 'life')[0]).toBe(S7.kingdew);
  });

  it('a Character with DON!! given goes to Life and the DON!! are not lost (the total DON!! on the field and in the deck is unchanged)', () => {
    const g = game(
      SUPERNOVAS_LEADER,
      {},
      { characters: [{ card: S7.kingdew, don: 2 }], costArea: { active: 3, rested: 0 } },
    );
    const before = dons(g, 'p2');
    playAndPay(g);
    target(g, S7.kingdew, 'p2', 'top');
    const after = dons(g, 'p2');
    expect(after.given).toBe(0);
    expect(after.active + after.rested + after.given).toBeGreaterThanOrEqual(
      before.active + before.rested,
    );
  });

  describe('[Counter]: Your Leader gains +3000 power during this battle', () => {
    function attacked(counter: boolean) {
      // p1 defends on p2's turn.
      const t = theirs7(SUPERNOVAS_LEADER, { hand: [GIBSON], costArea: { active: 3, rested: 0 } });
      attack(t, t.leader('p2'), t.leader('p1'));
      passBlock(t);
      if (counter) {
        expect(canCounterWith(t, t.find('p1', 'hand', GIBSON))).toBe(true);
        useCounter(t, t.find('p1', 'hand', GIBSON), t.leader('p1'));
        expect(t.power(t.leader('p1'))).toBe(8000);
      }
      return t;
    }

    it('without the Counter a 5000 Leader hit by a 5000 attacker loses a Life card', () => {
      const t = attacked(false);
      act(t, { type: 'endCounter' });
      while (decision(t)?.kind === 'trigger') act(t, { type: 'trigger', activate: false });
      expect(cardIds(t, 'p1', 'life').length).toBe(3);
    });

    it('with the Counter the Leader has 8000 in this battle: the 5000 attack misses and no Life card is lost', () => {
      const t = attacked(true);
      act(t, { type: 'endCounter' });
      while (decision(t)?.kind === 'trigger') act(t, { type: 'trigger', activate: false });
      expect(cardIds(t, 'p1', 'life').length).toBe(4);
    });

    it('the +3000 ends with the battle', () => {
      const t = attacked(true);
      act(t, { type: 'endCounter' });
      while (decision(t)?.kind === 'trigger') act(t, { type: 'trigger', activate: false });
      expect(t.power(t.leader('p1'))).toBe(5000);
    });

    it('the Counter needs its printed cost 1: with no active DON!! it cannot be used', () => {
      const t = theirs7(SUPERNOVAS_LEADER, { hand: [GIBSON], costArea: { active: 0, rested: 0 } });
      attack(t, t.leader('p2'), t.leader('p1'));
      passBlock(t);
      need(t, 'counter', 'p1');
      expect(canCounterWith(t, t.find('p1', 'hand', GIBSON))).toBe(false);
    });
  });
});
