/**
 * OP15-054 And No One Else Can Have It! It's Our Memento of Him (Event, Blue, cost 4, {Revolutionary
 * Army}/{Dressrosa}).
 *
 * Card text: "[Main] If your Leader is [Lucy], choose one:
 * - Draw 2 cards and trash 1 card from your hand. Then, play up to 1 {Dressrosa} type Character card with a
 *   cost of 4 or less from your hand.
 * - Return up to 1 Stage to the owner's hand."
 *
 * Rules: CR 8-3-3 (a failed "if" stops the text), CR 8-4-4 (choices at resolution), CR 8-4-4-1 ("up to"),
 * CR 4-5-3 (draw X), CR 4-10-2 (a "then" clause).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  choices,
  deck,
  don,
  hand,
  inst,
  kind,
  LD15,
  mine,
  modeLabels,
  need,
  none,
  offeredIds,
  pickInst,
  pickMode,
  playRaw,
  SC15,
  SCN,
  trash,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EVENT = 'OP15-054';
/** OP04-096 Corrida Coliseum: Stage, cost 1, {Dressrosa}. */
const STAGE = 'OP04-096';
const CAV4 = SC15.cavendish; // cost 4, 6000, {Dressrosa}
const GILLY = SC15.gilly; // cost 3, 5000, {Dressrosa}
const HAJ5 = SC15.hajrudin; // cost 5, 6000, {Dressrosa}
const DRAW = [SCN.c2, SCN.c3, BLUE, BLUE, BLUE];
const MODE1 = /Draw 2/;
const MODE2 = /Return up to 1 Stage/;

function start(
  leader: string,
  handCards: string[],
  o: { stage?: string; p2stage?: string; chars?: string[] } = {},
): TestGame {
  return mine(
    leader,
    {
      hand: [EVENT, ...handCards],
      deck: DRAW,
      ...(o.stage ? { stage: o.stage } : {}),
      ...(o.chars ? { characters: o.chars } : {}),
      costArea: { active: 10, rested: 0 },
    },
    o.p2stage ? { stage: o.p2stage } : {},
  );
}

describe('OP15-054 And No One Else Can Have It!: [Main] if my Leader is [Lucy], choose one', () => {
  it('offers both modes with a [Lucy] Leader', () => {
    const g = start(LD15.lucy, []);
    playRaw(g, EVENT);
    expect(modeLabels(g)).toHaveLength(2);
    expect(modeLabels(g).some((l) => MODE1.test(l))).toBe(true);
    expect(modeLabels(g).some((l) => MODE2.test(l))).toBe(true);
  });

  it('mode 1: draw 2, trash 1 from hand, then play a {Dressrosa} Character with cost 4 or less from hand', () => {
    const g = start(LD15.lucy, [CAV4]);
    playRaw(g, EVENT);
    pickMode(g, MODE1);
    need(g, 'choose', 'p1');
    // hand now: Cavendish, SCN.c2, SCN.c3
    expect(hand(g)).toEqual([CAV4, SCN.c2, SCN.c3].sort());
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c2)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CAV4]);
    pickInst(g, [inst(g, 'p1', 'hand', CAV4)]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([CAV4]);
    expect(trash(g)).toEqual([EVENT, SCN.c2].sort());
    expect(hand(g)).toEqual([SCN.c3]);
    expect(deck(g)).toHaveLength(3);
  });

  it('boundary: cost 4 is playable, cost 5 is not offered, cost 3 is', () => {
    const g = start(LD15.lucy, [CAV4, HAJ5, GILLY]);
    playRaw(g, EVENT);
    pickMode(g, MODE1);
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c2)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CAV4, GILLY].sort());
  });

  it('only {Dressrosa} Characters: a non-{Dressrosa} Character and a {Dressrosa} Stage are not offered', () => {
    const g = start(LD15.lucy, [SCN.c3, STAGE, BLUE]);
    playRaw(g, EVENT);
    pickMode(g, MODE1);
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c2)]);
    // nothing legal to play: either no prompt or an empty "up to" choice
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('"up to 1": the Character may be left in hand, after the draw and trash', () => {
    const g = start(LD15.lucy, [CAV4]);
    playRaw(g, EVENT);
    pickMode(g, MODE1);
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c2)]);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g)).toEqual([CAV4, SCN.c3].sort());
    expect(trash(g)).toEqual([EVENT, SCN.c2].sort());
  });

  it('the trash is exactly 1 card: the drawn Character itself may be trashed and then cannot be played', () => {
    const g = start(LD15.lucy, []);
    playRaw(g, EVENT);
    pickMode(g, MODE1);
    expect(hand(g)).toEqual([SCN.c2, SCN.c3].sort());
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c3)]);
    expect(trash(g)).toEqual([EVENT, SCN.c3].sort());
    expect(hand(g)).toEqual([SCN.c2]);
  });

  it('mode 2: returns my Stage to my hand', () => {
    const g = start(LD15.lucy, [], { stage: STAGE });
    playRaw(g, EVENT);
    pickMode(g, MODE2);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'stage', STAGE)]);
    expect(g.zone('p1', 'stage')).toHaveLength(0);
    expect(hand(g)).toEqual([STAGE]);
    expect(deck(g)).toHaveLength(5);
  });

  it('mode 2 may return the opponent’s Stage to its owner’s hand', () => {
    const g = start(LD15.lucy, [], { p2stage: STAGE });
    playRaw(g, EVENT);
    pickMode(g, MODE2);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([STAGE]);
    pickInst(g, [inst(g, 'p2', 'stage', STAGE)]);
    expect(g.zone('p2', 'stage')).toHaveLength(0);
    expect(hand(g, 'p2')).toEqual([STAGE]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('mode 2 "up to 1": may return nothing; Characters are never candidates', () => {
    const g = start(LD15.lucy, [], { stage: STAGE, chars: [SCN.c3] });
    playRaw(g, EVENT);
    pickMode(g, MODE2);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([STAGE]);
    none(g);
    expect(g.zone('p1', 'stage')).toHaveLength(1);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('must not: with a Leader that is not [Lucy] the Event does nothing (no draw, no return)', () => {
    const g = start(LD15.dressrosa, [CAV4], { stage: STAGE });
    playRaw(g, EVENT);
    if (kind(g) === 'choose') {
      // if the engine still asks for a mode, nothing may happen whichever is taken
      expect(modeLabels(g)).toEqual([]);
    }
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([CAV4]);
    expect(deck(g)).toHaveLength(5);
    expect(g.zone('p1', 'stage')).toHaveLength(1);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('the cost of 4 is paid when the Event is played', () => {
    const g = start(LD15.lucy, [], { stage: STAGE });
    playRaw(g, EVENT);
    pickMode(g, MODE2);
    none(g);
    expect(don(g)).toMatchObject({ active: 6, rested: 4 });
    expect(trash(g)).toEqual([EVENT]);
  });
});
