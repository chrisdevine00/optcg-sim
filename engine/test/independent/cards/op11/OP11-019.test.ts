/**
 * OP11-019 Glorp Web!! (Event, Red, cost 2, {Navy}/{SWORD}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +2000 power during this
 * battle. Then, if your opponent has a Character with 6000 power or more, up to 1 of your Leader or
 * Character cards gains +1000 power during this turn.
 * [Trigger] Up to 1 of your Leader or Character cards gains +1000 power during this turn."
 *
 * Rules: an Event [Counter] is used in the Counter Step and costs its printed cost (CR 7-1-3-2).
 * "During this battle" ends with the battle; "during this turn" lasts to the end of the turn. The
 * "if" reads the opponent's Characters' current power at resolution; "6000 or more" includes 6000.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  chr,
  canFinish,
  choices,
  fill,
  hitLeader,
  kind,
  L11,
  N11,
  need,
  none,
  offeredIds,
  pickInst,
  passBlock,
  theirs,
  activateTrigger,
} from './kit-op11a.ts';
import { act } from '../../helpers.ts';
import { canCounterWith, useCounter } from '../kit.ts';

const GW = 'OP11-019';

/** p2 attacks p1's Leader with `attacker`; p1 (Leader + one Character) holds Glorp Web!! and is at the Counter Step. */
function atCounter(attacker: string, extraP2: string[] = [], don = 4) {
  const g = theirs(
    L11.luffy,
    { hand: [GW], characters: [N11.navy3], costArea: { active: don, rested: 0 } },
    { characters: [attacker, ...extraP2] },
  );
  attack(g, chr(g, 'p2', attacker), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

describe('OP11-019 Glorp Web!!: [Counter] +2000 this battle, then +1000 this turn if the opponent has a 6000+ Character', () => {
  it('printed value: cost 2; usable as a Counter with 2 active DON!!, not with 1', () => {
    expect(
      canCounterWith(
        atCounter(N11.marco, [], 2),
        at(atCounter(N11.marco, [], 2), 'p1', 'hand', GW),
      ),
    ).toBe(true);
    const g = atCounter(N11.marco, [], 1);
    expect(canCounterWith(g, at(g, 'p1', 'hand', GW))).toBe(false);
  });

  it('+2000 during this battle: the Leader survives an attacker with 6000 power', () => {
    const g = atCounter(N11.hajrudin);
    useCounter(g, at(g, 'p1', 'hand', GW), g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBeGreaterThanOrEqual(7000);
    // Whatever the second part did, finish: the Leader (7000+) is not beaten by 6000.
    for (let i = 0; i < 2 && kind(g) === 'choose'; i++) none(g);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('with no opposing Character of 6000+ (5000 attacker), only +2000: the Leader is at 7000', () => {
    const g = atCounter(N11.marco);
    useCounter(g, at(g, 'p1', 'hand', GW), g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('boundary: an opposing Character with exactly 6000 turns the second part on (+1000: 8000 total)', () => {
    const g = atCounter(N11.hajrudin);
    useCounter(g, at(g, 'p1', 'hand', GW), g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('the second +1000 may go to a different card (my Character)', () => {
    const g = atCounter(N11.hajrudin);
    useCounter(g, at(g, 'p1', 'hand', GW), g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([L11.luffy, N11.navy3].sort());
    pickInst(g, [chr(g, 'p1', N11.navy3)]);
    expect(g.power(chr(g, 'p1', N11.navy3))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('the condition may be met by a Character other than the attacker (an 8000 one standing by)', () => {
    const g = atCounter(N11.marco, [N11.thatch]);
    useCounter(g, at(g, 'p1', 'hand', GW), g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
  });

  it('"up to 1": the +2000 may be given to no one', () => {
    const g = atCounter(N11.marco);
    useCounter(g, at(g, 'p1', 'hand', GW), g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the +2000 ends with the battle, the +1000 stays for the rest of the turn', () => {
    const g = atCounter(N11.hajrudin);
    useCounter(g, at(g, 'p1', 'hand', GW), g.leader('p1'));
    pickInst(g, [g.leader('p1')]);
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(6000);
  });
});

describe('OP11-019 Glorp Web!!: [Trigger] +1000 this turn', () => {
  function triggered() {
    const g = theirs(
      L11.luffy,
      { life: [GW, ...fill(BLUE, 3)], characters: [N11.navy3] },
      { characters: [N11.marco] },
    );
    hitLeader(g);
    return g;
  }

  it('gives my Leader +1000 power during this turn', () => {
    const g = triggered();
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([L11.luffy, N11.navy3].sort());
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('may be given to a Character instead, or to no one', () => {
    const g = triggered();
    activateTrigger(g);
    pickInst(g, [chr(g, 'p1', N11.navy3)]);
    expect(g.power(chr(g, 'p1', N11.navy3))).toBe(6000);
    const h = triggered();
    activateTrigger(h);
    none(h);
    expect(h.power(h.leader('p1'))).toBe(5000);
  });
});
