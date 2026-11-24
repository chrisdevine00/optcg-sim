/**
 * OP13-094 York (Character, Black, cost 1, 1000, Counter +1000, {Scientist}/{Egghead}).
 *
 * Card text: "[On Play] Up to 1 of your "Celestial Dragons" type Characters gains +2000 power during
 * this turn."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 8-1-4-2 (duration "during this turn"), CR 7-1-4-1 (power compare).
 * Scenery: OP13-085 Saint Jalmac (Black, cost 2, 4000, {Celestial Dragons}, vanilla).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  attack,
  chars,
  choices,
  doneRaw,
  endTurn,
  kind,
  LD13,
  mine,
  need,
  noDefence,
  offeredIds,
  pickRaw,
  playRaw,
  reachablePickSets,
  S13,
  SC15,
} from './kit-op13d.ts';

const ID = 'OP13-094';
const JAL = S13.jalmac;

function start(
  own: (string | { card: string; rested?: boolean })[] = [JAL, SC15.red3],
  p2: string[] = [],
): TestGame {
  const g = mine(LD13.black, { hand: [ID], characters: own }, { characters: p2 });
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

describe('OP13-094 York: [On Play] up to 1 of your {Celestial Dragons} Characters gains +2000 power this turn', () => {
  it('offers only {Celestial Dragons} Characters: not York himself, not a plain Character', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([JAL]);
  });

  it('the chosen Character goes from 4000 to 6000', () => {
    const g = start();
    pickRaw(g, at(g, 'p1', 'characters', JAL));
    expect(atMain(g)).toBe(true);
    expect(g.power(at(g, 'p1', 'characters', JAL))).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', SC15.red3))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(1000);
  });

  it('"up to 1": choosing nobody is legal and nothing changes', () => {
    const g = start();
    need(g, 'choose', 'p1');
    doneRaw(g);
    expect(g.power(at(g, 'p1', 'characters', JAL))).toBe(4000);
  });

  it('at most one of two {Celestial Dragons} Characters gets the boost', () => {
    const g = start([JAL, JAL]);
    need(g, 'choose', 'p1');
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    pickRaw(g, at(g, 'p1', 'characters', JAL, 0));
    const powers = [0, 1].map((n) => g.power(at(g, 'p1', 'characters', JAL, n)));
    expect(powers.sort()).toEqual([4000, 6000]);
  });

  it('another {Celestial Dragons} Character is a candidate too (OP13-087 Saint Charlos)', () => {
    const g = start([JAL, 'OP13-087']);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual(['OP13-087', JAL].sort());
  });

  it('the opponent’s {Celestial Dragons} Characters are not candidates', () => {
    const g = start([SC15.red3], [JAL]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      doneRaw(g);
    }
    expect(g.power(at(g, 'p2', 'characters', JAL))).toBe(4000);
  });

  it('with no {Celestial Dragons} Character of mine the effect does nothing', () => {
    const g = start([SC15.red3]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      doneRaw(g);
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ID, SC15.red3].sort());
    expect(g.power(at(g, 'p1', 'characters', SC15.red3))).toBe(5000);
  });

  it('the Leader is not a candidate', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(g.leader('p1'));
    pickRaw(g, at(g, 'p1', 'characters', JAL));
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost is real in battle: a 4000 Character attacking a 5000 Leader connects only with +2000', () => {
    const boosted = start([JAL]);
    pickRaw(boosted, at(boosted, 'p1', 'characters', JAL));
    // York was played this turn, but Jalmac was not: it can attack.
    attack(boosted, at(boosted, 'p1', 'characters', JAL), boosted.leader('p2'));
    noDefence(boosted);
    expect(boosted.life('p2')).toBe(3);

    const plain = start([JAL]);
    need(plain, 'choose', 'p1');
    doneRaw(plain);
    attack(plain, at(plain, 'p1', 'characters', JAL), plain.leader('p2'));
    noDefence(plain);
    expect(plain.life('p2')).toBe(4);
  });

  it('it lasts "during this turn" only: back to 4000 on the opponent’s turn', () => {
    const g = start();
    pickRaw(g, at(g, 'p1', 'characters', JAL));
    expect(g.power(at(g, 'p1', 'characters', JAL))).toBe(6000);
    endTurn(g);
    expect(g.power(at(g, 'p1', 'characters', JAL))).toBe(4000);
  });
});
