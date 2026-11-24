/**
 * OP13-050 Boa Sandersonia (Character, Blue, cost 2, 3000, Counter +1000, {Kuja Pirates}).
 *
 * Card text: "[On Play] If your Leader is [Boa Hancock], play up to 1 [Boa Hancock] with a cost of 3
 * or less from your hand."
 *
 * Rules: CR 8-4-4-1 ("up to"), a card played by an effect pays no cost, a prompt must never depend
 * on hidden cards (an "up to" pick from a non-empty hand is asked even with no match; with an
 * empty hand nothing is asked), CR 3-7-6-1 (a 6th Character: trash one first).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
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
  WL,
  WV,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SANDER = 'OP13-050';

function board(leader: string, hand: string[], chars: string[] = []): TestGame {
  return mine(leader, { hand: [SANDER, ...hand], characters: chars });
}

const onField = (g: TestGame, card: string) =>
  g.zone('p1', 'characters').some((c) => c.card === card);

describe('OP13-050 Boa Sandersonia: [On Play] with a [Boa Hancock] Leader, play a cost 3 or less [Boa Hancock] from hand', () => {
  it('offers exactly the [Boa Hancock] cards with cost 3 or less in my hand (3 yes, 4 and 6 no, other names no)', () => {
    const g = board(WL.hancock, [HANCOCK.c3b, HANCOCK.c4, HANCOCK.c6, WV.mohji]);
    playRaw(g, SANDER);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HANCOCK.c3b]);
  });

  it('plays the chosen Hancock for free, active, next to Sandersonia', () => {
    const g = board(WL.hancock, [HANCOCK.c3b]);
    playRaw(g, SANDER);
    pickInst(g, [g.find('p1', 'hand', HANCOCK.c3b)]);
    expect(onField(g, HANCOCK.c3b)).toBe(true);
    expect(g.card(g.find('p1', 'characters', HANCOCK.c3b)).rested).toBe(false);
    expect(dons(g).rested).toBe(2);
    expect(isMain(g)).toBe(true);
  });

  it('a multicoloured {Boa Hancock} Leader (OP14-041) counts as [Boa Hancock] too', () => {
    const g = board(WL.hancockMulti, [HANCOCK.c3b]);
    playRaw(g, SANDER);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'hand', HANCOCK.c3b)]);
    expect(onField(g, HANCOCK.c3b)).toBe(true);
  });

  it('a Leader that is not [Boa Hancock]: nothing is asked and nothing is played', () => {
    const g = board(WL.croc, [HANCOCK.c3b]);
    playRaw(g, SANDER);
    expect(isMain(g)).toBe(true);
    expect(onField(g, HANCOCK.c3b)).toBe(false);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([HANCOCK.c3b]);
  });

  it('"up to 1": choosing nothing plays nothing', () => {
    const g = board(WL.hancock, [HANCOCK.c3b]);
    playRaw(g, SANDER);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(onField(g, HANCOCK.c3b)).toBe(false);
    expect(isMain(g)).toBe(true);
  });

  it('plays at most one even with two eligible cards in hand', () => {
    const g = board(WL.hancock, [HANCOCK.c3b, HANCOCK.c3]);
    playRaw(g, SANDER);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HANCOCK.c3, HANCOCK.c3b].sort());
    pickInst(g, [g.find('p1', 'hand', HANCOCK.c3)]);
    expect(isMain(g)).toBe(true);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([HANCOCK.c3, SANDER].sort());
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([HANCOCK.c3b]);
  });

  it('hidden hand: with a non-matching hand the "up to" pick is still asked (empty), never skipped by peeking', () => {
    const g = board(WL.hancock, [HANCOCK.c4]);
    playRaw(g, SANDER);
    // raw check: either the empty pick is asked, or (if no card in hand at all) nothing
    expect(kind(g)).toBe('choose');
    expect(choices(g)).toEqual([]);
    act(g, { type: 'done' });
    expect(isMain(g)).toBe(true);
  });

  // DISAGREEMENT B-1 (severity 1, no leak): the hand is empty (public), yet the engine asks an empty pick.
  it.fails('hidden hand: an empty hand asks nothing', () => {
    const g = board(WL.hancock, []);
    playRaw(g, SANDER);
    expect(decision(g)?.kind).toBe('main');
  });

  it('the Hancock does not need Sandersonia to stay: Characters other than [Boa Hancock] are never offered', () => {
    const g = board(WL.hancock, [WV.mohji, WV.marco]);
    playRaw(g, SANDER);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SANDER]);
  });

  it('with 4 Characters in play Sandersonia makes 5; the played Hancock then needs one trashed first', () => {
    const g = board(WL.hancock, [HANCOCK.c3b], [WV.marco, WV.sai, WV.jil, WV.kingdew]);
    playRaw(g, SANDER);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'hand', HANCOCK.c3b)]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', WV.marco)]);
    expect(onField(g, HANCOCK.c3b)).toBe(true);
    expect(onField(g, WV.marco)).toBe(false);
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([WV.marco]);
  });
});
