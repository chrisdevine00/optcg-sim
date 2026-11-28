/**
 * OP18-018 Let's Go, Karoo!! (Red Event, cost 1, {Alabasta}).
 *
 * Card text (cards/data):
 *   "[Main] All of your {Alabasta} type Characters gain +1000 power during this turn.
 *    [Trigger] Up to 1 of your Leader or Characters gains +2000 power during this turn."
 *
 * Reading: [Main] affects your {Alabasta} Characters on the field when it resolves (not Leaders, not
 * the opponent's, not Characters played later) until end of turn. [Trigger] asks for "up to 1" of
 * your Leader or Characters.
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  declineTrigger,
  fill,
  kind,
  LC,
  mine,
  need,
  none,
  pickInst,
  playCard,
  theirs,
  toMyNextMain,
  VC,
  hand,
} from './kit-c.ts';

const EVENT = 'OP18-018';

describe('OP18-018 Let’s Go, Karoo!!: [Main] all your {Alabasta} Characters +1000 this turn', () => {
  it('every {Alabasta} Character gets +1000, others and the Leader do not', () => {
    const g = mine(LC.vivi, { hand: [EVENT], characters: [VC.karoo1, VC.sanji1, VC.marco3] });
    playCard(g, EVENT);
    expect(atMain(g)).toBe(true);
    expect(g.power(at(g, 'p1', 'characters', VC.karoo1))).toBe(4000);
    expect(g.power(at(g, 'p1', 'characters', VC.sanji1))).toBe(4000);
    expect(g.power(at(g, 'p1', 'characters', VC.marco3))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the opponent’s {Alabasta} Characters are not affected', () => {
    const g = mine(
      LC.vivi,
      { hand: [EVENT], characters: [VC.sanji1] },
      { characters: [VC.cobra5] },
    );
    playCard(g, EVENT);
    expect(g.power(at(g, 'p2', 'characters', VC.cobra5))).toBe(6000);
  });

  it('a Character played afterwards does not get the bonus', () => {
    const g = mine(LC.vivi, { hand: [EVENT, VC.sanji1] });
    playCard(g, EVENT);
    playCard(g, VC.sanji1);
    expect(g.power(at(g, 'p1', 'characters', VC.sanji1))).toBe(3000);
  });

  it('it lasts only during this turn', () => {
    const g = mine(LC.vivi, { hand: [EVENT], characters: [VC.sanji1] });
    playCard(g, EVENT);
    expect(g.power(at(g, 'p1', 'characters', VC.sanji1))).toBe(4000);
    toMyNextMain(g);
    expect(g.power(at(g, 'p1', 'characters', VC.sanji1))).toBe(3000);
  });

  it('costs 1 DON!! and works with no Character on the field', () => {
    const g = mine(LC.vivi, { hand: [EVENT] });
    playCard(g, EVENT);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([EVENT]);
  });

  it('the +1000 matters in battle: a 3000 Sanji beats a rested 4000 Character with the bonus', () => {
    const g = mine(
      LC.vivi,
      { hand: [EVENT], characters: [VC.sanji1] },
      { characters: [{ card: VC.sai2, rested: true }] },
    );
    playCard(g, EVENT);
    attack(g, at(g, 'p1', 'characters', VC.sanji1), at(g, 'p2', 'characters', VC.sai2));
    g.act({ type: 'block', blocker: null });
    if (kind(g) === 'counter') g.act({ type: 'endCounter' });
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });
});

describe('OP18-018 Let’s Go, Karoo!!: [Trigger] up to 1 of your Leader or Characters +2000', () => {
  /** p2's Kingdew hits p1's Leader; the top Life card is the Event. */
  function hit() {
    const g = theirs(
      LC.vivi,
      { life: [EVENT, ...fill(BLUE, 3)], characters: [VC.marco3, VC.sanji1] },
      { characters: [VC.kingdew5] },
    );
    attack(g, at(g, 'p2', 'characters', VC.kingdew5), g.leader('p1'));
    g.act({ type: 'block', blocker: null });
    if (kind(g) === 'counter') g.act({ type: 'endCounter' });
    return g;
  }

  it('on activation: the Leader can be chosen (5000 -> 7000)', () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a Character can be chosen (5000 -> 7000)', () => {
    const g = hit();
    activateTrigger(g);
    pickInst(g, [at(g, 'p1', 'characters', VC.marco3)]);
    expect(g.power(at(g, 'p1', 'characters', VC.marco3))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('opposing cards are not offered', () => {
    const g = hit();
    activateTrigger(g);
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered).not.toContain(g.leader('p2'));
    expect(offered).not.toContain(at(g, 'p2', 'characters', VC.kingdew5));
    expect(offered).toContain(g.leader('p1'));
  });

  it('"up to 1": may choose nothing', () => {
    const g = hit();
    activateTrigger(g);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('not activating: the card goes to hand and no power is given', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toContain(EVENT);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
