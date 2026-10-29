/**
 * OP07-076 Slow-Slow Beam Sword (Event, Purple, cost 2, Foxy Pirates).
 *
 * Card text (cards/data, no override text patch):
 *   effectText: "[Counter] DON!! −1 (You may return the specified number of DON!! cards from your
 *     field to your DON!! deck.): Up to 1 of your Leader or Character cards gains +2000 power during
 *     this battle. Then, rest up to 1 of your opponent's Characters."
 *   triggerText: "Add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules relied on:
 * - CR 7-1-3-1-2: pay the Event's cost (2), trash it, then its [Counter] (DON!! −1) resolves.
 * - CR 8-3-1-6 / RL-23: DON!! −1 may return a rested DON!!, including one rested for the cost.
 * - RL-08 / CR 7-1-5-3: "during this battle" ends at End of the Battle; a rest does not.
 * - RL-25 / CR 10-1-5-1..3: a [Trigger] costs nothing but its own activation cost (none here), and
 *   the card is trashed afterwards.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, decision, fill, passBlock } from '../helpers.ts';
import {
  AKP,
  accept,
  canCounterWith,
  choiceCards,
  chooseIfAsked,
  choose,
  donOf,
  eventCounterTargets,
  LEAD,
  offered,
  payDon,
  PURPLE,
  RED,
  settleYes,
  side,
  sortedIds,
  theirTurn,
  useCounter,
  VAN,
} from './kit.ts';

function counterGame(costArea: { active: number; rested: number }) {
  const g = theirTurn(
    side(LEAD.shanks, PURPLE, {
      hand: [AKP.slowSlow],
      costArea,
      characters: [{ card: VAN.komachiyo, rested: true }],
    }),
    side(LEAD.luffy, RED, { characters: [VAN.marco, VAN.sai] }),
  );
  attack(g, g.find('p2', 'characters', VAN.sai), g.leader('p1'));
  passBlock(g);
  return g;
}

function useSword(g: ReturnType<typeof counterGame>, target: string) {
  useCounter(g, g.find('p1', 'hand', AKP.slowSlow), target);
  if (offered(g, 'p1')) accept(g);
  payDon(g, 1, 'costRested');
  chooseIfAsked(g, [target]);
}

describe('OP07-076 Slow-Slow Beam Sword: [Counter] DON!! −1: +2000 this battle, then rest 1', () => {
  it('happy path: Leader +2000, then the opponent’s active Marco is rested; DON!! deck +1', () => {
    const g = counterGame({ active: 3, rested: 0 });
    const marco = g.find('p2', 'characters', VAN.marco);
    useSword(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(donOf(g, 'p1').deck).toBe(8);
    choose(g, [marco]);
    expect(g.card(marco).rested).toBe(true);
    act(g, { type: 'endCounter' });
    // Sai 4000 < 7000: no damage. The boost ends with the battle; the rest stays.
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.card(marco).rested).toBe(true);
  });

  it('target: the Leader or any of your Characters, even one not in the battle', () => {
    const g = counterGame({ active: 3, rested: 0 });
    const targets = eventCounterTargets(g, g.find('p1', 'hand', AKP.slowSlow));
    expect(targets.sort()).toEqual(
      [g.leader('p1'), g.find('p1', 'characters', VAN.komachiyo)].sort(),
    );
  });

  it('"rest up to 1 of your opponent’s Characters": only the opponent’s Characters are offered', () => {
    const g = counterGame({ active: 3, rested: 0 });
    useSword(g, g.leader('p1'));
    expect(choiceCards(g)).toEqual([VAN.marco, VAN.sai].sort());
  });

  it('CR 8-3-1-6: with exactly 2 DON!! (both rested to pay), DON!! −1 returns a rested one', () => {
    const g = counterGame({ active: 2, rested: 0 });
    expect(canCounterWith(g, g.find('p1', 'hand', AKP.slowSlow))).toBe(true);
    useSword(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 1, deck: 9 });
  });

  it('CR 7-1-3-1-2: with 1 active DON!! the cost 2 cannot be paid', () => {
    const g = counterGame({ active: 1, rested: 4 });
    expect(canCounterWith(g, g.find('p1', 'hand', AKP.slowSlow))).toBe(false);
  });
});

describe('OP07-076 Slow-Slow Beam Sword: [Trigger] add 1 active DON!!', () => {
  it('RL-25: activating the [Trigger] adds 1 active DON!! with no DON!! paid; the card is trashed', () => {
    const g = theirTurn(
      side(LEAD.shanks, PURPLE, {
        life: [AKP.slowSlow, ...fill(PURPLE, 3)],
        costArea: { active: 0, rested: 2 },
      }),
      side(LEAD.luffy, RED),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    expect(decision(g)).toMatchObject({ kind: 'trigger', player: 'p1' });
    act(g, { type: 'trigger', activate: true });
    settleYes(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 2, deck: 7 });
    expect(sortedIds(g, 'p1', 'trash')).toEqual([AKP.slowSlow]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([]);
  });
});
