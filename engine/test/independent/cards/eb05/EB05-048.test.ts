/**
 * EB05-048 Hedgehog Stinger (Event, Black, cost 1, {Baroque Works}).
 *
 * Card text: "[Main] You may rest 1 of your DON!! cards and K.O. 1 of your Characters with a type
 * including "Baroque Works": All of your opponent's Characters with a cost of 0 cannot activate
 * [Blocker] during this turn.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1-3 (a cost that cannot be paid in full cannot be paid at all), RD 85 (resting a
 * DON!! needs an ACTIVE DON!! beyond the one that paid the Event), M6b-Q19 / RL-15 (a K.O. paid as a
 * cost is a K.O.: [On K.O.] fires), RL-08 (battle boost ends with the battle), CR 1-3-6-2. The
 * cost-0 Blocker is made with EB05-049 Special Hollow (cost -3 this turn), the only scripted card
 * that lowers an opposing cost.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import {
  BLUE,
  blockers,
  CH,
  canAttack,
  canCounter,
  counterEvent,
  don,
  EV,
  fill,
  LD,
  mainEvent,
  mine,
  RED,
  side,
  theirTurn,
  trash,
} from './kit-b.ts';

const ID = 'EB05-048';
/** OP17-074 Yamato: cost 3, 1000, [Blocker]. OP09-072 Franky: cost 4, 5000, [Blocker]. */
const BLK2 = CH.blocker3;
const FRANKY = CH.blocker4;

function setup(
  o: {
    active?: number;
    own?: string[];
    blocker?: string;
    hollowOn?: boolean;
    deck?: string[];
  } = {},
) {
  const blocker = o.blocker ?? BLK2;
  const g = mine(
    LD.shc,
    {
      hand: [EV.hollow, ID],
      characters: o.own ?? [CH.moria, CH.mr9, CH.marco],
      costArea: { active: o.active ?? 5, rested: 0 },
      ...(o.deck ? { deck: o.deck } : {}),
    },
    { characters: [blocker] },
  );
  if (o.hollowOn !== false) {
    mainEvent(g, g.find('p1', 'hand', EV.hollow), {
      cost: [g.find('p1', 'characters', CH.moria)],
      picks: [[g.find('p2', 'characters', blocker)]],
    });
  }
  return g;
}

function stinger(g: ReturnType<typeof setup>, sacrifice: string = CH.mr9) {
  mainEvent(g, g.find('p1', 'hand', ID), {
    cost: [g.find('p1', 'characters', sacrifice)],
    don: 'costActive',
  });
}

describe('EB05-048 Hedgehog Stinger [Main]: rest 1 DON!! and K.O. 1 Baroque Works Character: cost-0 Characters cannot block', () => {
  it('control: without the Event a cost-0 [Blocker] can block my attack', () => {
    const g = setup();
    expect(g.card(g.find('p2', 'characters', BLK2)).cost).toBe(0);
    attack(g, g.find('p1', 'characters', CH.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', BLK2)]);
  });

  it('with the Event paid, the cost-0 [Blocker] cannot be activated this turn', () => {
    const g = setup();
    stinger(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(CH.mr9);
    expect(trash(g)).toContain(CH.mr9);
    attack(g, g.find('p1', 'characters', CH.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('boundary: a [Blocker] whose cost is 1 (Franky 4 - 3) can still block', () => {
    const g = setup({ blocker: FRANKY });
    expect(g.card(g.find('p2', 'characters', FRANKY)).cost).toBe(1);
    stinger(g);
    attack(g, g.find('p1', 'characters', CH.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', FRANKY)]);
  });

  it('a [Blocker] of cost 3 with no cost reduction is unaffected', () => {
    const g = setup({ hollowOn: false });
    stinger(g);
    attack(g, g.find('p1', 'characters', CH.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([g.find('p2', 'characters', BLK2)]);
  });

  it('CR 8-3-1-3: with no Baroque Works Character to K.O. the cost cannot be paid and the effect does not happen', () => {
    const g = setup({ own: [CH.moria, CH.marco] });
    mainEvent(g, g.find('p1', 'hand', ID), {});
    // (Moria went to Special Hollow's cost; Marco is not a Baroque Works Character and stays.)
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([CH.marco]);
    attack(g, g.find('p1', 'characters', CH.marco), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it('CR 8-3-1-3: the DON!! to rest must be an extra active DON!!: with only the DON!! that paid for the Event, no effect', () => {
    // Hollow (1) + Stinger (1) uses both of the 2 active DON!!; nothing is left to rest.
    const g = setup({ active: 2 });
    mainEvent(g, g.find('p1', 'hand', ID), {});
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(CH.mr9);
    attack(g, g.find('p1', 'characters', CH.marco), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it('the cost rests an extra DON!!: Event cost 1 + 1 rested = 2 DON!! rested by this card', () => {
    const g = setup({ hollowOn: false, active: 5 });
    const before = don(g).rested;
    stinger(g);
    expect(don(g).rested).toBe(before + 2);
  });

  it('M6b-Q19: the K.O. paid as a cost is a real K.O.: Ms. Monday’s [On K.O.] fires', () => {
    const g = setup({
      own: [CH.moria, 'EB05-045', CH.marco],
      deck: [CH.mr9, CH.mohji, CH.marco, ...fill(BLUE, 12)],
    });
    mainEvent(g, g.find('p1', 'hand', ID), {
      cost: [g.find('p1', 'characters', 'EB05-045')],
      don: 'costActive',
      use: [true],
    });
    // [On K.O.] looked at the top 3 and (the driver adding nothing) trashed all three.
    expect(trash(g)).toEqual(expect.arrayContaining(['EB05-045', CH.mr9, CH.mohji, CH.marco]));
  });

  it('declining the optional cost: no K.O., no restriction', () => {
    const g = setup();
    mainEvent(g, g.find('p1', 'hand', ID), { use: [false] });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(CH.mr9);
    expect(canAttack(g, g.find('p1', 'characters', CH.marco), g.leader('p2'))).toBe(true);
    attack(g, g.find('p1', 'characters', CH.marco), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });
});

describe('EB05-048 Hedgehog Stinger [Counter]: my Leader +3000 during this battle', () => {
  function defending() {
    const g = theirTurn(
      side(LD.shc, BLUE, { hand: [ID], costArea: { active: 1, rested: 0 } }),
      side(LD.shc, RED, { characters: [CH.kingdew] }),
    );
    attack(g, g.find('p2', 'characters', CH.kingdew), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('Leader 5000 + 3000 = 8000 stops a 7000 attacker, and the boost ends with the battle', () => {
    const g = defending();
    expect(canCounter(g, g.find('p1', 'hand', ID))).toBe(true);
    counterEvent(g, g.find('p1', 'hand', ID));
    expect(g.power(g.leader('p1'))).toBe(8000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('without it the 7000 attacker connects (control)', () => {
    const g = defending();
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });
});
