/**
 * OP18-009 Super Spot-Billed Duck Troops (Red Character, cost 4, 5000, {Animal}/{Alabasta}).
 *
 * Card text (cards/data):
 *   "[Rush]
 *    [Activate: Main] You may trash this Character: If you have 9 or more DON!! cards on your field,
 *    play up to 1 [Karoo] from your hand."
 *
 * Reading: the trash is the cost (paid even if the condition then fails). "9 or more DON!! cards on
 * your field" counts cost area (active and rested) plus DON!! given to cards; the opponent's DON!!
 * do not count. The played [Karoo] is free (named Karoo, any cost) and "up to 1" may be nothing.
 *
 * Scenery: ST01-003 Karoo (cost 1), EB02-001 Karoo (cost 5), OP01-023 Marco.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  canActivate,
  cardIds,
  donOf,
  hand,
  kw,
  LC,
  mine,
  need,
  offeredIds,
  pickCards,
  trash,
  useAbility,
  VC,
  canHit,
} from './kit-c.ts';

const DUCK = 'OP18-009';

function start(g: ReturnType<typeof mine>) {
  useAbility(g, at(g, 'p1', 'characters', DUCK));
}

describe('OP18-009 Super Spot-Billed Duck Troops', () => {
  it('has Rush: it can attack the turn it is played', () => {
    const g = mine(LC.luffy, { hand: [DUCK] });
    const duck = g.find('p1', 'hand', DUCK);
    g.act({ type: 'playCard', card: duck });
    while (g.legal().some((a) => a.type === 'pick'))
      g.act(g.legal().find((a) => a.type === 'pick')!);
    expect(kw(g, at(g, 'p1', 'characters', DUCK))).toContain('Rush');
    expect(canHit(g, at(g, 'p1', 'characters', DUCK), g.leader('p2'))).toBe(true);
  });

  it('with 9 DON!! on the field: trash this, play a [Karoo] from hand for free', () => {
    const g = mine(LC.luffy, {
      characters: [DUCK],
      hand: [VC.karoo5],
      costArea: { active: 9, rested: 0 },
    });
    start(g);
    pickCards(g, [VC.karoo5]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VC.karoo5]);
    expect(trash(g)).toEqual([DUCK]);
    expect(donOf(g, 'p1').active).toBe(9);
  });

  it('boundary: with 8 DON!! the cost is paid (Duck trashed) but no Karoo is played', () => {
    const g = mine(LC.luffy, {
      characters: [DUCK],
      hand: [VC.karoo1],
      costArea: { active: 8, rested: 0 },
    });
    start(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([DUCK]);
    expect(hand(g)).toEqual([VC.karoo1]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('rested DON!! and DON!! given to cards count toward the 9', () => {
    const h = mine(
      { card: LC.luffy, don: 2 },
      { characters: [DUCK], hand: [VC.karoo1], costArea: { active: 3, rested: 4 } },
    );
    start(h);
    pickCards(h, [VC.karoo1]);
    expect(cardIds(h, 'p1', 'characters')).toEqual([VC.karoo1]);
  });

  it('the opponent’s DON!! do not count', () => {
    const g = mine(
      LC.luffy,
      { characters: [DUCK], hand: [VC.karoo1], costArea: { active: 5, rested: 0 } },
      { costArea: { active: 10, rested: 0 } },
    );
    expect(donOf(g, 'p2').active).toBe(10);
    start(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g)).toEqual([DUCK]);
  });

  it('only a card named [Karoo] is offered', () => {
    const g = mine(LC.luffy, { characters: [DUCK], hand: [VC.marco3, VC.karoo1, VC.sanji1] });
    start(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VC.karoo1]);
    pickCards(g, [VC.karoo1]);
    expect(hand(g)).toEqual([VC.marco3, VC.sanji1].sort());
  });

  it('"up to 1": the Karoo may be left in hand (the Duck is still trashed)', () => {
    const g = mine(LC.luffy, { characters: [DUCK], hand: [VC.karoo1] });
    start(g);
    g.act({ type: 'done' });
    expect(hand(g)).toEqual([VC.karoo1]);
    expect(trash(g)).toEqual([DUCK]);
  });

  it('the Duck is not trashed unless the ability is activated; it is offered as a Main Phase action', () => {
    const g = mine(LC.luffy, { characters: [DUCK], hand: [VC.karoo1] });
    expect(canActivate(g, at(g, 'p1', 'characters', DUCK))).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([DUCK]);
  });

  it('a Duck played this turn can use it too (it is trashed as the cost, not rested)', () => {
    const g = mine(LC.luffy, {
      characters: [{ card: DUCK, playedThisTurn: true }],
      hand: [VC.karoo1],
    });
    expect(canActivate(g, at(g, 'p1', 'characters', DUCK))).toBe(true);
    start(g);
    pickCards(g, [VC.karoo1]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VC.karoo1]);
  });
});
