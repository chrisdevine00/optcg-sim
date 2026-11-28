/**
 * OP18-104 Strawberry (Yellow Character, cost 7, 7000, Counter +2000, {Vice Admiral}/{Navy}, [Banish]).
 *
 * Card text: "[Banish] (When this card deals damage, the target card is trashed without activating
 *             its Trigger.)"
 *
 * Rules: CR 10-1-3 (Banish). The damaged Life card goes to the trash, not to the hand, and its
 * [Trigger] cannot be activated.
 * Scenery: OP18-094 ("[Trigger] Draw 1 card.") as the Life card; OP02-006 Kingdew (no
 * keyword) as the control attacker; OP02-060 Mohji.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  cardIds,
  kind,
  kw,
  need,
  passBlock,
  passCounter,
  LDR,
  CH,
  takeDamage,
} from './kit-e.ts';
import { mineE } from './kit-e.ts';

const S = 'OP18-104';
/** OP18-094 Hee Hee Hee!!: Event with "[Trigger] Draw 1 card." (an easy-to-observe Trigger). */
const SPEED = 'OP18-094';
const MISS = 'OP02-060';

describe('OP18-104 Strawberry: [Banish]', () => {
  it('printed: cost 7, 7000, keyword Banish', () => {
    const g = mineE(LDR.luffy, { characters: [S] });
    expect(kw(g, at(g, 'p1', 'characters', S))).toContain('Banish');
    expect(g.card(at(g, 'p1', 'characters', S)).power).toBe(7000);
  });

  it('a hit on the Leader trashes the Life card instead of adding it to hand', () => {
    const g = mineE(LDR.luffy, { characters: [S] }, { life: [MISS, MISS, MISS, MISS] });
    attack(g, at(g, 'p1', 'characters', S), g.leader('p2'));
    passBlock(g);
    passCounter(g);
    expect(g.life('p2')).toBe(3);
    expect(cardIds(g, 'p2', 'trash')).toEqual([MISS]);
    expect(cardIds(g, 'p2', 'hand')).toEqual([]);
  });

  it('the banished Life card’s [Trigger] cannot be activated (no trigger decision, nothing drawn)', () => {
    const g = mineE(LDR.luffy, { characters: [S] }, { life: [SPEED, MISS, MISS, MISS] });
    attack(g, at(g, 'p1', 'characters', S), g.leader('p2'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p2', 'trash')).toEqual([SPEED]);
    expect(cardIds(g, 'p2', 'hand')).toEqual([]); // no Trigger drew a card
  });

  it('control: an attacker without [Banish] gives the opponent the Trigger decision for the same Life card', () => {
    const g = mineE(LDR.luffy, { characters: [CH.kingdew5] }, { life: [SPEED, MISS, MISS, MISS] });
    attack(g, at(g, 'p1', 'characters', CH.kingdew5), g.leader('p2'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p2');
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p2', 'hand')).toHaveLength(1); // the Trigger drew a card
    expect(cardIds(g, 'p2', 'trash')).toEqual([SPEED]);
  });

  it('a blocked attack deals no damage, so nothing is banished', () => {
    const g = mineE(
      LDR.luffy,
      { characters: [S] },
      { life: [MISS, MISS, MISS, MISS], characters: ['OP09-072'] },
    );
    attack(g, at(g, 'p1', 'characters', S), g.leader('p2'));
    act(g, { type: 'block', blocker: at(g, 'p2', 'characters', 'OP09-072') });
    passCounter(g);
    expect(g.life('p2')).toBe(4);
    expect(cardIds(g, 'p2', 'trash')).toEqual(['OP09-072']);
    takeDamage(g);
  });

  it('against a rested Character it is just a K.O.; no Life is lost', () => {
    const g = mineE(
      LDR.luffy,
      { characters: [S] },
      { life: [SPEED, MISS, MISS, MISS], characters: [{ card: CH.hajrudin4, rested: true }] },
    );
    attack(g, at(g, 'p1', 'characters', S), at(g, 'p2', 'characters', CH.hajrudin4));
    passBlock(g);
    passCounter(g);
    expect(cardIds(g, 'p2', 'trash')).toEqual([CH.hajrudin4]);
    expect(g.life('p2')).toBe(4);
  });
});
