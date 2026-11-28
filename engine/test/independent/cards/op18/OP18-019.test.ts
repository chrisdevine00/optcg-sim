/**
 * OP18-019 Quack!!! (Red Event, cost 1, {Animal}/{Alabasta}).
 *
 * Card text (cards/data):
 *   "[Main] If you have no Characters with 7000 base power or more, give up to 1 of your opponent's
 *    Characters -3000 power during this turn.
 *    [Counter] Your Leader gains +3000 power during this battle."
 *
 * Reading: the [Main] condition is on BASE power (printed, DON!! and buffs excluded) of your own
 * Characters; the target is an opposing Character (not the Leader). [Counter] is a plain +3000 to
 * your Leader for the battle.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock } from '../../helpers.ts';
import {
  activateCounter,
  at,
  atMain,
  canCounterNow,
  endCounter,
  kind,
  LC,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playCard,
  theirs,
  VC,
} from './kit-c.ts';

const QUACK = 'OP18-019';

describe('OP18-019 Quack!!!: [Main] if no 7000 base power Characters, opposing Character -3000', () => {
  it('with no Characters of your own: -3000 on the chosen opposing Character', () => {
    const g = mine(LC.luffy, { hand: [QUACK] }, { characters: [VC.kingdew5, VC.marco3] });
    playCard(g, QUACK);
    need(g, 'choose', 'p1');
    pickCards(g, [VC.kingdew5]);
    expect(atMain(g)).toBe(true);
    expect(g.power(at(g, 'p2', 'characters', VC.kingdew5))).toBe(4000);
    expect(g.power(at(g, 'p2', 'characters', VC.marco3))).toBe(5000);
  });

  it('boundary: a 6000 base power Character of yours does not stop it', () => {
    const g = mine(
      LC.luffy,
      { hand: [QUACK], characters: [VC.hajrudin4] },
      { characters: [VC.marco3] },
    );
    playCard(g, QUACK);
    pickCards(g, [VC.marco3]);
    expect(g.power(at(g, 'p2', 'characters', VC.marco3))).toBe(2000);
  });

  it('boundary: a 7000 base power Character of yours stops it (no target is asked)', () => {
    const g = mine(
      LC.luffy,
      { hand: [QUACK], characters: [VC.kingdew5] },
      { characters: [VC.marco3] },
    );
    playCard(g, QUACK);
    expect(atMain(g)).toBe(true);
    expect(g.power(at(g, 'p2', 'characters', VC.marco3))).toBe(5000);
  });

  it('it reads BASE power: a 5000 Character with 3 DON!! (8000 now) does not stop it', () => {
    const g = mine(
      LC.luffy,
      {
        hand: [QUACK],
        characters: [{ card: VC.marco3, don: 3 }],
        costArea: { active: 7, rested: 0 },
      },
      { characters: [VC.sai2] },
    );
    expect(g.power(at(g, 'p1', 'characters', VC.marco3))).toBe(8000);
    playCard(g, QUACK);
    pickCards(g, [VC.sai2]);
    expect(g.power(at(g, 'p2', 'characters', VC.sai2))).toBe(1000);
  });

  it('the opponent’s 7000 Characters do not count; the Leader is not a target', () => {
    const g = mine(LC.luffy, { hand: [QUACK] }, { characters: [VC.kingdew5] });
    playCard(g, QUACK);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VC.kingdew5]);
    pickCards(g, [VC.kingdew5]);
  });

  it('"up to 1": may choose nothing', () => {
    const g = mine(LC.luffy, { hand: [QUACK] }, { characters: [VC.kingdew5] });
    playCard(g, QUACK);
    none(g);
    expect(g.power(at(g, 'p2', 'characters', VC.kingdew5))).toBe(7000);
  });
});

describe('OP18-019 Quack!!!: [Counter] Leader +3000 during this battle', () => {
  function defend() {
    const g = theirs(
      LC.luffy,
      { hand: [QUACK], costArea: { active: 1, rested: 0 } },
      { characters: [VC.kingdew5] },
    );
    attack(g, at(g, 'p2', 'characters', VC.kingdew5), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('Leader 5000 +3000 = 8000 stops a 7000 attacker', () => {
    const g = defend();
    expect(canCounterNow(g, g.find('p1', 'hand', QUACK))).toBe(true);
    activateCounter(g, g.find('p1', 'hand', QUACK));
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(4);
  });

  it('without the Counter the same attack connects', () => {
    const g = defend();
    endCounter(g);
    while (kind(g) === 'trigger') g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(3);
  });

  it('the bonus is only for this battle', () => {
    const g = defend();
    activateCounter(g, g.find('p1', 'hand', QUACK));
    endCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(kind(g)).toBe('main');
  });

  it('cannot be used as a Counter without the 1 DON!! for its cost', () => {
    const g = theirs(LC.luffy, { hand: [QUACK] }, { characters: [VC.kingdew5] });
    attack(g, at(g, 'p2', 'characters', VC.kingdew5), g.leader('p1'));
    passBlock(g);
    expect(canCounterNow(g, g.find('p1', 'hand', QUACK))).toBe(false);
  });
});
