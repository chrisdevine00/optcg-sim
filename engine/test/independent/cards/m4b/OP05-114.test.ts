/**
 * OP05-114 El Thor (Event, Yellow, cost 1, {Sky Island}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +2000 power during this battle.
 * Then, if your opponent has 2 or less Life cards, that card gains an additional +2000 power during this
 * battle.
 * [Trigger] K.O. up to 1 of your opponent's Characters with a cost equal to or less than the number of
 * your opponent's Life Cards."
 *
 * Rules: CR 8-4-4-1 ("up to" allows 0), RL-08 (battle-long boosts end with the battle), CR 10-1-5 ([Trigger]),
 * CR 8-3-3 (the "if" is about the opponent's Life, "your opponent" = the attacking player here).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, fill, passBlock } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  cardOf,
  chars,
  choiceCards,
  choices,
  choose,
  chooseIfAsked,
  chooseNone,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  RED,
  settleYes,
  theirs,
  trash,
  useCounter,
  VAN,
  YL,
} from './kit-a.ts';

const EVENT = 'OP05-114';

function counterStep(p2Life: number, characters: string[] = []) {
  const g = theirs(
    YL.sky,
    { hand: [EVENT], costArea: { active: 1, rested: 0 }, characters },
    { life: fill(RED, p2Life) },
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  expect(kind(g)).toBe('counter');
  return g;
}

function counter(g: ReturnType<typeof counterStep>, target: string) {
  useCounter(g, g.find('p1', 'hand', EVENT), target);
  chooseIfAsked(g, [target]);
  settleYes(g, 'p1');
}

describe('OP05-114 El Thor: [Counter] +2000, and another +2000 if the opponent has 2 or less Life cards', () => {
  it('opponent with 3 Life: +2000 only (Leader 5000 -> 7000)', () => {
    const g = counterStep(3);
    counter(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('opponent with 2 Life: +2000 and an additional +2000 (-> 9000)', () => {
    const g = counterStep(2);
    counter(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('opponent with 0 Life also counts as "2 or less"', () => {
    const g = counterStep(0);
    counter(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the condition counts the OPPONENT’s Life, not mine: my 4 Life do not matter with the opponent at 2', () => {
    const g = counterStep(2);
    expect(g.life('p1')).toBe(4);
    counter(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the bonus goes on the same card as the first +2000 (a Character here), not on the Leader', () => {
    const g = counterStep(1, [VAN.sunny]);
    const sunny = g.find('p1', 'characters', VAN.sunny);
    counter(g, sunny);
    expect(g.power(sunny)).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may boost nobody', () => {
    const g = counterStep(2);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    if (kind(g) === 'choose') chooseNone(g);
    settleYes(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('RL-08: the boosts end with the battle', () => {
    const g = counterStep(2);
    counter(g, g.leader('p1'));
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p1')).toBe(4);
  });
});

describe('OP05-114 El Thor: [Trigger] K.O. a Character with cost <= the opponent’s Life count', () => {
  function hit(p2Life: number) {
    const g = theirs(
      YL.sky,
      { life: [EVENT, ...fill(BLUE, 3)] },
      {
        life: fill(RED, p2Life),
        characters: [VAN.sunny, VAN.sai, VAN.marco, VAN.hajrudin, VAN.kingdew],
      },
    );
    hitLeader(g);
    return g;
  }

  it('opponent with 4 Life: Characters of cost 4 or less are candidates (cost 5 is not)', () => {
    const g = hit(4);
    activateTrigger(g);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g).sort()).toEqual([VAN.sunny, VAN.sai, VAN.marco, VAN.hajrudin].sort());
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.hajrudin)!]);
    settleYes(g, 'p1');
    expect(trash(g, 'p2')).toEqual([VAN.hajrudin]);
    expect(chars(g, 'p2')).toHaveLength(4);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('opponent with 2 Life: only cost 2 or less (Sunny 1, Sai 2)', () => {
    const g = hit(2);
    activateTrigger(g);
    expect(choiceCards(g).sort()).toEqual([VAN.sunny, VAN.sai].sort());
  });

  it('my Life count does not matter: it is the opponent’s that sets the limit', () => {
    const g = hit(1);
    activateTrigger(g);
    expect(choiceCards(g)).toEqual([VAN.sunny]);
  });

  it('"up to 1": may K.O. nobody', () => {
    const g = hit(4);
    activateTrigger(g);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(5);
  });

  it('declining the [Trigger] puts El Thor in hand', () => {
    const g = hit(4);
    declineTrigger(g);
    expect(hand(g)).toEqual([EVENT]);
    expect(chars(g, 'p2')).toHaveLength(5);
  });
});
