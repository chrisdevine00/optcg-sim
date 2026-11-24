/** EB04-014 Kouzuki Sukiyaki. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, none, pick, play } from './helpers.ts';
import {
  activateAb,
  at,
  canActivate,
  finishBattle,
  mk,
  RED_LEADER,
  V,
  WANO_LEADER,
} from './helpers-eb04g1.ts';

const ID = 'EB04-014';

describe('EB04-014 Kouzuki Sukiyaki', () => {
  const start = (leader: string = WANO_LEADER, restedDon = 2) =>
    mk({ leader, characters: [ID], costArea: { active: 3, rested: restedDon } });

  it('[Activate: Main] [Once Per Turn]: gives up to 1 rested DON!! to your {Land of Wano} Leader', () => {
    const g = start();
    activateAb(g, at(g, 'p1', 'characters', ID), 'give-don');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1, given: 1 });
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('Once Per Turn: not offered a second time', () => {
    const g = start();
    const id = at(g, 'p1', 'characters', ID);
    activateAb(g, id, 'give-don');
    expect(canActivate(g, id, 'give-don')).toBe(false);
  });

  it('only a rested DON!! is given: with none rested nothing happens', () => {
    const g = start(WANO_LEADER, 0);
    activateAb(g, at(g, 'p1', 'characters', ID), 'give-don');
    expect(don(g, 'p1')).toMatchObject({ active: 3, given: 0 });
    expect(dec(g)?.kind).toBe('main');
  });

  it('a Leader that is not {Land of Wano} gets nothing (the DON!! stay rested)', () => {
    const g = start(RED_LEADER);
    activateAb(g, at(g, 'p1', 'characters', ID), 'give-don');
    expect(don(g, 'p1')).toMatchObject({ rested: 2, given: 0 });
  });

  it('"up to 1": once activated the give can be declined (the DON!! stays rested)', () => {
    const g = start();
    activateAb(g, at(g, 'p1', 'characters', ID), 'give-don');
    expectDecision(g, 'choose', 'p1');
    none(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 2, given: 0 });
  });

  it('prints [Blocker]: can block an attack on the Leader', () => {
    const g = mk(
      { leader: WANO_LEADER, characters: [ID] },
      { characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: at(g, 'p2', 'characters', V.c3),
      target: g.leader('p1'),
    });
    expectDecision(g, 'block', 'p1');
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === at(g, 'p1', 'characters', ID)),
    ).toBe(true);
    finishBattle(g);
  });

  it('can also be played and then used the same turn (an [Activate: Main] has no summoning sickness)', () => {
    const g = mk({ leader: WANO_LEADER, hand: [ID], costArea: { active: 3, rested: 3 } });
    play(g, ID);
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'give-don')).toBe(true);
  });
});
