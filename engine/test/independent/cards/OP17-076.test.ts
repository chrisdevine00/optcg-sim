/**
 * OP17-076 Wo Ro Ro Ro Ro... I Think I've Sobered Up (Event, Purple, cost 0, types The Four
 * Emperors / Animal Kingdom Pirates).
 *
 * Card text (cards/data; the normalizer restored the sign of "DON!! −1" in the [Trigger], textFixes;
 * "Charactes" is the printed typo):
 *   "[Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Charactes gains +3000
 *    power during this battle."
 *   [Trigger] "DON!! −1: Draw 2 cards."
 *
 * Rulings: CR 7-1-3-1-2 / 10-2-4-1 (Event [Counter] in the defender's Counter Step); RL-08 (a
 * battle boost may go on a card that is not being attacked, and ends with the battle); CR 8-3-1-3
 * (a cost that cannot be paid); RL-25 (a [Trigger] pays only its own activation cost; afterwards the
 * card is trashed, CR 10-1-5-3); CR 10-1-5-2 (a declined [Trigger] card goes to hand).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, decision, isLegal, passBlock } from '../helpers.ts';
import {
  accept,
  AKP,
  canCounterWith,
  chooseIfAsked,
  count,
  donOf,
  eventCounterTargets,
  LEAD,
  offered,
  payDon,
  payWith,
  PURPLE,
  RED,
  side,
  sortedIds,
  theirTurn,
  useCounter,
  VAN,
} from './kit.ts';

function defending(p1: Partial<PlayerSpec>, p2: Partial<PlayerSpec> = {}) {
  return theirTurn(side(LEAD.shanks, PURPLE, p1), side(LEAD.luffy, RED, p2));
}

describe('OP17-076 Wo Ro Ro Ro Ro: [Counter] you may trash 1 → +3000 during this battle', () => {
  it('happy path: trash 1, the Leader gains +3000, a 7000 attack is stopped, and it ends with the battle', () => {
    const g = defending(
      { hand: [AKP.woRoRo, VAN.gordon] },
      { leader: { card: LEAD.luffy, don: 2 } },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    const leader = g.leader('p1');
    useCounter(g, g.find('p1', 'hand', AKP.woRoRo), leader);
    if (offered(g, 'p1')) accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.gordon)]);
    chooseIfAsked(g, [leader]);
    expect(g.power(leader)).toBe(8000);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.woRoRo, VAN.gordon].sort());
    // Cost 0: no DON!! needed (p1 has none).
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.power(leader)).toBe(5000);
  });

  it('RL-08: the boost may go on a Character that is not being attacked', () => {
    const g = defending({ hand: [AKP.woRoRo, VAN.gordon], characters: [VAN.marco] });
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    const targets = eventCounterTargets(g, g.find('p1', 'hand', AKP.woRoRo));
    expect(targets).toEqual([g.leader('p1'), g.find('p1', 'characters', VAN.marco)].sort());
  });

  it('CR 8-3-1-3: with no other card in hand to trash, the +3000 cannot happen', () => {
    const g = defending({ hand: [AKP.woRoRo] });
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    const card = g.find('p1', 'hand', AKP.woRoRo);
    if (canCounterWith(g, card)) {
      useCounter(g, card, g.leader('p1'));
      expect(offered(g, 'p1')).toBe(false);
      chooseIfAsked(g, [g.leader('p1')]);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describe('OP17-076 Wo Ro Ro Ro Ro: [Trigger] DON!! −1 → draw 2', () => {
  function hit(p1: Partial<PlayerSpec>) {
    const g = defending({ life: [AKP.woRoRo, PURPLE, PURPLE, PURPLE], ...p1 });
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    if (decision(g)?.kind === 'counter') act(g, { type: 'endCounter' });
    return g;
  }

  it('RL-25: the [Trigger] is offered; paying DON!! −1 draws 2 and the card is trashed', () => {
    const g = hit({ costArea: { active: 0, rested: 2 } });
    expect(decision(g)).toMatchObject({ kind: 'trigger', player: 'p1' });
    expect(isLegal(g, { type: 'trigger', activate: true })).toBe(true);
    act(g, { type: 'trigger', activate: true });
    if (offered(g, 'p1')) accept(g);
    payDon(g, 1, 'costRested');
    expect(count(g, 'p1', 'hand')).toBe(2);
    expect(count(g, 'p1', 'deck')).toBe(13);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.woRoRo]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 1, deck: 9 });
    expect(g.life('p1')).toBe(3);
  });

  it('CR 10-1-5-2: declining the [Trigger] puts the card in hand and draws nothing', () => {
    const g = hit({ costArea: { active: 0, rested: 2 } });
    act(g, { type: 'trigger', activate: false });
    expect(sortedIds(g, 'p1', 'hand')).toEqual([AKP.woRoRo]);
    expect(count(g, 'p1', 'deck')).toBe(15);
  });

  it('CR 8-3-1-3: with no DON!! on the field the DON!! −1 cannot be paid, so no cards are drawn', () => {
    const g = hit({});
    if (decision(g)?.kind === 'trigger' && isLegal(g, { type: 'trigger', activate: true })) {
      act(g, { type: 'trigger', activate: true });
      if (offered(g, 'p1')) accept(g);
    }
    while (decision(g)?.kind === 'trigger') act(g, { type: 'trigger', activate: false });
    expect(count(g, 'p1', 'deck')).toBe(15);
  });
});
