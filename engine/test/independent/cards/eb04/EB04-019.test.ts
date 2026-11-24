/**
 * EB04-019 Eleclaw (Event, cost 1, {Minks}).
 *
 * Card text: "[Main] You may rest 1 of your cards: If your Leader has the {Minks} type, give up to 1
 * of your opponent's Characters −3 cost during this turn.
 * [Counter] Up to 1 of your {Minks} type Leader or Character cards gains +3000 power during this
 * battle."
 *
 * Rules: CR 8-3-1-3/-4 (optional cost), the cost is paid before the condition is checked, "up to 1"
 * (CR 8-4-4-1), "during this turn" ends with the turn, "during this battle" ends with the battle.
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  at,
  canCounterNow,
  choices,
  don,
  endTurn,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  offeredIds,
  p2attacks,
  passBlock,
  passCounter,
  pickInst,
  playRaw,
  restCost,
  SN,
  theirs,
  trash,
  yes,
} from './kit-eb04a.ts';

const ELE = 'EB04-019';

function main(leader: string = LE.minks, p1: Parameters<typeof mine>[1] = {}) {
  return mine(leader, { hand: [ELE], ...p1 }, { characters: [SN.c5, SN.c2] });
}
const cost = (g: ReturnType<typeof main>, card: string) =>
  g.card(at(g, 'p2', 'characters', card)).cost;

describe('EB04-019 Eleclaw [Main]: rest 1 of your cards: with a {Minks} Leader an opposing Character gets -3 cost', () => {
  it('printed values: Event, cost 1', () => {
    const g = main();
    expect(g.card(g.find('p1', 'hand', ELE)).cost).toBe(1);
  });

  it('pays by resting 1 DON!!: the chosen opposing Character costs 3 less this turn', () => {
    const g = main();
    playRaw(g, ELE);
    yes(g, 'p1');
    restCost(g, [], 1);
    need(g, 'choose');
    pickInst(g, [at(g, 'p2', 'characters', SN.c5)]);
    expect(kind(g)).toBe('main');
    expect(cost(g, SN.c5)).toBe(2);
    expect(cost(g, SN.c2)).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ active: 8, rested: 2 });
    expect(trash(g)).toEqual([ELE]);
  });

  it('the cost may be paid by resting a card (my Leader) instead of a DON!!', () => {
    const g = main();
    playRaw(g, ELE);
    yes(g, 'p1');
    need(g, 'choose');
    expect(choices(g)).toContain(g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    pickInst(g, [at(g, 'p2', 'characters', SN.c5)]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(cost(g, SN.c5)).toBe(2);
  });

  it('"you may": declining changes no cost and rests nothing', () => {
    const g = main();
    playRaw(g, ELE);
    no(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(cost(g, SN.c5)).toBe(5);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
  });

  it('must not happen: a Leader without {Minks}: the cost may be paid but no cost is changed', () => {
    const g = main(LE.luffy);
    playRaw(g, ELE);
    if (kind(g) === 'optional') {
      yes(g, 'p1');
      restCost(g, [], 1);
    }
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(kind(g)).toBe('main');
    expect(cost(g, SN.c5)).toBe(5);
  });

  it('"up to 1": choosing nobody changes nothing; only opposing Characters are candidates', () => {
    const g = main(LE.minks, { characters: [SN.c3] });
    playRaw(g, ELE);
    yes(g, 'p1');
    restCost(g, [], 1);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.c2, SN.c5].sort());
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cost(g, SN.c5)).toBe(5);
  });

  it('the -3 cost lasts this turn only', () => {
    const g = main();
    playRaw(g, ELE);
    yes(g, 'p1');
    restCost(g, [], 1);
    pickInst(g, [at(g, 'p2', 'characters', SN.c5)]);
    expect(cost(g, SN.c5)).toBe(2);
    endTurn(g);
    expect(g.card(at(g, 'p2', 'characters', SN.c5)).cost).toBe(5);
  });

  it('cost not payable (all DON!! and cards rested): "use" is not offered', () => {
    const g = mine(
      { card: LE.minks, rested: true },
      { hand: [ELE], costArea: { active: 1, rested: 9 } },
      { characters: [SN.c5] },
    );
    playRaw(g, ELE);
    // The 1 active DON!! paid Eleclaw's own cost, so nothing active is left to rest.
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g, 'p1');
    }
    expect(cost(g, SN.c5)).toBe(5);
  });
});

describe('EB04-019 Eleclaw [Counter]: up to 1 of my {Minks} Leader or Character cards gains +3000 power during this battle', () => {
  function defending(leader: string = LE.minks) {
    return theirs(
      leader,
      { hand: [ELE], characters: [SN.tristan, SN.c2], costArea: { active: 3, rested: 0 } },
      { characters: [SN.c5] },
    );
  }

  it('a {Minks} Leader gets +3000: 5000 + 3000 beats a 7000 attacker', () => {
    const g = defending();
    p2attacks(g, SN.c5);
    passBlock(g);
    const ev = g.find('p1', 'hand', ELE);
    expect(canCounterNow(g, ev)).toBe(true);
    activateCounter(g, ev);
    need(g, 'choose');
    expect(choices(g)).toContain(g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('only {Minks} cards are offered: a {Minks} Character yes, a non-{Minks} Character no', () => {
    const g = defending();
    p2attacks(g, SN.c5);
    passBlock(g);
    activateCounter(g, g.find('p1', 'hand', ELE));
    need(g, 'choose');
    expect(choices(g)).toContain(at(g, 'p1', 'characters', SN.tristan));
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SN.c2));
    pickInst(g, [at(g, 'p1', 'characters', SN.tristan)]);
    expect(g.power(at(g, 'p1', 'characters', SN.tristan))).toBe(6000);
  });

  it('must not happen: a non-{Minks} Leader is not a candidate', () => {
    const g = defending(LE.luffy);
    p2attacks(g, SN.c5);
    passBlock(g);
    activateCounter(g, g.find('p1', 'hand', ELE));
    need(g, 'choose');
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).toEqual([SN.tristan]);
    none(g);
  });

  it('the boost ends with the battle', () => {
    const g = defending();
    p2attacks(g, SN.c5);
    passBlock(g);
    activateCounter(g, g.find('p1', 'hand', ELE));
    pickInst(g, [g.leader('p1')]);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
