/**
 * OP15-111 Mont Blanc Noland (Character, Yellow, cost 4, 5000, Counter +2000, {Jaya}/{Botanist}).
 *
 * Card text: "[DON!! x1] [When Attacking] Up to 1 of your [Kalgara] cards gains [Rush] during this turn."
 *
 * Rules relied on: CR 10-2-9 ([DON!! x1] needs at least 1 DON!! given), CR 10-1-1 ([Rush]), CR 3-7-4
 * (a Character played this turn cannot attack without [Rush]), "up to" may choose nothing, names are
 * matched exactly ([Kalgara]), "during this turn" ends at the end of the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  canAttackAnything,
  chars,
  choices,
  kind,
  kw,
  LD15,
  mayChooseNone,
  mine,
  need,
  noDefence,
  offeredIds,
  pickCards,
  reachablePickSets,
  SC15,
  skipChoice,
  toMyNextMain,
} from './kit-op15c.ts';

const NOLAND = 'OP15-111';
/** OP12-099 Kalgara: Yellow, cost 5, 6000, named [Kalgara]. */
const KALGARA5 = 'OP12-099';

function start(
  o: { don?: number; mine?: (string | { card: string; playedThisTurn: boolean })[] } = {},
) {
  const g = mine(
    LD15.neutral,
    {
      characters: [
        { card: NOLAND, don: o.don ?? 1 },
        ...(o.mine ?? [{ card: SC15.kalgara, playedThisTurn: true }]),
      ],
      costArea: { active: 10 - (o.don ?? 1), rested: 0 },
    },
    {},
  );
  attack(g, at(g, 'p1', 'characters', NOLAND), g.leader('p2'));
  return g;
}

describe('OP15-111 Mont Blanc Noland [DON!! x1] [When Attacking]', () => {
  it('with 1 DON!! given: a [Kalgara] played this turn gains [Rush] and can attack after the battle', () => {
    const g = start();
    need(g, 'choose', 'p1');
    const k = at(g, 'p1', 'characters', SC15.kalgara);
    pickCards(g, [SC15.kalgara]);
    expect(kw(g, k)).toContain('Rush');
    noDefence(g);
    expect(atMain(g)).toBe(true);
    expect(canAttackAnything(g, k)).toBe(true);
  });

  it('with 2 DON!! given the condition [DON!! x1] still holds', () => {
    const g = start({ don: 2 });
    need(g, 'choose', 'p1');
    pickCards(g, [SC15.kalgara]);
    expect(kw(g, at(g, 'p1', 'characters', SC15.kalgara))).toContain('Rush');
  });

  it('with no DON!! given there is no ability: nothing is asked and the [Kalgara] stays unable to attack', () => {
    const g = start({ don: 0 });
    expect(kind(g)).not.toBe('choose');
    noDefence(g);
    const k = at(g, 'p1', 'characters', SC15.kalgara);
    expect(kw(g, k)).not.toContain('Rush');
    expect(canAttackAnything(g, k)).toBe(false);
  });

  it('only cards named [Kalgara] are offered: another Kalgara yes, a {Sky Island} Wyper no, Noland himself no', () => {
    const g = start({
      mine: [
        { card: SC15.kalgara, playedThisTurn: true },
        { card: KALGARA5, playedThisTurn: true },
        { card: SC15.sky6, playedThisTurn: true },
      ],
    });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.kalgara, KALGARA5].sort());
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', NOLAND));
  });

  it('"up to 1": choosing nothing gives [Rush] to nobody', () => {
    const g = start();
    expect(mayChooseNone(g)).toBe(true);
    skipChoice(g);
    noDefence(g);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', SC15.kalgara))).toBe(false);
  });

  it('only one [Kalgara] gains [Rush] even when two are on the field', () => {
    const g = start({
      mine: [
        { card: SC15.kalgara, playedThisTurn: true },
        { card: KALGARA5, playedThisTurn: true },
      ],
    });
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
    pickCards(g, [KALGARA5]);
    noDefence(g);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', KALGARA5))).toBe(true);
    expect(canAttackAnything(g, at(g, 'p1', 'characters', SC15.kalgara))).toBe(false);
  });

  it('[Rush] lasts only this turn: on my next turn the [Kalgara] has no [Rush]', () => {
    const g = start();
    pickCards(g, [SC15.kalgara]);
    noDefence(g);
    toMyNextMain(g);
    expect(kw(g, at(g, 'p1', 'characters', SC15.kalgara))).not.toContain('Rush');
    expect(chars(g)).toContain(SC15.kalgara);
  });

  it('a [Kalgara] that was already able to attack is still offered (it simply gains a keyword)', () => {
    const g = start({ mine: [SC15.kalgara] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.kalgara]);
  });
});
