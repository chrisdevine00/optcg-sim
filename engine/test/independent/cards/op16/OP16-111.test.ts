/**
 * OP16-111 Boa Sandersonia (Character, Yellow, cost 4, 5000, no Counter, {Kuja Pirates}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.) [Trigger] If you have 2 or less Life cards, play this card."
 *
 * Rules: RD 101-102 (while a [Trigger] resolves the card is in no area and the Life card taken is
 * already out of the Life count: 3 Life cards before the hit means 2 during the [Trigger]),
 * CR 3-7-6 (five Character areas), CR 10-1-4 ([Blocker]).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  at,
  atMain,
  attack,
  blockers,
  BLUE,
  chars,
  declineTrigger,
  decision,
  hand,
  hitLeader,
  isLegal,
  kind,
  LD16,
  mine,
  need,
  don,
  playIt,
  SCN,
  theirs,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-111';

/** p1 has `lifeBefore` Life cards with Boa on top; p2 hits the Leader. */
function hit(lifeBefore: number, field: string[] = []) {
  const g = theirs(
    LD16.wano,
    { life: [ID, ...Array.from({ length: lifeBefore - 1 }, () => BLUE)], characters: field },
    {},
  );
  hitLeader(g);
  return g;
}

describe('OP16-111 Boa Sandersonia: [Trigger] if I have 2 or less Life cards, play this card', () => {
  it('3 Life before the hit (2 left): activating plays Boa onto the field', () => {
    const g = hit(3);
    need(g, 'trigger', 'p1');
    expect(isLegal(g, { type: 'trigger', activate: true })).toBe(true);
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(g.life('p1')).toBe(2);
  });

  it('boundary: 4 Life before the hit leaves 3, so the condition fails and Boa is trashed without being played', () => {
    const g = hit(4);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: 2 Life before the hit (1 left) and 1 Life before the hit (0 left) both play it', () => {
    const two = hit(2);
    activateTrigger(two);
    expect(chars(two)).toEqual([ID]);

    const one = theirs(LD16.wano, { life: [ID] }, {});
    hitLeader(one);
    activateTrigger(one);
    expect(chars(one)).toEqual([ID]);
  });

  it('declining the [Trigger]: Boa goes to my hand', () => {
    const g = hit(3);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(chars(g)).toEqual([]);
  });

  it('with five Characters already on the field the played Boa makes a sixth: I must trash one', () => {
    const g = hit(3, [SCN.c1, SCN.c2, SCN.c3, SCN.c4, SCN.c5]);
    activateTrigger(g);
    expect(decision(g)?.kind).toBe('choose');
    expect(decision(g)?.purpose).toBe('characterLimit');
    const first = g.legal().find((a) => a.type === 'pick')!;
    g.act(first);
    expect(chars(g)).toHaveLength(5);
    expect(chars(g)).toContain(ID);
  });

  it('the played Boa is active (not rested), so it can still be used as a blocker later', () => {
    const g = hit(3);
    activateTrigger(g);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(false);
  });
});

describe('OP16-111 Boa Sandersonia: [Blocker]', () => {
  it('has [Blocker] and can rest to take an attack aimed at my Leader', () => {
    const g = theirs(LD16.wano, { characters: [ID] }, { characters: [SCN.c4] });
    const boa = at(g, 'p1', 'characters', ID);
    expect(g.card(boa).keywords).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', SCN.c4), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([boa]);
    act(g, { type: 'block', blocker: boa });
    expect(g.card(boa).rested).toBe(true);
  });
});

describe('OP16-111 Boa Sandersonia: played from hand', () => {
  it('costs 4 DON!! to play normally, and is then a [Blocker] on the field', () => {
    const g = mine(LD16.wano, { hand: [ID] });
    playIt(g, ID);
    expect(atMain(g)).toBe(true);
    expect(don(g).active).toBe(6);
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('the [Trigger] text does nothing from hand: with 3 Life it is simply a 4-cost Character', () => {
    const g = mine(LD16.wano, { hand: [ID], life: [BLUE, BLUE, BLUE] });
    expect(hand(g)).toEqual([ID]);
    expect(g.life('p1')).toBe(3);
  });
});
