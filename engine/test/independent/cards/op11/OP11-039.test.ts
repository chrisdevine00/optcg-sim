/**
 * OP11-039 Vagabond Drill (Green Event, cost 1, {Fish-Man}/{The Sun Pirates}/{Fish-Man Island}).
 *
 * Card text: "[Counter] Up to 1 of your {Fish-Man} or {Merfolk} type Leader or Character cards gains
 * +3000 power during this battle. Then, rest up to 1 of your opponent's Characters with a cost of 3
 * or less. [Trigger] Rest up to 1 of your opponent's Characters with a cost of 4 or less."
 *
 * Rules: a quoted type is matched exactly ({Fish-Man Island} is not {Fish-Man}); the boost lasts
 * for the battle, the rest is permanent. Cost limits are inclusive. "Up to 1" may be none.
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  activateTrigger,
  at,
  attack,
  BLUE,
  C11,
  fill,
  isRested,
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

const DRILL = 'OP11-039';

/** p2's 7000 Character attacks my Leader (`leader`); p1 holds the Event with 1 active DON!!. */
function defend(leader: string, mine: string[], p2other: string[]) {
  const g = theirs(
    leader,
    { hand: [DRILL, BLUE], costArea: { active: 1, rested: 0 }, characters: mine },
    { characters: [C11.c5, ...p2other] },
  );
  attack(g, at(g, 'p2', 'characters', C11.c5), g.leader('p1'));
  passBlock(g);
  activateCounter(g, at(g, 'p1', 'hand', DRILL));
  return g;
}

describe('OP11-039 Vagabond Drill: [Counter] +3000 to a {Fish-Man}/{Merfolk} card, then rest a cost-3-or-less Character', () => {
  it('offers exactly my {Fish-Man}/{Merfolk} Leader and Characters; {Fish-Man Island} and other types are not offered', () => {
    const g = defend(L11.fish, [C11.merfolk1, C11.fishman2, C11.fmi5, C11.c3], [C11.c2]);
    need(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    expect(offeredIds(g)).toEqual([L11.fish, C11.merfolk1, C11.fishman2].sort());
  });

  it('a Leader of another type is not a candidate', () => {
    const g = defend(L11.mono, [C11.merfolk1], [C11.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.merfolk1]);
  });

  it('+3000 on the Leader saves it from the 7000 attack (8000 vs 7000)', () => {
    const g = defend(L11.fish, [], [C11.c2]);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    need(g, 'choose', 'p1');
    none(g);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('then rests an opposing Character with cost 3 or less (3 in, 4 out, my own never)', () => {
    const g = defend(L11.fish, [C11.merfolk1, C11.c1], [C11.c3, C11.c4, C11.c2]);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.c2, C11.c3].sort());
    pickInst(g, [at(g, 'p2', 'characters', C11.c3)]);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c3))).toBe(true);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c4))).toBe(false);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c2))).toBe(false);
  });

  it('"up to 1" for the rest: may rest nothing', () => {
    const g = defend(L11.fish, [], [C11.c3]);
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    none(g);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c3))).toBe(false);
  });

  it('a boosted Character survives the attack that would K.O. it; the boost lasts only for the battle', () => {
    const g = theirs(
      L11.mono,
      {
        hand: [DRILL],
        costArea: { active: 1, rested: 0 },
        characters: [{ card: C11.fishman2, rested: true }],
      },
      { characters: [C11.c4] },
    );
    attack(g, at(g, 'p2', 'characters', C11.c4), at(g, 'p1', 'characters', C11.fishman2));
    passBlock(g);
    activateCounter(g, at(g, 'p1', 'hand', DRILL));
    pickInst(g, [at(g, 'p1', 'characters', C11.fishman2)]);
    expect(g.power(at(g, 'p1', 'characters', C11.fishman2))).toBe(7000);
    // no opposing Character of cost 3 or less: nothing to rest
    expect(kind(g)).toBe('counter');
    passCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([C11.fishman2]);
    expect(g.power(at(g, 'p1', 'characters', C11.fishman2))).toBe(4000);
  });

  it('the rest of the opposing Character is permanent: it is still rested after the battle', () => {
    const g = defend(L11.fish, [], [C11.c3]);
    pickInst(g, [g.leader('p1')]);
    pickInst(g, [at(g, 'p2', 'characters', C11.c3)]);
    passCounter(g);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c3))).toBe(true);
  });
});

describe('OP11-039 Vagabond Drill: [Trigger] rest up to 1 opposing Character with cost 4 or less', () => {
  const trig = () => {
    const g = theirs(
      L11.mono,
      { life: [DRILL, ...fill(BLUE, 3)] },
      { characters: [C11.c3, C11.c4, C11.c5] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    activateTrigger(g);
    return g;
  };

  it('offers the Characters with cost 4 or less (4 in, 5 out) and rests the chosen one', () => {
    const g = trig();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.c3, C11.c4].sort());
    pickInst(g, [at(g, 'p2', 'characters', C11.c4)]);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c4))).toBe(true);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c3))).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = trig();
    need(g, 'choose', 'p1');
    none(g);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c3))).toBe(false);
  });
});
