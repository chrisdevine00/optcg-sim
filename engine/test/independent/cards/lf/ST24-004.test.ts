/**
 * ST24-004 Law & Bepo (Character, Green, cost 10, 11000, no Counter, {Heart Pirates}/{Minks}/{Supernovas}).
 *
 * Card text: [On Play] Rest up to 1 of your opponent's Characters and that Character will not become
 * active in your opponent's next Refresh Phase. Then, if your opponent has 2 or more rested
 * Characters, your Leader gains +2000 power until the end of your opponent's next End Phase.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import { atMain, mine, need, none, offeredIds, pickInst, toMyNextMain } from '../op17/kit-op17b.ts';
import { inst, LC, playRaw, rested, SCL } from './kit-lfc.ts';
import type { PlayerSpec } from '@optcg/engine';

const LAW = 'ST24-004';

type Placed = string | { card: string; rested?: boolean };

function game(p2chars: Placed[]) {
  return mine(
    LC.plain,
    { hand: [LAW], costArea: { active: 10, rested: 0 } },
    { characters: p2chars as PlayerSpec['characters'] },
  );
}

describe('ST24-004 Law & Bepo: rest an opposing Character that stays rested next Refresh; with 2+ rested, Leader +2000', () => {
  it('rests the chosen Character, and it is still rested in the opponent next Main Phase (no refresh)', () => {
    const g = game([SCL.c5]);
    playRaw(g, LAW);
    need(g, 'choose', 'p1');
    const t = inst(g, 'p2', 'characters', SCL.c5);
    pickInst(g, [t]);
    expect(atMain(g)).toBe(true);
    expect(rested(g, t)).toBe(true);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(rested(g, t)).toBe(true);
  });

  it('only that one Refresh Phase is skipped: the Character becomes active in the following one', () => {
    const g = game([SCL.c5]);
    playRaw(g, LAW);
    const t = inst(g, 'p2', 'characters', SCL.c5);
    pickInst(g, [t]);
    toMyNextMain(g);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(rested(g, t)).toBe(false);
  });

  it('other rested Characters of the opponent still become active; only the chosen one is held down', () => {
    const g = game([{ card: SCL.c2, rested: true }, SCL.c5]);
    playRaw(g, LAW);
    const t = inst(g, 'p2', 'characters', SCL.c5);
    const other = inst(g, 'p2', 'characters', SCL.c2);
    pickInst(g, [t]);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(rested(g, t)).toBe(true);
    expect(rested(g, other)).toBe(false);
  });

  it('offers the opponent Characters only (not their Leader), with no cost limit', () => {
    const g = game([SCL.c2, SCL.c8]);
    playRaw(g, LAW);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCL.c2, SCL.c8].sort());
  });

  it('with 1 rested Character already and the target rested too, the opponent has 2 rested: Leader +2000', () => {
    const g = game([{ card: SCL.c2, rested: true }, SCL.c5]);
    playRaw(g, LAW);
    pickInst(g, [inst(g, 'p2', 'characters', SCL.c5)]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('with no other rested Character, resting one gives only 1 rested: no power gain', () => {
    const g = game([SCL.c5, SCL.c2]);
    playRaw(g, LAW);
    pickInst(g, [inst(g, 'p2', 'characters', SCL.c5)]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": choosing nothing while the opponent already has 2 rested Characters still gives +2000', () => {
    const g = game([{ card: SCL.c2, rested: true }, { card: SCL.c3, rested: true }, SCL.c5]);
    playRaw(g, LAW);
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(rested(g, inst(g, 'p2', 'characters', SCL.c5))).toBe(false);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('choosing nothing with fewer than 2 rested Characters gives no power', () => {
    const g = game([{ card: SCL.c2, rested: true }, SCL.c5]);
    playRaw(g, LAW);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the +2000 lasts through the opponent turn and ends at the end of their End Phase', () => {
    const g = game([{ card: SCL.c2, rested: true }, SCL.c5]);
    playRaw(g, LAW);
    pickInst(g, [inst(g, 'p2', 'characters', SCL.c5)]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(7000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with no opposing Characters the effect does nothing and asks nothing', () => {
    const g = game([]);
    playRaw(g, LAW);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });
});
