/**
 * OP13-058 Phoenix Pyreapple (Event, Blue, cost 1, {Former Whitebeard Pirates}).
 *
 * Card text: "[Main] You may rest 1 of your DON!! cards: Place up to 1 of your opponent's Characters
 * with 3000 power or less at the bottom of the owner's deck.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1 / digest 120 (the cost is paid first, "you may"), CR 8-4-4-1 ("up to"), digest
 * 109 (placing at the deck bottom is not a K.O.), CR 7-1 / digest 97 ("during this battle").
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  BLUE,
  canCounterWith,
  choices,
  dons,
  hasEvent,
  isMain,
  kind,
  mine,
  need,
  no,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  theirs,
  unusable,
  useCounter,
  attack,
  WL,
  WV,
  yes,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const PYRE = 'OP13-058';

function board(oppChars: string[], active = 5): TestGame {
  return mine(
    WL.croc,
    { hand: [PYRE], costArea: { active, rested: 0 }, characters: [WV.komachiyo] },
    { characters: oppChars, deck: [WV.marco, BLUE, BLUE, BLUE] },
  );
}

describe('OP13-058 Phoenix Pyreapple: [Main] rest 1 DON!!: place a Character with 3000 power or less at the deck bottom', () => {
  it('offers exactly the opposing Characters with 3000 power or less (3000 yes, 4000 no, 0 yes)', () => {
    const g = board([WV.komachiyo, WV.sai, WV.cobra]);
    playRaw(g, PYRE);
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([WV.cobra, WV.komachiyo].sort());
  });

  it('places the chosen Character at the bottom of its owner deck (not the trash)', () => {
    const g = board([WV.komachiyo]);
    playRaw(g, PYRE);
    yes(g);
    pickInst(g, [g.find('p2', 'characters', WV.komachiyo)]);
    expect(g.zone('p2', 'characters')).toEqual([]);
    const deck = g.zone('p2', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(5);
    expect(deck[deck.length - 1]).toBe(WV.komachiyo);
    expect(deck[0]).toBe(WV.marco);
    expect(g.zone('p2', 'trash')).toEqual([]);
  });

  it('is not a K.O.', () => {
    const g = board([WV.komachiyo]);
    playRaw(g, PYRE);
    yes(g);
    pickInst(g, [g.find('p2', 'characters', WV.komachiyo)]);
    expect(hasEvent(g, 'KO')).toBe(false);
  });

  it('my own Characters are never offered', () => {
    const g = board([WV.komachiyo]);
    playRaw(g, PYRE);
    yes(g);
    need(g, 'choose', 'p1');
    for (const i of choices(g)) expect(g.card(i).owner).toBe('p2');
  });

  it('pays exactly 1 extra rested DON!! on top of the Event cost', () => {
    const g = board([WV.komachiyo]);
    playRaw(g, PYRE);
    yes(g);
    expect(dons(g)).toMatchObject({ active: 3, rested: 2 });
  });

  it('"you may": declining the cost does nothing', () => {
    const g = board([WV.komachiyo]);
    playRaw(g, PYRE);
    no(g);
    expect(dons(g).rested).toBe(1);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(isMain(g)).toBe(true);
  });

  it('"up to 1": choosing nothing places nothing, the cost stays paid', () => {
    const g = board([WV.komachiyo]);
    playRaw(g, PYRE);
    yes(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(dons(g).rested).toBe(2);
  });

  it('unpayable cost: with 1 active DON!! (spent on the Event) the effect cannot be used', () => {
    const g = board([WV.komachiyo], 1);
    playRaw(g, PYRE);
    unusable(g);
    need(g, 'main', 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('with no Character of 3000 power or less the cost can be paid and nothing is placed', () => {
    const g = board([WV.sai]);
    playRaw(g, PYRE);
    yes(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(isMain(g)).toBe(true);
  });
});

describe('OP13-058 [Counter]: my Leader gains +3000 power during this battle', () => {
  function defend(): TestGame {
    const g = theirs(
      WL.croc,
      { hand: [PYRE], costArea: { active: 3, rested: 0 }, life: [BLUE, BLUE, BLUE, BLUE] },
      { characters: [WV.jil] },
    );
    attack(g, g.find('p2', 'characters', WV.jil), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    return g;
  }

  it('can be used in the Counter Step: Leader 8000 stops a 6000 attack', () => {
    const g = defend();
    expect(canCounterWith(g, g.find('p1', 'hand', PYRE))).toBe(true);
    useCounter(g, g.find('p1', 'hand', PYRE), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('control: without it the 6000 attack beats the 5000 Leader', () => {
    const g = defend();
    act(g, { type: 'endCounter' });
    expect(kind(g)).toBe('trigger');
  });

  it('the [Counter] does not place anything (the [Main] cost is not asked)', () => {
    const g = defend();
    useCounter(g, g.find('p1', 'hand', PYRE), g.leader('p1'));
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(dons(g).rested).toBe(1);
  });
});
