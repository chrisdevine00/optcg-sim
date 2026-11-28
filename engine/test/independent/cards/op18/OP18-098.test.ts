/**
 * OP18-098 Onigumo (Yellow Character, cost 7, 7000, Counter +2000, {Vice Admiral}/{Navy}, [Unblockable]).
 *
 * Card text: "[Unblockable] (This card cannot be blocked.)"
 *
 * Rules: CR 10-1-7 / 10-1-7-1: an [Unblockable] attacker cannot be blocked; [Blocker] cannot be
 * activated against it. The Counter Step still happens.
 * Scenery: OP09-072 Franky (Purple, cost 4, 5000, [Blocker]), OP02-006 Kingdew (Red, 7000, no
 * keyword) as the control attacker.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  cardIds,
  kind,
  kw,
  need,
  passBlock,
  passCounter,
  useCounter,
  LDR,
  CH,
} from './kit-e.ts';
import { mineE } from './kit-e.ts';

const O = 'OP18-098';
const BLOCKER = 'OP09-072';

describe('OP18-098 Onigumo: [Unblockable]', () => {
  it('printed: cost 7, 7000 power, keyword Unblockable', () => {
    const g = mineE(LDR.luffy, { characters: [O] });
    const c = g.card(at(g, 'p1', 'characters', O));
    expect([c.cost, c.power]).toEqual([7, 7000]);
    expect(kw(g, at(g, 'p1', 'characters', O))).toContain('Unblockable');
  });

  it('the opponent’s [Blocker] is not offered against an attack on the Leader; the Counter Step follows', () => {
    const g = mineE(LDR.luffy, { characters: [O] }, { characters: [BLOCKER] });
    attack(g, at(g, 'p1', 'characters', O), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
    passBlock(g);
    expect(kind(g)).toBe('counter');
    passCounter(g);
    expect(g.life('p2')).toBe(3);
  });

  it('control: the same [Blocker] is offered against a non-[Unblockable] attacker', () => {
    const g = mineE(LDR.luffy, { characters: [CH.kingdew5] }, { characters: [BLOCKER] });
    attack(g, at(g, 'p1', 'characters', CH.kingdew5), g.leader('p2'));
    need(g, 'block', 'p2');
    expect(blockers(g)).toEqual([at(g, 'p2', 'characters', BLOCKER)]);
  });

  it('also unblockable when it attacks a rested Character', () => {
    const g = mineE(
      LDR.luffy,
      { characters: [O] },
      { characters: [{ card: CH.hajrudin4, rested: true }, BLOCKER] },
    );
    attack(g, at(g, 'p1', 'characters', O), at(g, 'p2', 'characters', CH.hajrudin4));
    expect(blockers(g)).toEqual([]);
    passBlock(g);
    passCounter(g);
    expect(cardIds(g, 'p2', 'trash')).toEqual([CH.hajrudin4]);
  });

  it('the Counter Step still happens: two +1000 Counters bring the Leader to 7000, which stops the 7000 attack', () => {
    const g = mineE(
      LDR.luffy,
      { characters: [O] },
      { hand: [CH.marco3, CH.hajrudin4], characters: [BLOCKER] },
    );
    attack(g, at(g, 'p1', 'characters', O), g.leader('p2'));
    passBlock(g);
    need(g, 'counter', 'p2');
    useCounter(g, at(g, 'p2', 'hand', CH.marco3), g.leader('p2'));
    useCounter(g, at(g, 'p2', 'hand', CH.hajrudin4), g.leader('p2'));
    expect(g.power(g.leader('p2'))).toBe(7000);
    act(g, { type: 'endCounter' });
    expect(g.life('p2')).toBe(4);
  });
});
