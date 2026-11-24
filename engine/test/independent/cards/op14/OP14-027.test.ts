/**
 * OP14-027 Shanks (Character, cost 7, 9000, no Counter, {The Four Emperors}/{Red-Haired Pirates}/{East Blue}).
 *
 * Card text: "[Your Turn] When this Character becomes rested, rest up to 1 of your opponent's
 * Characters with 7000 base power or less.
 * [Opponent's Turn] If this Character is rested, give all of your opponent's Characters -1000 power."
 *
 * Rules: a Character rests when it attacks, so attacking is "becoming rested" (open question
 * M6b-Q30; the tests use attacking, and an opposing effect for the [Your Turn] gate). "Base power"
 * ignores modifiers. "Up to 1" may be none. [Opponent's Turn] "If this Character is rested" is a
 * live state check on the other player's turn; "all of your opponent's Characters" names Characters
 * only, so Leaders are untouched and the effect is not a choice.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chr,
  gammaKnife,
  kind,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  payDonStrict,
  pickInst,
  playRaw,
  S14,
  swing,
  theirs,
  yes,
} from './kit-op14a.ts';

const SHANKS = 'OP14-027';
const REST_EVENT = 'OP17-038';

function attacking(p2chars: (string | { card: string; rested?: boolean })[], hand: string[] = []) {
  return mine(LD14.luffy, { hand, characters: [SHANKS] }, { characters: p2chars });
}

describe('OP14-027 Shanks: [Your Turn] when rested, rest an opposing Character with 7000 base power or less', () => {
  it('printed values: cost 7, 9000, no Counter', () => {
    const g = attacking([]);
    const s = at(g, 'p1', 'characters', SHANKS);
    expect(g.card(s).cost).toBe(7);
    expect(g.power(s)).toBe(9000);
    expect(g.card(s).counter).toBeNull();
  });

  it('attacking rests Shanks; the effect offers exactly the opposing Characters with base power 7000 or less', () => {
    const g = attacking([S14.kingdew, S14.sai, S14.thatch, S14.oars]);
    swing(g, SHANKS);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.kingdew, S14.sai].sort());
  });

  it('rests the chosen Character', () => {
    const g = attacking([S14.kingdew, S14.sai]);
    swing(g, SHANKS);
    pickInst(g, [chr(g, 'p2', S14.kingdew)]);
    expect(g.card(chr(g, 'p2', S14.kingdew)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', S14.sai)).rested).toBe(false);
    expect(kind(g)).toBe('block');
  });

  it('boundary: base power 7000 qualifies, 8000 does not', () => {
    const g = attacking([S14.kingdew, S14.thatch]);
    swing(g, SHANKS);
    expect(offeredIds(g)).toEqual([S14.kingdew]);
  });

  it('"base" power: an 8000 Character lowered to 3000 this turn is still not offered', () => {
    const g = attacking([S14.thatch, S14.sai], [S14.gammaKnife]);
    gammaKnife(g, chr(g, 'p2', S14.thatch));
    expect(g.power(chr(g, 'p2', S14.thatch))).toBe(3000);
    swing(g, SHANKS);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.sai]);
  });

  it('"up to 1": may rest nothing', () => {
    const g = attacking([S14.kingdew]);
    swing(g, SHANKS);
    none(g);
    expect(g.card(chr(g, 'p2', S14.kingdew)).rested).toBe(false);
  });

  it('rests only one even when several qualify', () => {
    const g = attacking([S14.kingdew, S14.sai, S14.marco]);
    swing(g, SHANKS);
    pickInst(g, [chr(g, 'p2', S14.sai)]);
    expect(g.card(chr(g, 'p2', S14.kingdew)).rested).toBe(false);
    expect(g.card(chr(g, 'p2', S14.marco)).rested).toBe(false);
  });

  it('only Characters are offered: never the opposing Leader', () => {
    const g = attacking([S14.sai]);
    swing(g, SHANKS);
    expect(offeredIds(g)).not.toContain(LD14.luffy);
    none(g);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });

  it('the [Your Turn] effect does not fire when the opponent rests Shanks on their turn', () => {
    const g = theirs(
      LD14.luffy,
      { characters: [SHANKS, S14.marco] },
      { hand: [REST_EVENT], characters: [S14.sai, S14.kingdew] },
    );
    playRaw(g, REST_EVENT);
    yes(g, 'p2');
    payDonStrict(g, 4);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', SHANKS)]);
    expect(g.card(at(g, 'p1', 'characters', SHANKS)).rested).toBe(true);
    // Nothing of mine was asked and no opposing Character was rested by Shanks.
    expect(kind(g)).toBe('main');
    expect(g.card(chr(g, 'p2', S14.kingdew)).rested).toBe(false);
    expect(g.card(chr(g, 'p2', S14.sai)).rested).toBe(false);
  });
});

describe("OP14-027 Shanks: [Opponent's Turn] rested, all opposing Characters get -1000 power", () => {
  function defend(shanksRested: boolean) {
    return theirs(
      LD14.luffy,
      { characters: [{ card: SHANKS, rested: shanksRested }, S14.marco] },
      { characters: [S14.sai, S14.thatch] },
    );
  }

  it('with Shanks rested every opposing Character has -1000 power', () => {
    const g = defend(true);
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(3000);
    expect(g.power(chr(g, 'p2', S14.thatch))).toBe(7000);
  });

  it('with Shanks active there is no change', () => {
    const g = defend(false);
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(4000);
    expect(g.power(chr(g, 'p2', S14.thatch))).toBe(8000);
  });

  it('only Characters of the opponent: the opposing Leader and my own Characters are unchanged', () => {
    const g = defend(true);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(chr(g, 'p1', S14.marco))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', SHANKS))).toBe(9000);
  });

  it('on my own turn a rested Shanks gives no -1000 to the opponent Characters', () => {
    const g = mine(
      LD14.luffy,
      { characters: [{ card: SHANKS, rested: true }] },
      { characters: [S14.sai] },
    );
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(4000);
  });
});
