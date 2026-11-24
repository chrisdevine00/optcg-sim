/** EB05-017 Mermaid Cafe Dancers. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  accept,
  decline,
  dec,
  don,
  endCounter,
  expectDecision,
  game,
  passBlock,
  payDon,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  takeDamage,
  trash,
  V,
} from './helpers.ts';

const ID = 'EB05-017';
/** OP11-022 Shirahoshi Leader ({Merfolk}, 5000) and OP03-022 Arlong Leader ({Fish-Man}, 5000). */
const MERFOLK = 'OP11-022';
const FISHMAN = 'OP03-022';

/** p2 attacks p1's Leader with an 8000 Character (V.c6). */
const attack = (p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] }, active = 1) => {
  const g = game(
    { characters: [ID], costArea: { active, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c6] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
  return g;
};

describe('EB05-017 Mermaid Cafe Dancers', () => {
  it("[On Your Opponent's Attack]: rest 1 DON!! and trash this Character: your {Merfolk} Leader gains +4000 power during this battle", () => {
    const g = attack({ leader: MERFOLK });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    payDon(g);
    pick(g, [g.leader('p1')]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(don(g, 'p1').rested).toBe(1);
    passBlock(g);
    expect(g.power(g.leader('p1'))).toBe(9000);
    endCounter(g);
    expect(g.life('p1')).toBe(3); // 9000 stops the 8000 attacker
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('works for a {Fish-Man} type Leader as well', () => {
    const g = attack({ leader: FISHMAN });
    accept(g);
    payDon(g);
    pick(g, [g.leader('p1')]);
    passBlock(g);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('declining keeps the Character on the field, DON!! active and gives no power', () => {
    const g = attack({ leader: MERFOLK });
    decline(g);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(don(g, 'p1').rested).toBe(0);
    passBlock(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    endCounter(g);
    takeDamage(g);
    expect(g.life('p1')).toBe(2);
  });

  it('cannot be paid with no active DON!!: it is not offered and the Character stays', () => {
    const g = attack({ leader: MERFOLK }, 0);
    expect(dec(g)?.kind).toBe('block');
    passBlock(g);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Leader of neither type: the cost is paid (Character trashed) but nothing gains power', () => {
    const g = attack({ leader: PLAIN_PURPLE });
    accept(g);
    payDon(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    passBlock(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
