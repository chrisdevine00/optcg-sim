/**
 * OP09-008 Building Snake (Character, Red, cost 1, 2000, Slash, {Red-Haired Pirates}).
 *
 * Card text: "[Activate: Main] You may place this Character at the bottom of the owner's deck: Give up
 * to 1 of your opponent's Characters −3000 power during this turn."
 *
 * Rules: CR 8-3-1 (a cost before the colon is paid by choosing to activate; the effect after the
 * colon is then resolved), CR 4-8-1 ("up to"), CR 6-5-5-4 (DON!! given to a card that leaves the field
 * go to the cost area rested), CR 3-1-6 (a card that changes area is a new card).
 *
 * Scenery (printed): OP01-023 Marco 5000, OP01-010 Komachiyo 3000, OP01-012 Sai 4000.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { decision } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  BLUE,
  donOf,
  LW,
  mayEnd,
  need,
  none,
  offeredAbilities,
  offeredCards,
  ofZone,
  pickCards,
  RED,
  SC6,
  toMyNextMain,
  useAbility,
} from './kit-w6a.ts';

const ID = 'OP09-008';

function start(mine: PlayerSpec['characters'], theirs: PlayerSpec['characters'] = [], don = 0) {
  return myTurn(
    side(LW.luffy, BLUE, { characters: mine, costArea: { active: don, rested: 0 } }),
    side(LW.luffy, RED, { characters: theirs, costArea: { active: 3, rested: 0 } }),
  );
}

describe('OP09-008 Building Snake: [Activate: Main] place this Character at the bottom of the deck: -3000 power to an opposing Character', () => {
  it("places Snake at the bottom of the owner's deck as the cost, then gives -3000 power this turn", () => {
    const g = start([ID], [SC6.c5k]);
    const marco = g.find('p2', 'characters', SC6.c5k);
    const before = g.zone('p1', 'deck').length;
    useAbility(g, g.find('p1', 'characters', ID));
    // The cost is paid first: Snake is already in the deck, at the bottom.
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    const deck = g.zone('p1', 'deck');
    expect(deck).toHaveLength(before + 1);
    expect(deck[deck.length - 1]!.card).toBe(ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SC6.c5k]);
    expect(decision(g)?.kind).toBe('main');
    expect(g.power(marco)).toBe(2000);
  });

  it('only opposing Characters are offered as targets: not my Characters, not the Leaders', () => {
    const g = start([ID, SC6.c4k], [SC6.c5k, SC6.c3k]);
    useAbility(g, g.find('p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredCards(g)).toEqual([SC6.c5k, SC6.c3k].sort());
  });

  it('a 3000 Character goes to 0 power and the Character stays on the field', () => {
    const g = start([ID], [SC6.c3k]);
    useAbility(g, g.find('p1', 'characters', ID));
    pickCards(g, [SC6.c3k]);
    expect(g.power(g.find('p2', 'characters', SC6.c3k))).toBe(0);
    expect(ofZone(g, 'p2', 'characters')).toEqual([SC6.c3k]);
  });

  it('"up to 1": the target may be left unchosen; Snake is still placed', () => {
    const g = start([ID], [SC6.c5k]);
    useAbility(g, g.find('p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    expect(decision(g)?.max).toBe(1);
    none(g);
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(g.power(g.find('p2', 'characters', SC6.c5k))).toBe(5000);
  });

  it('the opponent has no Character: the cost can still be paid and Snake is placed', () => {
    const g = start([ID], []);
    expect(offeredAbilities(g, g.find('p1', 'characters', ID))).toHaveLength(1);
    useAbility(g, g.find('p1', 'characters', ID));
    if (decision(g)?.kind === 'choose') none(g);
    expect(decision(g)?.kind).toBe('main');
    expect(ofZone(g, 'p1', 'characters')).toEqual([]);
    expect(g.zone('p1', 'deck').at(-1)?.card).toBe(ID);
  });

  it('the -3000 lasts this turn only', () => {
    const g = start([ID], [SC6.c5k]);
    const marco = g.find('p2', 'characters', SC6.c5k);
    useAbility(g, g.find('p1', 'characters', ID));
    pickCards(g, [SC6.c5k]);
    expect(g.power(marco)).toBe(2000);
    toMyNextMain(g);
    expect(g.power(marco)).toBe(5000);
  });

  it('two Snakes stack: -6000 on the same Character', () => {
    const g = start([ID, ID], [SC6.c7k]);
    useAbility(g, g.find('p1', 'characters', ID, 0));
    pickCards(g, [SC6.c7k]);
    useAbility(g, g.find('p1', 'characters', ID, 0));
    pickCards(g, [SC6.c7k]);
    expect(g.power(g.find('p2', 'characters', SC6.c7k))).toBe(1000);
    expect(
      g
        .zone('p1', 'deck')
        .slice(-2)
        .map((c) => c.card),
    ).toEqual([ID, ID]);
  });

  it('can be used the turn it is played', () => {
    const g = start([{ card: ID, playedThisTurn: true }], [SC6.c5k]);
    expect(offeredAbilities(g, g.find('p1', 'characters', ID))).toHaveLength(1);
  });

  it('DON!! given to Snake go to the cost area rested when it is placed (the cost keeps the total)', () => {
    const g = start([{ card: ID, don: 2 }], [SC6.c5k], 1);
    expect(donOf(g)).toMatchObject({ active: 1, rested: 0, given: 2 });
    useAbility(g, g.find('p1', 'characters', ID));
    expect(donOf(g)).toMatchObject({ active: 1, rested: 2, given: 0 });
  });

  it('a placed Snake is no longer on the field: it cannot be activated twice and the next draw is not Snake', () => {
    const g = start([ID], [SC6.c5k]);
    const snake = g.find('p1', 'characters', ID);
    useAbility(g, snake);
    pickCards(g, [SC6.c5k]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'deck')[0]!.card).not.toBe(ID);
  });
});
