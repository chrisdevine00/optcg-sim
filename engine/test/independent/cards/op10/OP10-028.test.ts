/**
 * OP10-028 Kouzuki Momonosuke (Character, Green, cost 1, 1000, Counter +1000, {Land of Wano}/
 * {Kouzuki Clan}/{Punk Hazard}).
 *
 * Card text: "[Activate: Main] You may rest 2 of your DON!! cards and trash this Character: Look at 5
 * cards from the top of your deck; reveal up to 2 "The Akazaya Nine" type cards and add them to your
 * hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: the cost is resting 2 active DON!! of the cost area and trashing Momonosuke himself (trashing
 * a cost is not a K.O., RL-15); an unpayable cost cannot be paid at all (CR 8-3-1-3). Look at exactly
 * the top 5; "up to 2" may be 0, 1 or 2; the rest go to the bottom in an order the owner picks.
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  checkLook,
  deck,
  don,
  fill,
  hand,
  kind,
  mine,
  minus,
  offeredAbilities,
  reachablePickSets,
  tail,
  trash,
  useAbility,
  V10,
  VAN,
} from './kit-op10a.ts';
import type { CardId } from '@optcg/engine';

const MOMO = 'OP10-028';
/** Vanilla {The Akazaya Nine} Characters. */
const KAWAMATSU = 'OP01-037'; // Green, cost 2, 3000, {Fish-Man}/{Land of Wano}/{The Akazaya Nine}
const KINEMON = 'OP12-025'; // Green, cost 6, 8000, {Land of Wano}/{The Akazaya Nine}
const NEKO = 'OP12-032'; // Green, cost 6, 7000, {Land of Wano}/{Minks}/{The Akazaya Nine}
const KAWAMATSU5 = 'OP12-023'; // Green, cost 5, 6000, {Fish-Man}/{Land of Wano}/{The Akazaya Nine}

const TOP: CardId[] = [KAWAMATSU, VAN.marco, KINEMON, V10.mochaPh4, VAN.sai];

function start(top: CardId[], mineSpec: Parameters<typeof mine>[1] = {}) {
  const g = mine('ST01-001', {
    costArea: { active: 5, rested: 0 },
    characters: [MOMO],
    deck: [...top, VAN.kingdew, ...fill(BLUE, 8)],
    ...mineSpec,
  });
  useAbility(g, g.find('p1', 'characters', MOMO));
  return g;
}

describe('OP10-028 Momonosuke: [Activate: Main] rest 2 DON!! and trash this: look at 5, add up to 2 {The Akazaya Nine}', () => {
  it('printed values: cost 1, 1000, Counter +1000', () => {
    const g = mine('ST01-001', { hand: [MOMO] });
    const c = g.find('p1', 'hand', MOMO);
    expect(g.card(c).cost).toBe(1);
    expect(g.card(c).counter).toBe(1000);
    expect(g.power(c)).toBe(1000);
  });

  it('pays the cost (2 DON!! rested, Momonosuke trashed), offers the 2 matching cards, adds both', () => {
    const g = start(TOP);
    expect(don(g)).toMatchObject({ active: 3, rested: 2 });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(trash(g)).toEqual([MOMO]);
    checkLook(g, { candidates: [KAWAMATSU, KINEMON], pick: [KAWAMATSU, KINEMON] });
    expect(hand(g).sort()).toEqual([KAWAMATSU, KINEMON].sort());
    expect(deck(g)).toHaveLength(12); // 14 cards, 2 added
    expect(tail(deck(g), 3)).toEqual(minus(TOP, [KAWAMATSU, KINEMON]).sort());
    expect(kind(g)).toBe('main');
  });

  it('"up to 2": may add just 1', () => {
    const g = start(TOP);
    checkLook(g, { candidates: [KAWAMATSU, KINEMON], pick: [KINEMON] });
    expect(hand(g)).toEqual([KINEMON]);
    expect(deck(g)).toHaveLength(13); // 14 cards, 1 added
    expect(tail(deck(g), 4)).toEqual(minus(TOP, [KINEMON]).sort());
  });

  it('"up to 2": may add none, all 5 go to the bottom', () => {
    const g = start(TOP);
    checkLook(g, { candidates: [KAWAMATSU, KINEMON], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([...TOP].sort());
    expect(deck(g)[0]).toBe(VAN.kingdew);
  });

  it('at most 2 are added even when three {The Akazaya Nine} cards are in the top 5', () => {
    const g = start([KAWAMATSU, KINEMON, NEKO, VAN.marco, VAN.sai]);
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it('only cards with the {The Akazaya Nine} type are offered', () => {
    const g = start([KAWAMATSU5, VAN.marco, V10.tashigiNavy, VAN.sai, V10.namiPh]);
    checkLook(g, { candidates: [KAWAMATSU5], pick: [KAWAMATSU5] });
  });

  it('only the top 5 are looked at: a matching card in 6th place is not offered', () => {
    const g = mine('ST01-001', {
      costArea: { active: 5, rested: 0 },
      characters: [MOMO],
      deck: [
        VAN.marco,
        VAN.sai,
        VAN.hajrudin,
        VAN.komachiyo,
        VAN.thatch,
        KINEMON,
        ...fill(BLUE, 8),
      ],
    });
    useAbility(g, g.find('p1', 'characters', MOMO));
    checkLook(g, { candidates: [], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(KINEMON);
  });

  it('boundary: with only 1 active DON!! the cost cannot be paid and the ability is not offered', () => {
    const g = mine('ST01-001', {
      costArea: { active: 1, rested: 4 },
      characters: [MOMO],
      deck: [...TOP, ...fill(BLUE, 8)],
    });
    expect(offeredAbilities(g, g.find('p1', 'characters', MOMO))).toEqual([]);
  });

  it('boundary: exactly 2 active DON!! is enough', () => {
    const g = mine('ST01-001', {
      costArea: { active: 2, rested: 3 },
      characters: [MOMO],
      deck: [...TOP, ...fill(BLUE, 8)],
    });
    expect(offeredAbilities(g, g.find('p1', 'characters', MOMO))).toHaveLength(1);
  });

  it('it can be used the turn Momonosuke is played', () => {
    const g = mine('ST01-001', {
      costArea: { active: 5, rested: 0 },
      characters: [{ card: MOMO, playedThisTurn: true }],
      deck: [...TOP, ...fill(BLUE, 8)],
    });
    expect(offeredAbilities(g, g.find('p1', 'characters', MOMO))).toHaveLength(1);
  });
});
