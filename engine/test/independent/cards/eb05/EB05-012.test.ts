/**
 * EB05-012 Camie (Character, Green, cost 3, 0, Counter +2000, {Merfolk}/{Fish-Man Island}, Wisdom).
 *
 * Card text: "[On Play] Rest up to 1 of your opponent's Characters with a cost of 6 or less."
 *
 * Rules: CR 8-4-4-1 ("up to" allows 0), CR 6-2-4 (rested cards become active in their owner's Refresh),
 * CR 7-1-1 (only the active attack).
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import {
  BLUE,
  chars,
  choiceCards,
  choices,
  choose,
  chooseNone,
  EL,
  kind,
  mine,
  offeredInstance,
  playCard,
  reachablePickSets,
  settleYes,
  VAN,
} from './kit-eb05a.ts';

const CAMIE = 'EB05-012';

function played(
  opp: (string | { card: string; rested?: boolean })[] = [VAN.thatch, VAN.littleOars, VAN.marco],
) {
  const g = mine(
    EL.croc,
    { hand: [CAMIE], deck: fill(BLUE, 10), characters: [VAN.sai] },
    { characters: opp },
  );
  playCard(g, CAMIE);
  return g;
}
const isRested = (g: ReturnType<typeof played>, card: string) =>
  g.card(g.find('p2', 'characters', card)).rested;

describe('EB05-012 Camie: [On Play] rest up to 1 opposing Character with cost 6 or less', () => {
  it('rests the chosen Character with cost 6 (boundary) and no other', () => {
    const g = played();
    choose(g, [offeredInstance(g, VAN.thatch)]);
    settleYes(g, 'p1');
    expect(isRested(g, VAN.thatch)).toBe(true);
    expect(isRested(g, VAN.marco)).toBe(false);
    expect(isRested(g, VAN.littleOars)).toBe(false);
  });

  it('cost 7 is over the limit: it is not a candidate; cost 6 and cost 3 are', () => {
    const g = played();
    expect(choiceCards(g)).toEqual([VAN.marco, VAN.thatch].sort());
  });

  it('"up to 1": may rest nothing', () => {
    const g = played();
    chooseNone(g);
    settleYes(g, 'p1');
    expect(isRested(g, VAN.thatch)).toBe(false);
    expect(isRested(g, VAN.marco)).toBe(false);
  });

  it('rests at most 1 even with several candidates', () => {
    const g = played();
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the opponent’s Characters are candidates (not my own Character or Camie)', () => {
    const g = played();
    expect(choices(g).every((i) => g.card(i).owner === 'p2')).toBe(true);
    expect(chars(g)).toEqual([CAMIE, VAN.sai].sort());
  });

  it('with no eligible target (only cost 7) the effect resolves without a choice', () => {
    const g = played([VAN.littleOars]);
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(isRested(g, VAN.littleOars)).toBe(false);
  });

  it('a rested Character is rested for the opponent’s turn only until their Refresh Phase', () => {
    const g = played();
    choose(g, [offeredInstance(g, VAN.thatch)]);
    settleYes(g, 'p1');
    expect(isRested(g, VAN.thatch)).toBe(true);
    endTurn(g);
    expect(isRested(g, VAN.thatch)).toBe(false);
  });

  it('a Character that is already rested stays rested (nothing else changes)', () => {
    const g = played([{ card: VAN.thatch, rested: true }, VAN.marco]);
    if (kind(g) === 'choose') chooseNone(g);
    settleYes(g, 'p1');
    expect(isRested(g, VAN.thatch)).toBe(true);
    expect(isRested(g, VAN.marco)).toBe(false);
  });
});
