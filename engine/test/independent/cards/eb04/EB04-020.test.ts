/**
 * EB04-020 Shark Brick Fist (Event, cost 1, {Fish-Man}/{The Sun Pirates}/{Fish-Man Island}).
 *
 * Card text: "[Counter] Up to 1 of your {Fish-Man} type Leader or Character cards gains +3000 power
 * during this battle. Then, set up to 1 of your {Fish-Man} type Characters as active.
 * [Trigger] Rest up to 1 of your opponent's Characters with a cost of 4 or less."
 *
 * Rules: {Fish-Man} is a type ({Merfolk} is a different type); "up to 1" (CR 8-4-4-1); "during this
 * battle" ends with the battle; [Trigger] is optional to activate (CR 10-1-5), the Life card goes
 * to hand if it is not activated.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  at,
  attack,
  BLUE,
  choices,
  fill,
  hand,
  kind,
  LE,
  mayChooseNone,
  need,
  none,
  offeredIds,
  p2attacks,
  passBlock,
  passCounter,
  pickInst,
  SN,
  theirs,
  trash,
} from './kit-eb04a.ts';

const SBF = 'EB04-020';

function defending(leader: string = LE.fishMan, mine_: Parameters<typeof theirs>[1] = {}) {
  return theirs(
    leader,
    {
      hand: [SBF],
      characters: [SN.jinbe4, SN.c2],
      costArea: { active: 3, rested: 0 },
      life: fill(BLUE, 4),
      ...mine_,
    },
    { characters: [SN.c5] },
  );
}
function counter(g: ReturnType<typeof defending>) {
  p2attacks(g, SN.c5);
  passBlock(g);
  activateCounter(g, g.find('p1', 'hand', SBF));
}

describe('EB04-020 Shark Brick Fist [Counter]: +3000 to a {Fish-Man} Leader/Character, then set a {Fish-Man} Character active', () => {
  it('printed values: Event, cost 1', () => {
    const g = defending();
    expect(g.card(g.find('p1', 'hand', SBF)).cost).toBe(1);
  });

  it('a {Fish-Man} Leader gets +3000 (5000 -> 8000) and holds off a 7000 attacker', () => {
    const g = defending();
    counter(g);
    need(g, 'choose');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    if (kind(g) === 'choose') none(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([SBF]);
  });

  it('a {Fish-Man} Character gets +3000 too', () => {
    const g = defending();
    counter(g);
    pickInst(g, [at(g, 'p1', 'characters', SN.jinbe4)]);
    expect(g.power(at(g, 'p1', 'characters', SN.jinbe4))).toBe(9000);
    if (kind(g) === 'choose') none(g);
  });

  it('only {Fish-Man} cards are candidates: a non-{Fish-Man} Character is not offered', () => {
    const g = defending();
    counter(g);
    need(g, 'choose');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).toContain(at(g, 'p1', 'characters', SN.jinbe4));
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SN.c2));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    if (kind(g) === 'choose') none(g);
  });

  it('must not happen: a {Merfolk} Leader and a {Merfolk} Character are not {Fish-Man}', () => {
    const g = defending(LE.merfolk, { characters: [SN.hyouzou] });
    counter(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', SN.hyouzou))).toBe(6000);
  });

  it('"Then": sets a rested {Fish-Man} Character as active; a rested non-{Fish-Man} Character is not offered', () => {
    const g = defending(LE.fishMan, {
      characters: [
        { card: SN.jinbe4, rested: true },
        { card: SN.c2, rested: true },
      ],
    });
    counter(g);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.jinbe4]);
    expect(mayChooseNone(g)).toBe(true);
    pickInst(g, [at(g, 'p1', 'characters', SN.jinbe4)]);
    expect(g.card(at(g, 'p1', 'characters', SN.jinbe4)).rested).toBe(false);
    expect(g.card(at(g, 'p1', 'characters', SN.c2)).rested).toBe(true);
  });

  it('"up to 1": the set-active part may be declined', () => {
    const g = defending(LE.fishMan, { characters: [{ card: SN.jinbe4, rested: true }] });
    counter(g);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose');
    none(g);
    expect(g.card(at(g, 'p1', 'characters', SN.jinbe4)).rested).toBe(true);
  });

  it('the +3000 ends with the battle', () => {
    const g = defending();
    counter(g);
    pickInst(g, [g.leader('p1')]);
    if (kind(g) === 'choose') none(g);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describe('EB04-020 Shark Brick Fist [Trigger]: rest up to 1 opposing Character with cost 4 or less', () => {
  function hit(p2chars: string[] = [SN.c4, SN.c5, SN.c1]) {
    const g = theirs(LE.luffy, { life: [SBF, BLUE, BLUE, BLUE] }, { characters: p2chars });
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('activating it rests the chosen Character with cost 4 or less (cost 5 is not offered)', () => {
    const g = hit();
    need(g, 'trigger');
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.c1, SN.c4].sort());
    expect(mayChooseNone(g)).toBe(true);
    pickInst(g, [at(g, 'p2', 'characters', SN.c4)]);
    expect(g.card(at(g, 'p2', 'characters', SN.c4)).rested).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SN.c5)).rested).toBe(false);
    expect(trash(g)).toEqual([SBF]);
  });

  it('declining the [Trigger]: the Life card goes to hand and nothing is rested', () => {
    const g = hit();
    need(g, 'trigger');
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([SBF]);
    expect(g.card(at(g, 'p2', 'characters', SN.c4)).rested).toBe(false);
  });

  it('"up to 1": may rest nobody', () => {
    const g = hit();
    act(g, { type: 'trigger', activate: true });
    need(g, 'choose');
    none(g);
    expect(g.card(at(g, 'p2', 'characters', SN.c4)).rested).toBe(false);
  });
});
