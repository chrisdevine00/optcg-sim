/**
 * OP12-007 Shanks (Character, Red, cost 2, 2000, Counter +1000, {Roger Pirates}).
 *
 * Card text: "[On Play] Up to 1 of your Characters with a type including "Roger Pirates" other than
 * [Shanks] gains [Rush] during this turn."
 *
 * Rules: "type including X" is a substring match on any type ({Former Roger Pirates} qualifies:
 * CR 2-4-3-1, QA-GR); "other than [Shanks]" excludes every card named Shanks, this one included;
 * "your Characters" excludes the Leader; "up to 1" may be 0; [Rush] lets a Character attack the
 * turn it is played (CR 10-1-?) and "during this turn" ends at the end of the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  canAttackAnything,
  chr,
  kind,
  kw,
  LD12,
  mine,
  need,
  none,
  offeredCardIds,
  pickInst,
  playRaw,
  S12,
  toMyNextMain,
} from './kit-op12a.ts';

const SHX = 'OP12-007';

function board(
  chars: (string | { card: string; playedThisTurn?: boolean })[],
  extraHand: string[] = [],
) {
  return mine(LD12.luffy, { hand: [SHX, ...extraHand], characters: chars });
}

describe('OP12-007 Shanks: [On Play] a {Roger Pirates} Character other than [Shanks] gains [Rush]', () => {
  it('printed values: cost 2, 2000, Counter +1000', () => {
    const g = board([]);
    const c = g.card(g.find('p1', 'hand', SHX));
    expect([c.cost, c.power, c.counter]).toEqual([2, 2000, 1000]);
  });

  it('offers exactly the Characters whose type includes "Roger Pirates" other than [Shanks]', () => {
    const g = board([
      S12.bullet, // {Former Roger Pirates}: includes the text
      S12.crocusBlack, // {Former Roger Pirates}
      S12.buggyPurple, // {Roger Pirates}
      S12.shanksPurple, // [Shanks]: excluded by name
    ]);
    playRaw(g, SHX);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.buggyPurple, S12.bullet, S12.crocusBlack].sort());
  });

  it('a Character with no matching type (Sai) is not offered', () => {
    const g = board([S12.sai, S12.bullet]);
    playRaw(g, SHX);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.bullet]);
  });

  it('a second copy of [Shanks] already on the field is not offered, and neither is the card just played', () => {
    const g = board([SHX, S12.bullet]);
    playRaw(g, SHX);
    expect(offeredCardIds(g)).toEqual([S12.bullet]);
  });

  it('gives [Rush]: a Character played this turn can then attack', () => {
    const g = board([{ card: S12.bullet, playedThisTurn: true }]);
    expect(canAttackAnything(g, chr(g, 'p1', S12.bullet))).toBe(false);
    playRaw(g, SHX);
    pickInst(g, [chr(g, 'p1', S12.bullet)]);
    expect(kw(g, chr(g, 'p1', S12.bullet))).toContain('Rush');
    expect(canAttackAnything(g, chr(g, 'p1', S12.bullet))).toBe(true);
  });

  it('the Rush ends with the turn', () => {
    const g = board([S12.bullet]);
    playRaw(g, SHX);
    pickInst(g, [chr(g, 'p1', S12.bullet)]);
    expect(kw(g, chr(g, 'p1', S12.bullet))).toContain('Rush');
    toMyNextMain(g);
    expect(kw(g, chr(g, 'p1', S12.bullet))).not.toContain('Rush');
  });

  it('"up to 1": choosing nothing gives Rush to nobody', () => {
    const g = board([{ card: S12.bullet, playedThisTurn: true }]);
    playRaw(g, SHX);
    none(g);
    expect(kw(g, chr(g, 'p1', S12.bullet))).not.toContain('Rush');
    expect(canAttackAnything(g, chr(g, 'p1', S12.bullet))).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('only one of two candidates gets [Rush]', () => {
    const g = board([
      { card: S12.bullet, playedThisTurn: true },
      { card: S12.buggyPurple, playedThisTurn: true },
    ]);
    playRaw(g, SHX);
    pickInst(g, [chr(g, 'p1', S12.bullet)]);
    expect(kw(g, chr(g, 'p1', S12.bullet))).toContain('Rush');
    expect(kw(g, chr(g, 'p1', S12.buggyPurple))).not.toContain('Rush');
  });

  it('with no qualifying Character, the effect finds nothing and the play completes', () => {
    const g = board([S12.sai, S12.shanksPurple]);
    playRaw(g, SHX);
    if (kind(g) === 'choose') {
      expect(offeredCardIds(g)).toEqual([]);
      none(g);
    }
    expect(kind(g)).toBe('main');
    expect(kw(g, chr(g, 'p1', SHX))).not.toContain('Rush');
  });

  it('must not: Shanks himself gets no [Rush], and cannot attack the turn it is played', () => {
    const g = board([S12.bullet]);
    playRaw(g, SHX);
    pickInst(g, [chr(g, 'p1', S12.bullet)]);
    expect(kw(g, chr(g, 'p1', SHX))).not.toContain('Rush');
    expect(canAttackAnything(g, chr(g, 'p1', SHX))).toBe(false);
  });

  it('must not: the Leader is not a Character, even with a matching type', () => {
    const g = mine(LD12.rayleigh, { hand: [SHX], characters: [S12.sai] });
    playRaw(g, SHX);
    if (kind(g) === 'choose') {
      expect(offeredCardIds(g)).toEqual([]);
      none(g);
    }
    expect(kw(g, g.leader('p1'))).not.toContain('Rush');
  });
});
