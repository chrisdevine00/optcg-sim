/**
 * OP16-058 The Prisoners Are Rioting!! (Event, Blue, cost 1, {Impel Down}).
 *
 * Card text: "[Main] If you have 10 DON!! cards on your field, all of your [Prisoner of Impel Down]
 * cards' base power becomes 7000 during this turn. [Counter] Up to 1 of your [Buggy] gains +4000
 * power during this battle."
 *
 * Rules: CR 3-1-2 / RL-24 ("DON!! on your field" counts the cost area and DON!! given to cards), CR 4-9-2
 * (base power), CR 6-5-5-2 (given DON!! still add +1000 on top of the base), CR 8-3-3 (failed "if"),
 * CR 6-6-1-3 ("during this turn"), CR 7-1-5-3 (battle duration), CR 2-1-2 (exact names).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock, takeDamage } from '../../helpers.ts';
import {
  at,
  backAtMain,
  canCounterWith,
  chooseIfAsked,
  choices,
  ID,
  inst,
  LDR,
  mine,
  need,
  put,
  SCN,
  theirs,
  toMyNextMain,
  useCounter,
  offeredNow,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EVT = 'OP16-058';
const PRISONER = 'OP16-042';
/** OP02-058 Buggy: cost 1, 2000, Counter +1000, {Buggy Pirates}/{Impel Down}; its [On Play] only matters when played. */
const BUGGY = 'OP02-058';
const power = (g: TestGame, who: 'p1' | 'p2', card: string, nth = 0) =>
  g.power(at(g, who, 'characters', card, nth));

function main(
  chars: (string | { card: string; don: number })[],
  field: { active: number; rested?: number },
  p2: string[] = [],
): TestGame {
  const g = mine(
    LDR.luffy,
    {
      hand: [EVT],
      characters: chars,
      costArea: { active: field.active, rested: field.rested ?? 0 },
    },
    { characters: p2 },
  );
  put(g, EVT);
  return g;
}

describe('OP16-058 The Prisoners Are Rioting!!: [Main] with 10 DON!! on my field my [Prisoner of Impel Down] have base power 7000; [Counter] a [Buggy] gains +4000', () => {
  it('with 10 DON!! on my field: every [Prisoner of Impel Down] has base power 7000 (from 6000)', () => {
    const g = main([PRISONER, PRISONER], { active: 10 });
    expect(backAtMain(g)).toBe(true);
    expect(power(g, 'p1', PRISONER, 0)).toBe(7000);
    expect(power(g, 'p1', PRISONER, 1)).toBe(7000);
  });

  it('boundary: with 9 DON!! on my field (1 stays in the DON!! deck) nothing changes', () => {
    const g = main([PRISONER], { active: 9 });
    expect(backAtMain(g)).toBe(true);
    expect(power(g, 'p1', PRISONER)).toBe(6000);
  });

  it('DON!! given to my cards count as "on your field": 8 in the cost area + 2 given makes 10', () => {
    const g = main([{ card: PRISONER, don: 2 }], { active: 8 });
    // base 7000 + 2 given DON!! (+1000 each on my turn) = 9000
    expect(power(g, 'p1', PRISONER)).toBe(9000);
  });

  it('the DON!! count is checked on resolution, after the Event cost: 10 DON!! with the Event’s own 1 rested still counts 10', () => {
    const g = main([PRISONER], { active: 10 });
    expect(power(g, 'p1', PRISONER)).toBe(7000);
  });

  it('it is a base power change: a given DON!! still adds +1000 (8000)', () => {
    const g = main([{ card: PRISONER, don: 1 }], { active: 9 });
    expect(power(g, 'p1', PRISONER)).toBe(8000);
  });

  it('must-not-happen: other Characters of mine and the opponent’s [Prisoner of Impel Down] are unchanged', () => {
    const g = main([PRISONER, ID.blugori, SCN.c3], { active: 10 }, [PRISONER]);
    expect(power(g, 'p1', ID.blugori)).toBe(3000);
    expect(power(g, 'p1', SCN.c3)).toBe(5000);
    expect(power(g, 'p2', PRISONER)).toBe(6000);
  });

  it('"during this turn": on my next turn the base power is 6000 again', () => {
    const g = main([PRISONER], { active: 10 });
    toMyNextMain(g);
    expect(power(g, 'p1', PRISONER)).toBe(6000);
  });

  function counterGame(own: string[], attackerTarget: 'leader' | string) {
    const g = theirs(
      LDR.luffy,
      {
        hand: [EVT],
        characters: own.map((c) => ({ card: c, rested: true })),
        costArea: { active: 1, rested: 0 },
      },
      { characters: [SCN.c3] },
    );
    attack(
      g,
      inst(g, 'p2', 'characters', SCN.c3),
      attackerTarget === 'leader' ? g.leader('p1') : at(g, 'p1', 'characters', attackerTarget),
    );
    passBlock(g);
    need(g, 'counter', 'p1');
    return g;
  }

  it('[Counter]: a [Buggy] Character gains +4000 during this battle (2000 + 4000 beats 5000)', () => {
    const g = counterGame([BUGGY], BUGGY);
    useCounter(g, inst(g, 'p1', 'hand', EVT), at(g, 'p1', 'characters', BUGGY));
    chooseIfAsked(g, [at(g, 'p1', 'characters', BUGGY)]);
    expect(g.power(at(g, 'p1', 'characters', BUGGY))).toBe(6000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BUGGY]);
  });

  it('only a card named [Buggy] can be chosen: another Character is not offered', () => {
    const g = counterGame([BUGGY, SCN.c4], BUGGY);
    const evt = inst(g, 'p1', 'hand', EVT);
    // The target is chosen when the Event resolves.
    useCounter(g, evt, g.leader('p1'));
    expect(offeredNow(g)).toEqual([BUGGY]);
    expect(choices(g)).not.toContain(g.leader('p1'));
  });

  it('with no [Buggy] to choose nothing is boosted (the Leader keeps 5000)', () => {
    const g = counterGame([SCN.c4], 'leader');
    if (canCounterWith(g, inst(g, 'p1', 'hand', EVT))) {
      useCounter(g, inst(g, 'p1', 'hand', EVT), g.leader('p1'));
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
