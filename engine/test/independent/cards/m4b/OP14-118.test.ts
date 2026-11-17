/**
 * OP14-118 You'll Frighten Me... ♡ (Event, Yellow, cost 1; Kuja Pirates / The Seven Warlords of the Sea).
 *
 * Card text:
 *   "[Counter] If you have 2 or less Life cards, up to 1 of your opponent's active Characters cannot
 *    attack during this turn.
 *    [Trigger] Play up to 1 Character card with 6000 power or less and a [Trigger] from your hand."
 *
 * Rules: CR 4-10-1 false "if"; "active" Characters only (the attacker is rested once it attacks,
 * CR 7-1-1); "cannot attack during this turn" holds for the rest of the turn (CR 6-6-1-3); up to 1
 * (CR 8-4-4-1). Scenery: p2 Characters OP02-007 Thatch (attacker), OP01-018 Hajrudin (active),
 * OP01-023 Marco (rested). Trigger hand: OP14-114 Ran (5000, [Trigger]), EB04-027 (7000, [Trigger]),
 * Marco (no [Trigger]).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  activateTrigger,
  attack,
  BLUE,
  canAttackAny,
  canCounterWith,
  choiceCards,
  choose,
  chooseNone,
  hitLeader,
  LD,
  LEAD,
  noDefence,
  passBlock,
  RED,
  rep,
  side,
  sortedIds,
  theirTurn,
  TR,
  useCounter,
  VAN,
  kind,
} from './kit-d.ts';

const EVENT = 'OP14-118';

/** p2 attacks p1's Leader with Thatch; p1 holds the Event. Returns the game at p1's Counter Step. */
function counterGame(p1Life: number, p1: Partial<PlayerSpec> = {}) {
  const g = theirTurn(
    side(LD.navy, BLUE, {
      hand: [EVENT],
      life: rep(BLUE, p1Life),
      costArea: { active: 1, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED, {
      characters: [VAN.thatch, VAN.hajrudin, { card: VAN.marco, rested: true }],
    }),
  );
  attack(g, g.find('p2', 'characters', VAN.thatch), g.leader('p1'));
  passBlock(g);
  return g;
}

describe('OP14-118 [Counter]: with 2 or less Life, an opposing active Character cannot attack this turn', () => {
  it('2 Life (boundary): only ACTIVE opposing Characters are targets; the chosen one cannot attack afterwards', () => {
    const g = counterGame(2);
    const event = g.find('p1', 'hand', EVENT);
    expect(canCounterWith(g, event)).toBe(true);
    useCounter(g, event, g.leader('p1'));
    // The attacker (Thatch) is rested by its attack and Marco is rested: only Hajrudin is active.
    expect(choiceCards(g)).toEqual([VAN.hajrudin]);
    choose(g, [g.find('p2', 'characters', VAN.hajrudin)]);
    noDefence(g);
    // Back on p2's Main Phase: Hajrudin is active but cannot attack.
    expect(kind(g)).toBe('main');
    expect(canAttackAny(g, g.find('p2', 'characters', VAN.hajrudin))).toBe(false);
  });

  it('control: without the Event Hajrudin can attack in the same position', () => {
    const g = counterGame(2);
    noDefence(g);
    expect(canAttackAny(g, g.find('p2', 'characters', VAN.hajrudin))).toBe(true);
  });

  it('0 Life also counts as "2 or less"', () => {
    const g = counterGame(0);
    const event = g.find('p1', 'hand', EVENT);
    expect(canCounterWith(g, event)).toBe(true);
    useCounter(g, event, g.leader('p1'));
    expect(choiceCards(g)).toEqual([VAN.hajrudin]);
  });

  it('CR 8-4-4-1: up to 1 may be nobody', () => {
    const g = counterGame(2);
    useCounter(g, g.find('p1', 'hand', EVENT), g.leader('p1'));
    chooseNone(g);
    noDefence(g);
    expect(canAttackAny(g, g.find('p2', 'characters', VAN.hajrudin))).toBe(true);
  });

  it('CR 4-10-1: with 3 Life the condition fails: nobody is locked', () => {
    const g = counterGame(3);
    const event = g.find('p1', 'hand', EVENT);
    // A failed "if" does not stop the Event being played; it just does nothing.
    expect(canCounterWith(g, event)).toBe(true);
    useCounter(g, event, g.leader('p1'));
    expect(choiceCards(g)).toEqual([]);
    noDefence(g);
    expect(canAttackAny(g, g.find('p2', 'characters', VAN.hajrudin))).toBe(true);
  });
});

describe('OP14-118 [Trigger]: play a Character with 6000 power or less and a [Trigger] from hand', () => {
  function trig() {
    const g = theirTurn(
      side(LD.kuja, BLUE, {
        life: [EVENT, ...rep(BLUE, 3)],
        hand: [TR.ran, TR.hancock7000, VAN.marco],
      }),
      side(LEAD.luffy, RED),
    );
    hitLeader(g);
    activateTrigger(g);
    return g;
  }

  it('only a Character with power <=6000 and a [Trigger] is offered', () => {
    expect(choiceCards(trig())).toEqual([TR.ran]);
  });

  it('it is played for free; the others stay in hand', () => {
    const g = trig();
    choose(g, [g.find('p1', 'hand', TR.ran)]);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([TR.ran]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([TR.hancock7000, VAN.marco].sort());
  });

  it('CR 8-4-4-1: up to 1 may be nothing', () => {
    const g = trig();
    chooseNone(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
