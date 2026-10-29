/**
 * OP17-040 Edward.Newgate (Character, Blue, cost 6, 8000, no Counter, type Rocks Pirates).
 *
 * Card text (cards/data):
 *   "[On Play] Draw 1 card.
 *    [Once Per Turn] When your Leader with a type including "Rocks Pirates" attacks or is attacked,
 *    you may trash 1 card from your hand to activate this effect. Your Leader gains +3000 power
 *    during this battle."
 *
 * Rulings: RL-18 (QA-OP17 OP17-040): the "is attacked" part activates at the same timing as
 * [On Your Opponent's Attack], before [Blocker] and Counter. [Once Per Turn] is used only when the
 * effect resolves (CR 10-2-13-1/-3), as in RL-45. "Type including" is a substring match (CR 2-4-3-1).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { attack, attackTargets, decision, fill, noDefence, passBlock, play } from '../helpers.ts';
import {
  accept,
  BLUE,
  count,
  decider,
  decline,
  LEAD,
  myTurn,
  offered,
  payWith,
  RED,
  ROCKS,
  settleNo,
  settleYes,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from './kit.ts';

/** p2's turn; p1 (Rocks Leader by default) has Newgate on the field. */
function defending(
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  leader: string = LEAD.rocks,
) {
  return theirTurn(
    side(leader, BLUE, { characters: [ROCKS.newgate], hand: [VAN.mohji], ...p1 }),
    side(LEAD.luffy, RED, p2),
  );
}

describe('OP17-040 Edward.Newgate: [On Play] Draw 1 card', () => {
  it('happy path: playing it draws the top card of the deck, with no question asked', () => {
    const g = myTurn(
      side(LEAD.rocks, BLUE, {
        hand: [ROCKS.newgate],
        deck: [VAN.marco, ...fill(BLUE, 10)],
        costArea: { active: 6, rested: 0 },
      }),
      side(LEAD.luffy, RED),
    );
    play(g, g.find('p1', 'hand', ROCKS.newgate));
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.marco]);
    expect(count(g, 'p1', 'deck')).toBe(10);
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
  });
});

describe('OP17-040 Edward.Newgate: Leader +3000 when it attacks or is attacked', () => {
  it('RL-18: when the Rocks Leader is attacked, the offer comes before the Block Step; paying gives +3000 for the battle', () => {
    // p2's Leader (5000) attacks p1's Leader (5000). p1 has an active [Blocker] (OP17-042 Kaido).
    const g = defending({ characters: [ROCKS.newgate, ROCKS.kaido] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([VAN.mohji]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    // Then the Block Step.
    expect(decision(g)).toMatchObject({ kind: 'block', player: 'p1' });
  });

  it('"during this battle": the boost stops a 5000 attack, then ends with the battle', () => {
    const g = defending();
    attack(g, g.leader('p2'), g.leader('p1'));
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: after it resolves, a second attack in the same turn offers nothing', () => {
    // p2 attacks twice: with its Leader, then with OP01-023 Marco.
    const g = defending({ hand: [VAN.mohji, VAN.gordon] }, { characters: [VAN.marco] });
    attack(g, g.leader('p2'), g.leader('p1'));
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    noDefence(g);
    attack(g, g.find('p2', 'characters', VAN.marco), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(false);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.gordon]);
  });

  it('CR 10-2-13-1 (as RL-45): declining keeps it for a later attack in the same turn', () => {
    const g = defending({ hand: [VAN.mohji] }, { characters: [VAN.marco] });
    attack(g, g.leader('p2'), g.leader('p1'));
    decline(g);
    noDefence(g);
    attack(g, g.find('p2', 'characters', VAN.marco), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
  });

  it('only for the Leader: an attack on one of p1’s Characters offers nothing', () => {
    const g = defending({ characters: [ROCKS.newgate, { card: VAN.mohji, rested: true }] });
    attack(g, g.leader('p2'), g.find('p1', 'characters', VAN.mohji));
    expect(offered(g, 'p1')).toBe(false);
  });

  it('condition: a Leader whose type does not include "Rocks Pirates" (ST03-001 Crocodile) gets nothing', () => {
    const g = defending({}, {}, LEAD.crocodile);
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(false);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-3: with an empty hand the trash cannot be paid, so nothing is offered', () => {
    const g = defending({ hand: [] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(false);
  });

  it('CR 2-8-2: Newgate in hand (not on the field) does nothing', () => {
    const g = defending({ characters: [], hand: [ROCKS.newgate, VAN.mohji] });
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(false);
  });

  it('"attacks": when the Rocks Leader attacks on p1’s turn, Newgate and the Leader’s own [When Attacking] both resolve', () => {
    // Deck top OP01-023 Marco is not Rocks Pirates, so the Leader's reveal draws nothing.
    const g = myTurn(
      side(LEAD.rocks, BLUE, {
        characters: [ROCKS.newgate],
        hand: [VAN.mohji, VAN.gordon],
        deck: [VAN.marco, ...fill(BLUE, 10)],
      }),
      side(LEAD.luffy, RED),
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    settleYes(g, 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(count(g, 'p1', 'trash')).toBe(2);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(decider(g)).toBe('p2');
  });

  it('"attacks": declining everything leaves the attacking Leader at 5000', () => {
    const g = myTurn(
      side(LEAD.rocks, BLUE, {
        characters: [ROCKS.newgate],
        hand: [VAN.mohji, VAN.gordon],
        deck: [VAN.marco, ...fill(BLUE, 10)],
      }),
      side(LEAD.luffy, RED),
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    settleNo(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.zone('p1', 'hand')).toHaveLength(2);
  });

  it('[Once Per Turn] is per turn: used on p2’s turn, it is offered again on p1’s next turn', () => {
    const g = defending({ hand: [VAN.mohji, VAN.gordon], deck: fill(VAN.marco, 10) });
    attack(g, g.leader('p2'), g.leader('p1'));
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    noDefence(g);
    g.act({ type: 'endTurn' });
    // p1's turn 5. p1 drew a Marco. Attack with the Leader: Newgate is among the offers again.
    expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
    attack(g, g.leader('p1'), g.leader('p2'));
    settleYes(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('the boost does not change which cards can be attacked or blocked', () => {
    const g = defending();
    expect(attackTargets(g, g.leader('p2'))).toEqual([g.leader('p1')]);
    attack(g, g.leader('p2'), g.leader('p1'));
    accept(g);
    payWith(g, [g.find('p1', 'hand', VAN.mohji)]);
    passBlock(g);
    expect(decision(g)).toMatchObject({ kind: 'counter', player: 'p1' });
  });
});
