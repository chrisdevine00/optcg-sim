/**
 * EB02-023 Crocodile (Character, Blue, cost 4, 5000, Counter +1000, {Baroque Works}/{The Seven
 * Warlords of the Sea}).
 *
 * Card text: "[Your Turn] [Once Per Turn] When your opponent's Character is returned to the owner's
 * hand by your effect, look at 3 cards from the top of your deck and place them at the top or
 * bottom of the deck in any order."
 *
 * Bounce sources used: OP10-061 Special Long-Range Attack!! (Event, cost 3, "[Main] Draw 1 card.
 * Then, return up to 1 of your opponent's Characters with a cost of 2 or less to the owner's hand"),
 * and Sogeking EB02-024 ([On Play] ... return up to 1 Character with a cost of 1 or less). Vista
 * EB02-027 places a Character at the bottom of its owner's deck (not a return to the hand).
 * Whether the three cards go all to the top or bottom together or one by one is not asserted: the
 * tests check that the same three cards stay in the top or bottom three positions of the deck.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canFinish,
  chooseNone,
  choose,
  decision,
  deck,
  driveSogeking,
  E2C,
  E2L,
  fill,
  kind,
  mine,
  need,
  optionChoices,
  playRaw,
  tail,
} from './kit-eb02a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const CROC = 'EB02-023';
const BAG = 'OP10-061';
const SOGE = 'EB02-024';
const VISTA = 'EB02-027';

/** After the draw of the Event the deck is [marco, hajrudin, kingdew, ...]: those three are looked at. */
const DECK = [E2C.sai, E2C.marco, E2C.hajrudin, E2C.kingdew, ...fill(E2C.mohji, 10)];
const LOOKED = [E2C.marco, E2C.hajrudin, E2C.kingdew].sort();

function pos(
  hand: string[],
  oppChars: string[] = [E2C.mohji, E2C.komachiyo],
  mineChars: string[] = [],
) {
  return mine(
    E2L.shc,
    { hand, characters: [CROC, ...mineChars], deck: DECK },
    { characters: oppChars },
  );
}

/** Play the Event and return the opponent's Character `card`. */
function bounce(g: TestGame, card: string) {
  playRaw(g, BAG);
  choose(g, [g.find('p2', 'characters', card)]);
}

/** True when Crocodile's top-or-bottom question is pending. */
function asksPlacement(g: TestGame): boolean {
  const d = decision(g);
  return d?.kind === 'choose' && d.source?.card === CROC;
}

function place(g: TestGame, side: 'top' | 'bottom') {
  expect(asksPlacement(g)).toBe(true);
  expect(optionChoices(g)).toContain(side);
  act(g, { type: 'pick', choice: { option: side } });
  // Any further order question of the same effect: first listed answer.
  for (let i = 0; i < 6 && decision(g)?.kind === 'order'; i++) {
    g.act(g.legal().find((a) => a.type === 'order')!);
  }
}

describe('EB02-023 Crocodile: [Your Turn] [Once Per Turn] look at 3 when my effect returns an opponent’s Character to hand', () => {
  it('my Event returns an opponent’s Character: I am asked where to place the 3 cards looked at', () => {
    const g = pos([BAG]);
    bounce(g, E2C.mohji);
    expect(g.zone('p2', 'hand').map((c) => c.card)).toContain(E2C.mohji);
    expect(asksPlacement(g)).toBe(true);
  });

  it('placing them on top keeps the same 3 cards on top of the deck', () => {
    const g = pos([BAG]);
    bounce(g, E2C.mohji);
    place(g, 'top');
    need(g, 'main', 'p1');
    expect(deck(g)).toHaveLength(13);
    expect(deck(g).slice(0, 3).sort()).toEqual(LOOKED);
  });

  it('placing them at the bottom moves the same 3 cards to the bottom of the deck', () => {
    const g = pos([BAG]);
    bounce(g, E2C.mohji);
    place(g, 'bottom');
    need(g, 'main', 'p1');
    expect(deck(g)).toHaveLength(13);
    expect(tail(deck(g), 3)).toEqual(LOOKED);
    expect(deck(g)[0]).toBe(E2C.mohji);
  });

  it('exactly 3 cards are looked at: the 4th card from the top of the deck is not moved', () => {
    const g = pos([BAG]);
    bounce(g, E2C.mohji);
    place(g, 'bottom');
    expect(deck(g)[0]).toBe(E2C.mohji);
    expect(deck(g).filter((c) => c === E2C.mohji)).toHaveLength(10);
  });

  it('Once Per Turn: a second bounce in the same turn does not ask again', () => {
    const g = pos([BAG, BAG]);
    bounce(g, E2C.mohji);
    place(g, 'top');
    bounce(g, E2C.komachiyo);
    expect(
      g
        .zone('p2', 'hand')
        .map((c) => c.card)
        .sort(),
    ).toEqual([E2C.mohji, E2C.komachiyo].sort());
    expect(asksPlacement(g)).toBe(false);
    need(g, 'main', 'p1');
  });

  it('Sogeking’s [On Play] also counts as "your effect" returning an opponent’s Character', () => {
    const g = mine(
      E2L.shc,
      {
        hand: [SOGE, E2C.sai],
        characters: [CROC],
        deck: [E2C.marco, E2C.hajrudin, ...fill(E2C.mohji, 12)],
      },
      { characters: [E2C.komachiyo] },
    );
    playRaw(g, SOGE);
    driveSogeking(g, g.find('p2', 'characters', E2C.komachiyo));
    expect(g.zone('p2', 'hand').map((c) => c.card)).toEqual([E2C.komachiyo]);
    expect(asksPlacement(g)).toBe(true);
  });

  it('returning my OWN Character (Sogeking’s [On Play]) does not trigger it: it is not an opponent’s Character', () => {
    const g = mine(
      E2L.shc,
      {
        hand: [SOGE, E2C.sai],
        characters: [CROC, E2C.mohji],
        deck: [E2C.marco, E2C.hajrudin, ...fill(E2C.mohji, 12)],
      },
      { characters: [E2C.komachiyo] },
    );
    playRaw(g, SOGE);
    driveSogeking(g, g.find('p1', 'characters', E2C.mohji));
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(E2C.mohji);
    expect(asksPlacement(g)).toBe(false);
    need(g, 'main', 'p1');
  });

  it('placing an opponent’s Character at the bottom of its deck (Vista) is not a return to the hand', () => {
    const g = mine(
      E2L.shc,
      { hand: [VISTA], characters: [CROC], deck: DECK },
      { characters: [E2C.gaimon] },
    );
    playRaw(g, VISTA);
    choose(g, [g.find('p2', 'characters', E2C.gaimon)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(asksPlacement(g)).toBe(false);
    need(g, 'main', 'p1');
  });

  it('an effect that finds no Character to return does not trigger it', () => {
    const g = pos([BAG], [E2C.kingdew]);
    playRaw(g, BAG);
    // Cost 5 is above the Event’s limit of 2: nothing can be returned.
    if (kind(g) === 'choose' && canFinish(g)) chooseNone(g);
    expect(asksPlacement(g)).toBe(false);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
