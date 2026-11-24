/**
 * OP15-034 Yorki (Character, Green, cost 1, 0 power, Counter +2000, {Rumbar Pirates}).
 *
 * Card text: "[Your Turn] [On Play] Up to 1 of your [Brook] cards gains +2000 power during this
 * turn."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 8-4-2 (this turn), the name filter is exact: [Brook] cards are
 * cards named Brook (Characters and a Leader on the field). API gap (API-GAPS-a.md, G2): no
 * scripted card plays a Character from hand during the opponent's turn, so the "[Your Turn]" gate
 * cannot be probed.
 */
import { describe, expect, it } from 'vitest';
import { endTurn } from './kit-op15a.ts';
import {
  at,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S15,
  SCN,
} from './kit-op15a.ts';

const YORKI = 'OP15-034';

function board(chars: string[], p2chars: string[] = [], leader: string = LD15.luffy) {
  return mine(leader, { hand: [YORKI], characters: chars }, { characters: p2chars });
}

describe('OP15-034 Yorki: [Your Turn] [On Play] up to 1 [Brook] gains +2000 this turn', () => {
  it('offers only my cards named [Brook]; the chosen one gains +2000', () => {
    const g = board([S15.brook, SCN.c5]);
    playRaw(g, YORKI);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S15.brook]);
    pickInst(g, [at(g, 'p1', 'characters', S15.brook)]);
    expect(g.power(at(g, 'p1', 'characters', S15.brook))).toBe(9000);
    expect(g.power(at(g, 'p1', 'characters', SCN.c5))).toBe(7000);
  });

  it('a [Brook] Leader is one of my [Brook] cards and may gain the +2000', () => {
    const g = board([SCN.c5], [], LD15.brook);
    playRaw(g, YORKI);
    need(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'pick' && a.choice === g.leader('p1'))).toBe(true);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it("an opponent's [Brook] is not offered", () => {
    const g = board([S15.brook], [S15.brook]);
    playRaw(g, YORKI);
    expect(offeredIds(g)).toEqual([S15.brook]);
    const mineBrook = at(g, 'p1', 'characters', S15.brook);
    expect(g.legal().some((a) => a.type === 'pick' && a.choice === mineBrook)).toBe(true);
    expect(
      g
        .legal()
        .some((a) => a.type === 'pick' && a.choice === g.find('p2', 'characters', S15.brook)),
    ).toBe(false);
  });

  it('"up to 1": with two [Brook] cards only the chosen one gains power', () => {
    const g = board([S15.brook, S15.brook]);
    playRaw(g, YORKI);
    pickInst(g, [at(g, 'p1', 'characters', S15.brook, 0)]);
    need(g, 'main', 'p1');
    const powers = g
      .zone('p1', 'characters')
      .filter((c) => c.card === S15.brook)
      .map((c) => g.power(c.instance));
    expect(powers.sort()).toEqual([7000, 9000]);
  });

  it('"up to": choosing nothing changes nothing', () => {
    const g = board([S15.brook]);
    playRaw(g, YORKI);
    none(g);
    expect(g.power(at(g, 'p1', 'characters', S15.brook))).toBe(7000);
  });

  it('with no [Brook] card Yorki is just played (0 power, still on the field)', () => {
    const g = board([SCN.c5]);
    playRaw(g, YORKI);
    if (g.legal().some((a) => a.type === 'done')) {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    need(g, 'main', 'p1');
    expect(g.power(at(g, 'p1', 'characters', YORKI))).toBe(0);
  });

  it('Yorki is not a [Brook] itself', () => {
    const g = board([S15.brook]);
    playRaw(g, YORKI);
    expect(offeredIds(g)).not.toContain(YORKI);
  });

  it('the bonus ends at the end of the turn', () => {
    const g = board([S15.brook]);
    playRaw(g, YORKI);
    pickInst(g, [at(g, 'p1', 'characters', S15.brook)]);
    expect(g.power(at(g, 'p1', 'characters', S15.brook))).toBe(9000);
    endTurn(g);
    expect(g.power(at(g, 'p1', 'characters', S15.brook))).toBe(7000);
  });
});
