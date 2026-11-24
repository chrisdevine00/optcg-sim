/**
 * OP14-015 Roronoa Zoro (Character, cost 7, 8000, no Counter, {Straw Hat Crew}/{Supernovas}).
 *
 * Card text: "[Rush] (This card can attack on the turn in which it is played.) [When Attacking] Give
 * up to 1 of your opponent's Characters -1000 power during this turn."
 *
 * Rules: [Rush] (CR 10-1-1): may attack on the turn it is played. "Up to 1" may be none. "During
 * this turn" ends in the End Phase. Power at or below 0 does not remove a Character.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  canAttackAny,
  chr,
  endTurn,
  kind,
  kw,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickInst,
  S14,
  settleEmpty,
  sorted,
  swing,
} from './kit-op14a.ts';

const ZORO = 'OP14-015';

function board(playedThisTurn: boolean, p2chars: string[] = [S14.marco, S14.sai]) {
  return mine(
    LD14.luffy,
    { characters: [{ card: ZORO, playedThisTurn }, S14.thatch] },
    { characters: p2chars },
  );
}

describe('OP14-015 Zoro: [Rush]; [When Attacking] -1000 power to up to 1 opposing Character', () => {
  it('printed values: cost 7, 8000, no Counter, [Rush]', () => {
    const g = board(false);
    const z = at(g, 'p1', 'characters', ZORO);
    expect(g.card(z).cost).toBe(7);
    expect(g.power(z)).toBe(8000);
    expect(g.card(z).counter).toBeNull();
    expect(kw(g, z)).toContain('Rush');
  });

  it('[Rush]: played this turn, it may attack the Leader; a Character played this turn without Rush may not', () => {
    const g = mine(LD14.luffy, {
      characters: [
        { card: ZORO, playedThisTurn: true },
        { card: S14.thatch, playedThisTurn: true },
      ],
    });
    expect(canAttackAny(g, at(g, 'p1', 'characters', ZORO))).toBe(true);
    expect(canAttackAny(g, chr(g, 'p1', S14.thatch))).toBe(false);
  });

  it('gives -1000 to the chosen opposing Character and the battle goes on', () => {
    const g = board(true);
    swing(g, ZORO);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.marco, S14.sai].sort());
    pickInst(g, [chr(g, 'p2', S14.sai)]);
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(3000);
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(5000);
    expect(kind(g)).toBe('block');
  });

  it('never targets the opposing Leader or my own Characters', () => {
    const g = board(false);
    swing(g, ZORO);
    expect(offeredIds(g)).not.toContain(S14.thatch);
    expect(offeredIds(g)).not.toContain(LD14.luffy);
    none(g);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(chr(g, 'p1', S14.thatch))).toBe(8000);
  });

  it('"up to 1": choosing nothing changes no power', () => {
    const g = board(false);
    swing(g, ZORO);
    none(g);
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(5000);
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(4000);
  });

  it('affects only one Character', () => {
    const g = board(false, [S14.marco, S14.sai, S14.komachiyo]);
    swing(g, ZORO);
    pickInst(g, [chr(g, 'p2', S14.marco)]);
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(4000);
    expect(g.power(chr(g, 'p2', S14.komachiyo))).toBe(3000);
  });

  it('also fires when Zoro attacks a rested Character', () => {
    const g = mine(
      LD14.luffy,
      { characters: [ZORO] },
      { characters: [{ card: S14.sai, rested: true }, S14.marco] },
    );
    attack(g, at(g, 'p1', 'characters', ZORO), chr(g, 'p2', S14.sai));
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', S14.marco)]);
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(4000);
  });

  it('with no opposing Character the effect finds nothing and the attack goes on', () => {
    const g = board(false, []);
    swing(g, ZORO);
    settleEmpty(g);
    expect(kind(g)).toBe('block');
  });

  it('power may drop to 0 without removing the Character, and the -1000 ends with the turn', () => {
    const g = board(false, [S14.cobra]);
    swing(g, ZORO);
    pickInst(g, [chr(g, 'p2', S14.cobra)]);
    expect(g.power(chr(g, 'p2', S14.cobra))).toBe(-1000);
    expect(sorted(g, 'p2', 'characters')).toEqual([S14.cobra]);
    passBlock(g);
    passCounter(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p2', S14.cobra))).toBe(0);
  });
});
