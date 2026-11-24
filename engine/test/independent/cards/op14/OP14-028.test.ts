/**
 * OP14-028 Johnny (Character, cost 2, 2000, Counter +1000, {East Blue}).
 *
 * Card text: "[Your Turn] When this Character becomes rested, K.O. up to 1 of your opponent's rested
 * Characters with a cost of 2 or less."
 *
 * Rules: a Character rests when it attacks (open question M6b-Q30: the tests use attacking, and an
 * opposing effect for the [Your Turn] gate). Only rested Characters qualify; the cost filter reads
 * the current cost. "Up to 1" may be none. K.O. sends the card to the trash.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chr,
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
  settleEmpty,
  sorted,
  swing,
  theirs,
  trash,
  yes,
} from './kit-op14a.ts';

const JOHNNY = 'OP14-028';
const REST_EVENT = 'OP17-038';

function board(p2chars: (string | { card: string; rested?: boolean })[]) {
  return mine(LD14.luffy, { characters: [JOHNNY] }, { characters: p2chars });
}

const MIXED = [
  { card: S14.cobra, rested: true }, // cost 2
  { card: S14.mohji, rested: true }, // cost 1
  { card: S14.marco, rested: true }, // cost 3
  S14.sai, // cost 2, active
];

describe('OP14-028 Johnny: [Your Turn] when rested, K.O. a rested opposing Character with cost 2 or less', () => {
  it('printed values: cost 2, 2000, Counter +1000', () => {
    const g = board([]);
    const j = at(g, 'p1', 'characters', JOHNNY);
    expect(g.card(j).cost).toBe(2);
    expect(g.power(j)).toBe(2000);
    expect(g.card(j).counter).toBe(1000);
  });

  it('offers exactly the RESTED opposing Characters with cost 2 or less', () => {
    const g = board(MIXED);
    swing(g, JOHNNY);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.cobra, S14.mohji].sort());
  });

  it('K.O.s the chosen Character (to the trash) and the attack goes on', () => {
    const g = board(MIXED);
    swing(g, JOHNNY);
    pickInst(g, [chr(g, 'p2', S14.cobra)]);
    expect(trash(g, 'p2')).toEqual([S14.cobra]);
    expect(sorted(g, 'p2', 'characters')).toEqual([S14.marco, S14.mohji, S14.sai].sort());
    expect(kind(g)).toBe('block');
  });

  it('boundary: cost 2 qualifies, cost 3 does not (a rested cost-3 Character is not offered)', () => {
    const g = board([
      { card: S14.marco, rested: true },
      { card: S14.cobra, rested: true },
    ]);
    swing(g, JOHNNY);
    expect(offeredIds(g)).toEqual([S14.cobra]);
  });

  it('an ACTIVE Character with cost 2 is not offered', () => {
    const g = board([S14.sai, { card: S14.marco, rested: true }]);
    swing(g, JOHNNY);
    settleEmpty(g);
    expect(sorted(g, 'p2', 'characters')).toEqual([S14.marco, S14.sai].sort());
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = board(MIXED);
    swing(g, JOHNNY);
    none(g);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('K.O.s only one even when two qualify', () => {
    const g = board(MIXED);
    swing(g, JOHNNY);
    pickInst(g, [chr(g, 'p2', S14.mohji)]);
    expect(sorted(g, 'p2', 'characters')).toContain(S14.cobra);
    expect(trash(g, 'p2')).toEqual([S14.mohji]);
  });

  it('with no rested opposing Character the effect finds nothing and the attack goes on', () => {
    const g = board([S14.sai]);
    swing(g, JOHNNY);
    settleEmpty(g);
    expect(kind(g)).toBe('block');
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('it does not fire when the opponent rests Johnny on their turn ([Your Turn])', () => {
    const g = theirs(
      LD14.luffy,
      { characters: [JOHNNY] },
      { hand: [REST_EVENT], characters: [{ card: S14.cobra, rested: true }] },
    );
    playRaw(g, REST_EVENT);
    yes(g, 'p2');
    payDonStrict(g, 4);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', JOHNNY)]);
    expect(g.card(at(g, 'p1', 'characters', JOHNNY)).rested).toBe(true);
    expect(kind(g)).toBe('main');
    expect(sorted(g, 'p2', 'characters')).toEqual([S14.cobra]);
  });
});
