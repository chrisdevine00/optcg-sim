/**
 * EB05-052 Gloriosa (Character, Yellow, cost 4, 6000, no Counter, {Amazon Lily}/{Rocks Pirates}, Wisdom).
 *
 * Card text: "If you would take damage, you may trash this Character instead.
 * [Trigger] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 8-1-3-4 (replacement effects, optional when worded "may"), RD 103 / CR 4-6-3-1 (if a
 * replacement stops the Life card going to hand, its [Trigger] cannot activate), M6b-Q8 (RD 103, RL-22:
 * the damage is not dealt at all), RL-22 (effect damage and the 0-Life loss), CR 4-6-3 ([Trigger]),
 * CR 10-2-1-1 (trashing is not a K.O.). No scripted card deals effect damage, so only battle damage is
 * driven (see API-GAPS-a.md).
 */
import { describe, expect, it } from 'vitest';
import { attack, fill, passBlock, result, takeDamage, TRIGGER_SPEED } from '../../helpers.ts';
import {
  accept,
  activateTrigger,
  BLUE,
  charsOf,
  choices,
  choose,
  decider,
  decision,
  decline,
  deck,
  expectMain,
  hand,
  kind,
  LD,
  noDefence,
  RED,
  trash,
  theirs,
  VAN,
  WB,
} from './kit-op17a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const GLORIOSA = 'EB05-052';

/** p2's 5000 Leader attacks my Leader; I do not block or counter. Stops at the first decision I owe. */
function hit(own: string[], life: string[] = fill(BLUE, 4), inHand: string[] = []): TestGame {
  const g = theirs(LD.luffy, { characters: own, life, hand: inHand }, { characters: [WB.kingdew] });
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  g.act({ type: 'endCounter' });
  return g;
}

describe('EB05-052 Gloriosa: replacement, trash this Character instead of taking damage', () => {
  it('the replacement is offered when my Leader would take battle damage', () => {
    const g = hit([GLORIOSA]);
    expect(decider(g)).toBe('p1');
    expect(kind(g)).toBe('optional');
    expect(decision(g)?.purpose).toBe('replacement');
  });

  it('accepting: Gloriosa is trashed, I lose no Life and add nothing to hand', () => {
    const g = hit([GLORIOSA]);
    accept(g);
    expectMain(g, 'p2');
    expect(charsOf(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([GLORIOSA]);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
  });

  it('accepting stops the [Trigger] too: the top Life card with a [Trigger] stays in Life and is not offered', () => {
    const g = hit([GLORIOSA], [TRIGGER_SPEED, ...fill(BLUE, 3)]);
    accept(g);
    expectMain(g, 'p2');
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(TRIGGER_SPEED);
    expect(charsOf(g, 'p1')).toEqual([]);
    expect(hand(g)).toEqual([]);
  });

  it('declining: the damage is taken normally (Life 3, the card goes to hand) and Gloriosa stays', () => {
    const g = hit([GLORIOSA], [VAN.gordon, ...fill(BLUE, 3)]);
    decline(g);
    takeDamage(g);
    expectMain(g, 'p2');
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([VAN.gordon]);
    expect(charsOf(g, 'p1')).toEqual([GLORIOSA]);
  });

  it('control: without Gloriosa the same hit costs a Life card and nothing is asked', () => {
    const g = theirs(LD.luffy, { life: fill(BLUE, 4) }, { characters: [WB.kingdew] });
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefence(g);
    expect(g.life('p1')).toBe(3);
  });

  it('Gloriosa in hand (not on the field) gives no replacement', () => {
    const g = hit([], fill(BLUE, 4), [GLORIOSA]);
    expect(decision(g)?.purpose).not.toBe('replacement');
    takeDamage(g);
    expect(hand(g).sort()).toEqual([BLUE, GLORIOSA].sort());
    expect(g.life('p1')).toBe(3);
  });

  it('only damage: an attack on one of my Characters is not "taking damage": no offer', () => {
    const g = theirs(
      LD.luffy,
      { characters: [GLORIOSA, { card: VAN.mohji, rested: true }], life: fill(BLUE, 4) },
      { characters: [WB.kingdew] },
    );
    attack(g, g.find('p2', 'characters', WB.kingdew), g.find('p1', 'characters', VAN.mohji));
    noDefence(g);
    expectMain(g, 'p2');
    expect(charsOf(g, 'p1')).toEqual([GLORIOSA]);
    expect(g.life('p1')).toBe(4);
  });

  it('the replacement also applies at 0 Life: replaced damage is not taken, so I am not defeated', () => {
    const g = hit([GLORIOSA], []);
    expect(decision(g)?.purpose).toBe('replacement');
    accept(g);
    expectMain(g, 'p2');
    expect(result(g)).toBeFalsy();
    expect(trash(g)).toEqual([GLORIOSA]);
  });

  it('control at 0 Life: declining (or no Gloriosa) loses the game', () => {
    const g = hit([GLORIOSA], []);
    decline(g);
    expect(result(g)).toBeTruthy();
  });

  it('RD 96 + CR 4-6-3-1: against a [Banish] attacker (OP17-024) the replacement still applies: no Life card is trashed', () => {
    const g = theirs(
      LD.luffy,
      { characters: [GLORIOSA], life: fill(BLUE, 4) },
      { characters: ['OP17-024'] },
    );
    attack(g, g.find('p2', 'characters', 'OP17-024'), g.leader('p1'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    expect(decision(g)?.purpose).toBe('replacement');
    accept(g);
    expectMain(g, 'p2');
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([GLORIOSA]);
  });

  it('a second hit in the same turn: with Gloriosa already trashed the damage is taken', () => {
    const g = theirs(
      LD.luffy,
      { characters: [GLORIOSA], life: fill(BLUE, 4) },
      { characters: [WB.kingdew, WB.thatch] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    accept(g);
    attack(g, g.find('p2', 'characters', WB.kingdew), g.leader('p1'));
    noDefence(g);
    expect(g.life('p1')).toBe(3);
    void RED;
  });
});

describe('EB05-052 Gloriosa: [Trigger] draw 2 cards and trash 1 card from hand', () => {
  function triggered(inHand: string[] = [VAN.mohji]) {
    const g = theirs(
      LD.luffy,
      {
        life: [GLORIOSA, ...fill(BLUE, 3)],
        hand: inHand,
        deck: [WB.jil, WB.kingdew, ...fill(BLUE, 8)],
      },
      { characters: [WB.kingdew] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    return g;
  }

  it('revealed as the Life card: the Trigger is offered; activating draws 2 then asks me to trash 1', () => {
    const g = triggered();
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(hand(g)).toHaveLength(3);
    expect(kind(g)).toBe('choose');
    expect(deck(g)).toHaveLength(8);
  });

  it('the trashed card is my choice, from the whole hand including the cards just drawn', () => {
    const g = triggered();
    activateTrigger(g);
    expect(choices(g)).toHaveLength(3);
    choose(g, [g.find('p1', 'hand', WB.jil)]);
    expect(hand(g).sort()).toEqual([WB.kingdew, VAN.mohji].sort());
    expect(trash(g)).toContain(WB.jil);
  });

  it('exactly 1 card is trashed: the choice cannot be skipped', () => {
    const g = triggered();
    activateTrigger(g);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('the Life card went to the trash (Life 3) and nothing else was added to hand', () => {
    const g = triggered();
    activateTrigger(g);
    choose(g, [g.find('p1', 'hand', VAN.mohji)]);
    expectMain(g, 'p2');
    expect(g.life('p1')).toBe(3);
    expect(trash(g)).toContain(GLORIOSA);
    expect(hand(g)).toHaveLength(2);
  });
});
