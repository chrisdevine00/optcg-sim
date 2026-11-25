/**
 * OP09-043 Alvida (Character, Blue, cost 5, 6000, Counter +1000, {Cross Guild}).
 *
 * Card text: "[On K.O.] If your Leader has the "Cross Guild" type, play up to 1 Character card with a
 * cost of 5 or less other than [Alvida] from your hand."
 *
 * Rules: CR 10-2-17 ([On K.O.] resolves after the card is trashed), a colon-less "If" is an effect
 * condition, CR 8-4-4 ("up to"), a card played by an effect enters active. No prompt may depend on
 * hidden cards: an "up to" pick over the hand is asked (max 0) even when nothing qualifies, while a
 * failed Leader check (public) asks nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  answerEmptyChoose,
  at,
  atMain,
  chars,
  hand,
  kind,
  L9,
  need,
  none,
  offeredIds,
  opponentKOs,
  pickInst,
  theirs,
  theyKo,
  trash,
  V9,
  E9,
} from './kit-op09b.ts';

const ALVIDA = 'OP09-043';

function koed(leader: string, handCards: string[], extra: { own?: string[] } = {}) {
  const g = theirs(
    leader,
    { characters: [{ card: ALVIDA, rested: true }, ...(extra.own ?? [])], hand: handCards },
    { characters: [V9.c7] },
  );
  theyKo(g, at(g, 'p1', 'characters', ALVIDA), at(g, 'p2', 'characters', V9.c7));
  return g;
}

describe('OP09-043 Alvida: [On K.O.] with a {Cross Guild} Leader, play up to 1 Character with cost 5 or less other than [Alvida] from hand', () => {
  it('K.O.d in battle with a {Cross Guild} Leader: offers the hand Characters with cost 5 or less; the pick is played active', () => {
    const g = koed(L9.crossGuild, [V9.c3, V9.c5, V9.c6]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c3, V9.c5].sort());
    pickInst(g, [at(g, 'p1', 'hand', V9.c5)]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([V9.c5]);
    expect(g.card(at(g, 'p1', 'characters', V9.c5)).rested).toBe(false);
    expect(hand(g)).toEqual([V9.c3, V9.c6].sort());
    expect(trash(g)).toEqual([ALVIDA]);
  });

  it('boundary: cost 5 is playable and cost 6 is not', () => {
    const g = koed(L9.crossGuild, [V9.c5, V9.c6]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c5]);
  });

  it('"other than [Alvida]": a card named [Alvida] (OP03-023, cost 1; another OP09-043) is not offered', () => {
    const g = koed(L9.crossGuild, [V9.alvida1, ALVIDA, V9.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c3]);
  });

  it('an Event card in hand is not offered (Characters only)', () => {
    const g = koed(L9.crossGuild, [E9.blueEvent, V9.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c3]);
  });

  it('the Leader is not {Cross Guild}: nothing is asked, nothing is played', () => {
    const g = koed(L9.neutral, [V9.c3, V9.c5]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([V9.c3, V9.c5].sort());
    expect(trash(g)).toEqual([ALVIDA]);
  });

  it('"up to 1": choosing nothing is allowed; nothing is played', () => {
    const g = koed(L9.crossGuild, [V9.c3, V9.c5]);
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([V9.c3, V9.c5].sort());
  });

  it('plays at most 1 Character', () => {
    const g = koed(L9.crossGuild, [V9.c3, V9.c5, V9.c4]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', V9.c3)]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toHaveLength(1);
  });

  it('with no Character of cost 5 or less in hand the "up to" pick is still asked (max 0), so the opponent learns nothing', () => {
    const g = koed(L9.crossGuild, [V9.c6, V9.c7]);
    answerEmptyChoose(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([]);
  });

  it('with an empty hand the "up to" pick is asked as well (max 0)', () => {
    const g = koed(L9.crossGuild, []);
    answerEmptyChoose(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
  });

  it("K.O.d by the opponent's effect (Gum-Gum Lightning) the same [On K.O.] resolves", () => {
    const g = theirs(
      L9.crossGuild,
      { characters: [ALVIDA], hand: [V9.c3] },
      { hand: ['OP09-077'] },
    );
    opponentKOs(g, at(g, 'p1', 'characters', ALVIDA));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.c3]);
    pickInst(g, [at(g, 'p1', 'hand', V9.c3)]);
    expect(chars(g)).toEqual([V9.c3]);
    expect(kind(g)).toBe('main');
  });
});
