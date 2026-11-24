/**
 * OP14-002 Urouge (Character, cost 3, 2000, Counter +1000, {Fallen Monk Pirates}/{Supernovas}).
 *
 * Card text: "[When Attacking] If this Character has 5000 power or more, draw 1 card and K.O. up to 1
 * of your opponent's Characters with 3000 base power or less."
 *
 * Rules: [When Attacking] (CR 10-2); each DON!! given to a Character gives it +1000 power during
 * its controller's turn, so 3 DON!! make 5000. "Base power" ignores modifiers (rules-digest, base
 * power). "Up to" lets the player choose nothing (CR 8-4-4-1). The condition gates both halves.
 */
import { describe, expect, it } from 'vitest';
import { attack, gammaKnife, noDefence, passBlock } from './kit-op14a.ts';
import {
  at,
  chr,
  kind,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  S14,
  settleEmpty,
  sorted,
  swing,
} from './kit-op14a.ts';

const URO = 'OP14-002';

function board(
  don: number,
  p2chars: (string | { card: string; rested?: boolean })[],
  hand: string[] = [],
  extra: string[] = [],
) {
  return mine(
    LD14.luffy,
    {
      hand,
      costArea: { active: 10 - don, rested: 0 },
      characters: [{ card: URO, don }, ...extra],
    },
    { characters: p2chars },
  );
}

describe('OP14-002 Urouge: [When Attacking] with 5000 power, draw 1 and K.O. base power 3000 or less', () => {
  it('printed values: 2000 base, 5000 with 3 DON!! given', () => {
    const g = board(3, []);
    expect(g.card(at(g, 'p1', 'characters', URO)).cost).toBe(3);
    expect(g.power(at(g, 'p1', 'characters', URO))).toBe(5000);
    expect(g.card(at(g, 'p1', 'characters', URO)).counter).toBe(1000);
  });

  it('at exactly 5000: draws 1 and offers exactly the Characters with base power 3000 or less', () => {
    const g = board(3, [S14.komachiyo, S14.dadan, S14.sai, S14.marco]);
    swing(g, URO);
    need(g, 'choose', 'p1');
    expect(sorted(g, 'p1', 'hand')).toHaveLength(1);
    expect(offeredIds(g)).toEqual([S14.dadan, S14.komachiyo].sort());
  });

  it('K.O.s the chosen Character (to the trash) and the battle then goes on', () => {
    const g = board(3, [S14.komachiyo, S14.sai]);
    swing(g, URO);
    pickInst(g, [chr(g, 'p2', S14.komachiyo)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([S14.sai]);
    expect(sorted(g, 'p2', 'trash')).toEqual([S14.komachiyo]);
    expect(kind(g)).toBe('block');
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('below 5000 (2 DON!! = 4000): nothing is drawn, nothing is asked, nothing is K.O.d', () => {
    const g = board(2, [S14.komachiyo]);
    expect(g.power(at(g, 'p1', 'characters', URO))).toBe(4000);
    swing(g, URO);
    expect(kind(g)).toBe('block');
    expect(sorted(g, 'p1', 'hand')).toEqual([]);
    passBlock(g);
    expect(sorted(g, 'p2', 'characters')).toEqual([S14.komachiyo]);
  });

  it('with no DON!! at all (2000): the effect does nothing', () => {
    const g = board(0, [S14.dadan]);
    swing(g, URO);
    expect(kind(g)).toBe('block');
    expect(sorted(g, 'p1', 'hand')).toEqual([]);
    expect(sorted(g, 'p2', 'characters')).toEqual([S14.dadan]);
  });

  it('above 5000 (4 DON!! = 6000) the effect still works', () => {
    const g = board(4, [S14.dadan]);
    swing(g, URO);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', S14.dadan)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([]);
    expect(sorted(g, 'p1', 'hand')).toHaveLength(1);
  });

  it('"up to 1": choosing nothing still draws 1 card and K.O.s nothing', () => {
    const g = board(3, [S14.komachiyo]);
    swing(g, URO);
    need(g, 'choose', 'p1');
    none(g);
    expect(sorted(g, 'p1', 'hand')).toHaveLength(1);
    expect(sorted(g, 'p2', 'characters')).toEqual([S14.komachiyo]);
  });

  it('K.O.s only one Character even when two qualify', () => {
    const g = board(3, [S14.komachiyo, S14.dadan]);
    swing(g, URO);
    pickInst(g, [chr(g, 'p2', S14.komachiyo)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([S14.dadan]);
  });

  it('with no qualifying Character the card is still drawn', () => {
    const g = board(3, [S14.sai, S14.marco]);
    swing(g, URO);
    settleEmpty(g);
    expect(sorted(g, 'p1', 'hand')).toHaveLength(1);
    expect(sorted(g, 'p2', 'characters')).toEqual([S14.marco, S14.sai].sort());
  });

  it('base power, not current power: a 5000-base Character at 0 power this turn is not offered', () => {
    // OP05-077 Gamma Knife (-5000) on Marco; Marco's base power stays 5000.
    const g = board(3, [S14.marco, S14.dadan], [S14.gammaKnife]);
    gammaKnife(g, chr(g, 'p2', S14.marco));
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(0);
    swing(g, URO);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.dadan]);
  });

  it('attacking a rested Character instead of the Leader triggers it just the same', () => {
    const g = board(3, [{ card: S14.komachiyo, rested: true }, S14.dadan]);
    attack(g, at(g, 'p1', 'characters', URO), chr(g, 'p2', S14.komachiyo));
    need(g, 'choose', 'p1');
    expect(sorted(g, 'p1', 'hand')).toHaveLength(1);
    expect(offeredIds(g)).toEqual([S14.dadan, S14.komachiyo].sort());
  });
});
