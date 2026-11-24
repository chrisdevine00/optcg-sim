/**
 * EB05-005 Belo Betty (Character, Red, cost 2, 3000, Counter +1000, {Revolutionary Army}).
 *
 * Card text: "[On Play] Up to 3 of your Characters with both the {Revolutionary Army} type and a
 * [Trigger] gain +2000 power during this turn.
 * [Activate: Main] You may trash this Character: Give up to 1 of your opponent's Characters
 * -2000 power during this turn."
 *
 * Rules: CR 8-4-4-1 ("up to" allows 0), CR 8-3-1-3/-4 (costs), RL-09 ("during this turn"),
 * CR 10-2-1-3 (trash is not a K.O.), CR 8-3-3.
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import {
  abilities,
  act,
  accept,
  activate,
  BLUE,
  canActivate,
  chars,
  choiceCards,
  choose,
  chooseNone,
  decline,
  EL,
  hand,
  kind,
  mine,
  offered,
  offeredInstance,
  p2power,
  playCard,
  reachablePickSets,
  settleYes,
  trash,
  VAN,
} from './kit-eb05a.ts';

const BETTY = 'EB05-005';
/** OP09-108 Kuma: Yellow, 5000, {Revolutionary Army}, has [Trigger]. */
const KUMA = 'OP09-108';
/** OP09-100 Karasu: Yellow, 4000, {Revolutionary Army}, has [Trigger]. */
const KARASU = 'OP09-100';
/** OP09-112 Belo Betty: Yellow, 4000, {Revolutionary Army}, has [Trigger]. */
const BETTY_Y = 'OP09-112';
/** OP09-114 Lindbergh: Yellow, 4000, {Minks}/{Revolutionary Army}, has [Trigger]. */
const LINDBERGH = 'OP09-114';
/** OP09-113 Morley: Yellow, 6000, {Giant}/{Revolutionary Army}, no [Trigger]. */
const MORLEY_NO_TRIGGER = 'OP09-113';
/** OP01-009 Carrot: Red, 3000, {Minks}, has [Trigger], not Revolutionary Army. */
const CARROT = 'OP01-009';

function played(field: string[], opp: string[] = [VAN.marco]) {
  const g = mine(
    EL.croc,
    { hand: [BETTY], characters: field, deck: fill(BLUE, 12) },
    { characters: opp },
  );
  playCard(g, BETTY);
  return g;
}

const pow = (g: ReturnType<typeof played>, card: string) =>
  g.power(g.find('p1', 'characters', card));

describe('EB05-005 Belo Betty: [On Play] up to 3 {Revolutionary Army} Characters with a [Trigger] gain +2000', () => {
  it('gives +2000 to the 3 chosen of 4 eligible Characters and nothing to the fourth', () => {
    const g = played([KUMA, KARASU, BETTY_Y, LINDBERGH]);
    expect(kind(g)).toBe('choose');
    choose(g, [offeredInstance(g, KUMA), offeredInstance(g, KARASU), offeredInstance(g, BETTY_Y)]);
    settleYes(g, 'p1');
    expect(pow(g, KUMA)).toBe(7000);
    expect(pow(g, KARASU)).toBe(6000);
    expect(pow(g, BETTY_Y)).toBe(6000);
    expect(pow(g, LINDBERGH)).toBe(4000);
  });

  it('at most 3 can be chosen', () => {
    const g = played([KUMA, KARASU, BETTY_Y, LINDBERGH]);
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(3);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 3)).toBe(true);
  });

  it('CR 8-4-4-1: "up to": may choose 1, or none', () => {
    const sets = reachablePickSets(played([KUMA, KARASU]));
    expect(sets.has('')).toBe(true);
    expect(sets.has(KUMA)).toBe(true);
  });

  it('only Characters with BOTH the type and a [Trigger] are candidates', () => {
    const g = played([KUMA, MORLEY_NO_TRIGGER, CARROT]);
    expect(choiceCards(g)).toEqual([KUMA]);
  });

  it('Belo Betty herself has no [Trigger] and is not a candidate', () => {
    const g = played([KUMA]);
    expect(choiceCards(g)).toEqual([KUMA]);
    expect(choiceCards(g)).not.toContain(BETTY);
  });

  it('the opponent’s matching Characters are not candidates (only "your Characters")', () => {
    const g = played([KUMA], [KARASU]);
    expect(choiceCards(g)).toEqual([KUMA]);
  });

  it('with no eligible Character nothing happens', () => {
    const g = played([MORLEY_NO_TRIGGER, VAN.marco]);
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(pow(g, MORLEY_NO_TRIGGER)).toBe(6000);
  });

  it('"during this turn": the +2000 is gone once the turn ends', () => {
    const g = played([KUMA]);
    choose(g, [offeredInstance(g, KUMA)]);
    settleYes(g, 'p1');
    expect(pow(g, KUMA)).toBe(7000);
    endTurn(g);
    expect(g.power(g.find('p1', 'characters', KUMA))).toBe(5000);
  });
});

describe('EB05-005 Belo Betty: [Activate: Main] you may trash this Character: -2000 to up to 1 opposing Character', () => {
  const OPP = [VAN.marco, VAN.kingdew];
  function onField() {
    return mine(EL.croc, { characters: [BETTY, KUMA] }, { characters: OPP });
  }
  const betty = (g: ReturnType<typeof onField>) => g.find('p1', 'characters', BETTY);

  it('trashes Betty as the cost and gives the chosen Character -2000', () => {
    const g = onField();
    expect(canActivate(g, betty(g))).toBe(true);
    activate(g, betty(g));
    choose(g, [offeredInstance(g, VAN.kingdew)]);
    settleYes(g, 'p1');
    expect(trash(g)).toEqual([BETTY]);
    expect(chars(g)).toEqual([KUMA]);
    expect(p2power(g, VAN.kingdew)).toBe(5000);
    expect(p2power(g, VAN.marco)).toBe(5000);
  });

  it('only the opponent’s Characters are candidates (not own Characters, not Leaders)', () => {
    const g = onField();
    activate(g, betty(g));
    expect(choiceCards(g).sort()).toEqual([...OPP].sort());
  });

  it('CR 8-3-1-4: the cost is optional: if the engine asks, declining changes nothing; otherwise activating is paying', () => {
    const g = onField();
    const b = betty(g);
    const [ability] = abilities(g, b);
    act(g, { type: 'activate', card: b, ability: ability! });
    if (offered(g, 'p1')) {
      decline(g);
      expect(chars(g)).toEqual([BETTY, KUMA].sort());
      expect(trash(g)).toEqual([]);
      expect(p2power(g, VAN.kingdew)).toBe(7000);
    } else {
      expect(trash(g)).toEqual([BETTY]);
    }
  });

  it('"up to 1": after paying, may give -2000 to nobody (Betty is still trashed)', () => {
    const g = onField();
    activate(g, betty(g));
    chooseNone(g);
    settleYes(g, 'p1');
    expect(trash(g)).toEqual([BETTY]);
    expect(p2power(g, VAN.kingdew)).toBe(7000);
  });

  it('works on the turn Betty was played (no "rest" cost, no restriction)', () => {
    const g = played([KUMA]);
    choose(g, [offeredInstance(g, KUMA)]);
    settleYes(g, 'p1');
    expect(canActivate(g, g.find('p1', 'characters', BETTY))).toBe(true);
  });

  it('the -2000 lasts for the turn only, even though Betty left the field', () => {
    const g = onField();
    activate(g, betty(g));
    choose(g, [offeredInstance(g, VAN.kingdew)]);
    settleYes(g, 'p1');
    expect(p2power(g, VAN.kingdew)).toBe(5000);
    endTurn(g);
    expect(p2power(g, VAN.kingdew)).toBe(7000);
  });

  it('the trash cost is not a K.O.: the +2000 of a played Betty is unaffected and Kuma stays', () => {
    const g = onField();
    activate(g, betty(g));
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([KUMA]);
    expect(hand(g)).toEqual([]);
  });

  it('accept is only asked for the trash cost: nothing is asked when Betty is gone', () => {
    const g = onField();
    activate(g, betty(g));
    chooseNone(g);
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(() => accept(g)).toThrow();
  });
});
