/**
 * EB04-001 Jewelry Bonney (Leader, Red/Yellow, 5000, 4 Life, {Bonney Pirates}/{Egghead}).
 *
 * Card text: "[Opponent's Turn] If you have 1 or less Life cards, this Leader gains +2000 power.
 * [Activate: Main] [Once Per Turn] Give up to 1 of your opponent's Characters −1000 power during
 * this turn. Then, if you have 2 or more Life cards, you may add 1 card from the top of your Life
 * cards to your hand."
 *
 * Rules: CR 10-2-13 ([Once Per Turn]), CR 8-4-4-1 ("up to"), RL-09 (Life moved outside damage does
 * not activate [Trigger]), the "Then" after a failed condition does not resolve (M4b-5).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  endTurn,
  fill,
  hand,
  kind,
  mine,
  need,
  no,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  SN,
  theirs,
  useAbility,
  yes,
  BLUE,
  n,
  cardIds,
  attack,
  noDefence,
  mayChooseNone,
} from './kit-eb04a.ts';

const BONNEY = 'EB04-001';
const TOP = SN.c1; // a distinguishable top Life card (Komachiyo)

function lives(count: number) {
  return [TOP, ...fill(BLUE, 3)].slice(0, count);
}
const p1power = (g: ReturnType<typeof mine>) => g.power(g.leader('p1'));

describe('EB04-001 Jewelry Bonney: printed values', () => {
  it('Leader 5000 with 4 Life on my own turn', () => {
    const g = mine(BONNEY, { life: lives(4) }, { characters: [SN.c4] });
    expect(p1power(g)).toBe(5000);
    expect(g.life('p1')).toBe(4);
  });
});

describe("EB04-001 Jewelry Bonney: [Opponent's Turn] +2000 power with 1 or less Life", () => {
  it('1 Life card on the opponent turn: 7000', () => {
    const g = theirs(BONNEY, { life: lives(1) }, { characters: [SN.c4] });
    expect(p1power(g)).toBe(7000);
  });

  it('boundary: 2 Life cards on the opponent turn: still 5000', () => {
    const g = theirs(BONNEY, { life: lives(2) }, { characters: [SN.c4] });
    expect(p1power(g)).toBe(5000);
  });

  it('0 Life cards ("1 or less") on the opponent turn: 7000', () => {
    const g = theirs(BONNEY, { life: [] }, { characters: [SN.c4] });
    expect(p1power(g)).toBe(7000);
  });

  it('must not happen: 1 Life card on my own turn gives no bonus', () => {
    const g = mine(BONNEY, { life: lives(1) }, { characters: [SN.c4] });
    expect(p1power(g)).toBe(5000);
  });

  it('the bonus follows the Life count: 2 Life = 5000, and 7000 once a Life card is lost on the opponent turn', () => {
    const g = theirs(BONNEY, { life: lives(2) }, { characters: [SN.c4], hand: [] });
    expect(p1power(g)).toBe(5000);
    // p2's Leader (5000) hits Bonney (5000): equal power wins the attack, so one Life is lost.
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefence(g);
    expect(g.life('p1')).toBe(1);
    expect(kind(g)).toBe('main');
    expect(p1power(g)).toBe(7000);
  });
});

describe('EB04-001 Jewelry Bonney: [Activate: Main] [Once Per Turn] -1000 power, then maybe add Life', () => {
  it('with 2+ Life: -1000 on an opposing Character this turn; the add-Life card is optional and moves the top Life card to hand', () => {
    const g = mine(BONNEY, { life: lives(3) }, { characters: [SN.c4, SN.c3] });
    useAbility(g, g.leader('p1'));
    const target = at(g, 'p2', 'characters', SN.c4);
    pickInst(g, [target]);
    expect(g.power(target)).toBe(5000);
    expect(g.power(at(g, 'p2', 'characters', SN.c3))).toBe(5000);
    yes(g, 'p1');
    expect(g.life('p1')).toBe(2);
    expect(hand(g)).toEqual([TOP]);
    expect(kind(g)).toBe('main');
  });

  it('"you may": declining keeps every Life card; the -1000 still applies', () => {
    const g = mine(BONNEY, { life: lives(3) }, { characters: [SN.c4] });
    useAbility(g, g.leader('p1'));
    const target = at(g, 'p2', 'characters', SN.c4);
    pickInst(g, [target]);
    no(g, 'p1');
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([]);
    expect(g.power(target)).toBe(5000);
  });

  it('boundary: with exactly 1 Life card the -1000 applies but no Life card may be added', () => {
    const g = mine(BONNEY, { life: lives(1) }, { characters: [SN.c4] });
    useAbility(g, g.leader('p1'));
    const target = at(g, 'p2', 'characters', SN.c4);
    pickInst(g, [target]);
    expect(g.power(target)).toBe(5000);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(1);
    expect(hand(g)).toEqual([]);
  });

  it('boundary: with exactly 2 Life cards the add is offered (condition is "2 or more")', () => {
    const g = mine(BONNEY, { life: lives(2) }, { characters: [SN.c4] });
    useAbility(g, g.leader('p1'));
    pickInst(g, [at(g, 'p2', 'characters', SN.c4)]);
    yes(g, 'p1');
    expect(g.life('p1')).toBe(1);
    expect(hand(g)).toEqual([TOP]);
  });

  it('only the opponent Characters can be chosen (not my Characters, not either Leader), and "up to 1" allows nobody', () => {
    const g = mine(BONNEY, { life: lives(1), characters: [SN.c2] }, { characters: [SN.c4] });
    useAbility(g, g.leader('p1'));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.c4]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(at(g, 'p2', 'characters', SN.c4))).toBe(6000);
  });

  it('[Once Per Turn]: after one activation it is not offered again this turn, but is offered next turn', () => {
    const g = mine(BONNEY, { life: lives(1) }, { characters: [SN.c4] });
    useAbility(g, g.leader('p1'));
    pickInst(g, [at(g, 'p2', 'characters', SN.c4)]);
    expect(kind(g)).toBe('main');
    expect(offeredAbilities(g, g.leader('p1'))).toEqual([]);
    endTurn(g);
    endTurn(g);
    expect(kind(g)).toBe('main');
    expect(offeredAbilities(g, g.leader('p1')).length).toBe(1);
  });

  it('the -1000 lasts this turn only', () => {
    const g = mine(BONNEY, { life: lives(1) }, { characters: [SN.c4] });
    useAbility(g, g.leader('p1'));
    const target = at(g, 'p2', 'characters', SN.c4);
    pickInst(g, [target]);
    expect(g.power(target)).toBe(5000);
    endTurn(g);
    expect(g.power(target)).toBe(6000);
  });

  it('RL-09: the Life card added to hand never activates its [Trigger]; Life 2 -> 1 then gives +2000 on the next opponent turn', () => {
    const g = mine(BONNEY, { life: [SN.speed, BLUE] }, { characters: [SN.c4] });
    useAbility(g, g.leader('p1'));
    pickInst(g, [at(g, 'p2', 'characters', SN.c4)]);
    yes(g, 'p1');
    expect(hand(g)).toEqual([SN.speed]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(n(g, 'p1', 'life')).toBe(1);
    endTurn(g);
    expect(p1power(g)).toBe(7000);
  });
});
