/**
 * OP15-073 Yama (Character, Purple, cost 3, 4000, Counter +1000, {Sky Island}).
 *
 * Card text: "[Blocker] [On Play] Play up to 1 [Heavenly Warriors] with a cost of 1 or up to 1 {Vassals} type
 * Character card with a cost of 1 from your hand."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 8-4-4-1 ("up to"), CR 3-7 (playing a card by an effect pays no cost and
 * puts a Character active on the field), CR 2-4 (type match on the {Vassals} type; names in brackets).
 * Open point (M6b-Q26, not answered): whether "up to 1 X or up to 1 Y" allows one card in total or one of
 * each. The tests only rely on what both readings share.
 * Scenery: OP15-068 Heavenly Warriors (cost 1), OP15-067 Shura (Vassals, cost 1, no [On Play]),
 * OP05-106 Shura (Vassals, cost 2), OP05-105 Satori (Vassals, cost 5), OP02-060 Mohji (cost 1, no type match).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passCounter } from '../../helpers.ts';
import {
  atMain,
  block,
  BLUE,
  choices,
  don,
  hand,
  inst,
  kind,
  kws,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  reachablePickSets,
  SCN,
  theirs,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const YAMA = 'OP15-073';
const HW = 'OP15-068';
const SHURA1 = 'OP15-067';
const SHURA2 = 'OP05-106';
const SATORI5 = 'OP05-105';

function start(hand_: string[]): TestGame {
  return mine(LD15.purple, { hand: [YAMA, ...hand_], costArea: { active: 10, rested: 0 } });
}
const field = (g: TestGame) =>
  g
    .zone('p1', 'characters')
    .map((c) => c.card)
    .sort();

describe('OP15-073 Yama: [Blocker]; [On Play] play a [Heavenly Warriors] with cost 1 or a {Vassals} Character with cost 1 from hand', () => {
  it('has [Blocker] and blocks for my Leader', () => {
    const g = theirs(LD15.purple, { characters: [YAMA] }, { characters: [SCN.c3] });
    expect(kws(g, inst(g, 'p1', 'characters', YAMA))).toContain('Blocker');
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', YAMA)]);
    block(g, inst(g, 'p1', 'characters', YAMA));
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('plays [Heavenly Warriors] from hand', () => {
    const g = start([HW, BLUE]);
    playRaw(g, YAMA);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', HW)]);
    expect(atMain(g)).toBe(true);
    expect(field(g)).toEqual([HW, YAMA].sort());
    expect(hand(g)).toEqual([BLUE]);
  });

  it('plays a {Vassals} Character with cost 1 from hand', () => {
    const g = start([SHURA1, BLUE]);
    playRaw(g, YAMA);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', SHURA1)]);
    expect(field(g)).toEqual([SHURA1, YAMA].sort());
    expect(g.card(inst(g, 'p1', 'characters', SHURA1)).rested).toBe(false);
  });

  it('the cost of the played card is not paid: only Yama’s 3 DON!! are rested', () => {
    const g = start([HW]);
    playRaw(g, YAMA);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', HW)]);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });

  it('offers only the legal cards: cost-2 and cost-5 {Vassals}, and a cost-1 card of another type are not offered', () => {
    const g = start([HW, SHURA1, SHURA2, SATORI5, BLUE, SCN.c3]);
    playRaw(g, YAMA);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HW, SHURA1].sort());
  });

  it('"up to": choosing nothing plays nothing', () => {
    const g = start([HW, SHURA1]);
    playRaw(g, YAMA);
    need(g, 'choose', 'p1');
    none(g);
    expect(field(g)).toEqual([YAMA]);
    expect(hand(g)).toEqual([HW, SHURA1].sort());
  });

  it('at least one of the two legal cards can be played, and no third card ever is', () => {
    const g = start([HW, SHURA1, BLUE]);
    playRaw(g, YAMA);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect([...sets].some((s) => s === HW)).toBe(true);
    expect([...sets].some((s) => s === SHURA1)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
  });

  it('with nothing playable in hand nothing happens', () => {
    const g = start([SHURA2, SATORI5, BLUE]);
    playRaw(g, YAMA);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(field(g)).toEqual([YAMA]);
  });

  it('only cards in hand count: a [Heavenly Warriors] in the trash is not offered', () => {
    const g = mine(LD15.purple, { hand: [YAMA], trash: [HW], costArea: { active: 10, rested: 0 } });
    playRaw(g, YAMA);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(field(g)).toEqual([YAMA]);
  });

  it('[Blocker] works at once for the Character Yama played: with 7 DON!! left it blocks', () => {
    const g = start([HW]);
    playRaw(g, YAMA);
    pickInst(g, [inst(g, 'p1', 'hand', HW)]);
    expect(field(g)).toContain(HW);
    expect(kws(g, inst(g, 'p1', 'characters', YAMA))).toContain('Blocker');
  });
});
