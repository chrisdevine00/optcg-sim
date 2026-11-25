/**
 * OP09-009 Benn.Beckman (Character, Red, cost 7, 7000, Counter +1000, {Red-Haired Pirates}).
 *
 * Card text: "[On Play] Trash up to 1 of your opponent's Characters with 6000 power or less."
 *
 * Rules: "power" is current power (modifiers count; "base power" is the wording that ignores them,
 * CR 4-9); "up to 1" may be 0 (CR 8-4-4-1); the effect TRASHES, it does not K.O.: "cannot be K.O.'d"
 * does not stop it and [On K.O.] effects do not fire (RL-15, CR 10-2-1); only the opponent's
 * Characters qualify.
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  choices,
  hasEvent,
  kind,
  L9,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  pickInst,
  play,
  S9,
  theirs,
  trash,
  type Place,
} from './kit-op09a.ts';

const BENN = 'OP09-009';
const SHANKS_PERM = 'OP09-004'; // my permanent: all opposing Characters −1000
/** Black, cost 5, 6000, [Blocker]; [On Play] its controller's Characters cannot be K.O.'d by effects until their next turn; then draw 2, trash 2. */
const SABO = 'OP04-083';

function start(p2chars: Place[], own: Place[] = [], p2Leader: string = L9.luffy): TestGame {
  const g = mine(L9.luffy, { hand: [BENN], characters: own }, { characters: p2chars }, p2Leader);
  play(g, g.find('p1', 'hand', BENN));
  return g;
}

describe('OP09-009 Benn.Beckman: [On Play] trash up to 1 opposing Character with 6000 power or less', () => {
  it('printed values: cost 7, 7000, Counter +1000', () => {
    const g = start([]);
    const b = at(g, 'p1', 'characters', BENN);
    expect(g.card(b).cost).toBe(7);
    expect(g.power(b)).toBe(7000);
    expect(g.card(b).counter).toBe(1000);
  });

  it('trashes the chosen opposing Character; it goes to its owner’s trash', () => {
    const g = start([S9.c4, S9.c2]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', S9.c4)]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([S9.c2]);
    expect(trash(g, 'p2')).toEqual([S9.c4]);
  });

  it('boundary: 6000 is offered, 7000 is not', () => {
    const g = start([S9.c4, S9.c5, S9.c6]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.c4]);
  });

  it('the limit is on CURRENT power: a 7000-base Character at 6000 (my Shanks, −1000) is offered', () => {
    const g = start([S9.c5, S9.c6], [SHANKS_PERM]);
    need(g, 'choose', 'p1');
    expect(g.power(at(g, 'p2', 'characters', S9.c5))).toBe(6000);
    expect(offeredIds(g)).toEqual([S9.c5]);
  });

  it('"up to 1": I may trash nothing', () => {
    const g = start([S9.c4]);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('at most one is trashed even when several qualify', () => {
    const g = start([S9.c4, S9.c3, S9.c2]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', S9.c3)]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(atMain(g)).toBe(true);
  });

  it('only opposing Characters are offered: not their Leader, not my own Characters', () => {
    const g = start([S9.c4], [S9.c2]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([at(g, 'p2', 'characters', S9.c4)]);
  });

  it('rested and active Characters are both eligible', () => {
    const g = start([{ card: S9.c4, rested: true }, S9.c3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S9.c3, S9.c4].sort());
  });

  it('with no eligible Character (only 7000+), nothing is trashed and the game goes on', () => {
    const g = start([S9.c5, S9.c7]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it("it trashes, it does not K.O.: a Character that cannot be K.O.'d by effects (opposing Sabo) is still trashed", () => {
    // p2's turn: p2 plays Sabo (6000): "None of your Characters can be K.O.'d by effects until the
    // start of your next turn. Then, draw 2 cards and trash 2 cards from your hand."
    const g = theirs(
      L9.luffy,
      { hand: [BENN], costArea: { active: 8, rested: 0 } },
      { hand: [SABO, S9.c1, S9.c1], characters: [] },
    );
    play(g, g.find('p2', 'hand', SABO));
    need(g, 'choose', 'p2');
    pickCards(g, [S9.c1, S9.c1]);
    endTurn(g);
    need(g, 'main', 'p1');
    play(g, g.find('p1', 'hand', BENN));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SABO]);
    pickInst(g, [at(g, 'p2', 'characters', SABO)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(trash(g, 'p2')).toContain(SABO);
    expect(hasEvent(g, 'KO', { card: SABO })).toBe(false);
  });

  it("must not happen: no [On K.O.] fires (opposing Lucky.Roux would K.O. my 5000 Character if it were K.O.'d)", () => {
    const g = start([S9.roux], [S9.c3], L9.rhp);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', S9.roux)]);
    expect(trash(g, 'p2')).toEqual([S9.roux]);
    expect(hasEvent(g, 'KO')).toBe(false);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([S9.c3, BENN].sort());
  });
});
