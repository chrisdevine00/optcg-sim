/**
 * OP16-040 Gum-Gum Hammer Rifle (Event, Green, cost 1, {Straw Hat Crew}/{Impel Down}).
 *
 * Card text: "[Main] If you have [Monkey.D.Luffy] and [Mr.3(Galdino)], up to 1 of your opponent's
 * rested Characters with a cost of 6 or less will not become active in your opponent's next Refresh
 * Phase. [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 2-1-2 ([Name] is exact), CR 8-3-3 (text after a failed "if" does not resolve), CR 6-2-4
 * (Refresh sets rested cards active), CR 8-4-4-1 ("up to"), CR 7-1-5-3 (battle durations).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock, takeDamage } from '../../helpers.ts';
import {
  at,
  backAtMain,
  choices,
  declineChoice,
  endTurn,
  hand,
  inst,
  kind,
  LDR,
  mine,
  need,
  offeredNow,
  pickInst,
  put,
  rested,
  SCN,
  theirs,
  toMyNextMain,
  useCounter,
} from './kit-op16b.ts';

const EVT = 'OP16-040';
/** OP07-033 Monkey.D.Luffy: cost 5, 6000. Inert with fewer than 3 Characters. */
const LUFFY = 'OP07-033';
/** ST30-014 Mr.3(Galdino): cost 2, 3000, Counter +2000; only an [Activate: Main]. */
const MR3 = 'ST30-014';
/** OP02-065 Mr.3: cost 4, 5000, [Blocker]; a different card name from [Mr.3(Galdino)]. */
const MR3_PLAIN = 'OP02-065';
const R = (card: string) => ({ card, rested: true });

function start(
  own: string[],
  p2: ({ card: string; rested: boolean } | string)[],
  leader: string = LDR.dp,
) {
  return mine(leader, { hand: [EVT], characters: own }, { characters: p2 });
}

describe('OP16-040 Gum-Gum Hammer Rifle: [Main] with [Monkey.D.Luffy] and [Mr.3(Galdino)], a rested opposing Character stays rested next Refresh', () => {
  it('with both names on my field: the chosen rested Character is still rested in the opponent’s Main Phase', () => {
    const g = start([LUFFY, MR3], [R(SCN.c4), R(SCN.c3)]);
    put(g, EVT);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c4)]);
    expect(backAtMain(g)).toBe(true);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c4))).toBe(true);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c3))).toBe(false);
  });

  it('the Leader [Monkey.D.Luffy] counts as "you have [Monkey.D.Luffy]"', () => {
    const g = start([MR3], [R(SCN.c4)], LDR.luffy);
    put(g, EVT);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c4)]);
    endTurn(g);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c4))).toBe(true);
  });

  it('without [Mr.3(Galdino)] the effect does nothing: the Character becomes active as usual', () => {
    const g = start([LUFFY], [R(SCN.c4)]);
    put(g, EVT);
    expect(kind(g)).not.toBe('choose');
    expect(backAtMain(g)).toBe(true);
    endTurn(g);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c4))).toBe(false);
  });

  it('without [Monkey.D.Luffy] the effect does nothing', () => {
    const g = start([MR3], [R(SCN.c4)]);
    put(g, EVT);
    expect(kind(g)).not.toBe('choose');
    endTurn(g);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c4))).toBe(false);
  });

  it('CR 2-1-2: a Character named just [Mr.3] is not [Mr.3(Galdino)]', () => {
    const g = start([LUFFY, MR3_PLAIN], [R(SCN.c4)]);
    put(g, EVT);
    expect(kind(g)).not.toBe('choose');
    endTurn(g);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c4))).toBe(false);
  });

  it('cost boundary: a cost-6 rested Character is offered, a cost-7 one and an active one are not', () => {
    const g = start([LUFFY, MR3], [R(SCN.c6), R(SCN.c7), SCN.c3]);
    put(g, EVT);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([SCN.c6]);
  });

  it('"up to 1": may choose none, and then every rested Character becomes active', () => {
    const g = start([LUFFY, MR3], [R(SCN.c4)]);
    put(g, EVT);
    declineChoice(g);
    endTurn(g);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c4))).toBe(false);
  });

  it('only one Character is held: with two rested candidates just one is chosen', () => {
    const g = start([LUFFY, MR3], [R(SCN.c4), R(SCN.c3)]);
    put(g, EVT);
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(2);
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c3)]);
    expect(backAtMain(g)).toBe(true);
    endTurn(g);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c3))).toBe(true);
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c4))).toBe(false);
  });

  it('it holds for the next Refresh Phase only: the Character is active after the opponent’s following Refresh', () => {
    const g = start([LUFFY, MR3], [R(SCN.c4)]);
    put(g, EVT);
    pickInst(g, [inst(g, 'p2', 'characters', SCN.c4)]);
    toMyNextMain(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(rested(g, inst(g, 'p2', 'characters', SCN.c4))).toBe(false);
    void at;
  });

  it('[Counter]: my Leader gains +3000 power during this battle only', () => {
    const g = theirs(LDR.luffy, { hand: [EVT], costArea: { active: 2, rested: 0 } }, {}, LDR.luffy);
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    useCounter(g, inst(g, 'p1', 'hand', EVT), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([]);
  });
});
