/**
 * EB04-040 Flame Dragon Torch (Event, Purple, cost 1, Animal Kingdom Pirates / The Four Emperors).
 *
 * Card text (cards/data; textFixes sign repair "DON!! 1" → "DON!! −1"):
 *   "[Main] You may rest 6 of your DON!! cards: Up to 1 of your [Kaido] cards gains +3000 power
 *    during this turn. Then, rest up to 1 of your opponent's Characters.
 *    [Counter] DON!! −1: Your Leader gains +4000 power during this battle."
 *
 * Rules relied on:
 * - CR 2-1-2: [Kaido] is an exact name match; "cards" covers the Leader and Characters.
 * - CR 2-7-3 / 8-4-2: an Event's printed cost is paid when it is used, then its activation cost.
 * - CR 7-1-3-1-2 / 10-2-4-1: a [Counter] Event is used in the opponent's Counter Step.
 * - CR 8-3-1-6 / RL-23: DON!! −1 may return a rested cost-area DON!!, including the one just rested
 *   to pay the Event's cost.
 * - CR 6-6-1-3 / 7-1-5-3: "during this turn" vs "during this battle".
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, endTurn, isLegal, passBlock, takeDamage } from '../helpers.ts';
import {
  AKP,
  accept,
  canCounterWith,
  choiceCards,
  choose,
  decline,
  donOf,
  kind,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  side,
  theirTurn,
  useCounter,
  VAN,
} from './kit.ts';

function mainGame(p1: Partial<PlayerSpec> = {}) {
  const g = myTurn(
    side(LEAD.kaido, PURPLE, {
      hand: [AKP.flameDragon],
      costArea: { active: 7, rested: 0 },
      characters: [AKP.kaido10, AKP.king],
      ...p1,
    }),
    side(LEAD.luffy, RED, { characters: [VAN.marco, VAN.littleOars] }),
  );
  return g;
}

function counterGame(costArea: { active: number; rested: number }, given = 0) {
  const g = theirTurn(
    side(LEAD.shanks, PURPLE, {
      hand: [AKP.flameDragon],
      costArea,
      characters: given ? [{ card: VAN.gordon, don: given }] : [],
    }),
    side(LEAD.luffy, RED, { characters: [VAN.thatch] }),
  );
  attack(g, g.find('p2', 'characters', VAN.thatch), g.leader('p1'));
  passBlock(g);
  return g;
}

function useTorch(g: ReturnType<typeof counterGame>) {
  useCounter(g, g.find('p1', 'hand', AKP.flameDragon), g.leader('p1'));
  if (offered(g, 'p1')) accept(g);
  payDon(g, 1, 'costRested');
}

describe('EB04-040 Flame Dragon Torch: [Main] rest 6: [Kaido] +3000 this turn, then rest 1', () => {
  it('happy path: Kaido Leader +3000, then an opponent’s Character is rested', () => {
    const g = mainGame();
    const marco = g.find('p2', 'characters', VAN.marco);
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.flameDragon) });
    if (offered(g, 'p1')) accept(g);
    payDon(g, 6);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
    choose(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    choose(g, [marco]);
    expect(g.card(marco).rested).toBe(true);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([AKP.flameDragon]);
  });

  it('CR 2-1-2: [Kaido] candidates are the Kaido Leader and Kaido Characters, not King', () => {
    const g = mainGame();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.flameDragon) });
    if (offered(g, 'p1')) accept(g);
    payDon(g, 6);
    expect(choiceCards(g)).toEqual([LEAD.kaido, AKP.kaido10].sort());
  });

  it('"rest up to 1 of your opponent’s Characters" has no cost limit (cost 7 LittleOars)', () => {
    const g = mainGame();
    const oars = g.find('p2', 'characters', VAN.littleOars);
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.flameDragon) });
    if (offered(g, 'p1')) accept(g);
    payDon(g, 6);
    choose(g, [g.find('p1', 'characters', AKP.kaido10)]);
    expect(g.power(g.find('p1', 'characters', AKP.kaido10))).toBe(15000);
    choose(g, [oars]);
    expect(g.card(oars).rested).toBe(true);
  });

  it('CR 6-6-1-3: the +3000 lasts the turn and is gone on the opponent’s turn', () => {
    const g = mainGame();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.flameDragon) });
    if (offered(g, 'p1')) accept(g);
    payDon(g, 6);
    choose(g, [g.leader('p1')]);
    choose(g, []);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endTurn(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-3: with 6 active DON!! (1 pays the card) the rest-6 cost cannot be paid → no boost', () => {
    const g = mainGame({ costArea: { active: 6, rested: 0 } });
    const torch = g.find('p1', 'hand', AKP.flameDragon);
    if (isLegal(g, { type: 'playCard', card: torch })) {
      act(g, { type: 'playCard', card: torch });
      expect(offered(g, 'p1')).toBe(false);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(g.find('p2', 'characters', VAN.marco)).rested).toBe(false);
  });

  // Rules disagreement: see DISAGREEMENTS.md B-1. The engine pays a [Main] Event's "you may" cost
  // whenever the Event is played; CR 8-3-1-4 lets the player skip it (and get no effect).
  it.fails('CR 8-3-1-4: declining the rest-6 cost does nothing', () => {
    const g = mainGame();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.flameDragon) });
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 1 });
  });
});

describe('EB04-040 Flame Dragon Torch: [Counter] DON!! −1: Leader +4000 during this battle', () => {
  it('happy path: pays 1, returns 1 DON!!, Leader 9000 stops an 8000 attacker; gone after the battle', () => {
    const g = counterGame({ active: 2, rested: 0 });
    useTorch(g);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(donOf(g, 'p1').deck).toBe(9);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-6: with exactly 1 DON!! (active), it pays the cost and DON!! −1 returns it', () => {
    const g = counterGame({ active: 1, rested: 0 });
    expect(canCounterWith(g, g.find('p1', 'hand', AKP.flameDragon))).toBe(true);
    useTorch(g);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
  });

  it('CR 7-1-3-1-2: with no active DON!! the cost 1 cannot be paid', () => {
    const g = counterGame({ active: 0, rested: 3 });
    expect(canCounterWith(g, g.find('p1', 'hand', AKP.flameDragon))).toBe(false);
  });

  it('RL-23: DON!! −1 may return a DON!! given to a Character', () => {
    const g = counterGame({ active: 1, rested: 0 }, 1);
    useCounter(g, g.find('p1', 'hand', AKP.flameDragon), g.leader('p1'));
    if (offered(g, 'p1')) accept(g);
    payDon(g, 1, 'given', g.find('p1', 'characters', VAN.gordon));
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(g.card(g.find('p1', 'characters', VAN.gordon)).don).toBe(0);
    expect(kind(g)).toBe('counter');
  });
});
