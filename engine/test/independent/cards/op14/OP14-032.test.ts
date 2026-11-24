/**
 * OP14-032 Humandrill (Character, cost 3, 4000, Counter +2000, {Animal}/{Muggy Kingdom}).
 *
 * Card text: "[Your Turn] When this Character becomes rested, rest up to 1 of your opponent's
 * Characters with a cost of 4 or less."
 *
 * Rules: a Character rests when it attacks (open question M6b-Q30: the tests use attacking, and an
 * opposing effect for the [Your Turn] gate). The cost filter reads the current cost. "Up to 1" may
 * be none. Already-rested Characters are not asserted either way (resting one changes nothing).
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
  swing,
  theirs,
  yes,
} from './kit-op14a.ts';

const HUMAN = 'OP14-032';
const REST_EVENT = 'OP17-038';

function board(p2chars: string[]) {
  return mine(LD14.luffy, { characters: [HUMAN] }, { characters: p2chars });
}

describe('OP14-032 Humandrill: [Your Turn] when rested, rest an opposing Character with cost 4 or less', () => {
  it('printed values: cost 3, 4000, Counter +2000', () => {
    const g = board([]);
    const h = at(g, 'p1', 'characters', HUMAN);
    expect(g.card(h).cost).toBe(3);
    expect(g.power(h)).toBe(4000);
    expect(g.card(h).counter).toBe(2000);
  });

  it('offers exactly the opposing Characters with cost 4 or less (not cost 5 or more), and rests the chosen one', () => {
    const g = board([S14.marco, S14.hajrudin, S14.kingdew, S14.thatch]);
    swing(g, HUMAN);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.hajrudin, S14.marco].sort());
    pickInst(g, [chr(g, 'p2', S14.hajrudin)]);
    expect(g.card(chr(g, 'p2', S14.hajrudin)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', S14.marco)).rested).toBe(false);
    expect(kind(g)).toBe('block');
  });

  it('boundary: cost 4 qualifies, cost 5 does not', () => {
    const g = board([S14.hajrudin, S14.kingdew]);
    swing(g, HUMAN);
    expect(offeredIds(g)).toEqual([S14.hajrudin]);
  });

  it('"up to 1": may rest nothing', () => {
    const g = board([S14.marco]);
    swing(g, HUMAN);
    none(g);
    expect(g.card(chr(g, 'p2', S14.marco)).rested).toBe(false);
  });

  it('rests only one Character even when several qualify', () => {
    const g = board([S14.marco, S14.sai, S14.komachiyo]);
    swing(g, HUMAN);
    pickInst(g, [chr(g, 'p2', S14.sai)]);
    expect(g.card(chr(g, 'p2', S14.marco)).rested).toBe(false);
    expect(g.card(chr(g, 'p2', S14.komachiyo)).rested).toBe(false);
  });

  it('never offers the opposing Leader (a Leader has no cost) or my own Characters', () => {
    const g = mine(LD14.luffy, { characters: [HUMAN, S14.sai] }, { characters: [S14.marco] });
    swing(g, HUMAN);
    expect(offeredIds(g)).toEqual([S14.marco]);
    none(g);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });

  it('with no opposing Character with cost 4 or less nothing can be rested and the attack goes on', () => {
    const g = board([S14.kingdew, S14.thatch]);
    swing(g, HUMAN);
    settleEmpty(g);
    expect(g.card(chr(g, 'p2', S14.kingdew)).rested).toBe(false);
    expect(kind(g)).toBe('block');
  });

  it('a [Blocker] rested by it can no longer block', () => {
    // OP01-039 Killer has [Blocker]: a rested Character cannot activate it.
    const g = board([S14.killer2]);
    swing(g, HUMAN);
    pickInst(g, [chr(g, 'p2', S14.killer2)]);
    need(g, 'block', 'p2');
    const blockers = g.legal().filter((a) => a.type === 'block' && a.blocker !== null);
    expect(blockers).toEqual([]);
  });

  it('it does not fire when the opponent rests Humandrill on their turn ([Your Turn])', () => {
    const g = theirs(
      LD14.luffy,
      { characters: [HUMAN] },
      { hand: [REST_EVENT], characters: [S14.sai] },
    );
    playRaw(g, REST_EVENT);
    yes(g, 'p2');
    payDonStrict(g, 4);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', HUMAN)]);
    expect(kind(g)).toBe('main');
    expect(g.card(chr(g, 'p2', S14.sai)).rested).toBe(false);
  });
});
