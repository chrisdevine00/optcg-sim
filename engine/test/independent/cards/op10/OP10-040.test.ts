/**
 * OP10-040 The Weak Do Not Have the Right to Choose How They Die (Event, Green, cost 5,
 * {Heart Pirates}/{The Seven Warlords of the Sea}/{Punk Hazard}).
 *
 * Card text: "[Main]/[Counter] K.O. up to 1 of your opponent's rested Characters with a cost of 7
 * or less."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 6-5-5 (a Character that attacks is rested), CR 7-1-4 (a battle
 * whose attacker leaves the field ends), CR 8-3-1-3 (cost paid in active DON!!).
 */
import { describe, expect, it } from 'vitest';
import { act, passCounter } from '../../helpers.ts';
import {
  activateCounter,
  atMain,
  canCounterNow,
  defend,
  kind,
  LD10,
  mayDone,
  mine,
  need,
  none,
  offeredInst,
  pickInst,
  playId,
  SC10,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-040';

function main(p2: (string | { card: string; rested?: boolean })[], active = 5) {
  const g = mine(
    LD10.neutral,
    { hand: [ID], costArea: { active, rested: 0 }, characters: [{ card: SC10.c2, rested: true }] },
    { characters: p2 },
  );
  playId(g, ID);
  return g;
}

const R = (card: string) => ({ card, rested: true });

describe('OP10-040 [Main]: K.O. up to 1 rested opposing Character with a cost of 7 or less', () => {
  it('K.O.s a rested cost-7 Character (boundary: 7 qualifies)', () => {
    const g = main([R(SC10.c7), R(SC10.c3)]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', SC10.c7)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC10.c3]);
    expect(trash(g, 'p2')).toEqual([SC10.c7]);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g)).toBe(true);
  });

  it('a rested cost-8 Character is not a candidate', () => {
    const g = main([R(SC10.c8), R(SC10.c3)]);
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c3)]);
  });

  it('an ACTIVE Character is not a candidate even with a low cost', () => {
    const g = main([SC10.c3, R(SC10.c5)]);
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c5)]);
  });

  it('with no rested opposing Character there is nothing to K.O. and the Event is still spent', () => {
    const g = main([SC10.c3]);
    if (mayDone(g)) {
      expect(offeredInst(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(trash(g)).toEqual([ID]);
  });

  it('only opposing Characters: my own rested Character and the opposing Leader are not candidates', () => {
    const g = main([R(SC10.c4)]);
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c4)]);
  });

  it('"up to 1": may choose nothing, and at most one is K.O.d when two qualify', () => {
    const g = main([R(SC10.c4), R(SC10.c5)]);
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    const h = main([R(SC10.c4), R(SC10.c5)]);
    pickInst(h, [h.find('p2', 'characters', SC10.c4)]);
    expect(h.zone('p2', 'characters')).toHaveLength(1);
  });

  it('cost 5: not playable with 4 active DON!! (4 + 0), playable with 5', () => {
    const g = mine(LD10.neutral, { hand: [ID], costArea: { active: 4, rested: 0 } });
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(false);
  });
});

describe('OP10-040 [Counter]: K.O. up to 1 rested opposing Character with a cost of 7 or less', () => {
  it('K.O.s the rested attacker (a Character that attacked is rested): the attack does not connect', () => {
    const g = defend({
      hand: [ID],
      active: 5,
      p2chars: [SC10.c6],
      attackerCard: SC10.c6,
    });
    activateCounter(g, g.find('p1', 'hand', ID));
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p2', 'characters', SC10.c6)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('a cost-8 attacker is rested but cannot be K.O.d: it is not offered and the attack connects', () => {
    const g = defend({ hand: [ID], active: 5, p2chars: [SC10.c8], attackerCard: SC10.c8 });
    activateCounter(g, g.find('p1', 'hand', ID));
    if (kind(g) === 'choose') {
      expect(offeredInst(g)).toEqual([]);
      none(g);
    }
    passCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('a different rested opposing Character may be K.O.d instead (the attacker here is the Leader)', () => {
    const g = defend({ hand: [ID], active: 5, p2chars: [R(SC10.c4), SC10.c3] });
    activateCounter(g, g.find('p1', 'hand', ID));
    need(g, 'choose', 'p1');
    expect(offeredInst(g)).toEqual([g.find('p2', 'characters', SC10.c4)]);
    pickInst(g, [g.find('p2', 'characters', SC10.c4)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC10.c3]);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('with only 4 active DON!! it cannot be used as a Counter', () => {
    const g = defend({ hand: [ID], active: 4, p2chars: [SC10.c6], attackerCard: SC10.c6 });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
    act(g, { type: 'endCounter' });
  });
});
