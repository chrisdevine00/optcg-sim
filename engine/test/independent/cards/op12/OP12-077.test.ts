/**
 * OP12-077 The "Extinguishes All Sound Created by Your Influence" Technique (Event, Purple, cost 2,
 * {Heart Pirates}).
 *
 * Card text: "[Main] Select up to 1 of your [Trafalgar Law] cards and that card gains +2000 power
 * during this turn. Then, if the selected card attacks during this turn, your opponent cannot
 * activate [Blocker]. [Trigger] Draw 1 card."
 *
 * Rules: [Trafalgar Law] cards are my Leader and Characters NAMED Trafalgar Law (a card whose name
 * also counts as [Trafalgar Law] qualifies, CR 2-3). "Up to 1" may be none. "During this turn"
 * ends with the turn (CR 8-6). The no-Blocker rule covers only attacks by the selected card.
 * [Trigger] is activated from Life (CR 10-1-5).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  attack,
  blockers,
  cast,
  deck,
  declineTrigger,
  don,
  hand,
  hitLeader,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  SB,
  theirs,
  toMyNextMain,
  trash,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EVENT = 'OP12-077';
const LAW = 'OP12-073';
/** OP04-087 Trafalgar Law: Black, cost 5, 7000, {Heart Pirates}/{Dressrosa}. Vanilla. */
const LAW2 = 'OP04-087';
/** OP01-002 Trafalgar Law: Green/Red Leader, 5000, 4 Life. Only an [Activate: Main]. */
const LAW_LEADER = 'OP01-002';
/** EB04-038 Rosinante & Law: its name also counts as [Trafalgar Law]. */
const BOTH = 'EB04-038';

function setup(
  chars: string[],
  leader: string = LB.croc,
  theirChars: string[] = [SB.franky4],
): TestGame {
  return mine(leader, { hand: [EVENT], characters: chars }, { characters: theirChars });
}

describe('OP12-077 "Extinguishes All Sound...": [Main] a [Trafalgar Law] +2000 this turn and cannot be blocked; [Trigger] draw 1', () => {
  it('selected Law gets +2000 this turn; the Event costs 2 and goes to the trash', () => {
    const g = setup([LAW2]);
    cast(g, EVENT);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LAW2]);
    pickInst(g, [g.find('p1', 'characters', LAW2)]);
    expect(g.power(g.find('p1', 'characters', LAW2))).toBe(9000);
    expect(don(g).active).toBe(8);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('if the selected Law attacks, the opponent cannot block with a [Blocker]', () => {
    const g = setup([LAW2]);
    cast(g, EVENT);
    pickInst(g, [g.find('p1', 'characters', LAW2)]);
    attack(g, g.find('p1', 'characters', LAW2), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('the no-Blocker promise holds when the selected Law attacks a rested Character too', () => {
    const g = setup([LAW2], LB.croc, [
      SB.franky4,
      { card: SB.mohji, rested: true } as unknown as string,
    ]);
    cast(g, EVENT);
    pickInst(g, [g.find('p1', 'characters', LAW2)]);
    attack(g, g.find('p1', 'characters', LAW2), g.find('p2', 'characters', SB.mohji));
    expect(blockers(g)).toEqual([]);
  });

  it('control: without the Event the same Blocker can block that Law', () => {
    const g = setup([LAW2]);
    attack(g, g.find('p1', 'characters', LAW2), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it('only the selected card: another attacker of mine can still be blocked', () => {
    const g = setup([LAW2, SB.marco]);
    cast(g, EVENT);
    pickInst(g, [g.find('p1', 'characters', LAW2)]);
    attack(g, g.find('p1', 'characters', SB.marco), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it('only one Law is selected: a second Law is neither boosted nor unblockable', () => {
    const g = setup([LAW2, LAW]);
    cast(g, EVENT);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LAW, LAW2].sort());
    pickInst(g, [g.find('p1', 'characters', LAW)]);
    expect(g.power(g.find('p1', 'characters', LAW))).toBe(10000);
    expect(g.power(g.find('p1', 'characters', LAW2))).toBe(7000);
    attack(g, g.find('p1', 'characters', LAW2), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it('my [Trafalgar Law] Leader is a selectable card too', () => {
    const g = setup([SB.marco], LAW_LEADER);
    cast(g, EVENT);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LAW_LEADER]);
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('a card whose name also counts as [Trafalgar Law] (Rosinante & Law) is selectable', () => {
    const g = setup([BOTH]);
    cast(g, EVENT);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BOTH]);
  });

  it("must not: only my cards: the opponent's Law and my non-Law Characters are not offered", () => {
    const g = setup([SB.marco, LAW2], LB.croc, [LAW2]);
    cast(g, EVENT);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LAW2]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
  });

  it('"up to 1": may select nothing: no power, and no restriction on blocking', () => {
    const g = setup([LAW2]);
    cast(g, EVENT);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.find('p1', 'characters', LAW2))).toBe(7000);
    attack(g, g.find('p1', 'characters', LAW2), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it('no Law on my side: the Event does nothing useful and nothing is offered', () => {
    const g = setup([SB.marco]);
    cast(g, EVENT);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(trash(g)).toEqual([EVENT]);
  });

  it('the boost and the no-block promise end with the turn', () => {
    const g = setup([LAW2]);
    cast(g, EVENT);
    pickInst(g, [g.find('p1', 'characters', LAW2)]);
    toMyNextMain(g);
    expect(g.power(g.find('p1', 'characters', LAW2))).toBe(7000);
    attack(g, g.find('p1', 'characters', LAW2), g.leader('p2'));
    expect(blockers(g)).toHaveLength(1);
  });

  it('[Trigger] from Life: activating it draws 1 card', () => {
    const g = theirs(
      LB.croc,
      {
        life: [EVENT, SB.mohji, SB.mohji, SB.mohji],
        deck: [SB.marco, ...Array(14).fill(SB.mohji)],
      },
      { characters: [SB.thatch] },
    );
    hitLeader(g, g.find('p2', 'characters', SB.thatch));
    activateTrigger(g);
    expect(hand(g)).toEqual([SB.marco]);
    expect(deck(g)).toHaveLength(14);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('[Trigger] not activated: the Life card goes to hand and nothing is drawn', () => {
    const g = theirs(
      LB.croc,
      { life: [EVENT, SB.mohji, SB.mohji, SB.mohji] },
      { characters: [SB.thatch] },
    );
    hitLeader(g, g.find('p2', 'characters', SB.thatch));
    declineTrigger(g);
    expect(hand(g)).toEqual([EVENT]);
    expect(deck(g)).toHaveLength(15);
    void passBlock;
  });
});
