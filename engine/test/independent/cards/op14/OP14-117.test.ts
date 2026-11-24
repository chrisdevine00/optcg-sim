/**
 * OP14-117 Brick Bat (Event, Yellow, cost 1, {Thriller Bark Pirates}).
 *
 * Card text: "[Counter] Up to 1 of your {Thriller Bark Pirates} type Leader or Character cards gains
 * +3000 power during this battle.
 * [Trigger] Play up to 1 {Thriller Bark Pirates} type Character card with a cost of 4 or less from
 * your trash rested."
 *
 * Rules: CR 10-2-4 ([Counter] only in the Counter Step), CR 7-1-3, CR 6-6-1 (during this battle).
 * An attacker wins a tie (attacker power >= defender power).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  BLUE,
  canCounterNow,
  chars,
  chooseIfAsked,
  describeTbTrigger,
  don,
  hand,
  kind,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  SC14,
  TB,
  theirs,
  trash,
  useCounter,
} from './kit-op14d.ts';

const ID = 'OP14-117';

function defend(o: { leader?: string; chars?: string[]; attacker?: string } = {}) {
  const g = theirs(
    o.leader ?? LD14.tb,
    {
      hand: [ID, BLUE],
      characters: o.chars ?? [],
      life: [BLUE, BLUE, BLUE, BLUE],
      costArea: { active: 3, rested: 0 },
    },
    { characters: [o.attacker ?? SC14.c5] },
  );
  attack(g, g.find('p2', 'characters', o.attacker ?? SC14.c5), g.leader('p1'));
  passBlock(g);
  return g;
}

describe('OP14-117 Brick Bat: [Counter] +3000 to a {Thriller Bark Pirates} Leader or Character', () => {
  it('a {Thriller Bark Pirates} Leader gets +3000: a 7000 attack on my 5000 Leader fails', () => {
    const g = defend();
    expect(kind(g)).toBe('counter');
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
  });

  it('boundary: +3000 makes 8000, and an 8000 attacker still wins (attacker wins a tie)', () => {
    const g = defend({ attacker: SC14.c6 });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endCounter' });
    expect(kind(g)).toBe('trigger');
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(3);
  });

  it('only {Thriller Bark Pirates} cards are candidates: a TB Leader and TB Character yes, a plain Character no', () => {
    const g = defend({ chars: [TB.lola4, SC14.c4] });
    const ev = g.find('p1', 'hand', ID);
    expect(canCounterNow(g, ev)).toBe(true);
    useCounter(g, ev, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([TB.lola4, LD14.tb].sort());
  });

  it('a Leader that is not {Thriller Bark Pirates} cannot be chosen (only the TB Character can)', () => {
    const g = defend({ leader: LD14.neutral, chars: [TB.lola4] });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([TB.lola4]);
  });

  it('the boost can go to a {Thriller Bark Pirates} Character instead of the Leader', () => {
    const g = defend({ chars: [TB.lola4] });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    need(g, 'choose', 'p1');
    g.act({ type: 'pick', choice: at(g, 'p1', 'characters', TB.lola4) });
    expect(g.power(at(g, 'p1', 'characters', TB.lola4))).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may choose nobody; then the attack hits', () => {
    const g = defend({ chars: [TB.lola4] });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(3);
  });

  it('costs 1 DON!! of the 3 active and goes to the trash', () => {
    const g = defend();
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
    expect(hand(g)).toEqual([BLUE]);
  });

  it('the boost ends with the battle', () => {
    const g = defend();
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    g.act({ type: 'endCounter' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not be playable in my own Main Phase: it has no [Main] effect', () => {
    const g = mine(LD14.tb, { hand: [ID] });
    expect(
      g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', ID)),
    ).toBe(false);
    expect(chars(g)).toEqual([]);
  });
});

describeTbTrigger(ID, false);
