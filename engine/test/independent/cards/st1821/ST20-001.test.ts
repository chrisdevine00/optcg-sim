/**
 * ST20-001 Charlotte Katakuri (Yellow Character, cost 5, 6000, Counter +1000, {Big Mom Pirates},
 * [Blocker]).
 * "[Activate: Main] [Once Per Turn] You may turn 1 card from the top of your Life cards face-up:
 * Give up to 1 rested DON!! card to your Leader or 1 of your Characters."
 * Rules: only the TOP Life card is turned; a Life card turned face-up stays in the Life area; the
 * DON!! given must be a rested one. (Open M4b-3/M6b-Q59: a top card that is already in the wanted
 * state: only the cases every reading shares are asserted.)
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  BLUE,
  blockers,
  donOf,
  inst,
  LD,
  mainFor,
  many,
  mine,
  need,
  none,
  offeredAbilities,
  pickInst,
  SC,
  theirs,
  useAbility,
} from './kit-st1821a.ts';

const ID = 'ST20-001';

function start(life = 4, rested = 3) {
  return mine(LD.yamato, {
    characters: [ID, SC.bmp3],
    life: many(BLUE, life),
    costArea: { active: 3, rested },
  });
}

describe('ST20-001 Charlotte Katakuri', () => {
  it('[Blocker]: it can block an attack on my Leader and is rested by blocking', () => {
    const g = theirs(LD.yamato, { characters: [ID], life: many(BLUE, 4) });
    const k = inst(g, 'p1', 'characters', ID);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([k]);
    act(g, { type: 'block', blocker: k });
    expect(g.card(k).rested).toBe(true);
    expect(g.life('p1')).toBe(4);
  });

  it('turns the top Life card face-up (as the cost) and gives 1 rested DON!! to the chosen Character', () => {
    const g = start();
    const target = inst(g, 'p1', 'characters', SC.bmp3);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickInst(g, [target]);
    mainFor(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.card(target).don).toBe(1);
    expect(donOf(g, 'p1').rested).toBe(2);
    expect(donOf(g, 'p1').given).toBe(1);
  });

  it('only the top Life card is turned; the others stay face-down and no Life card leaves the area', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    pickInst(g, [g.leader('p1')]);
    const life = g.zone('p1', 'life');
    expect(life).toHaveLength(4);
    expect(life.map((c) => c.faceUp)).toEqual([true, false, false, false]);
  });

  it('the DON!! can go to my Leader', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    pickInst(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('only my own Leader and Characters can receive it', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []))
      .sort();
    const mineIds = [g.leader('p1'), ...g.zone('p1', 'characters').map((c) => c.instance)].sort();
    expect(offered).toEqual(mineIds);
  });

  it('"up to 1": choosing nobody gives nothing (the Life card stays turned)', () => {
    const g = start();
    useAbility(g, inst(g, 'p1', 'characters', ID));
    none(g);
    expect(donOf(g, 'p1').given).toBe(0);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('with no rested DON!! nothing can be given', () => {
    const g = start(4, 0);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    if (g.legal().some((a) => a.type === 'done')) act(g, { type: 'done' });
    mainFor(g);
    expect(donOf(g, 'p1').given).toBe(0);
    expect(donOf(g, 'p1').active).toBe(3);
  });

  it('with no Life cards the cost cannot be paid: the ability is not offered', () => {
    const g = start(0);
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('Once Per Turn: it cannot be activated twice in a turn', () => {
    const g = start();
    const k = inst(g, 'p1', 'characters', ID);
    useAbility(g, k);
    pickInst(g, [g.leader('p1')]);
    mainFor(g);
    expect(offeredAbilities(g, k)).toEqual([]);
  });
});
