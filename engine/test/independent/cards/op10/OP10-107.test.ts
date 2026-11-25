/**
 * OP10-107 Jewelry Bonney (Character, Yellow, cost 3, 4000, Counter +1000, {Bonney Pirates}/
 * {Supernovas}).
 *
 * Card text: "[Blocker] [On Play] You may add 1 card from the top or bottom of your Life cards to
 * your hand: Add up to 1 "Supernovas" type Character card with a cost of 5 from your hand to the
 * top of your Life cards face-up."
 *
 * Rules: CR 8-3-1-4 (optional cost; the Life card goes to the hand, not damage); "a cost of 5" is
 * exactly 5; an "up to" pick over the hand with a filter is asked even when nothing matches (max
 * 0); [Blocker] lets this Character take over an attack (CR 10-1-3).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  BLUE,
  theirs,
  canFinish,
  choices,
  decision,
  hand,
  kind,
  LD10,
  mine,
  need,
  no,
  none,
  offeredIds,
  optionChoices,
  pickInst,
  playRaw,
  SC10,
  SC14,
  unusable,
  yes,
  zoneIds,
} from './kit-op10c.ts';

const ID = 'OP10-107';

function game(o: { hand?: string[]; life?: string[] } = {}) {
  return mine(LD10.nova, {
    hand: [ID, ...(o.hand ?? [SC10.nova5, SC10.nova3r, SC14.c1])],
    costArea: { active: 3, rested: 0 },
    life: o.life ?? [SC14.c3, BLUE, SC14.c2],
    deck: [BLUE, BLUE],
  });
}

/** Play Capone, accept the cost, and take the 'top' or 'bottom' Life card. */
function pay(g: ReturnType<typeof game>, which: 'top' | 'bottom' = 'top') {
  playRaw(g, ID);
  yes(g, 'p1');
  const d = need(g, 'choose', 'p1');
  expect(d.purpose).toBe('mode');
  expect(optionChoices(g).sort()).toEqual(['bottom', 'top']);
  act(g, { type: 'pick', choice: { option: which } });
}

const lifeCards = (g: ReturnType<typeof game>) => g.zone('p1', 'life').map((c) => c.card);

describe('OP10-107 Bonney [Blocker] / [On Play] add Life to hand: cost-5 Supernovas Character to the top of Life', () => {
  it('paying with the top Life card, then placing a {Supernovas} Character on top, face-up', () => {
    const g = game();
    pay(g, 'top');
    expect(hand(g)).toContain(SC14.c3);
    pickInst(g, [g.find('p1', 'hand', SC10.nova5)]);
    need(g, 'main', 'p1');
    const life = g.zone('p1', 'life');
    expect(life.map((c) => c.card)).toEqual([SC10.nova5, BLUE, SC14.c2]);
    expect(life[0]!.faceUp).toBe(true);
    expect(life.slice(1).every((c) => !c.faceUp)).toBe(true);
    expect(hand(g)).toEqual([SC10.nova3r, SC14.c1, SC14.c3].sort());
  });

  it('paying with the bottom Life card takes the bottom one', () => {
    const g = game();
    pay(g, 'bottom');
    pickInst(g, [g.find('p1', 'hand', SC10.nova5)]);
    expect(lifeCards(g)).toEqual([SC10.nova5, SC14.c3, BLUE]);
    expect(hand(g)).toContain(SC14.c2);
  });

  it('declining the cost changes nothing', () => {
    const g = game();
    playRaw(g, ID);
    no(g, 'p1');
    need(g, 'main', 'p1');
    expect(lifeCards(g)).toEqual([SC14.c3, BLUE, SC14.c2]);
    expect(hand(g)).toHaveLength(3);
  });

  it('only {Supernovas} Characters are offered: a non-{Supernovas} Character and an Event are not', () => {
    const g = game({ hand: [SC10.nova5, SC14.c1, SC10.dr3, 'ST01-014'] });
    pay(g, 'top');
    expect(offeredIds(g)).toEqual([SC10.nova5]);
  });

  it('"a cost of 5" is exact: {Supernovas} Characters of cost 3, 4 and 6 are not offered, nor a cost-5 non-{Supernovas} one', () => {
    const g = game({ hand: [SC10.nova3r, SC10.nova4r, SC10.nova6, SC10.ra5, SC10.nova5] });
    pay(g, 'top');
    expect(offeredIds(g)).toEqual([SC10.nova5]);
  });

  it('with only {Supernovas} Characters of other costs in hand the pick is asked at max 0', () => {
    const g = game({ hand: [SC10.nova3r, SC10.nova6] });
    pay(g, 'top');
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(0);
    act(g, { type: 'done' });
    expect(g.life('p1')).toBe(2);
  });

  it('has [Blocker]: it can block an attack on the Leader', () => {
    const g = theirs(LD10.nova, { characters: [ID] }, { characters: [SC14.c4] });
    attack(g, g.find('p2', 'characters', SC14.c4), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
  });

  it('"up to 1": may place nothing; the Life card taken stays in the hand', () => {
    const g = game();
    pay(g, 'top');
    none(g);
    need(g, 'main', 'p1');
    expect(g.life('p1')).toBe(2);
    expect(hand(g)).toContain(SC14.c3);
  });

  it('with no {Supernovas} Character in hand the pick is still asked, at max 0', () => {
    const g = game({ hand: [SC14.c1, SC10.dr3] });
    pay(g, 'top');
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(0);
    expect(canFinish(g)).toBe(true);
    expect(choices(g)).toEqual([]);
    act(g, { type: 'done' });
    expect(g.life('p1')).toBe(2);
  });

  it('a {Supernovas} Character taken from Life can itself be placed back', () => {
    const g = game({ hand: [SC14.c1], life: [SC10.nova5, BLUE, BLUE] });
    pay(g, 'top');
    expect(offeredIds(g)).toEqual([SC10.nova5]);
    pickInst(g, [g.find('p1', 'hand', SC10.nova5)]);
    expect(lifeCards(g)).toEqual([SC10.nova5, BLUE, BLUE]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('with 0 Life cards the cost cannot be paid', () => {
    const g = game({ life: [] });
    playRaw(g, ID);
    unusable(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(0);
    expect(zoneIds(g, 'p1', 'hand')).toHaveLength(3);
  });

  it('with exactly 1 Life card it is taken (top = bottom) and a placed Character leaves 1 Life', () => {
    const g = game({ life: [SC14.c3] });
    playRaw(g, ID);
    yes(g, 'p1');
    if (decision(g)?.purpose === 'mode') act(g, { type: 'pick', choice: { option: 'top' } });
    pickInst(g, [g.find('p1', 'hand', SC10.nova5)]);
    expect(lifeCards(g)).toEqual([SC10.nova5]);
  });
});
