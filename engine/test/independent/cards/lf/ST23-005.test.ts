/**
 * ST23-005 Yasopp (Character, Red, cost 1, 1000, Counter +1000, {Red-Haired Pirates}).
 *
 * Card text: "[Activate:Main] [Once Per Turn] Give up to 1 rested DON!! card to your Leader or 1 of
 * your Characters."
 *
 * Rules: "give up to 1 DON!!" asks a target and may be ended with nothing; only rested DON!! cards
 * of the cost area can be given by this effect.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  canFinish,
  choices,
  donOf,
  kind,
  LB,
  mine,
  need,
  offeredAbilities,
  pickInst,
  SL,
  theirs,
} from './kit-lfb.ts';

const ID = 'ST23-005';

function start(o: { active?: number; rested?: number; chars?: string[] } = {}) {
  return mine(LB.rhp, {
    characters: [ID, ...(o.chars ?? [SL.c2])],
    costArea: { active: o.active ?? 5, rested: o.rested ?? 3 },
  });
}

function use(g: ReturnType<typeof start>) {
  const y = at(g, 'p1', 'characters', ID);
  const [ability] = offeredAbilities(g, y);
  if (!ability) throw new Error('Yasopp not offered');
  act(g, { type: 'activate', card: y, ability });
}

describe('ST23-005 Yasopp: [Activate: Main] give up to 1 rested DON!! to my Leader or 1 Character', () => {
  it('gives 1 rested DON!! to the Leader: rested -1, given +1, +1000 power', () => {
    const g = start();
    use(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 2, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('gives 1 rested DON!! to one of my Characters instead, including Yasopp', () => {
    const g = start();
    use(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual(
      expect.arrayContaining([
        g.leader('p1'),
        at(g, 'p1', 'characters', ID),
        at(g, 'p1', 'characters', SL.c2),
      ]),
    );
    pickInst(g, [at(g, 'p1', 'characters', ID)]);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(2000);
    expect(donOf(g, 'p1').given).toBe(1);
  });

  it('exactly 1 DON!! moves, never more', () => {
    const g = start({ rested: 5 });
    use(g);
    pickInst(g, [g.leader('p1')]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 4, given: 1 });
  });

  it('only a rested DON!! is given: the active ones are untouched', () => {
    const g = start({ active: 7, rested: 1 });
    use(g);
    pickInst(g, [g.leader('p1')]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 7, rested: 0, given: 1 });
  });

  it('with no rested DON!! the effect can do nothing: no DON!! changes state', () => {
    const g = start({ active: 8, rested: 0 });
    const y = at(g, 'p1', 'characters', ID);
    if (offeredAbilities(g, y).length) {
      use(g);
      if (kind(g) === 'choose' && canFinish(g)) act(g, { type: 'done' });
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 8, rested: 0, given: 0 });
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": the target pick may be ended with nothing; no DON!! is given', () => {
    const g = start();
    use(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 3, given: 0 });
  });

  it("only my own Leader and Characters are candidates, not the opponent's", () => {
    const g = mine(
      LB.rhp,
      { characters: [ID], costArea: { active: 5, rested: 3 } },
      { characters: [SL.c1] },
    );
    use(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(2);
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(g.find('p2', 'characters', SL.c1));
  });

  it('[Once Per Turn]: not offered again after it was used', () => {
    const g = start();
    use(g);
    pickInst(g, [g.leader('p1')]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('[Once Per Turn] is spent even if the target was left empty', () => {
    const g = start();
    use(g);
    act(g, { type: 'done' });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it("must not happen: it is not offered on the opponent's turn", () => {
    const g = theirs(LB.rhp, { characters: [ID], costArea: { active: 0, rested: 3 } });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
  });
});
