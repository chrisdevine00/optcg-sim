/**
 * ST22-007 Squard (Character, Blue, cost 1, 2000, Counter +1000, {Whitebeard Pirates Allies}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] Reveal 1 card from the top of your deck. If that
 * card's type includes "Whitebeard Pirates", give up to 1 rested DON!! card to your Leader or 1 of
 * your Characters."
 *
 * Rules: CR 11-2 (reveal), RL-44 (the revealed card stays on top), a colon-less "If" is an effect
 * condition (the once-per-turn is spent even when the check fails), "give up to 1 DON!!" asks
 * targets and may be ended with nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  canFinish,
  choices,
  deck,
  donOf,
  hasEvent,
  kind,
  LB,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  pickInst,
  SL,
  theirs,
} from './kit-lfb.ts';

const ID = 'ST22-007';
const MISS = SL.miss;
const PAD = Array.from({ length: 10 }, () => MISS);

function start(top: string[], o: { active?: number; rested?: number; chars?: string[] } = {}) {
  return mine(LB.neutral, {
    characters: [ID, ...(o.chars ?? [SL.c2])],
    deck: [...top, ...PAD],
    costArea: { active: o.active ?? 5, rested: o.rested ?? 3 },
  });
}

function use(g: ReturnType<typeof start>) {
  const squard = at(g, 'p1', 'characters', ID);
  const [ability] = offeredAbilities(g, squard);
  if (!ability) throw new Error('Squard not offered');
  act(g, { type: 'activate', card: squard, ability });
}

describe('ST22-007 Squard: [Activate: Main] reveal the top card; if Whitebeard Pirates, give 1 rested DON!!', () => {
  it('a hit: give 1 rested DON!! to my Leader (cost area rested -1, given +1, +1000 power)', () => {
    const g = start([SL.wb4]);
    use(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 2, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('a hit: the DON!! may go to one of my Characters instead, including Squard itself', () => {
    const g = start([SL.wb4]);
    use(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual(
      expect.arrayContaining([
        g.leader('p1'),
        at(g, 'p1', 'characters', ID),
        at(g, 'p1', 'characters', SL.c2),
      ]),
    );
    pickInst(g, [at(g, 'p1', 'characters', SL.c2)]);
    expect(g.power(at(g, 'p1', 'characters', SL.c2))).toBe(5000);
    expect(donOf(g, 'p1').given).toBe(1);
  });

  it("only my own Leader and Characters are candidates, not the opponent's", () => {
    const g = mine(
      LB.neutral,
      { characters: [ID], deck: [SL.wb4, ...PAD], costArea: { active: 5, rested: 3 } },
      { characters: [SL.c1] },
    );
    use(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.find('p2', 'characters', SL.c1));
    expect(choices(g)).toHaveLength(2);
  });

  it('"up to 1": the target pick may be ended with nothing; no DON!! moves', () => {
    const g = start([SL.wb4]);
    use(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 3, given: 0 });
  });

  it('a miss: nothing is given and no target is asked; the revealed card stays on top', () => {
    const g = start([SL.c2, SL.wb4]);
    use(g);
    expect(kind(g)).toBe('main');
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 3, given: 0 });
    expect(deck(g)[0]).toBe(SL.c2);
  });

  it('"type including": Former and Allies types are a hit; a Red-Haired type is a miss', () => {
    for (const top of [SL.former3, SL.allies6]) {
      const g = start([top]);
      use(g);
      expect(kind(g)).toBe('choose');
    }
    const g = start([SL.rhp4]);
    use(g);
    expect(kind(g)).toBe('main');
  });

  it('only the rested DON!! can be given: with none rested (all active) nothing can move', () => {
    const g = start([SL.wb4], { active: 8, rested: 0 });
    use(g);
    if (kind(g) === 'choose') {
      if (canFinish(g)) act(g, { type: 'done' });
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 8, rested: 0, given: 0 });
    expect(atMain(g)).toBe(true);
  });

  it('[Once Per Turn] is spent by a miss too: the colon-less "If" is an effect condition', () => {
    const g = start([SL.c2, SL.wb4]);
    use(g);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('[Once Per Turn] is spent by a hit', () => {
    const g = start([SL.wb4]);
    use(g);
    pickInst(g, [g.leader('p1')]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('the top card is revealed whether it matches or not (CR 11-2-1)', () => {
    const hit = start([SL.wb4]);
    use(hit);
    expect(hasEvent(hit, 'CardRevealed', { card: SL.wb4 })).toBe(true);
    const miss = start([SL.c2]);
    use(miss);
    expect(hasEvent(miss, 'CardRevealed', { card: SL.c2 })).toBe(true);
  });

  it("must not happen: it is not offered on the opponent's turn", () => {
    const g = theirs(LB.neutral, { characters: [ID] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
    expect(offeredIds).toBeTypeOf('function');
  });
});
