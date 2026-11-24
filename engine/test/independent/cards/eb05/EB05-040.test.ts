/**
 * EB05-040 You Need Me, Don't You?!! (Event, Purple, cost 0, {Donquixote Pirates}).
 *
 * Card text: "[Main] You may return 1 of your active DON!! cards to your DON!! deck: If your Leader
 * has the {Donquixote Pirates} type, draw 3 cards and trash 1 card from your hand.
 * [Counter] Your Leader gains +2000 power during this battle."
 *
 * Rules: CR 8-3-1-3/-4 (an optional cost that cannot be paid or is skipped: no effect), CR 8-3-3
 * (a failed "if"), RL-23 (given DON!! are not in the cost area, so they are not "active DON!!"),
 * RL-08 (battle boost ends with the battle), CR 8-4-4-1.
 */
import { describe, expect, it } from 'vitest';
import { fill, attack, passBlock, passCounter } from '../../helpers.ts';
import {
  beginUse,
  BLUE,
  CH,
  canCounter,
  choiceCards,
  counterEvent,
  don,
  hand,
  LD,
  mainEvent,
  mine,
  RED,
  side,
  theirTurn,
  trash,
} from './kit-b.ts';

const ID = 'EB05-040';
const DECK = [CH.marco, CH.sai, CH.thatch, ...fill(BLUE, 12)];

function main(o: {
  leader?: string | { card: string; don: number };
  active?: number;
  rested?: number;
  use?: boolean;
  hand?: string[];
}) {
  const g = mine(o.leader ?? LD.donq, {
    hand: [ID, ...(o.hand ?? [])],
    deck: DECK,
    costArea: { active: o.active ?? 10, rested: o.rested ?? 0 },
  });
  mainEvent(g, g.find('p1', 'hand', ID), { use: [o.use ?? true] });
  return g;
}

describe("EB05-040 You Need Me, Don't You?!! [Main]: return 1 active DON!!: Donquixote Leader: draw 3, trash 1", () => {
  it('Donquixote Pirates Leader: pays 1 active DON!!, draws 3 and trashes 1 (net +2 cards)', () => {
    const g = main({});
    expect(hand(g)).toHaveLength(2);
    expect(trash(g)).toHaveLength(2);
    expect(g.zone('p1', 'deck')).toHaveLength(12);
    expect(don(g).deck).toBe(1);
    expect(don(g).active).toBe(9);
  });

  it('the card to trash may be any card in hand, including one just drawn', () => {
    const g = mine(LD.donq, {
      hand: [ID, CH.mohji],
      deck: DECK,
      costArea: { active: 10, rested: 0 },
    });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    beginUse(g);
    expect(choiceCards(g)).toEqual([CH.marco, CH.mohji, CH.sai, CH.thatch].sort());
  });

  it('exactly 1 card is trashed and exactly 3 drawn: hand size 0 -> 3 -> 2', () => {
    const g = main({});
    expect(hand(g)).toHaveLength(2);
  });

  it('CR 8-3-3: a non-Donquixote Leader (ST01-001): nothing is drawn', () => {
    const g = main({ leader: LD.shc });
    expect(hand(g)).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(15);
  });

  it('only ACTIVE DON!! can pay: with every DON!! rested nothing is drawn and no DON!! is returned', () => {
    const g = main({ active: 0, rested: 3 });
    expect(hand(g)).toEqual([]);
    expect(don(g).deck).toBe(7);
    expect(trash(g)).toEqual([ID]);
  });

  it('RL-23: DON!! given to my Leader are not active cost-area DON!!: with none active the cost cannot be paid', () => {
    const g = main({ leader: { card: LD.donq, don: 2 }, active: 0, rested: 0 });
    expect(hand(g)).toEqual([]);
    expect(don(g).deck).toBe(8);
  });

  it('declining the optional cost: no draw and no DON!! returned; the Event is still spent', () => {
    const g = main({ use: false });
    expect(hand(g)).toEqual([]);
    expect(don(g).deck).toBe(0);
    expect(trash(g)).toEqual([ID]);
  });

  it('the cost costs the Event nothing to play: it is playable with 0 DON!! at all (cost 0)', () => {
    const g = main({ active: 0, rested: 0 });
    expect(trash(g)).toEqual([ID]);
  });
});

describe("EB05-040 You Need Me, Don't You?!! [Counter]: my Leader +2000 during this battle", () => {
  function defending(leader: string = LD.shc) {
    const g = theirTurn(
      side(leader, BLUE, { hand: [ID], deck: DECK, costArea: { active: 0, rested: 0 } }),
      side(LD.shc, RED, { characters: [CH.marco] }),
    );
    attack(g, g.find('p2', 'characters', CH.marco), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('Leader 5000 + 2000 stops a 5000 attacker, costs no DON!!, draws nothing, and ends with the battle', () => {
    const g = defending();
    expect(canCounter(g, g.find('p1', 'hand', ID))).toBe(true);
    counterEvent(g, g.find('p1', 'hand', ID));
    expect(g.power(g.leader('p1'))).toBe(7000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([]);
  });

  it('there is no Leader-type condition on the [Counter]', () => {
    const g = defending(LD.neutral);
    counterEvent(g, g.find('p1', 'hand', ID));
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('+2000 is not enough against 7000: a Kingdew attack (7000) vs Leader 7000 still connects (>=)', () => {
    const g = theirTurn(
      side(LD.shc, BLUE, { hand: [ID], costArea: { active: 0, rested: 0 } }),
      side(LD.shc, RED, { characters: [CH.kingdew] }),
    );
    attack(g, g.find('p2', 'characters', CH.kingdew), g.leader('p1'));
    passBlock(g);
    counterEvent(g, g.find('p1', 'hand', ID));
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('the target is fixed (my Leader): the Counter asks for no target', () => {
    const g = defending();
    g.act(g.legal().find((a) => a.type === 'activate')!);
    expect(choiceCards(g)).toEqual([]);
  });
});
