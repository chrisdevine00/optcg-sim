/**
 * EB04-049 Finger Pistol Yellow Lotus (Event, Black, cost 4, {CP9}).
 *
 * Card text: "[Main] You may trash 2 cards from the top of your deck: K.O. up to 1 of your opponent's
 * Characters with a base cost of 5 or less."
 * "[Trigger] Activate this card's [Main] effect."
 *
 * Rules: the cost is trashing the top 2 cards of the deck and cannot be paid with fewer. "Base
 * cost" ignores effects that change the cost (CR 4-9-2). "Up to 1" may be none. The [Trigger]
 * activates the [Main] effect, including its optional cost.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  chars,
  deck,
  fill,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  pickRaw,
  playRaw,
  theirs,
  trash,
  unusable,
  yes,
  atMain,
  costOf,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-049';
const ALPHA = 'EB04-042';
const SAI = 'OP01-012'; // Red, cost 2
const KINGDEW = 'OP02-006'; // Red, cost 5, 7000
const THATCH = 'OP02-007'; // Red, cost 6, 8000
const MARCO = 'OP01-023';

function cast(foes: string[], deckCards: string[] = [SAI, MARCO, ...fill(BLUE, 8)]): TestGame {
  const g = mine(
    LB.navy,
    { hand: [ID], deck: deckCards },
    { characters: foes, deck: fill(BLUE, 10) },
  );
  playRaw(g, ID);
  return g;
}

describe('EB04-049 Finger Pistol Yellow Lotus [Main]: trash 2 from the top: K.O. a Character with base cost 5 or less', () => {
  it('trashes the top 2 cards and K.O.s the chosen Character', () => {
    const g = cast([KINGDEW, SAI]);
    yes(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', KINGDEW));
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([SAI]);
    expect(trash(g, 'p2')).toEqual([KINGDEW]);
    expect(trash(g)).toEqual([ID, SAI, MARCO].sort());
    expect(deck(g)).toHaveLength(8);
  });

  it('boundary: base cost 5 is offered, base cost 6 is not', () => {
    const g = cast([KINGDEW, THATCH, SAI]);
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KINGDEW, SAI].sort());
  });

  it('uses the base cost: a cost-6 Character reduced to cost 5 is still not offered', () => {
    const g = mine(
      LB.navy,
      { hand: [ALPHA, ID], deck: fill(BLUE, 12), costArea: { active: 10, rested: 0 } },
      { characters: [THATCH] },
    );
    playRaw(g, ALPHA);
    yes(g);
    pickRaw(g, at(g, 'p2', 'characters', THATCH));
    expect(costOf(g, at(g, 'p2', 'characters', THATCH))).toBe(5);
    playRaw(g, ID);
    yes(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g, 'p2')).toEqual([THATCH]);
  });

  it('"up to 1": may K.O. nobody; the two cards are still trashed', () => {
    const g = cast([SAI]);
    yes(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toEqual([SAI]);
    expect(trash(g)).toHaveLength(3);
  });

  it('declining the cost: nothing trashed, nobody K.O.d', () => {
    const g = cast([SAI]);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(10);
    expect(chars(g, 'p2')).toEqual([SAI]);
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: with only 1 card in the deck the cost cannot be paid', () => {
    const g = cast([SAI], [SAI]);
    unusable(g);
    expect(chars(g, 'p2')).toEqual([SAI]);
    expect(deck(g)).toHaveLength(1);
  });

  it('K.O.s at most one Character', () => {
    const g = cast([SAI, SAI, KINGDEW]);
    yes(g);
    pickRaw(g, at(g, 'p2', 'characters', KINGDEW));
    expect(chars(g, 'p2')).toHaveLength(2);
  });

  it('with no legal target the cost can still be paid and nobody is K.O.d', () => {
    const g = cast([THATCH]);
    yes(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g, 'p2')).toEqual([THATCH]);
  });
});

describe('EB04-049 Finger Pistol Yellow Lotus [Trigger]: activate this card [Main] effect', () => {
  function triggered(): TestGame {
    const g = theirs(
      LB.navy,
      { life: [ID, BLUE, BLUE, BLUE], deck: [SAI, MARCO, ...fill(BLUE, 8)] },
      { characters: [KINGDEW, SAI] },
    );
    attack(g, at(g, 'p2', 'characters', KINGDEW), g.leader('p1'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    return g;
  }

  it('revealed from Life, it can be activated: pay 2 from the deck and K.O. a Character', () => {
    const g = triggered();
    expect(kind(g)).toBe('trigger');
    g.act({ type: 'trigger', activate: true });
    yes(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', SAI));
    expect(chars(g, 'p2')).toEqual([KINGDEW]);
    expect(trash(g)).toEqual([ID, SAI, MARCO].sort());
  });

  it('the optional cost may be declined inside the Trigger', () => {
    const g = triggered();
    g.act({ type: 'trigger', activate: true });
    no(g);
    expect(chars(g, 'p2')).toEqual([KINGDEW, SAI].sort());
    expect(deck(g)).toHaveLength(10);
  });

  it('the Trigger may be declined: the card goes to the hand and nothing happens', () => {
    const g = triggered();
    g.act({ type: 'trigger', activate: false });
    expect(chars(g, 'p2')).toEqual([KINGDEW, SAI].sort());
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(ID);
  });
});
