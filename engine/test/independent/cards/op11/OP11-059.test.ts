/**
 * OP11-059 Gum-Gum King Cobra (Blue Event, cost 1, {Straw Hat Crew}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +2000 power during this
 * battle. Then, if you have 4 or less cards in your hand, that card gains an additional +2000 power
 * during this battle. [Trigger] Return up to 1 Character with a cost of 2 or less to the owner's hand."
 *
 * Rules: the Event leaves the hand when it is used, so "cards in your hand" does not count it
 * (CR 3-?, an activated Event is on its way to the trash). A tie in battle goes to the attacker
 * (CR 7-1-4), so +2000 alone (7000 vs 7000) does not save the Leader but +4000 does. The boost
 * lasts only for the battle.
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  activateTrigger,
  at,
  attack,
  BLUE,
  canCounterNow,
  C11,
  chars,
  fill,
  hand,
  kind,
  L11,
  need,
  noDefenceUntilTrigger,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickInst,
  theirs,
} from './kit-op11b.ts';

const COBRA = 'OP11-059';

/** p2's 7000 Character attacks `target` ("leader" or my Character); p1 holds the Event + `others`. */
function defend(
  others: number,
  mine: (string | { card: string; rested?: boolean })[] = [],
  target: 'leader' | string = 'leader',
) {
  const g = theirs(
    L11.mono,
    {
      hand: [COBRA, ...fill(BLUE, others)],
      costArea: { active: 1, rested: 0 },
      characters: mine,
    },
    { characters: [C11.c5] },
  );
  const t = target === 'leader' ? g.leader('p1') : at(g, 'p1', 'characters', target);
  attack(g, at(g, 'p2', 'characters', C11.c5), t);
  passBlock(g);
  return g;
}

describe('OP11-059 Gum-Gum King Cobra: [Counter] +2000, and +2000 more with 4 or less cards in hand; [Trigger] bounce cost 2 or less', () => {
  it('with 4 other cards in hand (the Event leaves the hand) the Leader gets +4000 and survives a 7000 attack', () => {
    const g = defend(4);
    const ev = at(g, 'p1', 'hand', COBRA);
    expect(canCounterNow(g, ev)).toBe(true);
    activateCounter(g, ev);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('with 5 other cards in hand the boost is only +2000 and the tie (7000 vs 7000) goes to the attacker', () => {
    const g = defend(5);
    activateCounter(g, at(g, 'p1', 'hand', COBRA));
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('with an empty rest of the hand it is also +4000', () => {
    const g = defend(0);
    activateCounter(g, at(g, 'p1', 'hand', COBRA));
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the extra +2000 goes to the same card: a Character being attacked gets +4000, the Leader nothing', () => {
    const g = defend(2, [{ card: C11.c3, rested: true }], C11.c3);
    // 5000 Character: attacked by 7000
    activateCounter(g, at(g, 'p1', 'hand', COBRA));
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', C11.c3)]);
    expect(g.power(at(g, 'p1', 'characters', C11.c3))).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    passCounter(g);
    expect(chars(g)).toEqual([C11.c3]);
  });

  it('only my Leader and Characters are candidates', () => {
    const g = defend(2, [C11.c3]);
    activateCounter(g, at(g, 'p1', 'hand', COBRA));
    need(g, 'choose', 'p1');
    expect(offeredIds(g).filter((c) => c !== null)).toEqual([L11.mono, C11.c3].sort());
    expect(offeredIds(g)).not.toContain(C11.c5);
  });

  it('"up to 1": may choose nothing; no boost', () => {
    const g = defend(2);
    activateCounter(g, at(g, 'p1', 'hand', COBRA));
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost lasts only during this battle', () => {
    const g = defend(2);
    activateCounter(g, at(g, 'p1', 'hand', COBRA));
    pickInst(g, [g.leader('p1')]);
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the Event is used from hand for its cost and then is in the trash', () => {
    const g = defend(2);
    activateCounter(g, at(g, 'p1', 'hand', COBRA));
    pickInst(g, [g.leader('p1')]);
    expect(hand(g)).toEqual([BLUE, BLUE]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(COBRA);
  });

  it('[Trigger]: returns up to 1 Character with cost 2 or less to its owner hand; cost 3 is not offered', () => {
    const g = theirs(
      L11.mono,
      { life: [COBRA, ...fill(BLUE, 3)], characters: [C11.c2, C11.c3] },
      { characters: [C11.c1, C11.c4] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.c1, C11.c2].sort());
    pickInst(g, [at(g, 'p2', 'characters', C11.c1)]);
    expect(hand(g, 'p2')).toEqual([C11.c1]);
    expect(chars(g, 'p2')).toEqual([C11.c4]);
    expect(chars(g)).toEqual([C11.c2, C11.c3].sort());
  });

  it('[Trigger]: "up to 1" may return nothing', () => {
    const g = theirs(
      L11.mono,
      { life: [COBRA, ...fill(BLUE, 3)], characters: [C11.c2] },
      { characters: [C11.c1] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([C11.c2]);
    expect(chars(g, 'p2')).toEqual([C11.c1]);
  });
});
