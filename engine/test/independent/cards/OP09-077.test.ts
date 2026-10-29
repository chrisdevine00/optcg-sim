/**
 * OP09-077 Gum-Gum Lightning (Event, Purple, cost 2, Straw Hat Crew / The Four Emperors).
 *
 * Card text (cards/data; textFixes sign repair "DON!! 2" → "DON!! −2"):
 *   effectText: "[Main] DON!! −2 (You may return the specified number of DON!! cards from your field
 *     to your DON!! deck.): K.O. up to 1 of your opponent's Characters with 6000 power or less."
 *   triggerText: "Add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules relied on:
 * - CR 2-7-3 / 8-4-2: the Event's cost (2) is paid, then DON!! −2.
 * - CR 8-3-1-6 / RL-23: DON!! −2 may return rested DON!!, including the two just rested for the cost.
 * - CR 8-4-6 / RL-16: a power filter reads the current power (after OP17-058 Kaido's −2000).
 * - RL-25: the [Trigger] costs nothing; the card is trashed afterwards.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attack, decision, fill, noDefence, passBlock } from '../helpers.ts';
import {
  AKP,
  accept,
  choiceCards,
  choose,
  chooseNone,
  decline,
  donOf,
  LEAD,
  myTurn,
  offered,
  payDon,
  PURPLE,
  RED,
  settleYes,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function game(p1: Partial<PlayerSpec> = {}, leader: string = LEAD.shanks) {
  return myTurn(
    side(leader, PURPLE, {
      hand: [AKP.lightning],
      costArea: { active: 4, rested: 0 },
      characters: [VAN.sai],
      ...p1,
    }),
    side(LEAD.luffy, RED, { characters: [VAN.hajrudin, VAN.kingdew] }),
  );
}

function cast(g: TestGame) {
  act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.lightning) });
  if (offered(g, 'p1')) accept(g);
  payDon(g, 2, 'costRested');
}

describe('OP09-077 Gum-Gum Lightning: [Main] DON!! −2: K.O. up to 1 opponent’s Character ≤6000', () => {
  it('happy path: DON!! deck +2, Hajrudin (6000) K.O.’d', () => {
    const g = game();
    const hajrudin = g.find('p2', 'characters', VAN.hajrudin);
    cast(g);
    expect(donOf(g, 'p1').deck).toBe(8);
    choose(g, [hajrudin]);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.hajrudin]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.lightning]);
  });

  it('target restriction: 7000 Kingdew and your own Characters are not offered', () => {
    const g = game();
    cast(g);
    expect(choiceCards(g)).toEqual([VAN.hajrudin]);
  });

  it('CR 8-4-4-1: "up to 1" allows K.O.-ing nothing', () => {
    const g = game();
    cast(g);
    chooseNone(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('CR 8-3-1-6: with exactly 2 DON!! (both rested for the cost), DON!! −2 returns them', () => {
    const g = game({ costArea: { active: 2, rested: 0 } });
    cast(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
    choose(g, [g.find('p2', 'characters', VAN.hajrudin)]);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.hajrudin]);
  });

  it('declining the DON!! −2 (if asked) K.O.s nothing', () => {
    const g = game();
    act(g, { type: 'playCard', card: g.find('p1', 'hand', AKP.lightning) });
    if (offered(g, 'p1')) {
      decline(g);
      expect(g.zone('p2', 'characters')).toHaveLength(2);
      expect(donOf(g, 'p1').deck).toBe(6);
    }
  });

  it('CR 8-4-6 interaction: after OP17-058 Kaido’s −2000, Kingdew (7000 → 5000) can be K.O.’d', () => {
    const g = game({}, LEAD.kaido);
    const kingdew = g.find('p2', 'characters', VAN.kingdew);
    attack(g, g.leader('p1'), g.leader('p2'));
    accept(g);
    payDon(g, 1, 'costActive');
    choose(g, [kingdew]);
    noDefence(g);
    expect(g.power(kingdew)).toBe(5000);
    cast(g);
    expect(choiceCards(g)).toContain(VAN.kingdew);
    choose(g, [kingdew]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toContain(VAN.kingdew);
  });
});

describe('OP09-077 Gum-Gum Lightning: [Trigger] add 1 active DON!!', () => {
  it('RL-25: the [Trigger] adds 1 active DON!! for free, then the card is trashed', () => {
    const g = theirTurn(
      side(LEAD.shanks, PURPLE, {
        life: [AKP.lightning, ...fill(PURPLE, 3)],
        costArea: { active: 0, rested: 3 },
      }),
      side(LEAD.luffy, RED),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(decision(g)).toMatchObject({ kind: 'trigger', player: 'p1' });
    act(g, { type: 'trigger', activate: true });
    settleYes(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 3, deck: 6 });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.lightning]);
  });
});
