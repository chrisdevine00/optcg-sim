/**
 * OP10-062 Violet (Character, Purple, cost 3, 4000, Counter +1000, {Donquixote Pirates}).
 *
 * Card text: "[Blocker]
 * [On K.O.] DON!! −1: If your Leader has the "Donquixote Pirates" type, add up to 1 purple Event from
 * your trash to your hand."
 *
 * Rules: [Blocker] (CR 10-1-4), [On K.O.] (battle or effect K.O.), DON!! −N is "you may return" so it is
 * optional and needs the DON!! on the field (CR 10-2-10, RL-52), the "If" after the colon is an effect
 * condition (the cost is paid whether or not it holds), "up to 1" (CR 8-1-2), "purple Event" means an
 * Event card that is purple.
 * Scenery: OP01-060 Doflamingo (Leader, {Donquixote Pirates}), ST01-001 Luffy (Leader, not DP);
 * EB04-040 Flame Dragon Torch and OP07-076 Slow-Slow Beam Sword (purple Events), OP17-056 (blue Event),
 * ST05-007 Gordon (purple Character); OP02-006 Kingdew (7000) as the attacker.
 */
import { describe, expect, it } from 'vitest';
import { act, attack } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  block,
  C10,
  canUse,
  doneRaw,
  donSum,
  expectMain,
  hand,
  inst,
  kind,
  kw,
  L10,
  need,
  offeredNow,
  opponentKOs,
  pickRaw,
  theirs,
  trash,
  X10,
  zoneIds,
} from './kit-op10b.ts';

const VIOLET = 'OP10-062';
const PE1 = X10.purpleEvent;
const PE2 = X10.purpleEvent2;
const BE = X10.blueEvent;
const PCHAR = C10.gordon;

function ambush(
  trashCards: string[],
  o: { leader?: string; don?: { active: number; rested: number } } = {},
): TestGame {
  const g = theirs(
    o.leader ?? L10.dp,
    { characters: [VIOLET], trash: trashCards, costArea: o.don ?? { active: 3, rested: 0 } },
    { characters: [C10.kingdew] },
  );
  attack(g, inst(g, 'p2', 'characters', C10.kingdew), g.leader('p1'));
  need(g, 'block', 'p1');
  block(g, inst(g, 'p1', 'characters', VIOLET));
  need(g, 'counter', 'p1');
  act(g, { type: 'endCounter' });
  return g;
}

describe('OP10-062 Violet: [Blocker]; [On K.O.] DON!! -1: with a {Donquixote Pirates} Leader add up to 1 purple Event from trash to hand', () => {
  it('has [Blocker]', () => {
    const g = theirs(L10.dp, { characters: [VIOLET] }, {});
    expect(kw(g, inst(g, 'p1', 'characters', VIOLET))).toContain('Blocker');
  });

  it("K.O.'d while blocking: pay DON!! -1 (one DON!! returns to the DON!! deck) and add a purple Event from the trash to my hand", () => {
    const g = ambush([PE1, PE2]);
    const before = donSum(g);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    pickRaw(g, g.find('p1', 'trash', PE2));
    expect(hand(g)).toEqual([PE2]);
    expect(trash(g).sort()).toEqual([PE1, VIOLET].sort());
    expect(donSum(g)).toMatchObject({ active: before.active - 1, deck: before.deck + 1 });
  });

  it('only purple Events are offered: a blue Event and a purple Character in the trash are not', () => {
    const g = ambush([PE1, BE, PCHAR]);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([PE1]);
  });

  it('"up to 1": adding nothing still pays the DON!! -1', () => {
    const g = ambush([PE1]);
    const before = donSum(g);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    doneRaw(g);
    expectMain(g, 'p2');
    expect(hand(g)).toEqual([]);
    expect(donSum(g).deck).toBe(before.deck + 1);
  });

  it('adds at most 1 Event even when several are in the trash', () => {
    const g = ambush([PE1, PE2]);
    act(g, { type: 'optional', accept: true });
    pickRaw(g, g.find('p1', 'trash', PE1));
    expect(hand(g)).toHaveLength(1);
    expect(trash(g)).toContain(PE2);
  });

  it('"DON!! -1" is optional: declining returns no DON!! and adds nothing', () => {
    const g = ambush([PE1]);
    const before = donSum(g);
    need(g, 'optional', 'p1');
    expect(canUse(g)).toBe(true);
    act(g, { type: 'optional', accept: false });
    expectMain(g, 'p2');
    expect(hand(g)).toEqual([]);
    expect(donSum(g)).toMatchObject({ active: before.active, deck: before.deck });
  });

  it('with no DON!! on my field the cost cannot be paid: nothing is added', () => {
    const g = ambush([PE1], { don: { active: 0, rested: 0 } });
    if (kind(g) === 'optional') {
      expect(canUse(g)).toBe(false);
      act(g, { type: 'optional', accept: false });
    }
    expectMain(g, 'p2');
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toContain(PE1);
  });

  it('with a Leader that is not {Donquixote Pirates} the DON!! -1 is still paid but nothing is added (the "If" is an effect condition)', () => {
    const g = ambush([PE1], { leader: L10.luffy });
    const before = donSum(g);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    if (kind(g) === 'choose') {
      // the engine may ask an empty pick; it must offer nothing
      expect(offeredNow(g)).toEqual([]);
      doneRaw(g);
    }
    expectMain(g, 'p2');
    expect(hand(g)).toEqual([]);
    expect(donSum(g).deck).toBe(before.deck + 1);
    expect(trash(g)).toContain(PE1);
  });

  it('with no purple Event in the trash the DON!! -1 is still allowed and nothing is added', () => {
    const g = ambush([BE]);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    if (kind(g) === 'choose') {
      expect(offeredNow(g)).toEqual([]);
      doneRaw(g);
    }
    expectMain(g, 'p2');
    expect(hand(g)).toEqual([]);
  });

  it('a K.O. by an opposing effect also activates it (Gum-Gum Lightning)', () => {
    const g = theirs(
      L10.dp,
      { characters: [VIOLET], trash: [PE1], costArea: { active: 3, rested: 0 } },
      { hand: [X10.lightning] },
    );
    opponentKOs(g, inst(g, 'p1', 'characters', VIOLET));
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    pickRaw(g, g.find('p1', 'trash', PE1));
    expect(hand(g)).toEqual([PE1]);
  });

  it('it does not activate when Violet merely blocks a weaker attacker and survives', () => {
    const g = theirs(
      L10.dp,
      { characters: [VIOLET], trash: [PE1], costArea: { active: 3, rested: 0 } },
      { characters: [C10.gordon] },
    );
    attack(g, inst(g, 'p2', 'characters', C10.gordon), g.leader('p1'));
    block(g, inst(g, 'p1', 'characters', VIOLET));
    act(g, { type: 'endCounter' });
    expect(kind(g)).not.toBe('optional');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([VIOLET]);
  });
});
