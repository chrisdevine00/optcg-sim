/**
 * OP12-057 Ice Block Pheasant Peck (Event, Blue, cost 1, {Navy}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +4000 power during this
 * battle. Then, trash 1 card from your hand. [Trigger] You may trash 1 card from your hand: Draw 1
 * card."
 *
 * Rules: an Event [Counter] costs its printed cost (1 DON!!) and resolves in the Counter Step
 * (CR 7-1-3); "during this battle" ends with the battle; the "Then" trash is part of the effect
 * and takes a card from the hand that is left after the Event was played (the Event itself is
 * already out of the hand). [Trigger] is optional ("may"): its cost needs a card in hand, and a
 * draw follows (CR 10-1-5, 8-3-1-4).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  activateTrigger,
  attack,
  canCounterNow,
  declineTrigger,
  deck,
  don,
  hand,
  hitLeader,
  kind,
  LB,
  need,
  none,
  offeredIds,
  passBlock,
  payHand,
  pickCards,
  pickInst,
  SB,
  theirs,
  trash,
} from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const PECK = 'OP12-057';

/** p2 attacks p1's Leader with an 8000-power Thatch; p1 holds `h`, with `don` active DON!!. */
function underAttack(h: string[], activeDon = 3): TestGame {
  const g = theirs(
    LB.croc,
    { hand: h, costArea: { active: activeDon, rested: 0 } },
    { characters: [SB.thatch] },
  );
  attack(g, g.find('p2', 'characters', SB.thatch), g.leader('p1'));
  passBlock(g);
  return g;
}

describe('OP12-057 Ice Block Pheasant Peck: [Counter] +4000 then trash 1; [Trigger] trash 1: draw 1', () => {
  it('[Counter] on my Leader: 5000 + 4000 = 9000 beats an 8000 attacker; no damage; the Event costs 1 DON!!', () => {
    const g = underAttack([PECK, SB.sai]);
    activateCounter(g, g.find('p1', 'hand', PECK));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    pickCards(g, [SB.sai]);
    need(g, 'counter', 'p1');
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(don(g).active).toBe(2);
  });

  it('the "Then" trash takes 1 card from my hand, my choice (Sai or Marco), after the boost', () => {
    const g = underAttack([PECK, SB.sai, SB.marco]);
    activateCounter(g, g.find('p1', 'hand', PECK));
    pickInst(g, [g.leader('p1')]);
    const d = need(g, 'choose', 'p1');
    expect([d.min, d.max]).toEqual([1, 1]);
    expect(offeredIds(g)).toEqual([SB.marco, SB.sai].sort());
    pickCards(g, [SB.marco]);
    expect(trash(g).sort()).toEqual([PECK, SB.marco].sort());
    expect(hand(g)).toEqual([SB.sai]);
  });

  it('the boost lasts only this battle: after it the Leader is back to 5000', () => {
    const g = underAttack([PECK, SB.sai]);
    activateCounter(g, g.find('p1', 'hand', PECK));
    pickInst(g, [g.leader('p1')]);
    pickCards(g, [SB.sai]);
    act(g, { type: 'endCounter' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('can boost one of my Characters instead: 6000 + 4000 = 10000 survives an 8000 attacker', () => {
    const g = theirs(
      LB.croc,
      {
        hand: [PECK, SB.sai],
        characters: [{ card: SB.hajrudin, rested: true }],
        costArea: { active: 3, rested: 0 },
      },
      { characters: [SB.thatch] },
    );
    attack(g, g.find('p2', 'characters', SB.thatch), g.find('p1', 'characters', SB.hajrudin));
    passBlock(g);
    activateCounter(g, g.find('p1', 'hand', PECK));
    pickInst(g, [g.find('p1', 'characters', SB.hajrudin)]);
    expect(g.power(g.find('p1', 'characters', SB.hajrudin))).toBe(10000);
    pickCards(g, [SB.sai]);
    act(g, { type: 'endCounter' });
    // 8000 attacker against a 10000 defender: the Character survives.
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('"up to 1": the boost may be skipped; the attack then wins (Thatch 8000 vs Leader 5000: 1 Life lost)', () => {
    const g = underAttack([PECK, SB.sai]);
    activateCounter(g, g.find('p1', 'hand', PECK));
    need(g, 'choose', 'p1');
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('boundary: with Peck as the only card in hand the Event resolves and there is nothing to trash', () => {
    const g = underAttack([PECK]);
    activateCounter(g, g.find('p1', 'hand', PECK));
    pickInst(g, [g.leader('p1')]);
    // No card is left to trash: no pick of a hand card can be asked with any candidate.
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(trash(g)).toEqual([PECK]);
  });

  it('cost: with 0 active DON!! the Event cannot be used as a Counter', () => {
    const g = underAttack([PECK, SB.sai], 0);
    expect(canCounterNow(g, g.find('p1', 'hand', PECK))).toBe(false);
  });

  it('[Trigger] from Life: accept, trash 1 card from hand, draw 1', () => {
    const g = theirs(
      LB.croc,
      {
        life: [PECK, SB.mohji, SB.mohji, SB.mohji],
        hand: [SB.sai],
        deck: [SB.marco, ...Array(14).fill(SB.mohji)],
      },
      { characters: [SB.thatch] },
    );
    hitLeader(g, g.find('p2', 'characters', SB.thatch));
    activateTrigger(g);
    payHand(g, [SB.sai]);
    expect(trash(g).sort()).toEqual([PECK, SB.sai].sort());
    expect(hand(g)).toEqual([SB.marco]);
    expect(deck(g)).toHaveLength(14);
  });

  it('[Trigger] "you may": not activating it keeps the hand, draws nothing and the Life card goes to hand', () => {
    const g = theirs(
      LB.croc,
      { life: [PECK, SB.mohji, SB.mohji, SB.mohji], hand: [SB.sai] },
      { characters: [SB.thatch] },
    );
    hitLeader(g, g.find('p2', 'characters', SB.thatch));
    declineTrigger(g);
    expect(hand(g).sort()).toEqual([PECK, SB.sai].sort());
    expect(deck(g)).toHaveLength(15);
  });

  it('[Trigger] the cost is exactly 1 card from hand (a cost pick of one card)', () => {
    const g = theirs(
      LB.croc,
      { life: [PECK, SB.mohji, SB.mohji, SB.mohji], hand: [SB.sai, SB.marco] },
      { characters: [SB.thatch] },
    );
    hitLeader(g, g.find('p2', 'characters', SB.thatch));
    activateTrigger(g);
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('cost');
    expect([d.min, d.max]).toEqual([1, 1]);
  });

  it('[Trigger] with an empty hand the cost cannot be paid: nothing is drawn', () => {
    const g = theirs(
      LB.croc,
      { life: [PECK, SB.mohji, SB.mohji, SB.mohji] },
      { characters: [SB.thatch] },
    );
    hitLeader(g, g.find('p2', 'characters', SB.thatch));
    need(g, 'trigger', 'p1');
    if (g.isLegal({ type: 'trigger', activate: true, player: 'p1' })) {
      act(g, { type: 'trigger', activate: true });
      if (kind(g) === 'optional') act(g, { type: 'optional', accept: false });
    } else {
      declineTrigger(g);
    }
    expect(deck(g)).toHaveLength(15);
    expect(hand(g).filter((c) => c !== PECK)).toEqual([]);
  });
});
