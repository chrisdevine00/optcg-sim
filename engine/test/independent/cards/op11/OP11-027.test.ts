/**
 * OP11-027 Bulge-Eyed Neptunian (Character, Green, cost 4, 6000, no Counter, {Neptunian}).
 *
 * Card text: "If your Leader is [Shirahoshi], this Character can attack Characters on the turn in which
 * it is played."
 *
 * Rules: a Character cannot attack on the turn it is played (CR 3-7-4) unless an effect says so;
 * "can attack Characters" lifts that for Character targets only, and only rested Characters are
 * attackable (CR 7-1-1-2, RL-17). The condition reads the Leader's NAME.
 */
import { describe, expect, it } from 'vitest';
import { at, canHit, chr, L11, mine, N11, playRaw, attackers } from './kit-op11a.ts';

const BULGE = 'OP11-027';
/** OP03-116 Shirahoshi: a Character named Shirahoshi (not a Leader). */
const SHIRA_CHAR = 'OP03-116';

function board(
  leader: string,
  bulge: object | string = { card: BULGE, playedThisTurn: true },
  extra: string[] = [],
) {
  return mine(
    leader,
    { characters: [bulge as string, ...extra] },
    { characters: [{ card: N11.marco, rested: true }, N11.sai] },
  );
}

describe('OP11-027 Bulge-Eyed Neptunian: with a [Shirahoshi] Leader it attacks Characters the turn it is played', () => {
  it('printed values: cost 4, 6000, no Counter', () => {
    const g = mine(L11.shirahoshi, { hand: [BULGE] });
    const b = at(g, 'p1', 'hand', BULGE);
    expect(g.card(b).cost).toBe(4);
    expect(g.power(b)).toBe(6000);
    expect(g.card(b).counter).toBeNull();
  });

  it('with a [Shirahoshi] Leader a Bulge-Eyed Neptunian played this turn can attack a rested Character', () => {
    const g = board(L11.shirahoshi);
    expect(canHit(g, chr(g, 'p1', BULGE), chr(g, 'p2', N11.marco))).toBe(true);
  });

  it('it still cannot attack the Leader that turn', () => {
    const g = board(L11.shirahoshi);
    expect(canHit(g, chr(g, 'p1', BULGE), g.leader('p2'))).toBe(false);
  });

  it('it cannot attack an active Character', () => {
    const g = board(L11.shirahoshi);
    expect(canHit(g, chr(g, 'p1', BULGE), chr(g, 'p2', N11.sai))).toBe(false);
  });

  it('works for a copy played from hand this turn', () => {
    const g = mine(
      L11.shirahoshi,
      { hand: [BULGE], costArea: { active: 10, rested: 0 } },
      { characters: [{ card: N11.marco, rested: true }] },
    );
    playRaw(g, BULGE);
    expect(canHit(g, chr(g, 'p1', BULGE), chr(g, 'p2', N11.marco))).toBe(true);
  });

  it('with any other Leader it cannot attack at all on the turn it is played', () => {
    const g = board(L11.jinbe);
    expect(attackers(g)).not.toContain(chr(g, 'p1', BULGE));
    expect(canHit(g, chr(g, 'p1', BULGE), chr(g, 'p2', N11.marco))).toBe(false);
  });

  it('a Character named Shirahoshi does not count: only the Leader’s name is read', () => {
    const g = board(L11.jinbe, { card: BULGE, playedThisTurn: true }, [SHIRA_CHAR]);
    expect(canHit(g, chr(g, 'p1', BULGE), chr(g, 'p2', N11.marco))).toBe(false);
  });

  it('other Neptunian Characters played this turn do not gain it', () => {
    const h = mine(
      L11.shirahoshi,
      { characters: [{ card: N11.nept6, playedThisTurn: true }] },
      { characters: [{ card: N11.marco, rested: true }] },
    );
    expect(canHit(h, chr(h, 'p1', N11.nept6), chr(h, 'p2', N11.marco))).toBe(false);
  });

  it('on later turns it attacks the Leader as any Character (the ability adds, it does not restrict)', () => {
    const g = board(L11.shirahoshi, BULGE);
    expect(canHit(g, chr(g, 'p1', BULGE), g.leader('p2'))).toBe(true);
    expect(canHit(g, chr(g, 'p1', BULGE), chr(g, 'p2', N11.marco))).toBe(true);
  });
});
