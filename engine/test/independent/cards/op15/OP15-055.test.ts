/**
 * OP15-055 Go Ahead and Use 'Em, Mr. Luffy!!! (Event, Blue, cost 3, {Dressrosa}/{Barto Club}).
 *
 * Card text: "[Main] Choose one:
 * - Draw 2 cards.
 * - Up to 1 of your {Dressrosa} type Characters gains [Blocker] until the end of your opponent's next
 *   End Phase."
 *
 * Rules: CR 8-4-4 / 8-4-4-1 (modes are chosen at resolution; "up to"), CR 4-5-3 (draw X), CR 10-1-4
 * ([Blocker]), RL-11 / rulings.md 235-243 ("until the end of your opponent's next End Phase" ends at
 * step 6-6-1-2 of the opponent's End Phase, so the whole opponent turn is covered).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passCounter } from '../../helpers.ts';
import {
  at,
  atMain,
  block,
  BLUE,
  choices,
  deck,
  don,
  hand,
  inst,
  kind,
  kws,
  LD15,
  mine,
  modeLabels,
  need,
  none,
  offeredIds,
  pickInst,
  pickMode,
  playRaw,
  reachablePickSets,
  SC15,
  SCN,
  trash,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EVENT = 'OP15-055';
const MODE_DRAW = /Draw 2/;
const MODE_BLOCK = /Blocker/;
const DRAW = [SCN.c2, SCN.c3, BLUE, BLUE, BLUE];

function start(own: string[] = [SC15.bellamy, SCN.c3], p2: string[] = [SCN.c4]): TestGame {
  return mine(LD15.neutral, { hand: [EVENT], characters: own, deck: DRAW }, { characters: p2 });
}

describe('OP15-055 Go Ahead and Use ’Em, Mr. Luffy!!!: [Main] choose one: draw 2, or a {Dressrosa} Character gains [Blocker]', () => {
  it('offers the two modes, and the cost of 3 is paid', () => {
    const g = start();
    playRaw(g, EVENT);
    expect(modeLabels(g)).toHaveLength(2);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });

  it('mode "draw 2": exactly two cards, nobody gains [Blocker]', () => {
    const g = start();
    playRaw(g, EVENT);
    pickMode(g, MODE_DRAW);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(deck(g)).toHaveLength(3);
    expect(kws(g, at(g, 'p1', 'characters', SC15.bellamy))).not.toContain('Blocker');
    expect(trash(g)).toEqual([EVENT]);
  });

  it('mode "Blocker": a {Dressrosa} Character gains [Blocker]; nothing is drawn', () => {
    const g = start();
    playRaw(g, EVENT);
    pickMode(g, MODE_BLOCK);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', SC15.bellamy)]);
    expect(kws(g, at(g, 'p1', 'characters', SC15.bellamy))).toContain('Blocker');
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(5);
  });

  it('only my {Dressrosa} Characters are candidates', () => {
    const g = start([SC15.bellamy, SCN.c3, SC15.gilly], [SC15.hajrudin]);
    playRaw(g, EVENT);
    pickMode(g, MODE_BLOCK);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.bellamy, SC15.gilly].sort());
    expect(choices(g)).not.toContain(inst(g, 'p2', 'characters', SC15.hajrudin));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('"up to 1": may choose nobody; and never more than one Character', () => {
    const g = start([SC15.bellamy, SC15.gilly]);
    playRaw(g, EVENT);
    pickMode(g, MODE_BLOCK);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('declining the target: nobody gains [Blocker]', () => {
    const g = start();
    playRaw(g, EVENT);
    pickMode(g, MODE_BLOCK);
    none(g);
    expect(kws(g, at(g, 'p1', 'characters', SC15.bellamy))).not.toContain('Blocker');
  });

  it('the [Blocker] lasts through the opponent’s turn: it can block there', () => {
    const g = start();
    playRaw(g, EVENT);
    pickMode(g, MODE_BLOCK);
    pickInst(g, [inst(g, 'p1', 'characters', SC15.bellamy)]);
    g.act({ type: 'endTurn' });
    need(g, 'main', 'p2');
    attack(g, inst(g, 'p2', 'characters', SCN.c4), g.leader('p1'));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', SC15.bellamy)]);
    block(g, inst(g, 'p1', 'characters', SC15.bellamy));
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('it ends with the opponent’s End Phase: gone on my next turn', () => {
    const g = start();
    playRaw(g, EVENT);
    pickMode(g, MODE_BLOCK);
    pickInst(g, [inst(g, 'p1', 'characters', SC15.bellamy)]);
    g.act({ type: 'endTurn' });
    expect(kws(g, at(g, 'p1', 'characters', SC15.bellamy))).toContain('Blocker');
    g.act({ type: 'endTurn' });
    expect(kind(g)).toBe('main');
    expect(kws(g, at(g, 'p1', 'characters', SC15.bellamy))).not.toContain('Blocker');
  });

  it('must not: a Character that was not chosen gains no [Blocker]', () => {
    const g = start([SC15.bellamy, SC15.gilly]);
    playRaw(g, EVENT);
    pickMode(g, MODE_BLOCK);
    pickInst(g, [inst(g, 'p1', 'characters', SC15.bellamy)]);
    expect(kws(g, at(g, 'p1', 'characters', SC15.gilly))).not.toContain('Blocker');
  });

  it('with no {Dressrosa} Character the Blocker mode does nothing and the Event is still spent', () => {
    const g = start([SCN.c3]);
    playRaw(g, EVENT);
    pickMode(g, MODE_BLOCK);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(kws(g, at(g, 'p1', 'characters', SCN.c3))).not.toContain('Blocker');
    expect(trash(g)).toEqual([EVENT]);
  });
});
