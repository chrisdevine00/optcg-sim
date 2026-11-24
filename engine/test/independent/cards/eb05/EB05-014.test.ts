/**
 * EB05-014 Shirahoshi (Character, Green, cost 1, 0, no Counter, {Merfolk}/{Fish-Man Island}, Wisdom).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to a total of 2 [Megalo] or
 * {Neptunian} type cards and add them to your hand. Then, trash the rest.
 * [Activate: Main] You may rest this Character: Up to 1 of your {Neptunian} type Characters with 6000
 * power or less gains [Rush] during this turn."
 *
 * Rules: CR 8-4-4-1/-2 ("up to" allows 0), CR 11-2-1 (reveal), CR 10-1-1 ([Rush]), CR 3-7-4 (summoning
 * sickness), RL-09, CR 8-3-1-3/-4 (costs).
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import {
  abilities,
  activate,
  BLUE,
  canActivate,
  canAttackAny,
  checkLook,
  choiceCards,
  chooseCards,
  chooseNone,
  deck,
  EL,
  hand,
  kind,
  mine,
  offeredInstance,
  choose,
  playCard,
  reachablePickSets,
  settleYes,
  trash,
  VAN,
} from './kit-eb05a.ts';

const SHIRAHOSHI = 'EB05-014';
/** OP11-112 Megalo: Yellow, cost 3, 2000, {Animal}/{Fish-Man Island}, named [Megalo]. */
const MEGALO = 'OP11-112';
/** OP11-033 Bird Neptunian: Green, cost 6, 7000, {Neptunian}, vanilla. */
const NEP7000 = 'OP11-033';
/** OP11-027 Bulge-Eyed Neptunian: Green, cost 4, 6000, {Neptunian}; its only effect needs a [Shirahoshi] Leader. */
const NEP6000 = 'OP11-027';
/** OP11-036 Spotted Neptunian: Green, cost 4, 5000, {Neptunian}; its [On Play] only matters when played. */
const NEP5000 = 'OP11-036';

function played(top: string[]) {
  const g = mine(EL.croc, { hand: [SHIRAHOSHI], deck: [...top, NEP7000, ...fill(BLUE, 10)] });
  playCard(g, SHIRAHOSHI);
  return g;
}

describe('EB05-014 Shirahoshi: [On Play] look at 5, add up to a total of 2 [Megalo] or {Neptunian}, trash the rest', () => {
  const TOP = [MEGALO, NEP5000, VAN.marco, NEP6000, BLUE];

  it('offers [Megalo] and {Neptunian} cards only; the 2 chosen go to hand and the other 3 are TRASHED', () => {
    const g = played(TOP);
    expect(choiceCards(g)).toEqual([MEGALO, NEP5000, NEP6000].sort());
    chooseCards(g, [MEGALO, NEP6000]);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([MEGALO, NEP6000].sort());
    expect(trash(g)).toEqual([NEP5000, VAN.marco, BLUE].sort());
    expect(deck(g)).toHaveLength(11);
    expect(deck(g)[0]).toBe(NEP7000);
  });

  it('up to a total of 2: never 3, and 1 or 0 is allowed', () => {
    const sets = reachablePickSets(played(TOP));
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it('CR 8-4-4-2: may add nothing; then all 5 looked-at cards are trashed', () => {
    const g = played(TOP);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([...TOP].sort());
    expect(deck(g)).toHaveLength(11);
  });

  it('only the top 5 are looked at: a {Neptunian} in 6th place stays on the deck', () => {
    const g = played(fill(BLUE, 5));
    checkLook(g, { candidates: [], pick: [] });
    expect(deck(g)[0]).toBe(NEP7000);
    expect(trash(g)).toEqual(fill(BLUE, 5));
  });

  it('a non-matching card is never offered (a Character that merely has another type)', () => {
    const g = played([VAN.marco, VAN.kingdew, BLUE, BLUE, BLUE]);
    expect(choiceCards(g)).toEqual([]);
  });

  it('the cards left are trashed, not placed at the bottom of the deck', () => {
    const g = played(TOP);
    chooseCards(g, [NEP5000]);
    settleYes(g, 'p1');
    expect(deck(g).slice(-4)).toEqual(fill(BLUE, 4));
    expect(trash(g)).toHaveLength(4);
  });
});

describe('EB05-014 Shirahoshi: [Activate: Main] rest this Character: a {Neptunian} Character with 6000 power or less gains [Rush]', () => {
  function ready(extra: (string | { card: string; playedThisTurn: boolean })[]) {
    return mine(EL.croc, { characters: [SHIRAHOSHI, ...extra] });
  }
  const shirahoshi = (g: ReturnType<typeof ready>) => g.find('p1', 'characters', SHIRAHOSHI);
  const fresh = (card: string) => ({ card, playedThisTurn: true });

  it('the chosen {Neptunian} can attack on the turn it was played; Shirahoshi is rested', () => {
    const g = ready([fresh(NEP5000)]);
    const nep = g.find('p1', 'characters', NEP5000);
    expect(canAttackAny(g, nep)).toBe(false);
    expect(canActivate(g, shirahoshi(g))).toBe(true);
    activate(g, shirahoshi(g));
    choose(g, [offeredInstance(g, NEP5000)]);
    settleYes(g, 'p1');
    expect(g.card(shirahoshi(g)).rested).toBe(true);
    expect(g.card(nep).keywords).toContain('Rush');
    expect(canAttackAny(g, nep)).toBe(true);
  });

  it('power boundary: 6000 is allowed, 7000 is not', () => {
    const g = ready([fresh(NEP6000), fresh(NEP7000)]);
    activate(g, shirahoshi(g));
    expect(choiceCards(g)).toEqual([NEP6000]);
  });

  it('only {Neptunian} Characters are candidates', () => {
    const g = ready([fresh(VAN.marco), fresh(NEP5000)]);
    activate(g, shirahoshi(g));
    expect(choiceCards(g)).toEqual([NEP5000]);
  });

  it('"up to 1": may give [Rush] to nobody (Shirahoshi is still rested)', () => {
    const g = ready([fresh(NEP5000)]);
    activate(g, shirahoshi(g));
    chooseNone(g);
    settleYes(g, 'p1');
    expect(g.card(shirahoshi(g)).rested).toBe(true);
    expect(canAttackAny(g, g.find('p1', 'characters', NEP5000))).toBe(false);
  });

  it('CR 8-3-1-3: a rested Shirahoshi cannot pay the "rest this Character" cost', () => {
    const g = mine(EL.croc, { characters: [{ card: SHIRAHOSHI, rested: true }, fresh(NEP5000)] });
    expect(abilities(g, g.find('p1', 'characters', SHIRAHOSHI))).toEqual([]);
  });

  it('"during this turn": the [Rush] is gone next turn', () => {
    const g = ready([NEP5000]);
    activate(g, shirahoshi(g));
    choose(g, [offeredInstance(g, NEP5000)]);
    settleYes(g, 'p1');
    expect(g.card(g.find('p1', 'characters', NEP5000)).keywords).toContain('Rush');
    endTurn(g);
    expect(g.card(g.find('p1', 'characters', NEP5000)).keywords).not.toContain('Rush');
  });

  it('gives [Rush] only; a Neptunian that was not played this turn needs nothing and is unchanged otherwise', () => {
    const g = ready([NEP5000]);
    expect(kind(g)).toBe('main');
    expect(canAttackAny(g, g.find('p1', 'characters', NEP5000))).toBe(true);
  });
});
