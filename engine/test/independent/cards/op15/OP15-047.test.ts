/**
 * OP15-047 Sanji (Character, Blue, cost 3, 4000, Counter +1000, {Straw Hat Crew}/{Dressrosa}).
 *
 * Card text: "[Blocker] [On Play] Up to 1 of your Characters gains [Unblockable] during this turn."
 *
 * Rules: CR 10-1-4 ([Blocker]), [Unblockable] (rules-digest: the opponent cannot activate [Blocker]
 * against the attacker), CR 8-4-4-1 ("up to"), CR 8-1-4-2 ("during this turn" ends with the turn).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passBlock, passCounter } from '../../helpers.ts';
import {
  at,
  atMain,
  block,
  BLUE,
  choices,
  inst,
  kws,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  reachablePickSets,
  SCN,
  theirs,
  toMyNextMain,
} from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SANJI = 'OP15-047';
/** OP09-072 Franky: cost 4, 5000, [Blocker] (its [On Play] only matters when played). */
const BLOCKER = 'OP09-072';

function start(own: string[] = [SCN.c3], p2: string[] = [BLOCKER]): TestGame {
  return mine(LD15.shc, { hand: [SANJI], characters: own }, { characters: p2 });
}

describe('OP15-047 Sanji: [Blocker]; [On Play] up to 1 of your Characters gains [Unblockable] this turn', () => {
  it('has the [Blocker] keyword and blocks an attack on the Leader, resting', () => {
    const g = theirs(LD15.shc, { characters: [SANJI] }, { characters: [SCN.c3] });
    expect(kws(g, inst(g, 'p1', 'characters', SANJI))).toContain('Blocker');
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', SANJI)]);
    block(g, inst(g, 'p1', 'characters', SANJI));
    expect(g.card(inst(g, 'p1', 'characters', SANJI)).rested).toBe(true);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('[On Play]: another Character gains [Unblockable], so the opposing [Blocker] cannot block it', () => {
    const g = start();
    playRaw(g, SANJI);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', SCN.c3)]);
    expect(atMain(g)).toBe(true);
    expect(kws(g, inst(g, 'p1', 'characters', SCN.c3))).toContain('Unblockable');
    attack(g, inst(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
    passBlock(g);
    passCounter(g);
    expect(g.life('p2')).toBe(3);
  });

  it('control: without the effect the same attack is blockable', () => {
    const g = start();
    playRaw(g, SANJI);
    need(g, 'choose', 'p1');
    none(g);
    attack(g, inst(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    need(g, 'block', 'p2');
    expect(blockers(g)).toEqual([inst(g, 'p2', 'characters', BLOCKER)]);
  });

  it('the candidates are all my Characters, Sanji himself included, and nothing of the opponent', () => {
    const g = start([SCN.c3, SCN.c4]);
    playRaw(g, SANJI);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SANJI, SCN.c3, SCN.c4].sort());
    expect(choices(g)).not.toContain(inst(g, 'p2', 'characters', BLOCKER));
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('Sanji may give it to himself', () => {
    const g = start([]);
    playRaw(g, SANJI);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', SANJI)]);
    expect(kws(g, inst(g, 'p1', 'characters', SANJI))).toContain('Unblockable');
  });

  it('"up to 1": choosing nothing is legal and nobody gains [Unblockable]', () => {
    const g = start();
    playRaw(g, SANJI);
    need(g, 'choose', 'p1');
    none(g);
    expect(kws(g, inst(g, 'p1', 'characters', SCN.c3))).not.toContain('Unblockable');
    expect(kws(g, inst(g, 'p1', 'characters', SANJI))).not.toContain('Unblockable');
  });

  it('at most one Character gains it, even with two candidates', () => {
    const g = start([SCN.c3, SCN.c4]);
    playRaw(g, SANJI);
    need(g, 'choose', 'p1');
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('must not: a Character that was not chosen can still be blocked', () => {
    const g = start([SCN.c3, SCN.c4]);
    playRaw(g, SANJI);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', SCN.c3)]);
    expect(kws(g, inst(g, 'p1', 'characters', SCN.c4))).not.toContain('Unblockable');
    attack(g, inst(g, 'p1', 'characters', SCN.c4), g.leader('p2'));
    need(g, 'block', 'p2');
  });

  it('"during this turn": the keyword is gone on my next turn', () => {
    const g = start();
    playRaw(g, SANJI);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', SCN.c3)]);
    toMyNextMain(g);
    expect(kws(g, at(g, 'p1', 'characters', SCN.c3))).not.toContain('Unblockable');
  });

  it('[Unblockable] only affects attacks: the chosen Character can still be attacked and my Leader can be blocked', () => {
    const g = start([SCN.c3], [BLOCKER]);
    playRaw(g, SANJI);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'characters', SCN.c3)]);
    attack(g, g.leader('p1'), g.leader('p2'));
    need(g, 'block', 'p2');
    expect(blockers(g)).toEqual([inst(g, 'p2', 'characters', BLOCKER)]);
  });
});

void BLUE;
