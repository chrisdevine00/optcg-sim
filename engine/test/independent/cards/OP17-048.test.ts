/**
 * OP17-048 Shiki (Character, Blue, cost 7, 9000, no Counter, type Rocks Pirates).
 *
 * Card text (cards/data, with the verified override patch "trash 1 cards with" → "trash 1 card
 * with", source: official card list):
 *   "[Rush: Character]
 *    [When Attacking]/[On Your Opponent's Attack] [Once Per Turn] You may trash 1 card with a type
 *    including "Rocks Pirates" from your hand: Give up to 1 of your opponent's Characters −3000
 *    power during this turn."
 *
 * Rules: [Rush: Character] (CR 10-1-6-1). One [Once Per Turn] shared by both timings, used only when
 * the effect resolves (CR 10-2-13-1/-3; same structure as RL-45). [On Your Opponent's Attack]
 * activates whatever the target is (QA-GR), before Block and Counter (RL-18). "During this turn"
 * outlasts the battle (RL-09).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { attack, canAttack, endTurn, noDefence } from '../helpers.ts';
import {
  accept,
  BLUE,
  choiceCards,
  choose,
  decline,
  LEAD,
  myTurn,
  offered,
  payWith,
  RED,
  ROCKS,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function attacking(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LEAD.crocodile, BLUE, { characters: [ROCKS.shiki], hand: [ROCKS.kyo], ...p1 }),
    side(LEAD.luffy, RED, { characters: [VAN.marco], ...p2 }),
  );
}

function defending(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return theirTurn(
    side(LEAD.crocodile, BLUE, { characters: [ROCKS.shiki], hand: [ROCKS.kyo], ...p1 }),
    side(LEAD.luffy, RED, { characters: [VAN.hajrudin, VAN.marco], ...p2 }),
  );
}

function use(g: TestGame, trash: string, target: string) {
  accept(g);
  payWith(g, [g.find('p1', 'hand', trash)]);
  choose(g, [target]);
}

describe('OP17-048 Shiki: [Rush: Character]', () => {
  it('CR 10-1-6-1: played this turn, it may attack a rested Character but not the Leader', () => {
    const g = myTurn(
      side(LEAD.crocodile, BLUE, { characters: [{ card: ROCKS.shiki, playedThisTurn: true }] }),
      side(LEAD.luffy, RED, { characters: [{ card: VAN.marco, rested: true }] }),
    );
    const shiki = g.find('p1', 'characters', ROCKS.shiki);
    expect(g.card(shiki).keywords).toContain('Rush: Character');
    expect(canAttack(g, shiki, g.find('p2', 'characters', VAN.marco))).toBe(true);
    expect(canAttack(g, shiki, g.leader('p2'))).toBe(false);
  });
});

describe('OP17-048 Shiki: [When Attacking] trash a Rocks Pirates card → −3000', () => {
  it('happy path: Shiki attacks, p1 trashes Kyo and gives the opponent’s Marco −3000', () => {
    const g = attacking();
    attack(g, g.find('p1', 'characters', ROCKS.shiki), g.leader('p2'));
    expect(offered(g, 'p1')).toBe(true);
    const marco = g.find('p2', 'characters', VAN.marco);
    use(g, ROCKS.kyo, marco);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([ROCKS.kyo]);
    expect(g.power(marco)).toBe(2000);
  });

  it('"during this turn": the −3000 lasts after the battle and ends with the turn', () => {
    const g = attacking();
    attack(g, g.find('p1', 'characters', ROCKS.shiki), g.leader('p2'));
    const marco = g.find('p2', 'characters', VAN.marco);
    use(g, ROCKS.kyo, marco);
    noDefence(g);
    expect(g.power(marco)).toBe(2000);
    endTurn(g);
    expect(g.power(marco)).toBe(5000);
  });

  it('target restriction: only the opponent’s Characters (not Leaders, not p1’s own)', () => {
    const g = attacking({ characters: [ROCKS.shiki, VAN.mohji] });
    attack(g, g.find('p1', 'characters', ROCKS.shiki), g.leader('p2'));
    accept(g);
    payWith(g, [g.find('p1', 'hand', ROCKS.kyo)]);
    expect(choiceCards(g)).toEqual([VAN.marco]);
  });

  it('cost restriction: a hand with no Rocks Pirates card cannot pay, so nothing is offered', () => {
    const g = attacking({ hand: [VAN.mohji, VAN.gordon] });
    attack(g, g.find('p1', 'characters', ROCKS.shiki), g.leader('p2'));
    expect(offered(g, 'p1')).toBe(false);
  });

  it('CR 2-4-3-1: "type including" accepts OP08-051 Buckin (Former Rocks Pirates) as the trash', () => {
    const g = attacking({ hand: [ROCKS.buckin] });
    attack(g, g.find('p1', 'characters', ROCKS.shiki), g.leader('p2'));
    expect(offered(g, 'p1')).toBe(true);
  });

  it('it triggers on Shiki’s own attack only: another attacker offers nothing', () => {
    const g = attacking();
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(offered(g, 'p1')).toBe(false);
  });

  it('interaction: −3000 lets Shiki (9000) K.O. a rested 10000 Character', () => {
    // OP12-005 Shiki: vanilla, 10000.
    const g = attacking({}, { characters: [{ card: VAN.shiki8, rested: true }] });
    const big = g.find('p2', 'characters', VAN.shiki8);
    attack(g, g.find('p1', 'characters', ROCKS.shiki), big);
    use(g, ROCKS.kyo, big);
    expect(g.power(big)).toBe(7000);
    noDefence(g);
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.shiki8]);
  });
});

describe('OP17-048 Shiki: [On Your Opponent’s Attack]', () => {
  it('happy path: the attacking OP01-018 Hajrudin (6000) drops to 3000 and fails against the 5000 Leader', () => {
    const g = defending();
    const hajrudin = g.find('p2', 'characters', VAN.hajrudin);
    attack(g, hajrudin, g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
    use(g, ROCKS.kyo, hajrudin);
    expect(g.power(hajrudin)).toBe(3000);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('QA-GR: it activates whatever the target is (an attack on Shiki itself)', () => {
    const g = defending({ characters: [{ card: ROCKS.shiki, rested: true }] });
    attack(g, g.find('p2', 'characters', VAN.hajrudin), g.find('p1', 'characters', ROCKS.shiki));
    expect(offered(g, 'p1')).toBe(true);
  });

  it('[Once Per Turn]: after it resolves on the opponent’s turn, a second attack offers nothing', () => {
    const g = defending({ hand: [ROCKS.kyo, ROCKS.streusen] });
    const hajrudin = g.find('p2', 'characters', VAN.hajrudin);
    attack(g, hajrudin, g.leader('p1'));
    use(g, ROCKS.kyo, hajrudin);
    noDefence(g);
    attack(g, g.find('p2', 'characters', VAN.marco), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(false);
  });

  it('CR 10-2-13-1 (as RL-45): declining on the first attack keeps it for the second', () => {
    const g = defending();
    attack(g, g.find('p2', 'characters', VAN.hajrudin), g.leader('p1'));
    decline(g);
    noDefence(g);
    attack(g, g.find('p2', 'characters', VAN.marco), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
  });

  it('[Once Per Turn] is shared with [When Attacking] but resets each turn', () => {
    // Used on p1's turn 3, it is available again when p2 attacks on turn 4.
    const g = attacking(
      { hand: [ROCKS.kyo, ROCKS.streusen] },
      { characters: [VAN.marco, VAN.hajrudin] },
    );
    attack(g, g.find('p1', 'characters', ROCKS.shiki), g.leader('p2'));
    use(g, ROCKS.kyo, g.find('p2', 'characters', VAN.marco));
    noDefence(g);
    endTurn(g);
    attack(g, g.find('p2', 'characters', VAN.hajrudin), g.leader('p1'));
    expect(offered(g, 'p1')).toBe(true);
  });
});
