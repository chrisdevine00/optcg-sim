/**
 * OP14-077 Penta-Chromatic String (Event, Purple, cost 2, {Donquixote Pirates}/{The Seven Warlords
 * of the Sea}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +4000 power during this
 * battle. Then, if your opponent has a Character with 6000 power or more, add up to 1 DON!! card
 * from your DON!! deck and rest it."
 *
 * Rules: [Counter] (CR 10-2-9, RL-08: the boost ends with the battle and may go on a card that is not
 * in the battle), "up to 1" may be skipped, the "Then, if" reads the opposing Characters' CURRENT
 * power when it resolves (given DON!! add power on their own turn, RL-13), "add up to N DON!!" asks
 * a count.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  addDon,
  asksCount,
  at,
  attack,
  backToMain,
  canCounterNow,
  chr,
  countOptions,
  donOf14,
  kind,
  LD14,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  SC14,
  theirs,
  trash,
  onField,
} from './kit-op14c.ts';

const ID = 'OP14-077';

/** p2's Leader attacks my Leader (or my rested Sai); I reach the Counter Step with 4 active DON!!. */
function defend(
  o: {
    p2chars?: (string | { card: string; don: number })[];
    target?: 'leader' | 'char';
    p2leaderDon?: number;
    active?: number;
  } = {},
) {
  const g = theirs(
    LD14.dp,
    {
      hand: [ID],
      characters: [{ card: SC14.c2, rested: true }],
      costArea: { active: o.active ?? 4, rested: 0 },
    },
    {
      characters: o.p2chars ?? [],
      costArea: { active: 8, rested: 0 },
      leader: o.p2leaderDon ? { card: LD14.plain, don: o.p2leaderDon } : LD14.plain,
    },
  );
  const target = o.target === 'char' ? chr(g, 'p1', SC14.c2) : g.leader('p1');
  attack(g, g.leader('p2'), target);
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

describe('OP14-077 Penta-Chromatic String [Counter] +4000 power, then maybe add a rested DON!!', () => {
  it('is a Counter: it can be used in the Counter Step, not as a Main action', () => {
    const g = defend();
    expect(canCounterNow(g, at(g, 'p1', 'hand', ID))).toBe(true);
    const m = mine(LD14.dp, { hand: [ID], costArea: { active: 4, rested: 0 } });
    expect(canCounterNow(m, at(m, 'p1', 'hand', ID))).toBe(false);
  });

  it('gives my Leader +4000 during the battle (5000 -> 9000), so the attack fails', () => {
    const g = defend();
    activateCounter(g, at(g, 'p1', 'hand', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(SC14.c2);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
  });

  it('may boost one of my Characters instead (a rested Character under attack survives)', () => {
    const g = defend({ target: 'char' });
    activateCounter(g, at(g, 'p1', 'hand', ID));
    pickInst(g, [chr(g, 'p1', SC14.c2)]);
    expect(g.power(chr(g, 'p1', SC14.c2))).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    act(g, { type: 'endCounter' });
    expect(g.card(chr(g, 'p1', SC14.c2)).zone).toBe('characters');
  });

  it('only my own Leader or Characters are offered, never the opponent’s', () => {
    const g = defend({ p2chars: [SC14.c4] });
    activateCounter(g, at(g, 'p1', 'hand', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LD14.dp, SC14.c2].sort());
    const offered = g.legal().flatMap((a) => (a.type === 'pick' ? [a.choice] : []));
    expect(offered).toContain(g.leader('p1'));
    expect(offered).not.toContain(g.leader('p2'));
  });

  it('the boost ends with the battle', () => {
    const g = defend();
    activateCounter(g, at(g, 'p1', 'hand', ID));
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    backToMain(g, 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('opponent has a Character with 6000 power: asks a count, adding 1 puts a RESTED DON!! in my cost area', () => {
    const g = defend({ p2chars: [SC14.c4] });
    activateCounter(g, at(g, 'p1', 'hand', ID));
    pickInst(g, [g.leader('p1')]);
    need(g, 'choose', 'p1');
    expect(countOptions(g).sort()).toEqual(['0', '1']);
    addDon(g, 1);
    // Cost 2 rested 2 DON!!; the added one is rested too.
    expect(donOf14(g)).toMatchObject({ active: 2, rested: 3, deck: 5 });
  });

  it('boundary: a 5000 Character does not satisfy it, a 6000 one does; 7000 also does', () => {
    const five = defend({ p2chars: [SC14.c3] });
    activateCounter(five, at(five, 'p1', 'hand', ID));
    pickInst(five, [five.leader('p1')]);
    expect(kind(five)).toBe('counter');
    expect(onField(five)).toBe(4);
    const seven = defend({ p2chars: [SC14.c3, SC14.c5] });
    activateCounter(seven, at(seven, 'p1', 'hand', ID));
    pickInst(seven, [seven.leader('p1')]);
    expect(asksCount(seven)).toBe(true);
  });

  it('reads CURRENT power: a 5000 Character holding a DON!! (6000 on their turn) satisfies it', () => {
    const g = defend({ p2chars: [{ card: SC14.c3, don: 1 }] });
    expect(g.power(chr(g, 'p2', SC14.c3))).toBe(6000);
    activateCounter(g, at(g, 'p1', 'hand', ID));
    pickInst(g, [g.leader('p1')]);
    expect(asksCount(g)).toBe(true);
  });

  it('only Characters count: a 7000 Leader (a DON!! given) with no Character adds nothing', () => {
    const g = defend({ p2leaderDon: 2 });
    activateCounter(g, at(g, 'p1', 'hand', ID));
    pickInst(g, [g.leader('p1')]);
    expect(kind(g)).toBe('counter');
    expect(onField(g)).toBe(4);
  });

  it('"up to": adding none adds nothing', () => {
    const g = defend({ p2chars: [SC14.c4] });
    activateCounter(g, at(g, 'p1', 'hand', ID));
    pickInst(g, [g.leader('p1')]);
    addDon(g, 0);
    expect(onField(g)).toBe(4);
    expect(donOf14(g).deck).toBe(6);
  });

  it('"up to 1": the boost may be skipped (the card is still spent)', () => {
    const g = defend({ p2chars: [SC14.c4] });
    activateCounter(g, at(g, 'p1', 'hand', ID));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g)).toEqual([ID]);
  });
});
