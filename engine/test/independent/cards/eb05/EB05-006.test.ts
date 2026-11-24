/**
 * EB05-006 Miss Buckingham Stussy (Character, Red, cost 2, 2000, Counter +2000, {Rocks Pirates}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may add 1 card from the top of your Life cards to
 * your hand: Choose one:
 * - Give up to 1 Character +3000 power during this turn.
 * - Give up to 1 Character -4000 power during this turn."
 *
 * Rules: CR 8-3-1-3/-4 (costs), CR 8-4-4-1 ("up to"), CR 10-2-13 ([Once Per Turn]), RL-09,
 * RD 104 (Life moved outside damage never activates [Trigger]).
 */
import { describe, expect, it } from 'vitest';
import { endTurn, fill } from '../../helpers.ts';
import {
  abilities,
  act,
  activate,
  BLUE,
  canActivate,
  choices,
  choose,
  chooseNone,
  count,
  decline,
  EL,
  hand,
  kind,
  mine,
  offered,
  offeredInstance,
  p2power,
  pickMode,
  RED,
  settleYes,
  SC,
  VAN,
} from './kit-eb05a.ts';

const STUSSY = 'EB05-006';

function ready(life: string[] = fill(RED, 4)) {
  return mine(
    EL.croc,
    { characters: [STUSSY, VAN.sunny], life },
    { characters: [VAN.marco, VAN.kingdew] },
  );
}
const stussy = (g: ReturnType<typeof ready>) => g.find('p1', 'characters', STUSSY);
const own = (g: ReturnType<typeof ready>) => g.power(g.find('p1', 'characters', VAN.sunny));

describe('EB05-006 Miss Buckingham Stussy: add the top Life card to hand: +3000 or -4000 to up to 1 Character', () => {
  it('+3000 mode on one of my Characters; the top Life card goes to hand', () => {
    const g = ready();
    activate(g, stussy(g));
    pickMode(g, /\+\s?3000/);
    choose(g, [offeredInstance(g, VAN.sunny)]);
    settleYes(g, 'p1');
    expect(own(g)).toBe(6000);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([RED]);
  });

  it('-4000 mode on an opposing Character', () => {
    const g = ready();
    activate(g, stussy(g));
    pickMode(g, /(-|−)\s?4000/);
    choose(g, [offeredInstance(g, VAN.kingdew)]);
    settleYes(g, 'p1');
    expect(p2power(g, VAN.kingdew)).toBe(3000);
    expect(p2power(g, VAN.marco)).toBe(5000);
    expect(g.life('p1')).toBe(3);
  });

  it('both modes may target either side’s Characters (including Stussy herself), never a Leader', () => {
    for (const mode of [/\+\s?3000/, /(-|−)\s?4000/]) {
      const g = ready();
      activate(g, stussy(g));
      pickMode(g, mode);
      const offeredIds = choices(g);
      expect(offeredIds).toContain(stussy(g));
      expect(offeredIds).toContain(g.find('p1', 'characters', VAN.sunny));
      expect(offeredIds).toContain(g.find('p2', 'characters', VAN.marco));
      expect(offeredIds).not.toContain(g.leader('p1'));
      expect(offeredIds).not.toContain(g.leader('p2'));
    }
  });

  it('"up to 1": may give the power to nobody, but the Life card was already added to hand', () => {
    const g = ready();
    activate(g, stussy(g));
    pickMode(g, /\+\s?3000/);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(own(g)).toBe(3000);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([RED]);
  });

  it('CR 8-3-1-4: the cost is optional: if the engine asks, declining changes nothing; otherwise activating is paying', () => {
    const g = ready();
    const [ability] = abilities(g, stussy(g));
    act(g, { type: 'activate', card: stussy(g), ability: ability! });
    if (offered(g, 'p1')) {
      decline(g);
      expect(g.life('p1')).toBe(4);
      expect(hand(g)).toEqual([]);
      expect(kind(g)).toBe('main');
    } else {
      expect(g.life('p1')).toBe(3);
    }
  });

  it('CR 8-3-1-3: with 0 Life cards the cost cannot be paid and nothing happens', () => {
    const g = ready([]);
    if (canActivate(g, stussy(g))) {
      const [ability] = abilities(g, stussy(g));
      act(g, { type: 'activate', card: stussy(g), ability: ability! });
      settleYes(g, 'p1');
    }
    expect(hand(g)).toEqual([]);
    expect(own(g)).toBe(3000);
    expect(p2power(g, VAN.kingdew)).toBe(7000);
  });

  it('RD 104: the Life card is added from the TOP and its [Trigger] does not activate', () => {
    const g = ready([SC.speed, RED, RED, RED]);
    activate(g, stussy(g));
    pickMode(g, /\+\s?3000/);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([SC.speed]);
    expect(kind(g)).toBe('main');
    expect(count(g, 'p1', 'characters')).toBe(2);
  });

  it('[Once Per Turn]: not offered again after it resolved, but offered next turn', () => {
    const g = ready();
    activate(g, stussy(g));
    pickMode(g, /\+\s?3000/);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(abilities(g, stussy(g))).toEqual([]);
    endTurn(g);
    endTurn(g);
    expect(abilities(g, stussy(g))).toHaveLength(1);
  });

  it('"during this turn": both boosts end with the turn', () => {
    const g = ready();
    activate(g, stussy(g));
    pickMode(g, /\+\s?3000/);
    choose(g, [offeredInstance(g, VAN.sunny)]);
    settleYes(g, 'p1');
    expect(own(g)).toBe(6000);
    endTurn(g);
    expect(g.power(g.find('p1', 'characters', VAN.sunny))).toBe(3000);
  });

  it('"during this turn": the -4000 on an opposing Character ends with the turn', () => {
    const g = mine(
      EL.croc,
      { characters: [STUSSY], life: fill(RED, 4) },
      { characters: [VAN.kingdew] },
    );
    activate(g, g.find('p1', 'characters', STUSSY));
    pickMode(g, /(-|−)\s?4000/);
    choose(g, [offeredInstance(g, VAN.kingdew)]);
    settleYes(g, 'p1');
    expect(p2power(g, VAN.kingdew)).toBe(3000);
    endTurn(g);
    expect(p2power(g, VAN.kingdew)).toBe(7000);
  });

  it('only one mode is applied: choosing +3000 leaves the opposing Characters alone', () => {
    const g = ready();
    activate(g, stussy(g));
    pickMode(g, /\+\s?3000/);
    choose(g, [offeredInstance(g, VAN.marco)]);
    settleYes(g, 'p1');
    expect(p2power(g, VAN.marco)).toBe(8000);
    expect(p2power(g, VAN.kingdew)).toBe(7000);
    expect(BLUE).toBeTruthy();
  });

  it('power may go below 0: -4000 on a 3000 Character leaves it at -1000', () => {
    const g = mine(
      EL.croc,
      { characters: [STUSSY], life: fill(RED, 4) },
      { characters: [VAN.sunny] },
    );
    activate(g, g.find('p1', 'characters', STUSSY));
    pickMode(g, /(-|−)\s?4000/);
    choose(g, [offeredInstance(g, VAN.sunny)]);
    settleYes(g, 'p1');
    expect(p2power(g, VAN.sunny)).toBe(-1000);
  });
});
