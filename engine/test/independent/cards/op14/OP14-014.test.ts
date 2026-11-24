/**
 * OP14-014 Eustass"Captain"Kid (Character, cost 4, 5000, Counter +1000, {Kid Pirates}/{Supernovas}).
 *
 * Card text: "[Blocker] [On Play] If your Leader has the {Supernovas} type, play up to 1 red
 * Character card with 2000 power or less from your hand."
 *
 * Rules: [Blocker] (CR 10-1-4). A played card is placed active and its cost is not paid.
 * Only red Character cards qualify (not Events, not other colours); the power filter reads the
 * printed power. "Up to 1" may be none. A condition that is false means the effect does nothing
 * (and, as nothing about the hidden hand may leak, nothing is asked).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chars,
  hand,
  kind,
  kw,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S14,
  skipEmpty,
} from './kit-op14a.ts';

const KID = 'OP14-014';
/** ST01-014 Guard Point: red Event, cost 1. */
const RED_EVENT = 'ST01-014';

function play(leader: string, others: string[]) {
  const g = mine(leader, { hand: [KID, ...others] });
  playRaw(g, KID);
  return g;
}

describe('OP14-014 Kid: [Blocker]; [On Play] with a {Supernovas} Leader, play a red Character with 2000 power or less', () => {
  it('printed values: cost 4, 5000, Counter +1000, [Blocker]', () => {
    const g = mine(LD14.luffy, { hand: [KID] });
    const c = g.card(g.find('p1', 'hand', KID));
    expect(c.cost).toBe(4);
    expect(c.power).toBe(5000);
    expect(c.counter).toBe(1000);
    const g2 = play(LD14.luffy, []);
    skipEmpty(g2);
    expect(kw(g2, at(g2, 'p1', 'characters', KID))).toContain('Blocker');
  });

  it('with a {Supernovas} Leader it offers exactly the red Characters with 2000 power or less', () => {
    const g = play(LD14.luffy, [
      S14.dadan, // red, 2000
      S14.whitey, // red, 2000
      S14.cobra, // red, 0
      S14.komachiyo, // red, 3000
      S14.killer2, // green, 2000
      RED_EVENT, // red Event
      S14.marco, // red, 5000
    ]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.cobra, S14.dadan, S14.whitey].sort());
  });

  it('plays the chosen Character for free (no DON!! paid), active', () => {
    const g = play(LD14.luffy, [S14.dadan, S14.sai]);
    pickInst(g, [g.find('p1', 'hand', S14.dadan)]);
    expect(chars(g)).toEqual([KID, S14.dadan].sort());
    expect(g.card(at(g, 'p1', 'characters', S14.dadan)).rested).toBe(false);
    expect(hand(g)).toEqual([S14.sai]);
    // Kid cost 4 only: 10 DON!! - 4 = 6 active remain.
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    need(g, 'main', 'p1');
  });

  it('works with the other {Supernovas} Leader, ST02-001 Kid', () => {
    const g = play(LD14.kid, [S14.dadan]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.dadan]);
  });

  it('boundary: power 2000 qualifies, power 3000 does not', () => {
    const g = play(LD14.luffy, [S14.dadan, S14.komachiyo]);
    expect(offeredIds(g)).toEqual([S14.dadan]);
  });

  it('"up to 1": may play nothing', () => {
    const g = play(LD14.luffy, [S14.dadan]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([KID]);
    expect(hand(g)).toEqual([S14.dadan]);
  });

  it('plays only one Character even when two qualify', () => {
    const g = play(LD14.luffy, [S14.dadan, S14.whitey]);
    pickInst(g, [g.find('p1', 'hand', S14.whitey)]);
    expect(chars(g)).toEqual([KID, S14.whitey].sort());
    expect(hand(g)).toEqual([S14.dadan]);
  });

  it('without a qualifying card in hand nothing is played', () => {
    const g = play(LD14.luffy, [S14.komachiyo, S14.killer2, RED_EVENT]);
    skipEmpty(g);
    expect(chars(g)).toEqual([KID]);
    expect(hand(g)).toEqual([S14.komachiyo, S14.killer2, RED_EVENT].sort());
  });

  it('without the {Supernovas} type on my Leader (Crocodile) nothing is asked and nothing is played', () => {
    const g = play(LD14.croc, [S14.dadan]);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([KID]);
    expect(hand(g)).toEqual([S14.dadan]);
  });

  it('an Event is not a Character card: with only a red Event in hand nothing can be played', () => {
    const g = play(LD14.luffy, [RED_EVENT]);
    skipEmpty(g);
    expect(chars(g)).toEqual([KID]);
    expect(hand(g)).toEqual([RED_EVENT]);
  });
});
