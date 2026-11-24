/**
 * OP15-115 Impact Dial (Event, Yellow, cost 2, {Straw Hat Crew}/{Sky Island}).
 *
 * Card text: "[Main] K.O. up to 1 of your opponent's Characters with a cost of 4 or less. Then, add 1 card from
 * the top of your Life cards to your hand.
 * [Trigger] K.O. up to 1 of your opponent's Characters with a cost of 4 or less." (trigger restored by override)
 *
 * Rules relied on: CR 8-4-4-1 ("up to" may choose nothing), RD 104 (Life moved outside damage never
 * activates [Trigger]), CR 10-1-5 (the Trigger is its own effect: no Life is added), "add 1 card from the top
 * of your Life" is impossible with 0 Life and then does nothing, RL-15 (K.O.).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  chars,
  choices,
  declineTrigger,
  don,
  hand,
  hitLeader,
  kind,
  LD15,
  lifeCards,
  mine,
  need,
  offeredIds,
  pickCards,
  playRaw,
  reachablePickSets,
  SC15,
  theirs,
  trash,
} from './kit-op15c.ts';

const DIAL = 'OP15-115';

function cast(o: { life?: string[]; p2?: string[]; mine?: string[] } = {}) {
  const g = mine(
    LD15.neutral,
    {
      hand: [DIAL],
      characters: o.mine ?? [],
      ...(o.life ? { life: o.life } : {}),
    },
    { characters: o.p2 ?? [SC15.red4, SC15.red5] },
  );
  playRaw(g, g.find('p1', 'hand', DIAL));
  return g;
}

describe('OP15-115 Impact Dial [Main]', () => {
  it('K.O.s a cost-4 Character (the boundary), then adds my top Life card to my hand', () => {
    const g = cast();
    need(g, 'choose', 'p1');
    pickCards(g, [SC15.red4]);
    expect(atMain(g)).toBe(true);
    expect(trash(g, 'p2')).toEqual([SC15.red4]);
    expect(chars(g, 'p2')).toEqual([SC15.red5]);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([BLUE]);
    expect(trash(g)).toEqual([DIAL]);
  });

  it('boundary: cost 4 is offered, cost 5 is not; my own Characters are not', () => {
    const g = cast({ mine: [SC15.red2] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.red4]);
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SC15.red2));
  });

  it('costs 2 DON!!', () => {
    const g = cast();
    expect(don(g).rested).toBe(2);
    expect(don(g).active).toBe(8);
  });

  it('the Life card goes to hand and its [Trigger] does not activate (RD 104)', () => {
    const g = cast({ life: [SC15.speed, BLUE, BLUE, BLUE] });
    pickCards(g, [SC15.red4]);
    expect(hand(g)).toEqual([SC15.speed]);
    expect(chars(g)).toEqual([]);
    expect(lifeCards(g)).toEqual([BLUE, BLUE, BLUE]);
  });

  it('with 0 Life cards the K.O. still happens and there is nothing to add', () => {
    const g = cast({ life: [] });
    pickCards(g, [SC15.red4]);
    expect(atMain(g)).toBe(true);
    expect(trash(g, 'p2')).toEqual([SC15.red4]);
    expect(hand(g)).toEqual([]);
  });

  it('K.O.s at most one Character even when two qualify', () => {
    const g = cast({ p2: [SC15.red3, SC15.red4] });
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('with no Character of cost 4 or less the Event can still be played; nothing is K.O.’d', () => {
    const g = cast({ p2: [SC15.red6] });
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
    }
    expect(trash(g, 'p2')).toEqual([]);
  });
});

describe('OP15-115 Impact Dial [Trigger]', () => {
  const hit = () =>
    theirs(
      LD15.neutral,
      { life: [DIAL, BLUE, BLUE, BLUE] },
      { characters: [SC15.red4, SC15.red5] },
    );

  it('activated from Life: K.O. up to 1 Character with cost 4 or less, and NO Life card is added', () => {
    const g = hit();
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.red4]);
    pickCards(g, [SC15.red4]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(trash(g, 'p2')).toEqual([SC15.red4]);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([]);
  });

  it('declined: the Life card goes to hand and nothing is K.O.’d', () => {
    const g = hit();
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([DIAL]);
    expect(chars(g, 'p2')).toHaveLength(2);
  });
});
