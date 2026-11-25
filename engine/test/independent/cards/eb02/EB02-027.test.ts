/**
 * EB02-027 Vista (Character, Blue, cost 4, 5000, Counter +1000, {Whitebeard Pirates}).
 *
 * Card text: "[On Play] Place up to 1 of your opponent's Characters with 1000 power or less at the
 * bottom of the owner's deck."
 *
 * Rules: "up to" (CR 8-4-4-1); "1000 power or less" reads current power; the card goes to the bottom
 * of its OWNER's deck (it is not trashed or K.O.'d).
 */
import { describe, expect, it } from 'vitest';
import {
  canFinish,
  choices,
  choose,
  chooseNone,
  deck,
  E2C,
  E2L,
  kind,
  mine,
  need,
  offers,
  playRaw,
  trash,
} from './kit-eb02a.ts';

const VISTA = 'EB02-027';
const FAKE = 'EB02-005';
/** EB02-013 Carrot: cost 1, 0 power. */
const CARROT = 'EB02-013';
/** OP14-003 Capone"Gang"Bege: cost 1, 2000. */
const BEGE = 'OP14-003';

function start(
  oppChars: (string | { card: string; rested?: boolean })[],
  mineChars: string[] = [],
) {
  const g = mine(E2L.shc, { hand: [VISTA], characters: mineChars }, { characters: oppChars });
  playRaw(g, VISTA);
  return g;
}

describe('EB02-027 Vista: [On Play] place up to 1 opposing Character with 1000 power or less at the bottom of its owner’s deck', () => {
  it('places a 1000-power Character at the bottom of the owner’s deck', () => {
    const g = start([E2C.gaimon]);
    const before = deck(g, 'p2').length;
    choose(g, [g.find('p2', 'characters', E2C.gaimon)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(deck(g, 'p2')).toHaveLength(before + 1);
    expect(deck(g, 'p2').at(-1)).toBe(E2C.gaimon);
    need(g, 'main', 'p1');
  });

  it('the Character is not trashed or sent to hand', () => {
    const g = start([E2C.gaimon]);
    choose(g, [g.find('p2', 'characters', E2C.gaimon)]);
    expect(trash(g, 'p2')).toEqual([]);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
  });

  it('the power boundary: 1000 and 0 are offered, 2000 is not', () => {
    const g = start([E2C.gaimon, CARROT, BEGE]);
    expect(offers(g, g.find('p2', 'characters', E2C.gaimon))).toBe(true);
    expect(offers(g, g.find('p2', 'characters', CARROT))).toBe(true);
    expect(offers(g, g.find('p2', 'characters', BEGE))).toBe(false);
  });

  it('current power counts: a Fake Straw Hat Crew (3000 base, −2000 on my turn for the opponent) is offered', () => {
    const g = start([FAKE]);
    expect(g.power(g.find('p2', 'characters', FAKE))).toBe(1000);
    expect(offers(g, g.find('p2', 'characters', FAKE))).toBe(true);
  });

  it('a stronger Character is not offered', () => {
    const g = start([E2C.gaimon, E2C.marco]);
    expect(offers(g, g.find('p2', 'characters', E2C.marco))).toBe(false);
  });

  it('a rested Character is eligible too', () => {
    const g = start([{ card: E2C.gaimon, rested: true }]);
    expect(offers(g, g.find('p2', 'characters', E2C.gaimon))).toBe(true);
  });

  it('only the opponent’s Characters are offered, not my own 1000-power Character', () => {
    const g = start([E2C.gaimon], [E2C.gaimon]);
    expect(choices(g).every((i) => g.card(i).owner === 'p2')).toBe(true);
  });

  it('"up to 1": nothing needs to be placed', () => {
    const g = start([E2C.gaimon]);
    expect(canFinish(g)).toBe(true);
    chooseNone(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('places only one Character even when several are eligible', () => {
    const g = start([E2C.gaimon, CARROT]);
    choose(g, [g.find('p2', 'characters', CARROT)]);
    need(g, 'main', 'p1');
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([E2C.gaimon]);
  });

  it('my own deck is not touched', () => {
    const g = mine(E2L.shc, { hand: [VISTA] }, { characters: [E2C.gaimon] });
    const mineBefore = deck(g, 'p1').length;
    playRaw(g, VISTA);
    choose(g, [g.find('p2', 'characters', E2C.gaimon)]);
    expect(deck(g, 'p1')).toHaveLength(mineBefore);
    expect(kind(g)).toBe('main');
  });
});
