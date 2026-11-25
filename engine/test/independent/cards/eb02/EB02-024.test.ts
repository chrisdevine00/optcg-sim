/**
 * EB02-024 Sogeking (Character, Blue, cost 4, 5000, Counter +1000, {Sniper Island}).
 *
 * Card text: "Also treat this card's name as [Usopp] according to the rules.
 * [On Play] Draw 2 cards and place 2 cards from your hand at the bottom of your deck in any order.
 * Then, return up to 1 Character with a cost of 1 or less to the owner's hand."
 *
 * Rules: "place 2 cards" is exact (CR 8-4-4-1 allows 0 only for "up to"); the return is "up to 1"
 * over any Character (either side). The name alias has no scripted card that reads it, so it is
 * not tested (see API-GAPS-a.md).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canFinish,
  choices,
  decision,
  deck,
  driveSogeking,
  E2C,
  E2L,
  fill,
  hand,
  kind,
  mine,
  need,
  playRaw,
  tail,
} from './kit-eb02a.ts';

const SOGE = 'EB02-024';

/** Deck top: marco, hajrudin, then Mohji; my hand: Sogeking + Sai; Characters on both sides. */
function start(mineChars: string[] = [E2C.mohji], oppChars: string[] = [E2C.komachiyo]) {
  const g = mine(
    E2L.shc,
    {
      hand: [SOGE, E2C.sai],
      characters: mineChars,
      deck: [E2C.marco, E2C.hajrudin, ...fill(E2C.mohji, 12)],
    },
    { characters: oppChars },
  );
  playRaw(g, SOGE);
  return g;
}

describe('EB02-024 Sogeking: [On Play] draw 2, place 2 from hand at the bottom, return up to 1 Character with cost 1 or less', () => {
  it('draws 2 cards, places 2 at the bottom: the hand ends the same size, the deck the same size', () => {
    const g = start();
    driveSogeking(g, 'none');
    need(g, 'main', 'p1');
    expect(hand(g)).toHaveLength(1);
    expect(deck(g)).toHaveLength(14);
  });

  it('the 2 cards placed are the ones I choose, among the cards drawn too', () => {
    const g = start();
    // Hand now holds Sai and the two drawn cards (marco, hajrudin).
    const marco = g.find('p1', 'hand', E2C.marco);
    const hajrudin = g.find('p1', 'hand', E2C.hajrudin);
    expect(decision(g)?.kind).toBe('choose');
    expect(hand(g)).toEqual([E2C.hajrudin, E2C.marco, E2C.sai].sort());
    driveSogeking(g, 'none', [marco, hajrudin]);
    expect(hand(g)).toEqual([E2C.sai]);
    expect(tail(deck(g), 2)).toEqual([E2C.hajrudin, E2C.marco].sort());
  });

  it('the 2 cards go to the bottom: below the 12 Mohji that were not drawn', () => {
    const g = start();
    driveSogeking(g, 'none', [g.find('p1', 'hand', E2C.sai), g.find('p1', 'hand', E2C.marco)]);
    expect(tail(deck(g), 2)).toEqual([E2C.marco, E2C.sai].sort());
    expect(deck(g).slice(0, 12)).toEqual(fill(E2C.mohji, 12));
  });

  it('"place 2" is exact: the pick cannot be finished with fewer', () => {
    const g = start();
    expect(canFinish(g)).toBe(false);
    expect(decision(g)?.min).toBe(2);
    expect(decision(g)?.max).toBe(2);
  });

  it('the return may take my own Character of cost 1', () => {
    const g = start();
    driveSogeking(g, g.find('p1', 'characters', E2C.mohji));
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(E2C.mohji);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SOGE]);
  });

  it('the return may take an opponent’s Character of cost 1, to its owner’s hand', () => {
    const g = start();
    driveSogeking(g, g.find('p2', 'characters', E2C.komachiyo));
    expect(g.zone('p2', 'hand').map((c) => c.card)).toEqual([E2C.komachiyo]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('the cost boundary: a Character of cost 2 is not offered, cost 1 is', () => {
    const g = start([E2C.mohji, E2C.sai], [E2C.komachiyo, E2C.momoo]);
    // Walk to the return pick.
    for (let i = 0; i < 8 && !/return/.test(decision(g)?.prompt ?? ''); i++) {
      if (decision(g)?.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
      else act(g, { type: 'pick', choice: choices(g)[0]! });
    }
    const offered = choices(g);
    expect(offered).toContain(g.find('p1', 'characters', E2C.mohji));
    expect(offered).toContain(g.find('p2', 'characters', E2C.komachiyo));
    expect(offered).not.toContain(g.find('p1', 'characters', E2C.sai));
    expect(offered).not.toContain(g.find('p2', 'characters', E2C.momoo));
    expect(offered).not.toContain(g.find('p1', 'characters', SOGE));
  });

  it('"up to 1": nothing needs to be returned', () => {
    const g = start();
    driveSogeking(g, 'none');
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([E2C.mohji, SOGE].sort());
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([E2C.komachiyo]);
    expect(kind(g)).toBe('main');
  });

  it('returns at most one Character', () => {
    const g = start([E2C.mohji, E2C.komachiyo], [E2C.karoo1]);
    driveSogeking(g, g.find('p1', 'characters', E2C.mohji));
    need(g, 'main', 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});
