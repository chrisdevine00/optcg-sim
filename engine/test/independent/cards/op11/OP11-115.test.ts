/**
 * OP11-115 You're Just Not My Type! (Event, Yellow, cost 1, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "[Counter] If your Leader is [Shirahoshi], up to 1 of your Leader or Character cards
 * gains +4000 power during this battle.
 * [Trigger] K.O. up to 1 of your opponent's Characters with a cost of 2 or less."
 *
 * Rules: CR 8-3-2 (If), CR 8-4-4 ("up to"), CR 7-1-3 (Counter Step), CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  activateTrigger,
  at,
  attack,
  chars,
  cnt,
  declineTrigger,
  hitLeader,
  kind,
  LD11,
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

const ID = 'OP11-115';

function attacked(leader: string = LD11.shirahoshi) {
  const g = them(
    leader,
    { hand: [ID], costArea: { active: 1, rested: 0 }, characters: [SC11.r3] },
    { characters: [SC11.r5] },
  );
  attack(g, at(g, 'p2', 'characters', SC11.r5), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

describe('OP11-115 You’re Just Not My Type! [Counter]: with a [Shirahoshi] Leader, +4000 power in battle', () => {
  it('printed effect: my Leader gets +4000 (9000) and survives a 7000 attack', () => {
    const g = attacked();
    activateCounter(g, at(g, 'p1', 'hand', ID));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    act(g, { type: 'endCounter' });
    expect(cnt(g, 'p1', 'life')).toBe(4);
  });

  it('a Character may take the +4000 instead', () => {
    const g = attacked();
    activateCounter(g, at(g, 'p1', 'hand', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([LD11.shirahoshi, SC11.r3].sort());
    pickInst(g, [at(g, 'p1', 'characters', SC11.r3)]);
    expect(g.power(at(g, 'p1', 'characters', SC11.r3))).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": I may give the power to nobody', () => {
    const g = attacked();
    activateCounter(g, at(g, 'p1', 'hand', ID));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Leader that is not [Shirahoshi] gets no power (the Event is spent for nothing)', () => {
    const g = attacked(LD11.plain);
    activateCounter(g, at(g, 'p1', 'hand', ID));
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    passCounter(g);
    expect(cnt(g, 'p1', 'life')).toBe(3);
  });

  it('the boost lasts for this battle only', () => {
    const g = attacked();
    activateCounter(g, at(g, 'p1', 'hand', ID));
    pickInst(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describe('OP11-115 You’re Just Not My Type! [Trigger]: K.O. a Character of cost 2 or less', () => {
  function hit() {
    const g = them(
      LD11.shirahoshi,
      { life: [ID, SC11.r1, SC11.r2] },
      { characters: [SC11.r2, SC11.r3, SC11.r1] },
    );
    hitLeader(g, g.leader('p2'));
    return g;
  }

  it('printed effect: activating the [Trigger] K.O.s the chosen cost-2 Character', () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r2)]);
    expect(chars(g, 'p2')).toEqual([SC11.r1, SC11.r3].sort());
    expect(trash(g, 'p2')).toEqual([SC11.r2]);
  });

  it('boundary: cost 2 and cost 1 are offered, cost 3 is not', () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([SC11.r1, SC11.r2].sort());
  });

  it('"up to 1": I may K.O. nobody', () => {
    const g = hit();
    activateTrigger(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cnt(g, 'p2', 'characters')).toBe(3);
  });

  it('declining the [Trigger] K.O.s nobody and the Event goes to my hand', () => {
    const g = hit();
    declineTrigger(g);
    expect(cnt(g, 'p2', 'characters')).toBe(3);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(ID);
  });

  it('the [Trigger] does not depend on the Leader: it works with a non-[Shirahoshi] Leader too', () => {
    const g = them(LD11.plain, { life: [ID, SC11.r1, SC11.r2] }, { characters: [SC11.r2] });
    hitLeader(g, g.leader('p2'));
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r2)]);
    expect(cnt(g, 'p2', 'characters')).toBe(0);
  });
});
