/**
 * OP10-012 Dragon Number Thirteen (Character, Red, cost 2, 2000, Counter +1000, {Biological
 * Weapon}/{Punk Hazard}, [Blocker]).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)" and nothing else. The keyword comes from a verified override.
 *
 * Rules: CR 10-1-1: after an attack is declared the defender may rest an active [Blocker] Character
 * to make it the new target; a rested Character cannot block; the battle is then Character against
 * Character (the attacker K.O.s it with equal or greater power); blocking stops the Leader being hit.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  cardIds,
  kind,
  mine,
  need,
  noDefence,
  passBlock,
  passCounter,
  theirs,
  VAN,
} from './kit-op10a.ts';

const DRAGON = 'OP10-012';

/** p2's turn: p2's `attackerCard` attacks my Leader; I own Dragon (active) and `extra`. */
function attacked(attackerCard: string, mineSpec: Parameters<typeof theirs>[1] = {}) {
  const g = theirs(
    'ST01-001',
    { characters: [DRAGON], life: [VAN.sai, VAN.sai, VAN.sai, VAN.sai], ...mineSpec },
    { characters: [attackerCard] },
  );
  attack(g, at(g, 'p2', 'characters', attackerCard), g.leader('p1'));
  need(g, 'block', 'p1');
  return g;
}

describe('OP10-012 Dragon Number Thirteen: [Blocker]', () => {
  it('printed values: cost 2, 2000, Counter +1000, [Blocker]', () => {
    const g = mine('ST01-001', { hand: [DRAGON] });
    const c = g.find('p1', 'hand', DRAGON);
    expect(g.card(c).cost).toBe(2);
    expect(g.card(c).counter).toBe(1000);
    expect(g.power(c)).toBe(2000);
    expect(g.card(c).keywords).toContain('Blocker');
  });

  it('it is offered as the blocker when an attack is declared on my Leader', () => {
    const g = attacked(VAN.marco);
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', DRAGON)]);
  });

  it('blocking makes it the new target: my Leader takes no damage and keeps its Life', () => {
    const g = attacked(VAN.marco);
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', DRAGON) });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('a 5000 attacker K.O.s the blocking Dragon (2000)', () => {
    const g = attacked(VAN.marco);
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', DRAGON) });
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([DRAGON]);
  });

  it('boundary: an equal-power attacker (2000) also K.O.s it', () => {
    const g = attacked('OP02-014');
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', DRAGON) });
    noDefence(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('blocking rests it; a Counter that lifts it above the attacker keeps it on the field, rested', () => {
    const g = attacked('OP02-014', { hand: [VAN.hajrudin] });
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', DRAGON) });
    need(g, 'counter', 'p1');
    g.act({
      type: 'counter',
      card: at(g, 'p1', 'hand', VAN.hajrudin),
      target: at(g, 'p1', 'characters', DRAGON),
    });
    passCounter(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([DRAGON]);
    expect(g.card(at(g, 'p1', 'characters', DRAGON)).rested).toBe(true);
  });

  it('declining to block: the Leader takes the hit and Dragon stays active', () => {
    const g = attacked(VAN.marco);
    passBlock(g);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(g.card(at(g, 'p1', 'characters', DRAGON)).rested).toBe(false);
  });

  it('boundary: a rested Dragon cannot block', () => {
    const g = theirs(
      'ST01-001',
      { characters: [{ card: DRAGON, rested: true }] },
      { characters: [VAN.marco] },
    );
    attack(g, at(g, 'p2', 'characters', VAN.marco), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
  });

  it('it can also block an attack on one of my other Characters', () => {
    const g = theirs(
      'ST01-001',
      { characters: [DRAGON, { card: VAN.sai, rested: true }] },
      { characters: [VAN.marco] },
    );
    attack(g, at(g, 'p2', 'characters', VAN.marco), at(g, 'p1', 'characters', VAN.sai));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', DRAGON)]);
  });

  it('must not happen: on my own turn I am not asked to block my own attack', () => {
    const g = mine('ST01-001', { characters: [DRAGON, VAN.marco] });
    attack(g, at(g, 'p1', 'characters', VAN.marco), g.leader('p2'));
    need(g, 'block', 'p2');
    expect(blockers(g)).toEqual([]);
  });
});
