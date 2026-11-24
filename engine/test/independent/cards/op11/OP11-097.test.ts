/**
 * OP11-097 After All These Years I'm Losing My Edge!!! (Event, Black, cost 1, {Navy}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +1000 power during this
 * battle. Then, if you have 10 or more cards in your trash, add up to 1 black Character card with a
 * cost of 3 or less from your trash to your hand."
 *
 * Rules: CR 7-1-3 (Counter Step), CR 8-3-2 (If checked when the "Then" resolves), CR 8-4-4 ("up to").
 * Open point: whether the Event itself already counts in the trash when the "Then" checks (it is
 * trashed after resolving). Tests use 10+ cards already there (true on every reading) and 8 (false on
 * every reading); 9 is not asserted.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  at,
  attack,
  cnt,
  hand,
  kind,
  LD11,
  many,
  mayChooseNone,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickInst,
  SC11,
  them,
  trash,
} from './kit-op11c.ts';

const ID = 'OP11-097';

/** My trash: `n` plain red filler cards plus `extra` cards. */
function board(o: { fill: number; extra?: string[]; chars?: string[] }) {
  const g = them(
    LD11.navy,
    {
      hand: [ID],
      characters: o.chars ?? [],
      trash: [...(o.extra ?? []), ...many(SC11.r1, o.fill)],
      costArea: { active: 1, rested: 0 },
    },
    { characters: [SC11.r5] },
  );
  attack(g, at(g, 'p2', 'characters', SC11.r5), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

function use(g: ReturnType<typeof board>, target: string) {
  activateCounter(g, at(g, 'p1', 'hand', ID));
  need(g, 'choose', 'p1');
  pickInst(g, [target]);
}

describe('OP11-097 After All These Years: +1000 in battle, then with 10+ trash cards add a cheap black Character', () => {
  it('printed effect: my Leader gets +1000 power for this battle and the black Character comes back', () => {
    const g = board({ fill: 10, extra: [SC11.navyB2] });
    use(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(6000);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', SC11.navyB2)]);
    expect(hand(g)).toEqual([SC11.navyB2]);
  });

  it('the +1000 can go on a Character instead of the Leader', () => {
    const g = board({ fill: 10, chars: [SC11.r3] });
    activateCounter(g, at(g, 'p1', 'hand', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([SC11.r3, LD11.navy].sort());
    pickInst(g, [at(g, 'p1', 'characters', SC11.r3)]);
    expect(g.power(at(g, 'p1', 'characters', SC11.r3))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": the +1000 may go to nobody', () => {
    const g = board({ fill: 0 });
    activateCounter(g, at(g, 'p1', 'hand', ID));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with 8 cards in my trash (below 10 even with the Event) nothing is added', () => {
    const g = board({ fill: 7, extra: [SC11.navyB2] });
    use(g, g.leader('p1'));
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(hand(g)).toEqual([]);
  });

  it('boundary: 10 cards already in the trash is enough', () => {
    const g = board({ fill: 9, extra: [SC11.navyB2] });
    use(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC11.navyB2]);
  });

  it('only black Characters of cost 3 or less qualify: a cost-4, a non-black and an Event are not offered', () => {
    const g = board({
      fill: 7,
      extra: [SC11.navyB3, SC11.navyB4, SC11.navyG4, SC11.r1, 'OP11-099', SC11.navyB1],
    });
    use(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([SC11.navyB1, SC11.navyB3].sort());
  });

  it('"up to 1": with the condition met I may add nothing', () => {
    const g = board({ fill: 10, extra: [SC11.navyB2] });
    use(g, g.leader('p1'));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual([]);
  });

  it('the boost lasts for this battle only', () => {
    const g = board({ fill: 0 });
    use(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(6000);
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    // 6000 power still loses to the 7000 attacker.
    expect(cnt(g, 'p1', 'life')).toBe(3);
  });

  it('the Event is trashed after use', () => {
    const g = board({ fill: 0 });
    use(g, g.leader('p1'));
    act(g, { type: 'endCounter' });
    expect(trash(g)).toContain(ID);
    expect(hand(g)).toEqual([]);
  });

  it('it can only be used as a [Counter]: it is not playable in my Main Phase', () => {
    const g = them(
      LD11.navy,
      { hand: [ID], costArea: { active: 1, rested: 0 } },
      { characters: [SC11.r5] },
    );
    expect(g.legal().some((a) => 'card' in a && a.card === at(g, 'p1', 'hand', ID))).toBe(false);
  });
});
