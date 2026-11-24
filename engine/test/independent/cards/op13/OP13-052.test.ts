/**
 * OP13-052 Boa Marigold (Character, Blue, cost 5, 4000, Counter +1000, [Blocker], {Kuja Pirates}).
 *
 * Card text: "[Blocker]
 * [On Play] If your Leader is [Boa Hancock], play up to 1 [Boa Hancock] with a cost of 6 or less
 * from your hand."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 8-4-4-1 ("up to"), a card played by an effect pays no cost, a
 * prompt must never depend on hidden cards, CR 3-7-6-1 (6th Character).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  choices,
  decision,
  dons,
  HANCOCK,
  isMain,
  kind,
  mine,
  need,
  offeredIds,
  pickInst,
  playRaw,
  theirs,
  WL,
  WV,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const MARIGOLD = 'OP13-052';

function board(leader: string, hand: string[], chars: string[] = []): TestGame {
  return mine(leader, { hand: [MARIGOLD, ...hand], characters: chars });
}

const onField = (g: TestGame, card: string) =>
  g.zone('p1', 'characters').some((c) => c.card === card);

describe('OP13-052 Boa Marigold: [Blocker]; [On Play] with a [Boa Hancock] Leader, play a cost 6 or less [Boa Hancock]', () => {
  it('has the [Blocker] keyword and may block', () => {
    const g = theirs(WL.croc, { characters: [MARIGOLD] }, { characters: [WV.thatch] });
    expect(g.card(g.find('p1', 'characters', MARIGOLD)).keywords).toContain('Blocker');
    attack(g, g.find('p2', 'characters', WV.thatch), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', MARIGOLD)]);
  });

  it('offers exactly the [Boa Hancock] cards with cost 6 or less (6 yes, 7 no, other names no)', () => {
    const g = board(WL.hancock, [HANCOCK.c3b, HANCOCK.c4, HANCOCK.c6, HANCOCK.c7, WV.mohji]);
    playRaw(g, MARIGOLD);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HANCOCK.c3b, HANCOCK.c4, HANCOCK.c6].sort());
  });

  it('plays a cost-6 Hancock for free; only Marigold paid (5 DON!!)', () => {
    const g = board(WL.hancock, [HANCOCK.c6]);
    playRaw(g, MARIGOLD);
    pickInst(g, [g.find('p1', 'hand', HANCOCK.c6)]);
    expect(onField(g, HANCOCK.c6)).toBe(true);
    expect(dons(g).rested).toBe(5);
    expect(isMain(g)).toBe(true);
  });

  it('a Leader that is not [Boa Hancock]: nothing is asked or played', () => {
    const g = board(WL.croc, [HANCOCK.c4]);
    playRaw(g, MARIGOLD);
    expect(isMain(g)).toBe(true);
    expect(onField(g, HANCOCK.c4)).toBe(false);
  });

  it('"up to 1": choosing nothing plays nothing', () => {
    const g = board(WL.hancock, [HANCOCK.c4]);
    playRaw(g, MARIGOLD);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(onField(g, HANCOCK.c4)).toBe(false);
  });

  it('plays only one of two eligible cards', () => {
    const g = board(WL.hancock, [HANCOCK.c4, HANCOCK.c6]);
    playRaw(g, MARIGOLD);
    pickInst(g, [g.find('p1', 'hand', HANCOCK.c6)]);
    expect(isMain(g)).toBe(true);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([HANCOCK.c4]);
  });

  it('hidden hand: a non-matching hand still gets the (empty) pick', () => {
    const g = board(WL.hancock, [HANCOCK.c7]);
    playRaw(g, MARIGOLD);
    expect(kind(g)).toBe('choose');
    expect(choices(g)).toEqual([]);
    act(g, { type: 'done' });
    expect(isMain(g)).toBe(true);
  });

  // DISAGREEMENT B-1 (severity 1, no leak): the hand is empty (public), yet the engine asks an empty pick.
  it.fails('hidden hand: an empty hand asks nothing', () => {
    const g = board(WL.hancock, []);
    playRaw(g, MARIGOLD);
    expect(decision(g)?.kind).toBe('main');
  });

  it('the [Boa Hancock] played is not Marigold herself and the cost-4 boundary below is fine', () => {
    const g = board(WL.hancock, [HANCOCK.c4]);
    playRaw(g, MARIGOLD);
    pickInst(g, [g.find('p1', 'hand', HANCOCK.c4)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([HANCOCK.c4, MARIGOLD].sort());
  });

  it('with 4 Characters already, the played Hancock forces a trash first', () => {
    const g = board(WL.hancock, [HANCOCK.c4], [WV.marco, WV.sai, WV.jil, WV.kingdew]);
    playRaw(g, MARIGOLD);
    pickInst(g, [g.find('p1', 'hand', HANCOCK.c4)]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', WV.sai)]);
    expect(onField(g, HANCOCK.c4)).toBe(true);
    expect(onField(g, WV.sai)).toBe(false);
    expect(g.zone('p1', 'characters')).toHaveLength(5);
  });
});
