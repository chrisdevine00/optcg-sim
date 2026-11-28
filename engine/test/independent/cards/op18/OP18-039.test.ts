/**
 * OP18-039 Gum-Gum Giant Axe (Green Event, cost 1, {Water Seven}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[Counter] Up to 1 of your [Monkey.D.Luffy] gains +2000 power during this battle. Then, if your
 *    Leader is active, draw 1 card."
 *
 * Reading: "[Monkey.D.Luffy]" is a name match on your Leader or a Character; +2000 for this battle.
 * Then, if your Leader is active at that moment, draw 1.
 *
 * Scenery: ST01-001 Luffy (Leader named Monkey.D.Luffy, 5000), ST02-001 Kid (not Luffy),
 * OP18-036 Luffy (Character named Monkey.D.Luffy, 0 power), OP01-018 Hajrudin (6000 attacker).
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock } from '../../helpers.ts';
import {
  activateCounter,
  at,
  endCounter,
  hand,
  kind,
  LC,
  n,
  need,
  offeredIds,
  pickInst,
  theirs,
  VC,
} from './kit-c.ts';

const AXE = 'OP18-039';
const LUFFY_CH = 'OP18-036';

function defend(leader: string = LC.luffy, spec: object = {}) {
  const g = theirs(
    leader,
    { hand: [AXE], costArea: { active: 1, rested: 0 }, characters: [LUFFY_CH, VC.marco3], ...spec },
    { characters: [VC.hajrudin4] },
  );
  attack(g, at(g, 'p2', 'characters', VC.hajrudin4), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  activateCounter(g, g.find('p1', 'hand', AXE));
  return g;
}

describe('OP18-039 Gum-Gum Giant Axe: [Counter] a [Monkey.D.Luffy] +2000 this battle, then draw 1 if the Leader is active', () => {
  it('the Luffy Leader gets +2000 (5000 -> 7000), stops a 6000 attacker, and you draw 1', () => {
    const g = defend();
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(n(g, 'p1', 'hand')).toBe(1);
    endCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(4);
  });

  it('a Luffy Character can be the target; the Leader being active still draws 1', () => {
    const g = defend(LC.kid);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LUFFY_CH]);
    pickInst(g, [at(g, 'p1', 'characters', LUFFY_CH)]);
    expect(g.power(at(g, 'p1', 'characters', LUFFY_CH))).toBe(2000);
    expect(n(g, 'p1', 'hand')).toBe(1);
  });

  it('only cards named [Monkey.D.Luffy] are offered: Marco is not, Kid (Leader) is not', () => {
    const g = defend(LC.kid);
    expect(offeredIds(g)).toEqual([LUFFY_CH]);
    expect(offeredIds(g)).not.toContain(VC.marco3);
  });

  it('with a Luffy Leader both the Leader and the Luffy Character are offered', () => {
    const g = defend();
    expect(offeredIds(g)).toEqual([LC.luffy, LUFFY_CH].sort());
  });

  it('no draw when the Leader is rested', () => {
    const g = theirs(
      { card: LC.luffy, rested: true } as never,
      {
        hand: [AXE],
        costArea: { active: 1, rested: 0 },
        characters: [{ card: LUFFY_CH, rested: true }],
      },
      { characters: [VC.hajrudin4] },
    );
    attack(g, at(g, 'p2', 'characters', VC.hajrudin4), at(g, 'p1', 'characters', LUFFY_CH));
    passBlock(g);
    activateCounter(g, g.find('p1', 'hand', AXE));
    pickInst(g, [at(g, 'p1', 'characters', LUFFY_CH)]);
    expect(hand(g)).toEqual([]);
  });

  it('the +2000 is only for this battle', () => {
    const g = defend();
    pickInst(g, [g.leader('p1')]);
    endCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('cannot be used without 1 DON!! for the cost', () => {
    const g = theirs(LC.luffy, { hand: [AXE] }, { characters: [VC.hajrudin4] });
    attack(g, at(g, 'p2', 'characters', VC.hajrudin4), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    expect(
      g
        .legal()
        .some(
          (a) =>
            (a.type === 'counter' || a.type === 'activate') && a.card === g.find('p1', 'hand', AXE),
        ),
    ).toBe(false);
  });
});
