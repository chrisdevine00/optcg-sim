/**
 * EB02-006 Yamato (Character, Red, cost 6, 7000, no Counter, {Land of Wano}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] If your Leader has the "Land of Wano" type or is
 * [Portgas.D.Ace], give up to 1 rested DON!! card to 1 of your Leader. Then, this Character gains
 * [Rush] during this turn."
 *
 * Reading: the "If" has no colon, so it is an effect condition: the ability is offered and its Once
 * Per Turn is spent even when the check fails; "Then" after a failed "If" does not resolve (M4b-5).
 * Whether "Then" runs after an "up to" give that moved nothing is not asserted (rules-digest 122).
 */
import { describe, expect, it } from 'vitest';
import {
  canFinish,
  canHit,
  choices,
  choose,
  chooseNone,
  donOf,
  E2C,
  E2L,
  kind,
  kw,
  mine,
  need,
  offeredAbilities,
  toMyNextMain,
  useAbility,
} from './kit-eb02a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const YAMATO = 'EB02-006';

function pos(leader: string, rested = 2) {
  return mine(leader, {
    characters: [{ card: YAMATO, playedThisTurn: true }, E2C.koala],
    costArea: { active: 3, rested },
  });
}

/** Activate, then give to the Leader if the engine asks for the target. */
function run(g: TestGame) {
  useAbility(g, g.find('p1', 'characters', YAMATO));
  if (kind(g) === 'choose' && choices(g).includes(g.leader('p1'))) choose(g, [g.leader('p1')]);
}

describe('EB02-006 Yamato: [Activate: Main] [Once Per Turn] give a rested DON!! to the Leader, gain [Rush]', () => {
  it('with a {Land of Wano} Leader: the Leader gets 1 rested DON!! and Yamato can attack the turn it is played', () => {
    const g = pos(E2L.wano);
    const yamato = g.find('p1', 'characters', YAMATO);
    expect(canHit(g, yamato, g.leader('p2'))).toBe(false);
    run(g);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(kw(g, yamato)).toContain('Rush');
    expect(canHit(g, yamato, g.leader('p2'))).toBe(true);
  });

  it('with the Leader [Portgas.D.Ace] (not a {Land of Wano} type) the condition holds too', () => {
    const g = pos(E2L.ace);
    run(g);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(kw(g, g.find('p1', 'characters', YAMATO))).toContain('Rush');
  });

  it('with any other Leader: the check fails, no DON!! is given and no [Rush] is gained', () => {
    const g = pos(E2L.croc);
    run(g);
    const yamato = g.find('p1', 'characters', YAMATO);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(donOf(g, 'p1').given).toBe(0);
    expect(kw(g, yamato)).not.toContain('Rush');
    expect(canHit(g, yamato, g.leader('p2'))).toBe(false);
  });

  it('a failed condition still spends Once Per Turn (the "If" is an effect condition)', () => {
    const g = pos(E2L.croc);
    expect(offeredAbilities(g, g.find('p1', 'characters', YAMATO))).toHaveLength(1);
    run(g);
    expect(offeredAbilities(g, g.find('p1', 'characters', YAMATO))).toEqual([]);
  });

  it('Once Per Turn: a successful use cannot be repeated this turn', () => {
    const g = pos(E2L.wano);
    run(g);
    expect(offeredAbilities(g, g.find('p1', 'characters', YAMATO))).toEqual([]);
  });

  it('the DON!! goes to the Leader only, one DON!!, and not to the Character', () => {
    const g = pos(E2L.wano, 4);
    run(g);
    expect(donOf(g, 'p1').given).toBe(1);
    expect(g.card(g.find('p1', 'characters', E2C.koala)).don).toBe(0);
    expect(g.card(g.find('p1', 'characters', YAMATO)).don).toBe(0);
  });

  it('only a rested DON!! is given: with every cost-area DON!! active nothing is given', () => {
    const g = pos(E2L.wano, 0);
    useAbility(g, g.find('p1', 'characters', YAMATO));
    if (kind(g) === 'choose') chooseNone(g);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(donOf(g, 'p1').active).toBe(3);
  });

  it('"up to 1": the DON!! may be left in the cost area', () => {
    const g = pos(E2L.wano);
    useAbility(g, g.find('p1', 'characters', YAMATO));
    if (kind(g) === 'choose' && canFinish(g)) chooseNone(g);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('[Rush] lasts this turn only', () => {
    const g = pos(E2L.wano);
    run(g);
    toMyNextMain(g);
    expect(kw(g, g.find('p1', 'characters', YAMATO))).not.toContain('Rush');
  });

  it('is usable again on my next turn', () => {
    const g = pos(E2L.wano);
    run(g);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, g.find('p1', 'characters', YAMATO))).toHaveLength(1);
  });
});
