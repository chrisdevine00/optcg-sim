/**
 * ST25-002 Cabaji (Character, Blue, cost 4, 1000, Counter +2000, {Cross Guild}).
 *
 * Card text:
 *   If you have 2 or more Characters with a base cost of 5 or more, this Character gains [Blocker] and +1 cost.
 *   [Opponent's Turn] This Character gains +5000 power.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import { blockers, kw, mine, need, theirs } from '../op17/kit-op17b.ts';
import { block, inst, kind, LC, SCL } from './kit-lfc.ts';

const CABAJI = 'ST25-002';

function myField(chars: (string | { card: string; rested?: boolean })[], p2chars: string[] = []) {
  return mine(LC.plain, { characters: chars }, { characters: p2chars });
}

describe('ST25-002 Cabaji: with 2+ Characters of base cost 5+ it gains [Blocker] and +1 cost; +5000 power on the opponent turn', () => {
  it('with two Characters of base cost 5 or more it has [Blocker] and costs 5', () => {
    const g = myField([CABAJI, SCL.c5, SCL.c6]);
    const c = inst(g, 'p1', 'characters', CABAJI);
    expect(kw(g, c)).toContain('Blocker');
    expect(g.card(c).cost).toBe(5);
  });

  it('with only one such Character it has neither [Blocker] nor the extra cost', () => {
    const g = myField([CABAJI, SCL.c5, SCL.c4]);
    const c = inst(g, 'p1', 'characters', CABAJI);
    expect(kw(g, c)).not.toContain('Blocker');
    expect(g.card(c).cost).toBe(4);
  });

  it('boundary: base cost 4 Characters do not count toward the 2', () => {
    const g = myField([CABAJI, SCL.c4, SCL.c4, SCL.c5]);
    const c = inst(g, 'p1', 'characters', CABAJI);
    expect(kw(g, c)).not.toContain('Blocker');
    expect(g.card(c).cost).toBe(4);
  });

  it('another Cabaji, which has base cost 4, does not help: two Cabajis and one cost 5 Character give nothing', () => {
    const g = myField([CABAJI, CABAJI, SCL.c5]);
    for (const n of [0, 1]) {
      const c = inst(g, 'p1', 'characters', CABAJI, n);
      expect(kw(g, c)).not.toContain('Blocker');
      expect(g.card(c).cost).toBe(4);
    }
  });

  it('only my Characters count: two cost 5+ Characters of the opponent give nothing', () => {
    const g = myField([CABAJI], [SCL.c5, SCL.c6]);
    const c = inst(g, 'p1', 'characters', CABAJI);
    expect(kw(g, c)).not.toContain('Blocker');
    expect(g.card(c).cost).toBe(4);
  });

  it('on my own turn it has its printed 1000 power', () => {
    const g = myField([CABAJI, SCL.c5]);
    expect(g.power(inst(g, 'p1', 'characters', CABAJI))).toBe(1000);
  });

  it('on the opponent turn it has +5000 power (6000), with or without the 2 Characters', () => {
    const bare = theirs(LC.plain, { characters: [CABAJI] }, {});
    expect(bare.power(inst(bare, 'p1', 'characters', CABAJI))).toBe(6000);
    const full = theirs(LC.plain, { characters: [CABAJI, SCL.c5, SCL.c6] }, {});
    expect(full.power(inst(full, 'p1', 'characters', CABAJI))).toBe(6000);
  });

  it('with the condition met it can block an attack on my Leader and survives a 5000 attacker', () => {
    const g = theirs(LC.plain, { characters: [CABAJI, SCL.c5, SCL.c6] }, { characters: [SCL.c3] });
    const c = inst(g, 'p1', 'characters', CABAJI);
    attack(g, inst(g, 'p2', 'characters', SCL.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toContain(c);
    block(g, c);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    // The 5000 attacker (Marco) does not beat Cabaji's 6000 on the opponent's turn.
    expect(g.zone('p1', 'characters').map((x) => x.card)).toContain(CABAJI);
    expect(g.life('p1')).toBe(4);
  });

  it('with the condition not met it cannot block', () => {
    const g = theirs(LC.plain, { characters: [CABAJI, SCL.c5] }, { characters: [SCL.c3] });
    attack(g, inst(g, 'p2', 'characters', SCL.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
    passBlock(g);
  });
});
