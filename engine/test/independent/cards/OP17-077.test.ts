/**
 * OP17-077 Kundali Dragon Swarm (Event, Purple, cost 1, types The Four Emperors / Animal Kingdom
 * Pirates).
 *
 * Card text (cards/data; the normalizer restored the sign of "DON!! −1", textFixes):
 *   "[Main] You may rest 3 of your DON!! cards and trash 2 cards from your hand: If your Leader has
 *    the {Animal Kingdom Pirates} type, add up to 3 DON!! cards as rested from your DON!! deck.
 *    [Counter] DON!! −1: Your Leader gains +4000 power during this battle."
 *
 * Rules: CR 2-7-3 / 8-4-2 (an Event's cost is paid, the card trashed, then the effect resolves);
 * CR 8-3-1-1 / 8-3-1-3 (all cost parts must be payable, paid in text order); QA-GR "rest 1 of your
 * DON!! cards" = ① (CR 8-3-1-5: rests active cost-area DON!!); CR 4-10-1 failed "if"; CR 7-1-3-1-2
 * Event [Counter]; CR 8-3-1-6 / RL-23 (DON!! −X may return a rested DON!!); RL-08 (battle duration).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, isLegal, passBlock } from '../helpers.ts';
import {
  accept,
  AKP,
  canCounterWith,
  chooseIfAsked,
  donOf,
  donOnField,
  LEAD,
  myTurn,
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
import type { TestGame } from '../../fixtures/index.ts';

function mainGame(p1: Partial<PlayerSpec>, leader: string = LEAD.kaido) {
  return myTurn(
    side(leader, PURPLE, {
      hand: [AKP.kundali, VAN.gordon, VAN.sai],
      costArea: { active: 4, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
}

function playKundali(g: TestGame): boolean {
  const card = g.find('p1', 'hand', AKP.kundali);
  if (!isLegal(g, { type: 'playCard', card })) return false;
  act(g, { type: 'playCard', card });
  return true;
}

function payMainCost(g: TestGame): void {
  accept(g);
  payDon(g, 3, 'costActive');
  payWith(g, [g.find('p1', 'hand', VAN.gordon), g.find('p1', 'hand', VAN.sai)]);
  if (offered(g, 'p1')) accept(g); // "up to 3" asked as a yes/no
}

describe('OP17-077 Kundali Dragon Swarm: [Main] rest 3 DON!! and trash 2 → add up to 3 rested DON!!', () => {
  it('happy path (AKP Leader): pay card cost 1, rest 3, trash 2, then add 3 rested DON!!', () => {
    const g = mainGame({});
    playKundali(g);
    expect(offered(g, 'p1')).toBe(true);
    payMainCost(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 7, deck: 3 });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.kundali, VAN.gordon, VAN.sai].sort());
  });

  it('"up to 3": with 2 cards in the DON!! deck, 2 are added', () => {
    const g = mainGame({ costArea: { active: 8, rested: 0 } });
    playKundali(g);
    payMainCost(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 6, deck: 0 });
  });

  it('CR 4-10-1: with a non-AKP Leader the costs are paid but no DON!! is added', () => {
    const g = mainGame({}, LEAD.shanks);
    playKundali(g);
    payMainCost(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 4, deck: 6 });
  });

  it('CR 8-3-1-3: only 1 other card in hand → the cost cannot be paid; nothing is rested or added', () => {
    const g = mainGame({ hand: [AKP.kundali, VAN.gordon] });
    if (playKundali(g)) expect(offered(g, 'p1')).toBe(false);
    expect(donOf(g, 'p1').deck).toBe(6);
    expect(donOf(g, 'p1').active).toBeGreaterThanOrEqual(3);
  });

  it('CR 8-3-1-3: only 2 active DON!! left after the card cost → cannot rest 3; nothing happens', () => {
    const g = mainGame({ costArea: { active: 3, rested: 0 } });
    if (playKundali(g)) expect(offered(g, 'p1')).toBe(false);
    expect(donOf(g, 'p1').deck).toBe(7);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(VAN.gordon);
  });
});

describe('OP17-077 Kundali Dragon Swarm: [Counter] DON!! −1 → Leader +4000 during this battle', () => {
  function defending(p1: Partial<PlayerSpec>) {
    return theirTurn(
      side(LEAD.shanks, PURPLE, { hand: [AKP.kundali], costArea: { active: 2, rested: 0 }, ...p1 }),
      side(LEAD.luffy, RED, { characters: [VAN.kingdew] }),
    );
  }

  it('happy path: pay 1 and DON!! −1; the Leader is 9000 and stops a 7000 attack; the boost ends with the battle', () => {
    const g = defending({});
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', AKP.kundali), g.leader('p1'));
    payDon(g, 1, 'costRested');
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    // 2 DON!!: one rested for the card cost, one returned by DON!! −1.
    expect(donOf(g, 'p1').deck).toBe(9);
    expect(donOnField(g, 'p1')).toBe(1);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"Your Leader" only: when a Character is attacked, the +4000 still goes to the Leader and the Character is K.O.’d', () => {
    const g = defending({ characters: [{ card: VAN.marco, rested: true }] });
    const marco = g.find('p1', 'characters', VAN.marco);
    attack(g, g.find('p2', 'characters', VAN.kingdew), marco);
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', AKP.kundali), marco);
    payDon(g, 1, 'costRested');
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(g.power(marco)).toBe(5000);
    act(g, { type: 'endCounter' });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.kundali, VAN.marco].sort());
  });

  it('CR 8-3-1-6: with exactly 1 DON!! on the field, the DON!! rested for the cost can pay DON!! −1', () => {
    const g = defending({ costArea: { active: 1, rested: 0 } });
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.leader('p1'));
    passBlock(g);
    const card = g.find('p1', 'hand', AKP.kundali);
    expect(canCounterWith(g, card)).toBe(true);
    useCounter(g, card, g.leader('p1'));
    payDon(g, 1, 'costRested');
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(donOnField(g, 'p1')).toBe(0);
  });

  it('CR 7-1-3-1-2: with no DON!! at all, the cost 1 cannot be paid, so it cannot be used', () => {
    const g = defending({ costArea: { active: 0, rested: 0 } });
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.leader('p1'));
    passBlock(g);
    expect(canCounterWith(g, g.find('p1', 'hand', AKP.kundali))).toBe(false);
  });
});
