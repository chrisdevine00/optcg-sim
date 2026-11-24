/**
 * EB04-014 Kouzuki Sukiyaki (Character, cost 3, 0 power, no Counter, {Land of Wano}/{Kouzuki Clan}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)
 * [Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to your {Land of Wano} type Leader."
 *
 * Rules: [Blocker] (CR 10-1-?), CR 10-2-13 ([Once Per Turn]), CR 8-4-4-1 ("up to 1": the target pick
 * may end with nothing), DON!! given from the cost area are removed from it and attached.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  choices,
  don,
  endTurn,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  none,
  offeredAbilities,
  pickInst,
  SN,
  theirs,
  useAbility,
} from './kit-eb04a.ts';

const SUKI = 'EB04-014';

function field(leader: string = LE.wano, costArea = { active: 5, rested: 3 }) {
  return mine(leader, { characters: [SUKI, SN.c2], costArea }, { characters: [SN.c4] });
}
const suki = (g: ReturnType<typeof field>) => at(g, 'p1', 'characters', SUKI);

describe('EB04-014 Kouzuki Sukiyaki: [Blocker]; [Activate: Main] [Once Per Turn] give up to 1 rested DON!! to my {Land of Wano} Leader', () => {
  it('printed values: cost 3, 0 power, [Blocker]', () => {
    const g = field();
    const c = g.card(suki(g));
    expect(c.cost).toBe(3);
    expect(c.power).toBe(0);
    expect(c.keywords).toContain('Blocker');
  });

  it('gives 1 rested DON!! to the {Land of Wano} Leader (the DON!! leaves the cost area, Leader +1000 on my turn)', () => {
    const g = field();
    useAbility(g, suki(g));
    need(g, 'choose');
    expect(choices(g)).toEqual([g.leader('p1')]);
    pickInst(g, [g.leader('p1')]);
    expect(kind(g)).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 2, given: 1 });
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('"up to 1": may give nothing; no DON!! moves', () => {
    const g = field();
    useAbility(g, suki(g));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 3, given: 0 });
  });

  it('the target is the Leader only: my Characters (not even Land of Wano ones) are not offered', () => {
    const g = mine(
      LE.wano,
      { characters: [SUKI, SN.shinobu], costArea: { active: 5, rested: 3 } },
      {},
    );
    useAbility(g, suki(g));
    expect(choices(g)).toEqual([g.leader('p1')]);
    none(g);
  });

  it('must not happen: with no rested DON!! (only active ones) nothing is given', () => {
    const g = field(LE.wano, { active: 5, rested: 0 });
    if (offeredAbilities(g, suki(g)).length) useAbility(g, suki(g));
    if (kind(g) === 'choose') none(g);
    expect(kind(g)).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 0, given: 0 });
  });

  it('must not happen: a Leader without {Land of Wano} receives nothing', () => {
    const g = field(LE.luffy);
    if (offeredAbilities(g, suki(g)).length) useAbility(g, suki(g));
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(kind(g)).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 3, given: 0 });
  });

  it('[Once Per Turn]: not offered again this turn, offered next turn', () => {
    const g = field();
    useAbility(g, suki(g));
    pickInst(g, [g.leader('p1')]);
    expect(offeredAbilities(g, suki(g))).toEqual([]);
    endTurn(g);
    endTurn(g);
    expect(offeredAbilities(g, suki(g)).length).toBe(1);
  });

  it('[Blocker]: it can block an attack on my Leader and becomes the new target', () => {
    const g = theirs(
      LE.wano,
      { characters: [SUKI], life: [SN.c1, SN.c1, SN.c1, SN.c1] },
      { characters: [SN.c4] },
    );
    attack(g, at(g, 'p2', 'characters', SN.c4), g.leader('p1'));
    expect(blockers(g)).toEqual([suki(g as never)]);
    g.act({ type: 'block', blocker: suki(g as never) });
    expect(g.card(suki(g as never)).rested).toBe(true);
    expect(g.life('p1')).toBe(4);
  });
});
