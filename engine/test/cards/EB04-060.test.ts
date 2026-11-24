/** EB04-060 Gum-Gum Hawk Gatling: [Main] you may add 1 card from the top or bottom of your Life to your hand: add up to 1 {Egghead} Character from your hand to the top of your Life face-up; then -1000 power; [Trigger] draw 2, trash 1. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, none, option, pick, play, V } from './helpers.ts';
import { canPick, EGGHEAD4, EVENT, ids, mine, OTHER_LEADER, triggerHit } from './helpers-eb04g2.ts';

const ID = 'EB04-060';

const setup = (handCards: string[], life = [V.c1, V.c2, V.c3]) =>
  mine({ leader: OTHER_LEADER, hand: [ID, ...handCards], life }, { characters: [V.c5] });

describe('EB04-060 Gum-Gum Hawk Gatling', () => {
  it('top Life card to hand: an {Egghead} Character goes to the top of Life face-up, then an opposing Character gets -1000', () => {
    const g = setup([EGGHEAD4]);
    play(g, ID);
    accept(g);
    option(g, 'top');
    expect(ids(g, 'p1', 'life')).toEqual([V.c2, V.c3]);
    expect(hand(g, 'p1')).toContain(V.c1);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', EGGHEAD4)]);
    expect(ids(g, 'p1', 'life')).toEqual([EGGHEAD4, V.c2, V.c3]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(6000);
  });

  it('bottom Life card to hand: the Egghead still goes to the top', () => {
    const g = setup([EGGHEAD4]);
    play(g, ID);
    accept(g);
    option(g, 'bottom');
    expect(ids(g, 'p1', 'life')).toEqual([V.c1, V.c2]);
    expect(hand(g, 'p1')).toContain(V.c3);
    pick(g, [g.find('p1', 'hand', EGGHEAD4)]);
    expect(ids(g, 'p1', 'life')).toEqual([EGGHEAD4, V.c1, V.c2]);
  });

  it('only {Egghead} Characters are offered (not other Characters, not an Event)', () => {
    const g = setup([EGGHEAD4, V.c3, EVENT]);
    play(g, ID);
    accept(g);
    option(g, 'top');
    expect(canPick(g, g.find('p1', 'hand', EGGHEAD4))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', EVENT))).toBe(false);
    none(g);
  });

  it('"Then" is independent: with no Egghead chosen the -1000 still happens', () => {
    const g = setup([V.c3]);
    play(g, ID);
    accept(g);
    option(g, 'top');
    none(g);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(6000);
    expect(g.life('p1')).toBe(2);
  });

  it('the power part is "up to 1": it may be skipped', () => {
    const g = setup([EGGHEAD4]);
    play(g, ID);
    accept(g);
    option(g, 'top');
    pick(g, [g.find('p1', 'hand', EGGHEAD4)]);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
  });

  it('the "you may" cost can be declined: no Life card moves and nothing else happens', () => {
    const g = setup([EGGHEAD4]);
    play(g, ID);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
    expect(ids(g, 'p1', 'hand')).toEqual([EGGHEAD4]);
  });

  it('with no Life cards the cost cannot be paid', () => {
    const g = setup([EGGHEAD4], []);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
  });

  it('[Trigger] draw 2 cards and trash 1 card from your hand', () => {
    const g = triggerHit(ID, { hand: [V.c1] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1')).toHaveLength(3);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(ids(g, 'p1', 'trash')).toContain(V.c1);
  });
});
